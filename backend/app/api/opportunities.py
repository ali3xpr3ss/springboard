from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth.deps import get_current_user, require_role
from ..db.session import get_db

from ..models import (
    ApplicantProfile,
    Application,
    ApplicationStatus,
    EmployerProfile,
    Opportunity,
    OpportunityStatus,
    OpportunityTag,
    Tag,
    User,
    UserRole,
    VerificationStatus,
)
from ..schemas.applicant import ApplicationCreate, ApplicationOut
from ..schemas.opportunity import OpportunityCreate, OpportunityOut


router = APIRouter(prefix="/opportunities", tags=["opportunities"])


def _build_opportunity_outs(opps: list[Opportunity], db: Session) -> list[OpportunityOut]:
    opp_ids = [o.id for o in opps]
    tags_by_opp: dict[int, list[dict]] = {oid: [] for oid in opp_ids}
    if opp_ids:
        rows = db.execute(
            select(OpportunityTag.opportunity_id, Tag.id, Tag.name, Tag.slug, Tag.category)
            .join(Tag, Tag.id == OpportunityTag.tag_id)
            .where(OpportunityTag.opportunity_id.in_(opp_ids))
        ).all()
        for opp_id, tid, name, slug, cat in rows:
            tags_by_opp[opp_id].append({"id": tid, "name": name, "slug": slug, "category": cat})

    employer_ids = list({o.employer_id for o in opps})
    employer_names: dict[int, str] = {}
    if employer_ids:
        emp_rows = db.execute(
            select(EmployerProfile.id, EmployerProfile.company_name)
            .where(EmployerProfile.id.in_(employer_ids))
        ).all()
        employer_names = {eid: name for eid, name in emp_rows}

    return [
        OpportunityOut(
            id=o.id, employer_id=o.employer_id, title=o.title, description=o.description,
            opportunity_type=o.opportunity_type, work_format=o.work_format, status=o.status,
            city=o.city, address=o.address, lat=o.lat, lng=o.lng,
            salary_from=o.salary_from, salary_to=o.salary_to,
            published_at=o.published_at, expires_at=o.expires_at, event_date=o.event_date,
            scheduled_at=o.scheduled_at,
            company_name=employer_names.get(o.employer_id),
            tags=tags_by_opp.get(o.id, []),
        )
        for o in opps
    ]


@router.get("", response_model=list[OpportunityOut])
def list_opportunities(
    db: Session = Depends(get_db),
    q: str | None = None,
    types: list[str] | None = Query(default=None),
    formats: list[str] | None = Query(default=None),
    tag_ids: list[int] | None = Query(default=None),
    salary_from: int | None = None,
    salary_to: int | None = None,
    city: str | None = None,
) -> list[OpportunityOut]:
    conditions = [Opportunity.status.in_([OpportunityStatus.active, OpportunityStatus.scheduled])]
    if q:
        like = f"%{q}%"
        conditions.append(Opportunity.title.ilike(like))
    if types:
        conditions.append(Opportunity.opportunity_type.in_(types))
    if formats:
        conditions.append(Opportunity.work_format.in_(formats))
    if city:
        conditions.append(Opportunity.city.ilike(city))
    if salary_from is not None:
        conditions.append((Opportunity.salary_to.is_not(None)) & (Opportunity.salary_to >= salary_from) | (Opportunity.salary_from >= salary_from))
    if salary_to is not None:
        conditions.append((Opportunity.salary_from.is_not(None)) & (Opportunity.salary_from <= salary_to) | (Opportunity.salary_to <= salary_to))

    stmt = select(Opportunity).where(and_(*conditions)).order_by(Opportunity.published_at.desc()).limit(200)
    opps = list(db.scalars(stmt).all())

    outs = _build_opportunity_outs(opps, db)

    # filter by tag_ids (post-filter: requires any of them)
    if tag_ids:
        tag_set = set(tag_ids)
        outs = [o for o in outs if any(t["id"] in tag_set for t in o.tags)]

    return outs


@router.get("/{opportunity_id}", response_model=OpportunityOut)
def get_opportunity(opportunity_id: int, db: Session = Depends(get_db)) -> OpportunityOut:
    o = db.get(Opportunity, opportunity_id)
    if not o:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Не найдено")
    rows = db.execute(
        select(Tag.id, Tag.name, Tag.slug, Tag.category)
        .join(OpportunityTag, OpportunityTag.tag_id == Tag.id)
        .where(OpportunityTag.opportunity_id == o.id)
    ).all()
    tags = [{"id": tid, "name": name, "slug": slug, "category": cat} for tid, name, slug, cat in rows]
    emp = db.scalar(select(EmployerProfile).where(EmployerProfile.id == o.employer_id))
    return OpportunityOut(
        id=o.id,
        employer_id=o.employer_id,
        title=o.title,
        description=o.description,
        opportunity_type=o.opportunity_type,
        work_format=o.work_format,
        status=o.status,
        city=o.city,
        address=o.address,
        lat=o.lat,
        lng=o.lng,
        salary_from=o.salary_from,
        salary_to=o.salary_to,
        published_at=o.published_at,
        expires_at=o.expires_at,
        event_date=o.event_date,
        scheduled_at=o.scheduled_at,
        company_name=emp.company_name if emp else None,
        tags=tags,
    )


@router.post("", response_model=OpportunityOut)
def create_opportunity(
    payload: OpportunityCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.employer)),
) -> OpportunityOut:
    employer = db.scalar(select(EmployerProfile).where(EmployerProfile.user_id == user.id))
    if not employer:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Профиль работодателя не найден")
    if employer.verification_status != VerificationStatus.approved:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Компания не верифицирована. Дождитесь одобрения куратора.")

    now = datetime.now(timezone.utc)
    scheduled_at = payload.scheduled_at
    if scheduled_at is not None and scheduled_at.tzinfo is not None and scheduled_at > now:
        initial_status = OpportunityStatus.scheduled
    else:
        initial_status = OpportunityStatus.pending_moderation
        scheduled_at = None

    o = Opportunity(
        employer_id=employer.id,
        title=payload.title,
        description=payload.description,
        opportunity_type=payload.opportunity_type,
        work_format=payload.work_format,
        city=payload.city,
        address=payload.address,
        lat=payload.lat,
        lng=payload.lng,
        salary_from=payload.salary_from,
        salary_to=payload.salary_to,
        expires_at=payload.expires_at,
        event_date=payload.event_date,
        scheduled_at=scheduled_at,
        status=initial_status,
    )
    db.add(o)
    db.flush()
    for tid in payload.tag_ids:
        db.add(OpportunityTag(opportunity_id=o.id, tag_id=tid))
    db.commit()
    return get_opportunity(o.id, db)


@router.post("/{opportunity_id}/apply", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def apply_to_opportunity(
    opportunity_id: int,
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.applicant)),
) -> ApplicationOut:
    o = db.get(Opportunity, opportunity_id)
    if not o or o.status != OpportunityStatus.active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Вакансия не найдена или неактивна")

    profile = db.scalar(select(ApplicantProfile).where(ApplicantProfile.user_id == user.id))
    if not profile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Профиль соискателя не найден")

    app = Application(
        applicant_id=profile.id,
        opportunity_id=opportunity_id,
        status=ApplicationStatus.pending,
        cover_letter=payload.cover_letter,
    )
    db.add(app)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Вы уже откликались на эту вакансию")
    db.refresh(app)

    opp_out = _build_opportunity_outs([o], db)[0]
    return ApplicationOut(
        id=app.id,
        opportunity_id=app.opportunity_id,
        status=app.status,
        cover_letter=app.cover_letter,
        created_at=app.created_at,
        opportunity=opp_out,
    )

