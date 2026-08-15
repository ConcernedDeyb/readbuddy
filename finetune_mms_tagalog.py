"""
Continues fine-tuning the EXISTING facebook/mms-1b-all Tagalog ('tgl')
adapter on google/fleurs (config 'fil_ph').

See the top-of-file docstring in the previous version for the full
rationale (warm-starting from the existing adapter, reusing the existing
vocabulary, etc). This version additionally bypasses torchcodec for audio
decoding: TorchCodec only supports FFmpeg 4-7 on Windows (FFmpeg 8 is
Linux/macOS only as of this writing), so on a Windows machine with FFmpeg
8 installed, every torchcodec DLL probe fails. We disable datasets'
automatic decode path (Audio(decode=False)) and decode manually with
soundfile instead - the same library already confirmed working throughout
this project's earlier .wav file testing.

KNOWN BUG, FIXED HERE: set_target_lang() swaps in the tgl vocabulary but
does NOT refresh the tokenizer's cached word_delimiter_token_id, which
stays at whatever the default/first-loaded language used (4 in this
adapter's case) instead of tgl's actual '|' id (5). Since batch_decode's
CTC grouping looks for that cached id to convert into a literal space,
every decoded prediction/label came out as one run-on string with zero
spaces - making WER register ~1.0+ on every eval regardless of how good
the model's actual predictions were. Confirmed via PRED/LABEL debug prints
during eval: strings were character-for-character close to correct, just
missing every single word boundary. Fixed by loading the processor with
target_lang=TARGET_LANG set at construction time (see the processor-loading
comment below) instead of calling set_target_lang() post-hoc - this avoids
the caching bug entirely rather than patching around it.
"""

import io
import os
import re

import numpy as np
import soundfile as sf
import torch
from dataclasses import dataclass
from typing import Dict, List, Union

from datasets import load_dataset, Audio
from evaluate import load as load_metric
from transformers import (
    AutoProcessor,
    Wav2Vec2ForCTC,
    Trainer,
    TrainingArguments,
)
from safetensors.torch import save_file as safe_save_file
from transformers.models.wav2vec2.modeling_wav2vec2 import WAV2VEC2_ADAPTER_SAFE_FILE

TARGET_LANG = "tgl"
BASE_MODEL_ID = "facebook/mms-1b-all"
OUTPUT_DIR = "mms-tgl-finetuned"
TARGET_SR = 16000

_CHARS_TO_REMOVE_RE = re.compile(r'[,?.!;:"“”‘’%\']')


def remove_special_characters(batch):
    batch["transcription"] = _CHARS_TO_REMOVE_RE.sub("", batch["transcription"]).lower()
    return batch


def resample_audio(audio: np.ndarray, orig_sr: int, target_sr: int = TARGET_SR) -> np.ndarray:
    """Simple linear-interpolation resample - avoids adding a librosa/scipy
    dependency just for this. FLEURS audio should already be 16kHz in most
    cases, but this handles it if not."""
    if orig_sr == target_sr:
        return audio.astype(np.float32)
    ratio = orig_sr / target_sr
    new_length = int(len(audio) / ratio)
    x_old = np.linspace(0, 1, len(audio))
    x_new = np.linspace(0, 1, new_length)
    return np.interp(x_new, x_old, audio).astype(np.float32)


@dataclass
class DataCollatorCTCWithPadding:
    processor: AutoProcessor
    padding: Union[bool, str] = True

    def __call__(self, features: List[Dict[str, Union[List[int], torch.Tensor]]]) -> Dict[str, torch.Tensor]:
        input_features = [{"input_values": f["input_values"]} for f in features]
        label_features = [{"input_ids": f["labels"]} for f in features]

        batch = self.processor.pad(input_features, padding=self.padding, return_tensors="pt")
        labels_batch = self.processor.pad(labels=label_features, padding=self.padding, return_tensors="pt")

        labels = labels_batch["input_ids"].masked_fill(labels_batch.attention_mask.ne(1), -100)
        batch["labels"] = labels
        return batch


def main():
    print("Loading FLEURS (fil_ph)...")
    train_ds = load_dataset("google/fleurs", "fil_ph", split="train")
    eval_ds = load_dataset("google/fleurs", "fil_ph", split="validation")
    print(f"Eval set size: {len(eval_ds)} samples.")

    keep_cols = ["audio", "transcription"]
    train_ds = train_ds.remove_columns([c for c in train_ds.column_names if c not in keep_cols])
    eval_ds = eval_ds.remove_columns([c for c in eval_ds.column_names if c not in keep_cols])

    train_ds = train_ds.map(remove_special_characters)
    eval_ds = eval_ds.map(remove_special_characters)

    # decode=False: skip datasets' automatic (torchcodec-based) decoding
    # entirely. We decode manually with soundfile in prepare_dataset below.
    train_ds = train_ds.cast_column("audio", Audio(decode=False))
    eval_ds = eval_ds.cast_column("audio", Audio(decode=False))

    print("Loading processor (reusing existing tgl vocabulary)...")
    # NOTE: previously this loaded with AutoProcessor.from_pretrained(BASE_MODEL_ID)
    # followed by processor.tokenizer.set_target_lang(TARGET_LANG), then a manual
    # resync of word_delimiter_token_id. That approach left convert_tokens_to_ids('|')
    # stubbornly returning the default-language id (4) instead of tgl's actual id (5),
    # even though the manual resync patched word_delimiter_token_id itself correctly.
    # Confirmed via isolated testing (word_delimeter.py) that loading with
    # target_lang= set at construction time avoids the bug entirely - the tokenizer's
    # special-token machinery is initialized correctly for tgl from the start, with
    # no post-hoc patching needed.
    processor = AutoProcessor.from_pretrained(BASE_MODEL_ID, target_lang=TARGET_LANG)
    print(f"[DEBUG] word_delimiter_token_id: {processor.tokenizer.word_delimiter_token_id}")
    

    def prepare_dataset(batch):
        audio_bytes = batch["audio"]["bytes"]
        array, sr = sf.read(io.BytesIO(audio_bytes), dtype="float32")
        if array.ndim > 1:
            array = array.mean(axis=1)  # downmix to mono if stereo
        array = resample_audio(array, sr, TARGET_SR)

        batch["input_values"] = processor(array, sampling_rate=TARGET_SR).input_values[0]
        batch["input_length"] = len(batch["input_values"])
        batch["labels"] = processor(text=batch["transcription"]).input_ids
        return batch

    print("Preprocessing dataset (this takes a while on first run)...")
    train_ds = train_ds.map(prepare_dataset, remove_columns=train_ds.column_names)
    eval_ds = eval_ds.map(prepare_dataset, remove_columns=eval_ds.column_names)

    data_collator = DataCollatorCTCWithPadding(processor=processor, padding=True)
    wer_metric = load_metric("wer")

    print("Loading model with existing tgl adapter...")
    model = Wav2Vec2ForCTC.from_pretrained(
        BASE_MODEL_ID,
        attention_dropout=0.0,
        hidden_dropout=0.0,
        feat_proj_dropout=0.0,
        layerdrop=0.0,
        ctc_loss_reduction="mean",
        target_lang=TARGET_LANG,
        ignore_mismatched_sizes=True,
    )

    model.load_adapter(TARGET_LANG)

    model.freeze_base_model()
    adapter_weights = model._get_adapters()
    for param in adapter_weights.values():
        param.requires_grad = True

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"Trainable parameters: {trainable:,} (should be ~2-3M, not ~1B)")

    print(f"[DEBUG] tokenizer vocab_size: {processor.tokenizer.vocab_size}")
    print(f"[DEBUG] model lm_head out_features: {model.lm_head.out_features}")
    print(f"[DEBUG] model.config.pad_token_id: {model.config.pad_token_id}")
    print(f"[DEBUG] processor.tokenizer.pad_token_id: {processor.tokenizer.pad_token_id}")

    def compute_metrics(pred):
        pred_logits = pred.predictions
        pred_ids = np.argmax(pred_logits, axis=-1)
        pred.label_ids[pred.label_ids == -100] = processor.tokenizer.pad_token_id
        pred_str = processor.batch_decode(pred_ids)
        label_str = processor.batch_decode(pred.label_ids, group_tokens=False)

        # TEMP DIAGNOSTIC - remove once WER is confirmed sane.
        for i in range(min(3, len(pred_str))):
            print(f"[DEBUG] PRED : {pred_str[i]!r}")
            print(f"[DEBUG] LABEL: {label_str[i]!r}")

        wer = wer_metric.compute(predictions=pred_str, references=label_str)
        return {"wer": wer}

    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=16,
        eval_strategy="steps",
        eval_accumulation_steps=2,
        per_device_eval_batch_size=1,
        num_train_epochs=6,
        gradient_checkpointing=True,
        fp16=True,
        save_steps=200,
        eval_steps=100,
        logging_steps=50,
        learning_rate=1e-4,
        warmup_steps=100,
        save_total_limit=2,
        load_best_model_at_end=True,
        metric_for_best_model="wer",
        greater_is_better=False,
        push_to_hub=False,
    )
    
    trainer = Trainer(
        model=model,
        data_collator=data_collator,
        args=training_args,
        compute_metrics=compute_metrics,
        train_dataset=train_ds,
        eval_dataset=eval_ds,
        processing_class=processor.feature_extractor,
    )

    print("Starting training...")
    trainer.train()

    print("Saving fine-tuned adapter weights separately...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    adapter_file = WAV2VEC2_ADAPTER_SAFE_FILE.format(TARGET_LANG)
    adapter_file = os.path.join(OUTPUT_DIR, adapter_file)
    safe_save_file(model._get_adapters(), adapter_file, metadata={"format": "pt"})
    print(f"Adapter saved to: {adapter_file}")


if __name__ == "__main__":
    main()