import io

import soundfile as sf
from fastapi import APIRouter, File, Query, UploadFile

from app.services.asr_service import asr_service

router = APIRouter()


@router.post("/asr/test")
async def test_transcription(
    file: UploadFile = File(...),
    language: str = Query("en", enum=["en", "tl"]),
):
    """
    Proof-of-chain endpoint only: upload a short 16kHz WAV file, get a
    transcription back. This confirms frontend -> backend -> GPU model
    works end to end.

    NOT the real product flow - the actual pronunciation-checking feature
    uses a persistent WebSocket audio stream (architecture.md §4), not a
    one-shot file upload. Build that next, once this proof passes.
    """
    audio_bytes = await file.read()
    audio_array, sample_rate = sf.read(io.BytesIO(audio_bytes))

    if sample_rate != 16000:
        return {
            "error": (
                f"Expected 16kHz audio, got {sample_rate}Hz. "
                "Resample the file before uploading."
            )
        }

    transcription = asr_service.transcribe(audio_array, sample_rate, language=language)

    return {
        "language": language,
        "transcription": transcription,
    }
