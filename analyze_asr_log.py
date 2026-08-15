"""
analyze_asr_log.py

Reads logs/asr_reading_log.jsonl and prints the numbers you'd cite for
Rules.md R-3 ASR benchmark validation:

- Overall word-recognition accuracy, broken down by language (en / tl)
- Per-session accuracy (so you can see variance across sessions/passages,
  not just one blended number)
- A confusion table: for INCORRECT words, which (expected -> transcribed)
  pairs repeat most often - this is what turns "I noticed loob becomes
  loog a lot" into an actual frequency count worth putting in the thesis's
  evaluation section

Run standalone, no server needed:
    python analyze_asr_log.py
    python analyze_asr_log.py --language tl
    python analyze_asr_log.py --log-path logs/asr_reading_log.jsonl
"""

import argparse
import json
from collections import Counter
from pathlib import Path


def load_records(log_path: Path) -> list[dict]:
    if not log_path.exists():
        raise FileNotFoundError(
            f"No log file found at {log_path}. Run some /ws/reading sessions "
            f"first."
        )
    records = []
    with log_path.open("r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError:
                print(f"  (skipping malformed line {line_num})")
    return records


def summarize(records: list[dict], language_filter: str | None, last_n_sessions: int | None) -> None:
    words = [r for r in records if r["record_type"] == "word"]
    sessions = [r for r in records if r["record_type"] == "session"]

    if last_n_sessions is not None:
        # Sessions are appended in chronological order as they complete, so
        # the last N "session" records (by file order / timestamp) are the
        # most recent N reading sessions - useful for excluding older runs
        # from before a matcher/ASR fix, without needing to manually
        # cross-reference session_ids or truncate the log file by hand.
        sessions = sorted(sessions, key=lambda s: s["timestamp"])[-last_n_sessions:]
        keep_session_ids = {s["session_id"] for s in sessions}
        words = [r for r in words if r["session_id"] in keep_session_ids]
        print(f"(Filtered to the {last_n_sessions} most recent session(s))")
        print()

    if language_filter:
        words = [r for r in words if r["language"] == language_filter]
        sessions = [r for r in sessions if r["language"] == language_filter]

    if not words:
        print("No word-level records found (for this language filter, if set).")
        return

    print(f"Total word results: {len(words)}")
    print(f"Total sessions: {len(sessions)}")
    print()

    # --- Overall accuracy, by language ---
    by_language: dict[str, list[dict]] = {}
    for r in words:
        by_language.setdefault(r["language"], []).append(r)

    print("Word-recognition accuracy by language:")
    for lang, lang_words in sorted(by_language.items()):
        correct = sum(1 for r in lang_words if r["is_correct"])
        total = len(lang_words)
        pct = correct / total * 100 if total else 0.0
        print(f"  {lang}: {correct}/{total} ({pct:.1f}%)")
    print()

    # --- Per-session accuracy ---
    if sessions:
        print("Per-session accuracy:")
        for s in sessions:
            score = s.get("word_recognition_score")
            score_str = f"{score:.1f}%" if score is not None else "N/A"
            print(
                f"  session {s['session_id'][:8]}... ({s['language']}): "
                f"{s['correct_count']}/{s['total_words_scored']} = {score_str}"
            )
        print()

    # --- Confusion table: most common (expected -> transcribed) mismatches ---
    confusion_counter: Counter[tuple[str, str, str]] = Counter()
    for r in words:
        if r["is_correct"]:
            continue
        transcribed = r["transcribed_word"] or "(omitted)"
        confusion_counter[(r["language"], r["expected_word"], transcribed)] += 1

    if confusion_counter:
        print("Most common substitution/omission patterns (expected -> transcribed):")
        for (lang, expected, transcribed), count in confusion_counter.most_common(20):
            print(f"  [{lang}] {expected!r} -> {transcribed!r}: {count}x")
    print()

    # --- Omission rate specifically (transcribed_word == "") ---
    omissions = [r for r in words if not r["is_correct"] and not r["transcribed_word"]]
    if words:
        omission_rate = len(omissions) / len(words) * 100
        print(
            f"Omitted words (no transcription assigned): {len(omissions)}/"
            f"{len(words)} ({omission_rate:.1f}%)"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--log-path",
        type=Path,
        default=Path("logs/asr_reading_log.jsonl"),
        help="Path to the JSONL log file (default: logs/asr_reading_log.jsonl)",
    )
    parser.add_argument(
        "--language",
        choices=["en", "tl"],
        default=None,
        help="Filter to a single language (default: show all, broken down)",
    )
    parser.add_argument(
        "--last-n-sessions",
        type=int,
        default=None,
        help="Only include the N most recently completed sessions (useful "
             "for excluding older runs from before a matcher/ASR fix)",
    )
    args = parser.parse_args()

    records = load_records(args.log_path)
    summarize(records, args.language, args.last_n_sessions)


if __name__ == "__main__":
    main()