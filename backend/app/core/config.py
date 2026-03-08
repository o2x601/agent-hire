from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # App
    app_name: str = "Agent-Hire API"
    debug: bool = False
    api_prefix: str = "/api/v1"

    # Supabase
    supabase_url: str
    supabase_service_role_key: str

    # OpenAI
    openai_api_key: str = ""

    # Ollama (ローカルLLM)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3"

    # LLM routing threshold (ms): これを超えたら OpenAI にフォールバック
    llm_timeout_ms: int = 5000

    # Frontend URL (CORS)
    frontend_url: str = "http://localhost:3000"


settings = Settings()
