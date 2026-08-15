# ReadBuddy Backend

FastAPI backend. This scaffold's only job right now is to prove the chain
works: browser -> FastAPI -> wav2vec2 model -> your RTX 2070. It's not the
full app yet - see `Rules.md` and `architecture.md` in the docs set for what
comes next (streaming WebSocket audio, the LLM comprehension-test route,
PostgreSQL models).

## Setup

Use the same Python 3.14 environment you already confirmed CUDA works in
(the one where `torch.cuda.is_available()` returned `True`).

```bash
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Also install torch/torchaudio matching YOUR cuda version - see the
# environment-setup conversation for why this is separate from requirements.txt:
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu132
```

Copy `.env.example` to `.env` and adjust if needed (defaults match what's
already confirmed working).

## Run it

```bash
uvicorn app.main:app --reload --port 8000
```

Watch the terminal on startup - you should see:

```
[ASRService] Loading models on cuda...
[ASRService] Both models loaded.
```

If it says `cpu` instead of `cuda`, stop and fix your torch install before
going further - see the environment-setup steps we already worked through.

## Test it

**Health check:**
```bash
curl http://localhost:8000/health
```

**ASR test** (needs a short 16kHz mono WAV file - record one with your
phone's voice recorder or any tool, then convert with ffmpeg if needed:
`ffmpeg -i input.m4a -ar 16000 -ac 1 test.wav`):

```bash
curl -X POST "http://localhost:8000/asr/test?language=en" \
  -F "file=@test.wav"
```

Expected response:
```json
{"language": "en", "transcription": "WHATEVER YOU SAID"}
```

If this works, the full chain (audio in -> GPU model -> text out) is proven
and you're ready to build the frontend against this backend, then move on
to the real WebSocket streaming route.

## Structure

```
app/
  main.py              - FastAPI app, CORS, lifespan (model load/unload)
  config.py            - settings, reads from .env
  routes/
    health.py           - GET /health
    asr.py               - POST /asr/test (proof-of-chain only)
  services/
    asr_service.py       - the two wav2vec2 models, singleton, load()/unload()/transcribe()
```

Next additions, in order (see the build-order plan): `services/llm_service.py`
(Ollama + SeaLLM), `services/ocr_service.py` (EasyOCR), `services/document_service.py`
(PyMuPDF/mammoth), then the database models from `Schema.md`, then the real
WebSocket streaming route to replace this test one.
