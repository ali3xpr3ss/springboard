import enum


class UserRole(str, enum.Enum):
    applicant = "applicant"
    employer = "employer"
    curator = "curator"


class VerificationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class OpportunityType(str, enum.Enum):
    internship = "internship"
    vacancy = "vacancy"
    mentoring = "mentoring"
    event = "event"


class WorkFormat(str, enum.Enum):
    office = "office"
    hybrid = "hybrid"
    remote = "remote"


class OpportunityStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    closed = "closed"
    scheduled = "scheduled"
    pending_moderation = "pending_moderation"


class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    reserve = "reserve"


class ContactStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class TagCategory(str, enum.Enum):
    tech = "tech"
    level = "level"
    employment = "employment"
    other = "other"


class PrivacyLevel(str, enum.Enum):
    private = "private"
    contacts = "contacts"
    all_auth = "all_auth"

