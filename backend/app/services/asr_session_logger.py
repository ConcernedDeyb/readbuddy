"""
asr_session_logger.py

Lightweight, append-only JSONL logger for guided-reading ASR results
(ws_reading.py / WordMatcher). Same rationale as generation_logger.py on
the LLM side: this is evaluation/instrumentation data for Rules.md R-3
benchmark validation of the ASR models (especially
Khalsuu/filipino-wav2vec2-l-xls-r-300m-official, which has no published
WER at all), not product data - so it's a flat file, not a Schema.md table.

Two record types, sharing a `session_id` (one per WebSocket connection):

- "word": one row per word result emitted by WordMatcher.process_transcription()
  (both mid-session partial results and the final-flush results). This is
  the raw material for a real word-recognition accuracy number, and for a
  confusion table of (expected_word -> transcribed_word) substitution
  patterns - see analyze_asr_log.py.
- "session": one row per completed reading session, summarizing total
  words scored, correct count, and computed accuracy - shaped closely
  after Schema.md's reading_sessions.word_recognition_score so this data
  is easy to migrate into that table later if/when DB persistence is
  wired up.

Logging is best-effort: any failure to write is caught and printed, never
raised, so a logging problem can never turn into a broken reading session
for a student.
"""

import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_LOG_PATH = Path("logs/asr_reading_log.jsonl")

_write_lock = threading.Lock()


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_session_id() -> str:
    """Call once per WebSocket /ws/reading connection."""
    return str(uuid.uuid4())


def _append(record: dict, log_path: Path = DEFAULT_LOG_PATH) -> None:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(record, ensure_ascii=False)
    with _write_lock:
        with log_path.open("a", encoding="utf-8") as f:
            f.write(line + "\n")


def log_word_result(
    *,
    session_id: str,
    language: str,
    word_index: int,
    expected_word: str,
    transcribed_word: str,
    is_correct: bool,
    log_path: Path = DEFAULT_LOG_PATH,
) -> None:
    """
    Logs a single word result, exactly as returned by
    WordMatcher.process_transcription() - one call per dict in that
    method's returned list, whether it came from a mid-session partial
    pass or the final flush.
    """
    try:
        _append(
            {
                "record_type": "word",
                "timestamp": _utc_now_iso(),
                "session_id": session_id,
                "language": language,
                "word_index": word_index,
                "expected_word": expected_word,
                "transcribed_word": transcribed_word,
                "is_correct": is_correct,
            },
            log_path=log_path,
        )
    except Exception as exc:  # noqa: BLE001 - logging must never break a session
        print(f"[asr_session_logger] Failed to write word log: {exc}")


def log_session_summary(
    *,
    session_id: str,
    language: str,
    passage_word_count: int,
    total_words_scored: int,
    correct_count: int,
    log_path: Path = DEFAULT_LOG_PATH,
) -> None:
    """
    Logs the outcome of a completed reading session. word_recognition_score
    is computed here the same way Schema.md's reading_sessions column is
    described (percentage of words scored correct) - total_words_scored may
    be less than passage_word_count if the session ended early (e.g. client
    disconnect) rather than reaching the passage's final word.
    """
    try:
        score = (
            round(100.0 * correct_count / total_words_scored, 2)
            if total_words_scored > 0
            else None
        )
        _append(
            {
                "record_type": "session",
                "timestamp": _utc_now_iso(),
                "session_id": session_id,
                "language": language,
                "passage_word_count": passage_word_count,
                "total_words_scored": total_words_scored,
                "correct_count": correct_count,
                "word_recognition_score": score,
            },
            log_path=log_path,
        )
    except Exception as exc:  # noqa: BLE001 - logging must never break a session
        print(f"[asr_session_logger] Failed to write session log: {exc}")