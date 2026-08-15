"""
Standalone test client for the /ws/reading endpoint.

Streams an existing 16kHz mono 16-bit WAV file to the backend in small
chunks, simulating how a browser's Web Audio API would deliver live
microphone audio - NOT a real-time delay, just chunked delivery, so this
proves the protocol/buffering/matching logic works before wiring up the
actual frontend recorder.

Usage:
    python test_ws_reading.py path\\to\\test_audio.wav "The sun was setting..."
"""

import asyncio
import sys
import wave

import websockets

WS_URL = "ws://localhost:8000/ws/reading"
CHUNK_MS = 100  # send audio in 100ms chunks, like a real streaming recorder would


async def stream_audio(wav_path: str, passage_text: str, language: str = "en"):
    with wave.open(wav_path, "rb") as wf:
        if wf.getframerate() != 16000 or wf.getnchannels() != 1 or wf.getsampwidth() != 2:
            print(
                f"WARNING: expected 16kHz mono 16-bit, got "
                f"{wf.getframerate()}Hz, {wf.getnchannels()}ch, "
                f"{wf.getsampwidth() * 8}-bit. Convert with ffmpeg first."
            )
        frames_per_chunk = int(16000 * (CHUNK_MS / 1000))
        chunks = []
        while True:
            data = wf.readframes(frames_per_chunk)
            if not data:
                break
            chunks.append(data)

    print(f"Loaded {len(chunks)} chunks (~{len(chunks) * CHUNK_MS / 1000:.1f}s of audio)")

    async with websockets.connect(WS_URL) as ws:
        await ws.send(
            __import__("json").dumps(
                {"type": "start", "passage_text": passage_text, "language": language}
            )
        )
        print("Sent start message. Streaming audio...")

        async def receiver():
            async for message in ws:
                print("SERVER:", message)

        recv_task = asyncio.create_task(receiver())

        for chunk in chunks:
            await ws.send(chunk)
            await asyncio.sleep(CHUNK_MS / 1000)

        print("Finished streaming audio. Sending finish...")
        await ws.send(__import__("json").dumps({"type": "finish"}))

        await asyncio.sleep(3)  # give the server time to flush + respond
        recv_task.cancel()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print('Usage: python test_ws_reading.py <wav_path> "<passage text>" [language]')
        sys.exit(1)

    wav_path = sys.argv[1]
    passage_text = sys.argv[2]
    language = sys.argv[3] if len(sys.argv) > 3 else "en"

    asyncio.run(stream_audio(wav_path, passage_text, language))