import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from ..models.enums import ApplicationStatus, VerificationStatus


class EmployerProfileOut(BaseModel):
    company_name: str
    industry: str | None = None
    website_url: str | None = None
    logo_url: str | None = None
    verification_status: VerificationStatus
    inn: str | None = None
    corp_email_domain: str | None = None


class EmployerProfileUpdate(BaseModel):
    company_name: str | None = Field(default=None, max_length=200)
    industry: str | None = Field(default=None, max_length=200)
    website_url: str | None = Field(default=None, max_length=500)
    logo_url: str | None = Field(default=None, max_length=500)
    inn: str | None = Field(default=None, max_length=32)
    corp_email_domain: str | None = Field(default=None, max_length=120)

    @field_validator("inn")
    @classmethod
    def validate_inn(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return v
        if not re.fullmatch(r"\d{10}|\d{12}", v):
            raise ValueError("ИНН должен содержать 10 или 12 цифр")
        return v


class EmployerApplicationOut(BaseModel):
    id: int
    opportunity_id: int
    opportunity_title: str
    applicant_profile_id: int
    applicant_full_name: str | None
    status: ApplicationStatus
    cover_letter: str | None
    created_at: datetime


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus

