from datetime import UTC

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth.security import (
    create_access_token,
    create_refresh_token,
    create_refresh_token_expiry,
    hash_password,
    verify_password,
)
from ..db.session import get_db
from ..models import (
    ApplicantProfile,
    CuratorProfile,
    EmployerProfile,
    RefreshToken,
    User,
    UserRole,
)
from ..schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenPair


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenPair)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenPair:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email уже зарегистрирован")

    if payload.role == UserRole.curator:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Регистрация кураторов закрыта. Аккаунты кураторов создаются администратором.",
        )

    user = User(
        email=payload.email,
        display_name=payload.display_name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    db.flush()  # получить user.id

    if payload.role == UserRole.applicant:
        db.add(ApplicantProfile(user_id=user.id))
    elif payload.role == UserRole.employer:
        company_name = payload.company_name or payload.display_name
        db.add(EmployerProfile(user_id=user.id, company_name=company_name))
    elif payload.role == UserRole.curator:
        db.add(CuratorProfile(user_id=user.id, is_admin=False))

    access, access_exp = create_access_token(user_id=user.id, role=user.role.value)
    refresh = create_refresh_token()
    refresh_exp = create_refresh_token_expiry()
    db.add(RefreshToken(user_id=user.id, token=refresh, expires_at=refresh_exp))
    db.commit()

    return TokenPair(
        access_token=access,
        access_expires_at=access_exp.isoformat(),
        refresh_token=refresh,
        refresh_expires_at=refresh_exp.isoformat(),
        role=user.role,
        user_id=user.id,
    )


@router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenPair:
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный логин или пароль")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Пользователь заблокирован")

    access, access_exp = create_access_token(user_id=user.id, role=user.role.value)
    refresh = create_refresh_token()
    refresh_exp = create_refresh_token_expiry()
    db.add(RefreshToken(user_id=user.id, token=refresh, expires_at=refresh_exp))
    db.commit()

    return TokenPair(
        access_token=access,
        access_expires_at=access_exp.isoformat(),
        refresh_token=refresh,
        refresh_expires_at=refresh_exp.isoformat(),
        role=user.role,
        user_id=user.id,
    )


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenPair:
    rt = db.scalar(select(RefreshToken).where(RefreshToken.token == payload.refresh_token))
    if not rt:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token недействителен")
    if rt.expires_at.replace(tzinfo=UTC) < __import__("datetime").datetime.now(UTC):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token недействителен")

    user = db.get(User, rt.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден")

    # rotation: удалить старый, выдать новый
    db.delete(rt)

    access, access_exp = create_access_token(user_id=user.id, role=user.role.value)
    new_refresh = create_refresh_token()
    refresh_exp = create_refresh_token_expiry()
    db.add(RefreshToken(user_id=user.id, token=new_refresh, expires_at=refresh_exp))
    db.commit()

    return TokenPair(
        access_token=access,
        access_expires_at=access_exp.isoformat(),
        refresh_token=new_refresh,
        refresh_expires_at=refresh_exp.isoformat(),
        role=user.role,
        user_id=user.id,
    )

