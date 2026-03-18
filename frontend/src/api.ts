import type { Opportunity, OpportunityQuery } from "./types";
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

