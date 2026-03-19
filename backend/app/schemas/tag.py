from pydantic import BaseModel, Field

from ..models.enums import TagCategory


class TagOut(BaseModel):
    id: int
    name: str
    slug: str
    category: TagCategory
    is_system: bool
    usage_count: int


class TagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    slug: str = Field(min_length=1, max_length=140)
    category: TagCategory
