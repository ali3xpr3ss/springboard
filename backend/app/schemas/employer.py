from pydantic import BaseModel, Field

from ..models.enums import VerificationStatus


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

