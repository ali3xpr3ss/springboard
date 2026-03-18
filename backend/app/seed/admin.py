from sqlalchemy import select

from ..auth.security import hash_password
from ..db.session import SessionLocal
from ..models import CuratorProfile, User, UserRole
from ..settings import settings


def ensure_admin_curator() -> None:
    db = SessionLocal()
    try:
        existing = db.scalar(select(User).where(User.email == settings.admin_email))
        if existing:
            return

        user = User(
            email=settings.admin_email,
            display_name=settings.admin_display_name,
            hashed_password=hash_password(settings.admin_password),
            role=UserRole.curator,
            is_active=True,
        )
        db.add(user)
        db.flush()
        db.add(CuratorProfile(user_id=user.id, is_admin=True, created_by_id=None))
        db.commit()
    finally:
        db.close()

