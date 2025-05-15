import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "My FastAPI App"
    debug: bool = True
    DATABASE_URL: str = "postgresql://postgres:gcghH9Y1mlBP4iJI@practically-stalwart-jaguar.data-1.euc1.tembo.io:5432/postgres"
    JWKS_URL: str = "https://clear-fowl-0.clerk.accounts.dev/.well-known/jwks.json"
    CLERK_AUDIENCE: str = "api"
    CLERK_WEBHOOK_SECRET: str = "whsec_y+PbMjlVUABxp7BJg/CRPGNKFPdvbWp5"

settings = Settings()