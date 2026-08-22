from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import asr, health, ocr, llm, ws_reading, auth, passages, classes, sessions, tests
from app.services.asr_service import asr_service
from app.db import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    asr_service.load()
    yield
    asr_service.unload()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(classes.router)
app.include_router(passages.router)
app.include_router(sessions.router)
app.include_router(tests.router)
app.include_router(health.router)
app.include_router(asr.router)
app.include_router(ocr.router)
app.include_router(llm.router)
app.include_router(ws_reading.router)