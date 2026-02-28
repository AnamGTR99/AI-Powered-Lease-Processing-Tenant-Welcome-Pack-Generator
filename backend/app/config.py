from pathlib import Path

from pydantic_settings import BaseSettings

# Sensible local default: template lives at repo_root/template/
_DEFAULT_TEMPLATE_PATH = str(
    Path(__file__).resolve().parent.parent.parent
    / "template"
    / "Tenant Welcome Pack Template.docx"
)


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_jwt_secret: str = ""

    # AI APIs
    gemini_api_key: str = ""

    # CORS — comma-separated origins supported (e.g. "https://app.vercel.app,http://localhost:5173")
    frontend_url: str = "http://localhost:5173"

    # Welcome Pack template path — override via TEMPLATE_PATH env var in Docker
    template_path: str = _DEFAULT_TEMPLATE_PATH

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def cors_origins(self) -> list[str]:
        """Parse frontend_url into a list of origins (supports comma-separated)."""
        return [origin.strip() for origin in self.frontend_url.split(",") if origin.strip()]


settings = Settings()
