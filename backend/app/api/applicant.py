from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth.deps import require_role
from ..db.session import get_db
from ..models import Application, ApplicantProfile, Contact, ContactStatus, Favorite, Opportunity, User, UserRole
from ..models.tags import ApplicantSkill
from ..schemas.applicant import (
    ApplicantProfileOut,
    ApplicantProfileUpdate,
    ApplicationOut,
    ContactOut,
    ContactRequest,
)
from ..schemas.opportunity import OpportunityOut
from .opportunities import _build_opportunity_outs


router = APIRouter(prefix="/applicant", tags=["applicant"])


@router.get("/me", response_model=ApplicantProfileOut)
def me(db: Session = Depends(get_db), user: User = Depends(require_role(UserRole.applicant))) -> ApplicantProfileOut:
    p = db.scalar(select(ApplicantProfile).where(ApplicantProfile.user_id == user.id))
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Профиль не найден")
    skill_ids = list(db.scalars(select(ApplicantSkill.tag_id).where(ApplicantSkill.applicant_id == p.id)).all())
    return ApplicantProfileOut(**p.__dict__, skill_tag_ids=skill_ids)


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
    new_skill_ids = data.pop("skill_tag_ids", None)
    for k, v in data.items():
        setattr(p, k, v)
    if new_skill_ids is not None:
        db.query(ApplicantSkill).filter(ApplicantSkill.applicant_id == p.id).delete()
        for tag_id in new_skill_ids:
            db.add(ApplicantSkill(applicant_id=p.id, tag_id=tag_id))
    db.commit()
    db.refresh(p)
    skill_ids = list(db.scalars(select(ApplicantSkill.tag_id).where(ApplicantSkill.applicant_id == p.id)).all())
    return ApplicantProfileOut(**p.__dict__, skill_tag_ids=skill_ids)


@router.get("/applications", response_model=list[ApplicationOut])
def get_applications(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.applicant)),
) -> list[ApplicationOut]:
    profile = db.scalar(select(ApplicantProfile).where(ApplicantProfile.user_id == user.id))
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Профиль не найден")

    apps = list(db.scalars(
        select(Application).where(Application.applicant_id == profile.id).order_by(Application.created_at.desc())
    ).all())

    opp_ids = [a.opportunity_id for a in apps]
    opps = list(db.scalars(select(Opportunity).where(Opportunity.id.in_(opp_ids))).all()) if opp_ids else []
    opp_outs_by_id = {o.id: o for o in _build_opportunity_outs(opps, db)}

    return [
        ApplicationOut(
            id=a.id,
            opportunity_id=a.opportunity_id,
            status=a.status,
            cover_letter=a.cover_letter,
            created_at=a.created_at,
            opportunity=opp_outs_by_id[a.opportunity_id],
        )
        for a in apps
    ]


@router.get("/favorites", response_model=list[OpportunityOut])
def get_favorites(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.applicant)),
) -> list[OpportunityOut]:
    profile = db.scalar(select(ApplicantProfile).where(ApplicantProfile.user_id == user.id))
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Профиль не найден")

    favs = list(db.scalars(select(Favorite).where(Favorite.applicant_id == profile.id)).all())

    opp_ids = [f.opportunity_id for f in favs]
    opps = list(db.scalars(select(Opportunity).where(Opportunity.id.in_(opp_ids))).all()) if opp_ids else []
    return _build_opportunity_outs(opps, db)


@router.get("/contacts", response_model=list[ContactOut])
def get_contacts(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.applicant)),
) -> list[ContactOut]:
    profile = db.scalar(select(ApplicantProfile).where(ApplicantProfile.user_id == user.id))
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Профиль не найден")

    contacts = list(db.scalars(
        select(Contact).where(or_(Contact.requester_id == profile.id, Contact.receiver_id == profile.id))
    ).all())

    other_ids = [c.receiver_id if c.requester_id == profile.id else c.requester_id for c in contacts]
    profiles_by_id: dict[int, ApplicantProfile] = {}
    if other_ids:
        for p in db.scalars(select(ApplicantProfile).where(ApplicantProfile.id.in_(other_ids))).all():
            profiles_by_id[p.id] = p

    result = []
    for c in contacts:
        other_id = c.receiver_id if c.requester_id == profile.id else c.requester_id
        other_profile = profiles_by_id.get(other_id)
        result.append(ContactOut(
            id=c.id,
            other_applicant_id=other_id,
            other_full_name=other_profile.full_name if other_profile else None,
            status=c.status,
            created_at=c.created_at,
            is_requester=(c.requester_id == profile.id),
        ))
    return result


@router.post("/contacts", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def create_contact(
    payload: ContactRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.applicant)),
) -> ContactOut:
    profile = db.scalar(select(ApplicantProfile).where(ApplicantProfile.user_id == user.id))
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Профиль не найден")

    if payload.receiver_id == profile.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нельзя добавить себя в контакты")

    receiver = db.get(ApplicantProfile, payload.receiver_id)
    if not receiver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Соискатель не найден")

    contact = Contact(requester_id=profile.id, receiver_id=payload.receiver_id, status=ContactStatus.pending)
    db.add(contact)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Запрос контакта уже существует")
    db.refresh(contact)

    return ContactOut(
        id=contact.id,
        other_applicant_id=payload.receiver_id,
        other_full_name=receiver.full_name,
        status=contact.status,
        created_at=contact.created_at,
        is_requester=True,
    )

