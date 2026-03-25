from datetime import datetime

from pydantic import BaseModel

from ..models.enums import UserRole


class UserOut(BaseModel):
    id: int
    email: str
    display_name: str
    role: UserRole
    is_active: bool
    avatar_url: str | None
    created_at: datetime


class UserActiveUpdate(BaseModel):
    is_active: bool
