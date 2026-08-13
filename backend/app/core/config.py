from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/bitlabs_coding_lab"
    SECRET_KEY: str = "change-this-secret-key-before-production"
    GROQ_API_KEY: str | None = None
    NVIDIA_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    EXECUTION_TIMEOUT: int = 10
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
