from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..models import Tag, TagCategory
from ..schemas.tag import TagOut


router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagOut])
def list_tags(
    category: TagCategory | None = None,
    db: Session = Depends(get_db),
) -> list[TagOut]:
    stmt = select(Tag)
    if category is not None:
        stmt = stmt.where(Tag.category == category)
    stmt = stmt.order_by(Tag.usage_count.desc(), Tag.name.asc())
    tags = db.scalars(stmt).all()
    return [
        TagOut(
            id=t.id,
            name=t.name,
            slug=t.slug,
            category=t.category,
            is_system=t.is_system,
            usage_count=t.usage_count,
        )
        for t in tags
    ]
