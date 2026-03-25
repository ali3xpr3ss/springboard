from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth.deps import require_role
from ..db.session import get_db
from ..models import (
    ApplicantProfile,
    Application,
    ApplicationStatus,
    EmployerProfile,
    Opportunity,
    OpportunityStatus,
    OpportunityTag,
    User,
    UserRole,
    VerificationStatus,
)
from ..schemas.employer import (
    ApplicationStatusUpdate,
    EmployerApplicationOut,
    EmployerProfileOut,
    EmployerProfileUpdate,
)
from ..schemas.opportunity import OpportunityOut, OpportunityUpdate
from .opportunities import _build_opportunity_outs, get_opportunity


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
    verification_fields = {"inn", "corp_email_domain"}
    if verification_fields & data.keys():
        data["verification_status"] = VerificationStatus.pending
    for k, v in data.items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return EmployerProfileOut(**p.__dict__)


@router.get("/opportunities", response_model=list[OpportunityOut])
def get_employer_opportunities(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.employer)),
    opp_status: OpportunityStatus | None = Query(default=None, alias="status"),
) -> list[OpportunityOut]:
    profile = db.scalar(select(EmployerProfile).where(EmployerProfile.user_id == user.id))
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Профиль не найден")

    stmt = select(Opportunity).where(Opportunity.employer_id == profile.id)
    if opp_status is not None:
        stmt = stmt.where(Opportunity.status == opp_status)
    stmt = stmt.order_by(Opportunity.published_at.desc())
    opps = list(db.scalars(stmt).all())
    return _build_opportunity_outs(opps, db)


@router.put("/opportunities/{opportunity_id}", response_model=OpportunityOut)
def update_opportunity(
    opportunity_id: int,
    payload: OpportunityUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.employer)),
) -> OpportunityOut:
    profile = db.scalar(select(EmployerProfile).where(EmployerProfile.user_id == user.id))
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Профиль не найден")

    o = db.get(Opportunity, opportunity_id)
    if not o:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Вакансия не найдена")
    if o.employer_id != profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа")

    data = payload.model_dump(exclude_unset=True)
    tag_ids = data.pop("tag_ids", None)

    for k, v in data.items():
        setattr(o, k, v)

    if tag_ids is not None:
        db.execute(
            OpportunityTag.__table__.delete().where(OpportunityTag.opportunity_id == o.id)
        )
        for tid in tag_ids:
            db.add(OpportunityTag(opportunity_id=o.id, tag_id=tid))

    db.commit()
    db.refresh(o)
    return get_opportunity(o.id, db)


@router.patch("/opportunities/{opportunity_id}/status", response_model=OpportunityOut)
def toggle_opportunity_status(
    opportunity_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.employer)),
) -> OpportunityOut:
    profile = db.scalar(select(EmployerProfile).where(EmployerProfile.user_id == user.id))
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Профиль не найден")
    o = db.get(Opportunity, opportunity_id)
    if not o:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Вакансия не найдена")
    if o.employer_id != profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа")
    if o.status == OpportunityStatus.active:
        o.status = OpportunityStatus.closed
    elif o.status == OpportunityStatus.closed:
        o.status = OpportunityStatus.active
    db.commit()
    db.refresh(o)
    return get_opportunity(o.id, db)


@router.delete("/opportunities/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_opportunity(
    opportunity_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.employer)),
) -> None:
    profile = db.scalar(select(EmployerProfile).where(EmployerProfile.user_id == user.id))
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Профиль не найден")

    o = db.get(Opportunity, opportunity_id)
    if not o:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Вакансия не найдена")
    if o.employer_id != profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа")

    db.delete(o)
    db.commit()


@router.get("/applications", response_model=list[EmployerApplicationOut])
def get_employer_applications(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.employer)),
    q: str | None = None,
    app_status: ApplicationStatus | None = Query(default=None, alias="status"),
) -> list[EmployerApplicationOut]:
    profile = db.scalar(select(EmployerProfile).where(EmployerProfile.user_id == user.id))
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Профиль не найден")

    opp_ids = list(db.scalars(
        select(Opportunity.id).where(Opportunity.employer_id == profile.id)
    ).all())
    if not opp_ids:
        return []

    stmt = (
        select(Application)
        .join(ApplicantProfile, ApplicantProfile.id == Application.applicant_id)
        .where(Application.opportunity_id.in_(opp_ids))
    )
    if app_status is not None:
        stmt = stmt.where(Application.status == app_status)
    if q:
        stmt = stmt.where(ApplicantProfile.full_name.ilike(f"%{q}%"))
    stmt = stmt.order_by(Application.created_at.desc())
    applications = list(db.scalars(stmt).all())

    applicant_ids = list({a.applicant_id for a in applications})
    profiles_by_id: dict[int, ApplicantProfile] = {}
    if applicant_ids:
        rows = db.scalars(select(ApplicantProfile).where(ApplicantProfile.id.in_(applicant_ids))).all()
        profiles_by_id = {p.id: p for p in rows}

    opps_by_id: dict[int, Opportunity] = {}
    opp_rows = db.scalars(select(Opportunity).where(Opportunity.id.in_(opp_ids))).all()
    opps_by_id = {o.id: o for o in opp_rows}

    result = []
    for a in applications:
        applicant_profile = profiles_by_id.get(a.applicant_id)
        opp = opps_by_id.get(a.opportunity_id)
        result.append(EmployerApplicationOut(
            id=a.id,
            opportunity_id=a.opportunity_id,
            opportunity_title=opp.title if opp else "",
            applicant_profile_id=a.applicant_id,
            applicant_full_name=applicant_profile.full_name if applicant_profile else None,
            status=a.status,
            cover_letter=a.cover_letter,
            created_at=a.created_at,
        ))
    return result


@router.patch("/applications/{application_id}/status", response_model=EmployerApplicationOut)
def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.employer)),
) -> EmployerApplicationOut:
    profile = db.scalar(select(EmployerProfile).where(EmployerProfile.user_id == user.id))
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Профиль не найден")

    a = db.get(Application, application_id)
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заявка не найдена")

    o = db.get(Opportunity, a.opportunity_id)
    if not o or o.employer_id != profile.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа")

    a.status = payload.status
    db.commit()
    db.refresh(a)

    applicant_profile = db.get(ApplicantProfile, a.applicant_id)
    return EmployerApplicationOut(
        id=a.id,
        opportunity_id=a.opportunity_id,
        opportunity_title=o.title,
        applicant_profile_id=a.applicant_id,
        applicant_full_name=applicant_profile.full_name if applicant_profile else None,
        status=a.status,
        cover_letter=a.cover_letter,
        created_at=a.created_at,
    )
