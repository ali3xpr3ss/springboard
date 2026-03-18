from sqlalchemy import select

from ..db.session import SessionLocal
from ..models import EmployerProfile, Opportunity, OpportunityStatus, OpportunityType, Tag, TagCategory, WorkFormat


def ensure_demo_data() -> None:
    db = SessionLocal()
    try:
        # system tags
        existing_tags = db.scalar(select(Tag.id))
        if not existing_tags:
            tags = [
                ("Python", "python", TagCategory.tech),
                ("Java", "java", TagCategory.tech),
                ("SQL", "sql", TagCategory.tech),
                ("Junior", "junior", TagCategory.level),
                ("Middle", "middle", TagCategory.level),
                ("Полная занятость", "full-time", TagCategory.employment),
                ("Частичная занятость", "part-time", TagCategory.employment),
            ]
            for name, slug, cat in tags:
                db.add(Tag(name=name, slug=slug, category=cat, is_system=True))
            db.commit()

        # if there is at least one employer, but no active opportunities — create demo
        employer = db.scalar(select(EmployerProfile).order_by(EmployerProfile.id.asc()))
        if not employer:
            return
        has_active = db.scalar(select(Opportunity.id).where(Opportunity.status == OpportunityStatus.active))
        if has_active:
            return

        db.add(
            Opportunity(
                employer_id=employer.id,
                title="Junior Python стажёр",
                description="Стажировка для студентов: Python, SQL, пет‑проекты приветствуются.",
                opportunity_type=OpportunityType.internship,
                work_format=WorkFormat.remote,
                status=OpportunityStatus.active,
                city="Москва",
                lat=55.751244,
                lng=37.618423,
                salary_from=40000,
                salary_to=80000,
            )
        )
        db.add(
            Opportunity(
                employer_id=employer.id,
                title="Хакатон от компании",
                description="Очное мероприятие для студентов: командная разработка, призы и собеседования.",
                opportunity_type=OpportunityType.event,
                work_format=WorkFormat.office,
                status=OpportunityStatus.active,
                city="Санкт‑Петербург",
                lat=59.93428,
                lng=30.335099,
            )
        )
        db.commit()
    finally:
        db.close()

