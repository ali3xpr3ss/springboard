from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth.deps import require_role
from ..db.session import get_db
from ..models import EmployerProfile, User, UserRole
from ..schemas.employer import EmployerProfileOut, EmployerProfileUpdate


router = APIRouter(prefix="/employer", tags=["employer"])


@router.get("/me", response_model=EmployerProfileOut)
def me(db: Session = Depends(get_db), user: User = Depends(require_role(UserRole.employer))) -> EmployerProfileOut:
    p = db.scalar(select(EmployerProfile).where(EmployerProfile.user_id == user.id))
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Профиль не найден")
    return EmployerProfileOut(**p.__dict__)


@router.put("/me", response_model=EmployerProfileOut)
def update_me(
    payload: EmployerProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.employer)),
) -> EmployerProfileOut:
    p = db.scalar(select(EmployerProfile).where(EmployerProfile.user_id == user.id))
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Профиль не найден")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return EmployerProfileOut(**p.__dict__)

