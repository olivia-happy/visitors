from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    app_env: str
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    amap_web_service_key: str
    xiaohongshu_parser_mode: str

    @property
    def storage_mode(self) -> str:
        if self.supabase_url and self.supabase_service_role_key:
            return "supabase"
        return "memory"


def get_settings() -> Settings:
    return Settings(
        app_env=os.getenv("APP_ENV", "development"),
        supabase_url=os.getenv("SUPABASE_URL", ""),
        supabase_anon_key=os.getenv("SUPABASE_ANON_KEY", ""),
        supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
        amap_web_service_key=os.getenv("AMAP_WEB_SERVICE_KEY", ""),
        xiaohongshu_parser_mode=os.getenv("XIAOHONGSHU_PARSER_MODE", "best_effort"),
    )
