from pydantic import BaseModel, EmailStr, Field

from ..models.enums import UserRole


class RegisterRequest(BaseModel):
    email: EmailStr
    display_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=6, max_length=200)
    role: UserRole

    # employer extras (optional; can be filled позже)
    company_name: str | None = Field(default=None, max_length=200)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    access_expires_at: str
    refresh_token: str
    refresh_expires_at: str
    role: UserRole | None = None
    user_id: int | None = None


class RefreshRequest(BaseModel):
    refresh_token: str

