from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base
from .enums import PrivacyLevel, VerificationStatus


class ApplicantProfile(Base):
    __tablename__ = "applicant_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    full_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    university: Mapped[str | None] = mapped_column(String(200), nullable=True)
    graduation_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    resume_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    github_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    privacy_resume: Mapped[PrivacyLevel] = mapped_column(
        Enum(PrivacyLevel, name="privacy_level"),
        default=PrivacyLevel.all_auth,
        nullable=False,
    )
    privacy_applications: Mapped[PrivacyLevel] = mapped_column(
        Enum(PrivacyLevel, name="privacy_level_applications"),
        default=PrivacyLevel.contacts,
        nullable=False,
    )

    user = relationship("User", back_populates="applicant_profile")


class EmployerProfile(Base):
    __tablename__ = "employer_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    industry: Mapped[str | None] = mapped_column(String(200), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus, name="verification_status"),
        default=VerificationStatus.pending,
        nullable=False,
    )
    inn: Mapped[str | None] = mapped_column(String(32), nullable=True)
    corp_email_domain: Mapped[str | None] = mapped_column(String(120), nullable=True)

    user = relationship("User", back_populates="employer_profile")
    opportunities = relationship("Opportunity", back_populates="employer")


class CuratorProfile(Base):
    __tablename__ = "curator_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    is_admin: Mapped[bool] = mapped_column(default=False, nullable=False)
    created_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    user = relationship("User", back_populates="curator_profile", foreign_keys=[user_id])

