from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Central config, matching the model choices locked in during the title
    hearing / architecture.md. Reads from .env - copy .env.example to .env
    and adjust if your setup differs.
    """
    app_name: str = "ReadBuddy Backend"
    device: str = "cuda"  # ASRService falls back to cpu automatically if unavailable

    asr_model: str = "facebook/mms-1b-all"
    asr_en_model: str = "jonatasgrosman/wav2vec2-large-xlsr-53-english"
    asr_tl_model: str = "Khalsuu/filipino-wav2vec2-l-xls-r-300m-official"

    ollama_model: str = "gemma3:4b"
    ollama_base_url: str = "http://localhost:11434"

    database_url: str = "postgresql://readbuddy:readbuddy@localhost:5432/readbuddy"

    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"]

    jwt_secret_key: str = "change-me-in-.env"  # MUST override in .env for anything beyond local dev
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "no-reply@readbuddy.local"

    frontend_base_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
