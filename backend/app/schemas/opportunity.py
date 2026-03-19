from datetime import datetime

from pydantic import BaseModel, Field

from ..models.enums import OpportunityStatus, OpportunityType, WorkFormat


class OpportunityBase(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = None
    opportunity_type: OpportunityType
    work_format: WorkFormat
    city: str | None = Field(default=None, max_length=120)
    address: str | None = Field(default=None, max_length=250)
    lat: float | None = None
    lng: float | None = None
    salary_from: int | None = None
    salary_to: int | None = None
    expires_at: datetime | None = None
    event_date: datetime | None = None
    tag_ids: list[int] = []


class OpportunityCreate(OpportunityBase):
    pass


class OpportunityUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = None
    opportunity_type: OpportunityType | None = None
    work_format: WorkFormat | None = None
    city: str | None = Field(default=None, max_length=120)
    address: str | None = Field(default=None, max_length=250)
    lat: float | None = None
    lng: float | None = None
    salary_from: int | None = None
    salary_to: int | None = None
    expires_at: datetime | None = None
    event_date: datetime | None = None
    tag_ids: list[int] | None = None  # None = не трогать теги


class OpportunityOut(BaseModel):
    id: int
    employer_id: int
    title: str
    description: str | None
    opportunity_type: OpportunityType
    work_format: WorkFormat
    status: OpportunityStatus
    city: str | None
    address: str | None
    lat: float | None
    lng: float | None
    salary_from: int | None
    salary_to: int | None
    published_at: datetime
    expires_at: datetime | None
    event_date: datetime | None
    tags: list[dict]

