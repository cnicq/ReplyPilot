from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "postgresql://replypilot:replypilot@localhost:5433/replypilot"
    ai_provider: str = "mimo"
    ai_api_key: str = ""
    ai_base_url: str = "https://api.xiaomimimo.com/v1"
    ai_model: str = "mimo-v2.5-pro"
    max_history_examples: int = 15
    api_port: int = 7800


settings = Settings()
