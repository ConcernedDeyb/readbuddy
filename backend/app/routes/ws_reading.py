import asyncio
import json

import torch
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.audio import (
    SAMPLE_RATE,
    PROCESS_INTERVAL_BYTES,
    SILENCE_RMS_THRESHOLD,
    CONSECUTIVE_SILENT_WINDOWS_FOR_WARNING,
    calculate_rms,
    session_manager,
)
from app.services.asr_service import asr_service
from app.services.word_matcher import WordMatcher
from app.services import asr_session_logger

router = APIRouter(prefix="/ws", tags=["reading"])


def _log_results(session_id: str, language: str, results: list[dict]) -> None:
    for r in results:
        asr_session_logger.log_word_result(
            session_id=session_id,
            language=language,
            word_index=r["word_index"],
            expected_word=r["expected_word"],
            transcribed_word=r["transcribed_word"],
            is_correct=r["is_correct"],
        )


@router.websocket("/reading")
async def guided_reading(websocket: WebSocket):
    """
    Live guided-reading session (architecture.md §4, design.md Step 3).
    """
    await websocket.accept()

    acquired = await session_manager.acquire_session()
    if not acquired:
        await websocket.send_json(
            {
                "type": "error",
                "detail": (
                    "Another reading session is already in progress. "
                    "Please finish or close it before starting a new one."
                ),
            }
        )
        await websocket.close()
        return

    buffer = bytearray()
    bytes_since_last_process = 0
    consecutive_silent_windows = 0
    silence_warning_sent = False
    session_id = asr_session_logger.new_session_id()
    total_words_scored = 0
    correct_count = 0

    try:
        start_message = await websocket.receive_json()
        if start_message.get("type") != "start":
            await websocket.send_json(
                {"type": "error", "detail": "First message must be {'type': 'start', ...}."}
            )
            await websocket.close()
            return

        passage_text = start_message.get("passage_text", "").strip()
        language = start_message.get("language", "en")

        if not passage_text:
            await websocket.send_json(
                {"type": "error", "detail": "start message missing non-empty 'passage_text'."}
            )
            await websocket.close()
            return

        expected_words = passage_text.split()
        matcher = WordMatcher(expected_words)

        if not asr_service._loaded:
            await websocket.send_json(
                {"type": "status", "detail": "Loading pronunciation models..."}
            )
            await asyncio.to_thread(asr_service.load)

        while True:
            message = await websocket.receive()

            if "bytes" in message and message["bytes"] is not None:
                buffer.extend(message["bytes"])
                bytes_since_last_process += len(message["bytes"])

                if bytes_since_last_process >= PROCESS_INTERVAL_BYTES:
                    new_chunk = bytes(buffer[-bytes_since_last_process:])
                    rms = calculate_rms(new_chunk)
                    print(f"[AUDIO CHECK] rms={rms:.4f}")

                    if rms < SILENCE_RMS_THRESHOLD:
                        consecutive_silent_windows += 1
                        bytes_since_last_process = 0

                        if (
                            consecutive_silent_windows
                            == CONSECUTIVE_SILENT_WINDOWS_FOR_WARNING
                            and not silence_warning_sent
                        ):
                            await websocket.send_json(
                                {
                                    "type": "warning",
                                    "detail": (
                                        "No microphone input detected. Check "
                                        "that your microphone is still "
                                        "connected."
                                    ),
                                }
                            )
                            silence_warning_sent = True

                        continue

                    consecutive_silent_windows = 0
                    silence_warning_sent = False

                    transcription = await asyncio.to_thread(
                        asr_service.transcribe_pcm16,
                        bytes(buffer),
                        sample_rate=SAMPLE_RATE,
                        language=language,
                    )

                    print(f"[ASR OUTPUT] {transcription!r}")

                    results = matcher.process_transcription(
                        transcription, hold_last_word=True
                    )
                    if results:
                        await websocket.send_json({"type": "words", "results": results})
                        _log_results(session_id, language, results)
                        total_words_scored += len(results)
                        correct_count += sum(1 for r in results if r["is_correct"])

                    bytes_since_last_process = 0

                    if torch.cuda.is_available():
                        print(
                            f"[VRAM] buffer={len(buffer) / 1024:.1f}KB "
                            f"allocated={torch.cuda.memory_allocated() / 1024**2:.1f}MB "
                            f"reserved={torch.cuda.memory_reserved() / 1024**2:.1f}MB"
                        )

                    if matcher.is_complete:
                        break

            elif "text" in message and message["text"] is not None:
                control = json.loads(message["text"])
                if control.get("type") == "finish":
                    break

            elif message.get("type") == "websocket.disconnect":
                asr_session_logger.log_session_summary(
                    session_id=session_id,
                    language=language,
                    passage_word_count=len(expected_words),
                    total_words_scored=total_words_scored,
                    correct_count=correct_count,
                )
                return

        if len(buffer) > 0:
            final_transcription = await asyncio.to_thread(
                asr_service.transcribe_pcm16,
                bytes(buffer),
                sample_rate=SAMPLE_RATE,
                language=language,
            )

            print(f"[ASR OUTPUT - FINAL FLUSH] {final_transcription!r}")

            final_results = matcher.process_transcription(
                final_transcription, hold_last_word=False
            )
            if final_results:
                await websocket.send_json({"type": "words", "results": final_results})
                _log_results(session_id, language, final_results)
                total_words_scored += len(final_results)
                correct_count += sum(1 for r in final_results if r["is_correct"])

        asr_session_logger.log_session_summary(
            session_id=session_id,
            language=language,
            passage_word_count=len(expected_words),
            total_words_scored=total_words_scored,
            correct_count=correct_count,
        )

        await websocket.send_json({"type": "done"})
        await websocket.close()

    except WebSocketDisconnect:
        pass
    finally:
        await session_manager.release_session()