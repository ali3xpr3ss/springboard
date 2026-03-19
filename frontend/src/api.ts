import type { ApplicationOut, ApplicationStatus, EmployerApplicationOut, Opportunity, OpportunityQuery, TagOut, UserOut } from "./types";
import type { Session } from "./auth/auth";

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8000";

function toQuery(params: Record<string, unknown>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      for (const it of v) sp.append(k, String(it));
    } else {
      sp.set(k, String(v));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function fetchOpportunities(q: OpportunityQuery): Promise<Opportunity[]> {
  const res = await fetch(`${API_BASE}/opportunities${toQuery(q as any)}`);
  if (!res.ok) throw new Error(`Ошибка загрузки: ${res.status}`);
  return await res.json();
}

export type RegisterPayload = {
  email: string;
  display_name: string;
  password: string;
  role: "applicant" | "employer" | "curator";
  company_name?: string;
};

export type LoginPayload = { email: string; password: string };

export async function register(payload: RegisterPayload): Promise<Session> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function login(payload: LoginPayload): Promise<Session> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function fetchMyApplications(session: Session): Promise<ApplicationOut[]> {
  const res = await fetch(`${API_BASE}/applicant/applications`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
  return await res.json();
}

export async function applyToOpportunity(session: Session, opportunityId: number, cover_letter: string | null): Promise<ApplicationOut> {
  const res = await fetch(`${API_BASE}/opportunities/${opportunityId}/apply`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ cover_letter }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function fetchEmployerApplications(session: Session): Promise<EmployerApplicationOut[]> {
  const res = await fetch(`${API_BASE}/employer/applications`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
  return await res.json();
}

export async function updateApplicationStatus(session: Session, appId: number, status: ApplicationStatus): Promise<EmployerApplicationOut> {
  const res = await fetch(`${API_BASE}/employer/applications/${appId}/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function fetchEmployerOpportunities(session: Session): Promise<Opportunity[]> {
  const res = await fetch(`${API_BASE}/employer/opportunities`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
  return await res.json();
}

export async function deleteOpportunity(session: Session, id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/employer/opportunities/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function fetchTags(category?: string): Promise<TagOut[]> {
  const qs = category ? `?category=${category}` : "";
  const res = await fetch(`${API_BASE}/tags${qs}`);
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
  return await res.json();
}

export async function createTag(session: Session, payload: { name: string; slug: string; category: string }): Promise<TagOut> {
  const res = await fetch(`${API_BASE}/curator/tags`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function fetchUsers(session: Session, role?: string): Promise<UserOut[]> {
  const qs = role ? `?role=${role}` : "";
  const res = await fetch(`${API_BASE}/curator/users${qs}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
  return await res.json();
}

export async function fetchOpportunity(id: number): Promise<Opportunity> {
  const res = await fetch(`${API_BASE}/opportunities/${id}`);
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
  return await res.json();
}

