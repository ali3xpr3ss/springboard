from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://tramplin:tramplin@localhost:5432/tramplin"
    cors_origins: list[str] = ["http://localhost:5173"]

    jwt_secret: str = "dev-secret-change-me"
    jwt_access_ttl_min: int = 30
    jwt_refresh_ttl_days: int = 30

    admin_email: str = "admin@gmail.com"
    admin_password: str = "admin"
    admin_display_name: str = "Администратор"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

