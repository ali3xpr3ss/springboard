export type OpportunityType = "internship" | "vacancy" | "mentoring" | "event";
export type WorkFormat = "office" | "hybrid" | "remote";

export type Tag = {
  id: number;
  name: string;
  slug: string;
  category: string;
};

export type Opportunity = {
  id: number;
  employer_id: number;
  title: string;
  description?: string | null;
  opportunity_type: OpportunityType;
  work_format: WorkFormat;
  status: string;
  city?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  salary_from?: number | null;
  salary_to?: number | null;
  published_at: string;
  expires_at?: string | null;
  event_date?: string | null;
  scheduled_at?: string | null;
  company_name?: string | null;
  tags: Tag[];
};

export type OpportunityQuery = {
  q?: string;
  types?: OpportunityType[];
  formats?: WorkFormat[];
  tag_ids?: number[];
  salary_from?: number;
  salary_to?: number;
  city?: string;
};

export type ApplicationStatus = "pending" | "accepted" | "rejected" | "reserve";

export type ApplicationOut = {
  id: number;
  opportunity_id: number;
  status: ApplicationStatus;
  cover_letter: string | null;
  created_at: string;
  opportunity: Opportunity;
};

export type EmployerApplicationOut = {
  id: number;
  opportunity_id: number;
  opportunity_title: string;
  applicant_profile_id: number;
  applicant_full_name: string | null;
  status: ApplicationStatus;
  cover_letter: string | null;
  created_at: string;
};

export type TagCategory = "tech" | "level" | "employment" | "other";

export type TagOut = {
  id: number;
  name: string;
  slug: string;
  category: TagCategory;
  is_system: boolean;
  usage_count: number;
};

export type UserOut = {
  id: number;
  email: string;
  display_name: string;
  role: "applicant" | "employer" | "curator";
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
};

export type ContactStatus = "pending" | "accepted" | "rejected";

export type ContactOut = {
  id: number;
  other_applicant_id: number;
  other_full_name: string | null;
  status: ContactStatus;
  created_at: string;
  is_requester: boolean;
};

export type RecommendationOut = {
  id: number;
  from_applicant_id: number;
  from_full_name: string | null;
  opportunity_id: number;
  opportunity_title: string;
  message: string | null;
  created_at: string;
};

