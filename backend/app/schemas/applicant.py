from datetime import datetime

from pydantic import BaseModel, Field

from ..models.enums import ApplicationStatus, ContactStatus, PrivacyLevel
from .opportunity import OpportunityOut


class ApplicantProfileOut(BaseModel):
    full_name: str | None = None
    university: str | None = None
    graduation_year: int | None = None
    bio: str | None = None
    resume_url: str | None = None
    github_url: str | None = None
    privacy_resume: PrivacyLevel
    privacy_applications: PrivacyLevel
    skill_tag_ids: list[int] = []


class ApplicantProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=200)
    university: str | None = Field(default=None, max_length=200)
    graduation_year: int | None = None
    bio: str | None = None
    resume_url: str | None = Field(default=None, max_length=500)
    github_url: str | None = Field(default=None, max_length=500)
    privacy_resume: PrivacyLevel | None = None
    privacy_applications: PrivacyLevel | None = None
    skill_tag_ids: list[int] | None = None


class ApplicationCreate(BaseModel):
    cover_letter: str | None = None


class ApplicationOut(BaseModel):
    id: int
    opportunity_id: int
    status: ApplicationStatus
    cover_letter: str | None
    created_at: datetime
    opportunity: OpportunityOut


class ContactRequest(BaseModel):
    receiver_id: int


class ContactOut(BaseModel):
    id: int
    other_applicant_id: int
    other_full_name: str | None
    status: ContactStatus
    created_at: datetime
    is_requester: bool


class ContactStatusUpdate(BaseModel):
    status: ContactStatus


class RecommendationCreate(BaseModel):
    opportunity_id: int
    message: str | None = None


class RecommendationOut(BaseModel):
    id: int
    from_applicant_id: int
    from_full_name: str | None
    opportunity_id: int
    opportunity_title: str
    message: str | None
    created_at: datetime

