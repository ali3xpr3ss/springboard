from pydantic import BaseModel, Field

from ..models.enums import PrivacyLevel


class ApplicantProfileOut(BaseModel):
    full_name: str | None = None
    university: str | None = None
    graduation_year: int | None = None
    bio: str | None = None
    resume_url: str | None = None
    github_url: str | None = None
    privacy_resume: PrivacyLevel
    privacy_applications: PrivacyLevel


class ApplicantProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=200)
    university: str | None = Field(default=None, max_length=200)
    graduation_year: int | None = None
    bio: str | None = None
    resume_url: str | None = Field(default=None, max_length=500)
    github_url: str | None = Field(default=None, max_length=500)
    privacy_resume: PrivacyLevel | None = None
    privacy_applications: PrivacyLevel | None = None

