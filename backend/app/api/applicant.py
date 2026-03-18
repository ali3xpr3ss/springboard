from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth.deps import require_role
from ..db.session import get_db
from ..models import ApplicantProfile, User, UserRole
from ..schemas.applicant import ApplicantProfileOut, ApplicantProfileUpdate


router = APIRouter(prefix="/applicant", tags=["applicant"])


@router.get("/me", response_model=ApplicantProfileOut)
def me(db: Session = Depends(get_db), user: User = Depends(require_role(UserRole.applicant))) -> ApplicantProfileOut:
    p = db.scalar(select(ApplicantProfile).where(ApplicantProfile.user_id == user.id))
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Профиль не найден")
    return ApplicantProfileOut(**p.__dict__)


@router.put("/me", response_model=ApplicantProfileOut)
def update_me(
    payload: ApplicantProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.applicant)),
) -> ApplicantProfileOut:
    p = db.scalar(select(ApplicantProfile).where(ApplicantProfile.user_id == user.id))
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Профиль не найден")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return ApplicantProfileOut(**p.__dict__)

