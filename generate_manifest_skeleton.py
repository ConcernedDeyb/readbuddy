"""
generate_manifest_skeleton.py

Scans a folder of audio files and writes out manifest.csv with the
filename column pre-filled, sorted alphabetically. You then fill in the
reference_text column by hand for each row - i.e. the sentence you
actually read in that recording, lowercase, no punctuation (matching the
same normalization the training script applies).

Usage:
    python generate_manifest_skeleton.py --audio-dir ./benchmark_audio
"""

import argparse
import csv
from pathlib import Path

AUDIO_EXTENSIONS = {".wav", ".flac", ".mp3", ".m4a", ".ogg"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--audio-dir", type=Path, required=True)
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Where to write manifest.csv (default: <audio-dir>/manifest.csv)",
    )
    args = parser.parse_args()

    output_path = args.output or (args.audio_dir / "manifest.csv")

    audio_files = sorted(
        f.name for f in args.audio_dir.iterdir()
        if f.is_file() and f.suffix.lower() in AUDIO_EXTENSIONS
    )

    if not audio_files:
        print(f"No audio files found in {args.audio_dir} "
              f"(looked for: {', '.join(sorted(AUDIO_EXTENSIONS))})")
        return

    with output_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["filename", "reference_text"])
        for filename in audio_files:
            writer.writerow([filename, ""])

    print(f"Found {len(audio_files)} audio file(s).")
    print(f"Wrote skeleton manifest to: {output_path}")
    print("\nNow open that CSV and fill in reference_text for each row - "
          "the exact sentence spoken in that file, lowercase, no punctuation.")


if __name__ == "__main__":
    main()
