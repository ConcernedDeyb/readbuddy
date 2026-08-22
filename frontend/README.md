# ReadBuddy Frontend

Next.js frontend. Right now this is just a chain-test page - it proves the
frontend can reach the FastAPI backend and get a real transcription back
from your GPU. It is NOT the real ReadBuddy UI yet.

## Setup

```bash
npm install
cp .env.local.example .env.local
```

## Run it

Make sure `readbuddy-backend` is already running on port 8000 first, then:

```bash
npm run dev
```

Open http://localhost:3000. You should see:

1. A button to check `/health` — click it, confirm it shows
   `"cuda_available": true`.
2. A file upload for a WAV file — upload a short 16kHz mono recording of
   yourself saying something, and confirm the transcription comes back
   correctly.

If both work, the full chain (browser -> FastAPI -> wav2vec2 -> your RTX
2070 -> back to browser) is proven end to end.

## What's next

This test page gets replaced by the real screens from `design.md`:
input method selection, extracted-text review, guided reading with live
pronunciation feedback (WebSocket, not file upload), the comprehension
test, and the Phil-IRI result screen. Build those once this proof-of-chain
is confirmed working on your machine.
