from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base
from .enums import TagCategory


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), nullable=False, unique=True, index=True)
    category: Mapped[TagCategory] = mapped_column(Enum(TagCategory, name="tag_category"), nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    usage_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    opportunity_tags = relationship("OpportunityTag", back_populates="tag", cascade="all, delete-orphan")
    applicant_skills = relationship("ApplicantSkill", back_populates="tag", cascade="all, delete-orphan")


class OpportunityTag(Base):
    __tablename__ = "opportunity_tags"
    __table_args__ = (UniqueConstraint("opportunity_id", "tag_id", name="uq_opportunity_tag"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    opportunity_id: Mapped[int] = mapped_column(ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False)
    tag_id: Mapped[int] = mapped_column(ForeignKey("tags.id", ondelete="CASCADE"), nullable=False)

    opportunity = relationship("Opportunity", back_populates="opportunity_tags")
    tag = relationship("Tag", back_populates="opportunity_tags")


class ApplicantSkill(Base):
    __tablename__ = "applicant_skills"
    __table_args__ = (UniqueConstraint("applicant_id", "tag_id", name="uq_applicant_skill"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    applicant_id: Mapped[int] = mapped_column(ForeignKey("applicant_profiles.id", ondelete="CASCADE"), nullable=False)
    tag_id: Mapped[int] = mapped_column(ForeignKey("tags.id", ondelete="CASCADE"), nullable=False)

    tag = relationship("Tag", back_populates="applicant_skills")

