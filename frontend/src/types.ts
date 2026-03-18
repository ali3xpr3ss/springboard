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

