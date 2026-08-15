"""
Run this yourself (needs your HF login/token + accepted dataset terms).
Loads a handful of sil-ai/bloom-speech tgl samples, prints any metadata
fields available, saves the audio clips locally so you can actually
listen to them, and prints the matching transcriptions so you can
sanity-check text complexity even before listening.
"""
from datasets import load_dataset
import soundfile as sf

ds = load_dataset("sil-ai/bloom-speech", "tgl", token=True, trust_remote_code=True)

print("Available splits:", list(ds.keys()))
for split_name, split in ds.items():
    print(f"\n{split_name}: {len(split)} samples")
    print("Columns/features:", split.column_names)
    break  # just need this once

train = ds["train"] if "train" in ds else list(ds.values())[0]

print(f"\nSaving first 5 samples as .wav files + printing transcriptions and any metadata...")
for i in range(min(5, len(train))):
    sample = train[i]
    audio = sample["audio"]
    out_path = f"bloom_sample_{i}.wav"
    sf.write(out_path, audio["array"], audio["sampling_rate"])

    print(f"\n--- Sample {i} ---")
    print(f"Saved to: {out_path}")
    print(f"Duration: {len(audio['array']) / audio['sampling_rate']:.1f}s")
    # print every field EXCEPT the raw audio array itself (too long to print)
    for key, value in sample.items():
        if key != "audio":
            print(f"{key}: {value}")