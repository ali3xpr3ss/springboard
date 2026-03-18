from datetime import UTC, datetime, timedelta

from jose import jwt
from passlib.context import CryptContext

from ..settings import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def create_access_token(*, user_id: int, role: str) -> tuple[str, datetime]:
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.jwt_access_ttl_min)
    token = jwt.encode(
        {"sub": str(user_id), "role": role, "exp": expires_at},
        settings.jwt_secret,
        algorithm="HS256",
    )
    return token, expires_at


def create_refresh_token() -> str:
    return pwd_context.hash(f"rt-{datetime.now(UTC).timestamp()}").replace("/", "_")


def create_refresh_token_expiry() -> datetime:
    return datetime.now(UTC) + timedelta(days=settings.jwt_refresh_ttl_days)

