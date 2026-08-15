"""
Standalone comparison script: transcribes a WAV file with BOTH
Khalsuu/filipino-wav2vec2-l-xls-r-300m-official (current production model)
and facebook/mms-1b-all (documented fallback per architecture.md / PRD.md
Open Decisions, Rules.md R-3), side by side, on the exact same audio.

Deliberately isolated - does NOT touch app/services/asr_service.py or the
running backend. mms-1b-all is a ~1B parameter model, meaningfully larger
than the current two wav2vec2 models combined; loading it into the
persistent ASRService before confirming it's worth switching to would
change the VRAM budget documented in architecture.md §3 for no reason.

Usage:
    python compare_tagalog_models.py path\\to\\tagalog_test_audio.wav
    python compare_tagalog_models.py path\\to\\tagalog_test_audio.wav "expected passage text here"

The second (optional) argument, if given, prints a rough word-accuracy
score for each model against that expected text - same normalize/diff
approach as app/services/word_matcher.py, but a simple one-shot version
(no live-streaming reserve-tail complexity needed for an offline
comparison like this).
"""

import difflib
import re
import sys
import wave

import numpy as np
import torch
from transformers import AutoProcessor, Wav2Vec2ForCTC, Wav2Vec2Processor

_PUNCT_RE = re.compile(r"[^\w\s'-]")


def normalize_word(word: str) -> str:
    return _PUNCT_RE.sub("", word).lower().strip()


def rough_word_accuracy(expected_text: str, transcribed_text: str) -> tuple[int, int]:
    """Returns (correct_count, total_expected_words) via simple diff alignment."""
    expected = [normalize_word(w) for w in expected_text.split()]
    transcribed = [normalize_word(w) for w in transcribed_text.split()]
    matcher = difflib.SequenceMatcher(None, expected, transcribed, autojunk=False)
    correct = sum(block.size for block in matcher.get_matching_blocks())
    return correct, len(expected)


def load_wav_as_float32(path: str) -> tuple[np.ndarray, int]:
    with wave.open(path, "rb") as wf:
        rate = wf.getframerate()
        if rate != 16000 or wf.getnchannels() != 1 or wf.getsampwidth() != 2:
            print(
                f"WARNING: expected 16kHz mono 16-bit, got {rate}Hz, "
                f"{wf.getnchannels()}ch, {wf.getsampwidth() * 8}-bit. "
                f"Convert with ffmpeg first."
            )
        raw = wf.readframes(wf.getnframes())
    audio = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    return audio, rate


def transcribe_khalsuu(audio: np.ndarray, sample_rate: int, device: torch.device) -> str:
    model_id = "Khalsuu/filipino-wav2vec2-l-xls-r-300m-official"
    processor = Wav2Vec2Processor.from_pretrained(model_id)
    model = Wav2Vec2ForCTC.from_pretrained(model_id).to(device)
    model.eval()

    inputs = processor(audio, sampling_rate=sample_rate, return_tensors="pt", padding=True)
    input_values = inputs.input_values.to(device)
    with torch.no_grad():
        logits = model(input_values).logits
    predicted_ids = torch.argmax(logits, dim=-1)
    text = processor.batch_decode(predicted_ids)[0]

    del model
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    return text


def transcribe_mms(
    audio: np.ndarray, sample_rate: int, device: torch.device, target_lang: str = "tgl"
) -> str:
    model_id = "facebook/mms-1b-all"

    # This is the exact pattern from the official facebook/mms-1b-all model
    # card: load with default (English) adapter, then swap the tokenizer's
    # target language AND load that language's adapter weights before
    # running inference.
    processor = AutoProcessor.from_pretrained(model_id)
    model = Wav2Vec2ForCTC.from_pretrained(model_id).to(device)
    model.eval()

    processor.tokenizer.set_target_lang(target_lang)
    model.load_adapter(target_lang)

    inputs = processor(audio, sampling_rate=sample_rate, return_tensors="pt")
    input_values = inputs.input_values.to(device)
    with torch.no_grad():
        logits = model(input_values).logits
    ids = torch.argmax(logits, dim=-1)[0]
    text = processor.decode(ids)

    del model
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    return text


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print('Usage: python compare_tagalog_models.py <wav_path> ["expected passage text"]')
        sys.exit(1)

    wav_path = sys.argv[1]
    expected_text = sys.argv[2] if len(sys.argv) > 2 else None

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    audio, rate = load_wav_as_float32(wav_path)
    print(f"Loaded {len(audio) / rate:.1f}s of audio at {rate}Hz\n")

    print("Loading and running Khalsuu (current production model)...")
    khalsuu_text = transcribe_khalsuu(audio, rate, device)

    print("Loading and running facebook/mms-1b-all (tgl adapter, fallback candidate)...")
    mms_text = transcribe_mms(audio, rate, device)

    print("\n" + "=" * 70)
    print("KHALSUU (current):")
    print(khalsuu_text)
    if expected_text:
        c, t = rough_word_accuracy(expected_text, khalsuu_text)
        print(f"Rough accuracy: {c}/{t} = {c / t * 100:.1f}%")

    print("\nMMS-1B-ALL (fallback candidate):")
    print(mms_text)
    if expected_text:
        c, t = rough_word_accuracy(expected_text, mms_text)
        print(f"Rough accuracy: {c}/{t} = {c / t * 100:.1f}%")
    print("=" * 70)