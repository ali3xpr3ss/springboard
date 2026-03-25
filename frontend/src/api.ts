import type { ApplicationOut, ApplicationStatus, ContactOut, EmployerApplicationOut, Opportunity, OpportunityQuery, RecommendationOut, TagOut, UserOut } from "./types";
import type { Session } from "./auth/auth";
import { isExpiringSoon, refreshSession, saveSession } from "./auth/auth";

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8000";

function friendlyMessage(msg: string, field?: string): string {
  const m = msg.toLowerCase();
  if (m.includes("email") && (m.includes("@-sign") || m.includes("not a valid email") || m.includes("valid email")))
    return "Введите корректный email (например, user@example.com)";
  if (m.includes("at least") && m.includes("character") || m.includes("min_length") || m.includes("should have at least"))
    return field === "password" ? "Пароль слишком короткий" : "Значение слишком короткое";
  if (m.includes("password") && (m.includes("incorrect") || m.includes("wrong")))
    return "Неверный пароль";
  if (m.includes("not found") || m.includes("no user"))
    return "Пользователь не найден";
  if (m.includes("already") && m.includes("exist"))
    return "Пользователь с таким email уже зарегистрирован";
  if (m.includes("inactive") || m.includes("не активен"))
    return "Аккаунт деактивирован";
  if (m.includes("forbidden") || res.status === 403)
    return "Недостаточно прав";
  if (m.includes("unauthorized") || res.status === 401)
    return "Неверный email или пароль";
  if (m.includes("field required") || m.includes("missing"))
    return "Заполните все обязательные поля";
  return msg;
}

async function parseApiError(res: Response): Promise<string> {
  let body: any;
  try {
    body = await res.json();
  } catch {
    return `Ошибка: ${res.status}`;
  }
  if (typeof body?.detail === "string") return friendlyMessage(body.detail);
  if (Array.isArray(body?.detail)) {
    return body.detail
      .map((e: any) => {
        const field = Array.isArray(e?.loc) ? e.loc[e.loc.length - 1] : undefined;
        return friendlyMessage(e?.msg ?? JSON.stringify(e), field);
      })
      .join("\n");
  }
  return `Ошибка: ${res.status}`;
}

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

/**
 * fetch с автообновлением токена.
 * Если access-токен истёк или истекает, сначала обновляет сессию через /auth/refresh.
 * При неудаче очищает localStorage и бросает ошибку.
 */
export async function authedFetch(session: Session, url: string, init: RequestInit = {}): Promise<Response> {
  let s = session;
  if (isExpiringSoon(s)) {
    const refreshed = await refreshSession(s);
    if (!refreshed) {
      saveSession(null);
      throw new Error("Сессия истекла. Пожалуйста, войдите снова.");
    }
    s = refreshed;
  }
  return fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${s.access_token}` },
  });
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
  if (!res.ok) throw new Error(await parseApiError(res));
  return await res.json();
}

export async function login(payload: LoginPayload): Promise<Session> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  return await res.json();
}

export async function fetchMyApplications(session: Session): Promise<ApplicationOut[]> {
  const res = await authedFetch(session, `${API_BASE}/applicant/applications`);
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
  return await res.json();
}

export async function applyToOpportunity(session: Session, opportunityId: number, cover_letter: string | null): Promise<ApplicationOut> {
  const res = await authedFetch(session, `${API_BASE}/opportunities/${opportunityId}/apply`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cover_letter }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function fetchEmployerApplications(
  session: Session,
  params?: { q?: string; status?: string },
): Promise<EmployerApplicationOut[]> {
  const qs = params ? toQuery(params as Record<string, unknown>) : "";
  const res = await authedFetch(session, `${API_BASE}/employer/applications${qs}`);
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
  return await res.json();
}

export async function updateApplicationStatus(session: Session, appId: number, status: ApplicationStatus): Promise<EmployerApplicationOut> {
  const res = await authedFetch(session, `${API_BASE}/employer/applications/${appId}/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function fetchEmployerOpportunities(
  session: Session,
  params?: { status?: string },
): Promise<Opportunity[]> {
  const qs = params ? toQuery(params as Record<string, unknown>) : "";
  const res = await authedFetch(session, `${API_BASE}/employer/opportunities${qs}`);
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
  return await res.json();
}

export async function updateOpportunity(session: Session, id: number, payload: Record<string, unknown>): Promise<Opportunity> {
  const res = await authedFetch(session, `${API_BASE}/employer/opportunities/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function toggleOpportunityStatus(session: Session, id: number): Promise<Opportunity> {
  const res = await authedFetch(session, `${API_BASE}/employer/opportunities/${id}/status`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function deleteOpportunity(session: Session, id: number): Promise<void> {
  const res = await authedFetch(session, `${API_BASE}/employer/opportunities/${id}`, {
    method: "DELETE",
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
  const res = await authedFetch(session, `${API_BASE}/curator/tags`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function fetchUsers(session: Session, role?: string): Promise<UserOut[]> {
  const qs = role ? `?role=${role}` : "";
  const res = await authedFetch(session, `${API_BASE}/curator/users${qs}`);
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
  return await res.json();
}

export async function fetchOpportunity(id: number): Promise<Opportunity> {
  const res = await fetch(`${API_BASE}/opportunities/${id}`);
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
  return await res.json();
}

export async function fetchCuratorMe(session: Session): Promise<{ is_admin: boolean }> {
  const res = await authedFetch(session, `${API_BASE}/curator/me`);
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
  return await res.json();
}

export async function createCurator(
  session: Session,
  payload: { email: string; display_name: string; password: string },
): Promise<UserOut> {
  const res = await authedFetch(session, `${API_BASE}/curator/curators`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function setUserActive(session: Session, userId: number, is_active: boolean): Promise<UserOut> {
  const res = await authedFetch(session, `${API_BASE}/curator/users/${userId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ is_active }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function fetchContacts(session: Session): Promise<ContactOut[]> {
  const res = await authedFetch(session, `${API_BASE}/applicant/contacts`);
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
  return await res.json();
}

export async function acceptContact(
  session: Session,
  contactId: number,
  contactStatus: "accepted" | "rejected",
): Promise<ContactOut> {
  const res = await authedFetch(session, `${API_BASE}/applicant/contacts/${contactId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: contactStatus }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function createRecommendation(
  session: Session,
  contactId: number,
  opportunity_id: number,
  message: string | null,
): Promise<RecommendationOut> {
  const res = await authedFetch(session, `${API_BASE}/applicant/contacts/${contactId}/recommend`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ opportunity_id, message }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function fetchRecommendations(session: Session): Promise<RecommendationOut[]> {
  const res = await authedFetch(session, `${API_BASE}/applicant/recommendations`);
  if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
  return await res.json();
}

export async function uploadFile(session: Session, file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await authedFetch(session, `${API_BASE}/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
