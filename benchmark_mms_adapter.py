"""
benchmark_mms_adapter.py

Benchmarks the fine-tuned facebook/mms-1b-all Tagalog ('tgl') adapter
against the STOCK (un-fine-tuned) adapter, on real recorded audio - not
FLEURS. This is the actual R-3 benchmark step: Rules.md R-3 requires
testing "against real sample data from the target population" before a
model can be cited as final, and a published/FLEURS number "is a starting
signal, not sufficient evidence on its own."

Usage:
    python benchmark_mms_adapter.py \\
        --audio-dir ./benchmark_audio \\
        --manifest ./benchmark_audio/manifest.csv \\
        --adapter-path ./adapter.tgl.safetensors

manifest.csv format (two columns, header row required):
    filename,reference_text
    sample1.wav,si ana ay may alagang pusa na nagngangalang puti
    sample2.wav,isang araw nawala si puti sa loob ng tatlong oras

Reference text should be lowercase with punctuation stripped, matching
the same normalization the training script applied
(remove_special_characters) - otherwise WER will be inflated by
formatting differences that have nothing to do with transcription
accuracy.

Prints per-sample transcriptions (both models) and overall WER for each,
so you can both read the qualitative difference and cite the quantitative
one.
"""

import argparse
import csv
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
from evaluate import load as load_metric
from safetensors.torch import load_file as safe_load_file
from transformers import AutoProcessor, Wav2Vec2ForCTC

BASE_MODEL_ID = "facebook/mms-1b-all"
TARGET_LANG = "tgl"
TARGET_SR = 16000


def load_manifest(manifest_path: Path) -> list[dict]:
    rows = []
    with manifest_path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    if not rows:
        raise ValueError(f"No rows found in {manifest_path}")
    return rows


def load_audio(path: Path) -> np.ndarray:
    array, sr = sf.read(str(path), dtype="float32")
    if array.ndim > 1:
        array = array.mean(axis=1)
    if sr != TARGET_SR:
        # Same simple linear-interpolation resample used in training, for
        # consistency - avoids adding a librosa/scipy dependency just for
        # this script.
        ratio = sr / TARGET_SR
        new_length = int(len(array) / ratio)
        x_old = np.linspace(0, 1, len(array))
        x_new = np.linspace(0, 1, new_length)
        array = np.interp(x_new, x_old, array).astype(np.float32)
    return array


def build_model(adapter_path: Path | None, device: torch.device):
    """
    Loads facebook/mms-1b-all with the tgl adapter, either the stock
    adapter (adapter_path=None) or with fine-tuned weights loaded on top
    (adapter_path set). target_lang is passed at construction time, not
    via a post-hoc set_target_lang() call - see word_delimeter.py /
    finetune_mms_tagalog.py's docstrings for why the post-hoc approach
    leaves word_delimiter_token_id pointing at the wrong vocabulary and
    silently destroys word-boundary decoding.
    """
    processor = AutoProcessor.from_pretrained(BASE_MODEL_ID, target_lang=TARGET_LANG)
    assert processor.tokenizer.word_delimiter_token_id == processor.tokenizer.vocab[TARGET_LANG]["|"], (
        "word_delimiter_token_id does not match tgl vocab - the delimiter "
        "bug may have resurfaced."
    )

    model = Wav2Vec2ForCTC.from_pretrained(
        BASE_MODEL_ID,
        target_lang=TARGET_LANG,
        ignore_mismatched_sizes=True,
    )
    model.load_adapter(TARGET_LANG)

    if adapter_path is not None:
        fine_tuned_weights = safe_load_file(str(adapter_path))
        missing, unexpected = model.load_state_dict(fine_tuned_weights, strict=False)
        # load_state_dict with strict=False will silently ignore a
        # mismatched/empty state dict rather than error - printing what
        # was actually loaded so a bad --adapter-path doesn't silently
        # benchmark the stock model twice under a different label.
        loaded_keys = set(fine_tuned_weights.keys()) - set(unexpected)
        print(f"[DEBUG] Loaded {len(loaded_keys)} fine-tuned tensor(s) from {adapter_path}")
        if len(loaded_keys) == 0:
            raise RuntimeError(
                f"No matching tensors loaded from {adapter_path} - check "
                f"the adapter file is valid and matches this model's shapes."
            )

    model.to(device)
    model.eval()
    return processor, model


@torch.no_grad()
def transcribe(processor, model, device, audio: np.ndarray) -> str:
    inputs = processor(audio, sampling_rate=TARGET_SR, return_tensors="pt")
    input_values = inputs.input_values.to(device)
    logits = model(input_values).logits
    predicted_ids = torch.argmax(logits, dim=-1)
    return processor.batch_decode(predicted_ids)[0]


def run_benchmark(label: str, processor, model, device, manifest: list[dict], audio_dir: Path, wer_metric):
    predictions = []
    references = []

    print(f"\n{'=' * 70}")
    print(f"  {label}")
    print(f"{'=' * 70}")

    for row in manifest:
        audio_path = audio_dir / row["filename"]
        reference = row["reference_text"].strip()
        audio = load_audio(audio_path)
        prediction = transcribe(processor, model, device, audio)

        predictions.append(prediction)
        references.append(reference)

        print(f"\n  file: {row['filename']}")
        print(f"  REF : {reference!r}")
        print(f"  PRED: {prediction!r}")

    wer = wer_metric.compute(predictions=predictions, references=references)
    print(f"\n  --> {label} overall WER: {wer:.4f}")
    return wer


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--audio-dir", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument(
        "--adapter-path",
        type=Path,
        default=None,
        help="Path to adapter.tgl.safetensors (fine-tuned weights). If "
             "omitted, only the stock adapter is benchmarked.",
    )
    parser.add_argument(
        "--stock-only",
        action="store_true",
        help="Only benchmark the stock adapter, skip the fine-tuned one "
             "even if --adapter-path is given.",
    )
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    manifest = load_manifest(args.manifest)
    print(f"Loaded manifest: {len(manifest)} sample(s)")

    wer_metric = load_metric("wer")

    print("\nLoading stock (un-fine-tuned) adapter...")
    processor, stock_model = build_model(adapter_path=None, device=device)
    stock_wer = run_benchmark(
        "STOCK facebook/mms-1b-all (tgl adapter)",
        processor, stock_model, device, manifest, args.audio_dir, wer_metric,
    )
    del stock_model
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    if args.adapter_path and not args.stock_only:
        print("\nLoading fine-tuned adapter...")
        processor, finetuned_model = build_model(adapter_path=args.adapter_path, device=device)
        finetuned_wer = run_benchmark(
            "FINE-TUNED adapter",
            processor, finetuned_model, device, manifest, args.audio_dir, wer_metric,
        )

        print(f"\n{'=' * 70}")
        print("  SUMMARY")
        print(f"{'=' * 70}")
        print(f"  Stock adapter WER:      {stock_wer:.4f}")
        print(f"  Fine-tuned adapter WER: {finetuned_wer:.4f}")
        delta = stock_wer - finetuned_wer
        direction = "better" if delta > 0 else "worse" if delta < 0 else "unchanged"
        print(f"  Fine-tuned is {direction} by {abs(delta):.4f} WER on this sample set")
        print(f"\n  NOTE: this is a benchmark against {len(manifest)} sample(s) of "
              f"real, non-FLEURS audio - still needs testing against actual "
              f"basic-education student recordings before being cited as "
              f"final per Rules.md R-3.")


if __name__ == "__main__":
    main()
