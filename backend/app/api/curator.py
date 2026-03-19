from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth.deps import require_role
from ..db.session import get_db
from ..models import (
    CuratorProfile,
    EmployerProfile,
    Opportunity,
    OpportunityStatus,
    Tag,
    TagCategory,
    User,
    UserRole,
    VerificationStatus,
)
from ..schemas.tag import TagCreate, TagOut
from ..schemas.user import UserOut


router = APIRouter(prefix="/curator", tags=["curator"])


def _require_curator(db: Session, user: User) -> CuratorProfile:
    c = db.scalar(select(CuratorProfile).where(CuratorProfile.user_id == user.id))
    if not c:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Профиль куратора не найден")
    return c


@router.get("/employers/pending")
def employers_pending(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.curator)),
) -> list[dict]:
    _require_curator(db, user)
    rows = db.scalars(select(EmployerProfile).where(EmployerProfile.verification_status == VerificationStatus.pending)).all()
    return [
        {
            "id": e.id,
            "user_id": e.user_id,
            "company_name": e.company_name,
            "inn": e.inn,
            "corp_email_domain": e.corp_email_domain,
            "verification_status": e.verification_status,
        }
        for e in rows
    ]


@router.post("/employers/{employer_id}/verify")
def verify_employer(
    employer_id: int,
    action: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.curator)),
) -> dict:
    _require_curator(db, user)
    e = db.get(EmployerProfile, employer_id)
    if not e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Не найдено")
    if action not in ("approve", "reject"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="action=approve|reject")
    e.verification_status = VerificationStatus.approved if action == "approve" else VerificationStatus.rejected
    db.commit()
    return {"ok": True, "verification_status": e.verification_status}


@router.get("/opportunities/pending")
def opportunities_pending(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.curator)),
) -> list[dict]:
    _require_curator(db, user)
    rows = db.scalars(select(Opportunity).where(Opportunity.status == OpportunityStatus.pending_moderation)).all()
    return [
        {
            "id": o.id,
            "title": o.title,
            "employer_id": o.employer_id,
            "opportunity_type": o.opportunity_type,
            "work_format": o.work_format,
            "city": o.city,
            "status": o.status,
        }
        for o in rows
    ]


@router.post("/opportunities/{opportunity_id}/moderate")
def moderate_opportunity(
    opportunity_id: int,
    action: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.curator)),
) -> dict:
    _require_curator(db, user)
    o = db.get(Opportunity, opportunity_id)
    if not o:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Не найдено")
    if action not in ("approve", "reject"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="action=approve|reject")
    o.status = OpportunityStatus.active if action == "approve" else OpportunityStatus.closed
    db.commit()
    return {"ok": True, "status": o.status}


@router.post("/tags", response_model=TagOut, status_code=status.HTTP_201_CREATED)
def create_tag(
    payload: TagCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.curator)),
) -> TagOut:
    _require_curator(db, user)

    existing = db.scalar(select(Tag).where(Tag.slug == payload.slug))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug уже занят")

    t = Tag(name=payload.name, slug=payload.slug, category=payload.category, is_system=False, usage_count=0)
    db.add(t)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug уже занят")
    db.refresh(t)
    return TagOut(id=t.id, name=t.name, slug=t.slug, category=t.category, is_system=t.is_system, usage_count=t.usage_count)


@router.get("/users", response_model=list[UserOut])
def list_users(
    role: UserRole | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.curator)),
) -> list[UserOut]:
    _require_curator(db, user)

    stmt = select(User)
    if role is not None:
        stmt = stmt.where(User.role == role)
    stmt = stmt.order_by(User.created_at.desc())
    users = db.scalars(stmt).all()
    return [
        UserOut(
            id=u.id,
            email=u.email,
            display_name=u.display_name,
            role=u.role,
            is_active=u.is_active,
            avatar_url=u.avatar_url,
            created_at=u.created_at,
        )
        for u in users
    ]
