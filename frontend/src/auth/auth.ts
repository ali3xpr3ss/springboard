export type Role = "applicant" | "employer" | "curator";

export type Session = {
  access_token: string;
  refresh_token: string;
  access_expires_at: string;
  refresh_expires_at: string;
  role?: Role;
  user_id?: number;
};

const KEY = "tramplin:session";
const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8000";

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function saveSession(s: Session | null) {
  if (!s) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(s));
}

export function authHeader(session: Session | null): HeadersInit {
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

/** Возвращает true, если access-токен истёк или истекает в течение 60 секунд */
export function isExpiringSoon(session: Session): boolean {
  return new Date(session.access_expires_at).getTime() - Date.now() < 60_000;
}

/** Обновляет access/refresh токены через /auth/refresh. Сохраняет новую сессию в localStorage. */
export async function refreshSession(session: Session): Promise<Session | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    if (!res.ok) return null;
    const newSession: Session = await res.json();
    saveSession(newSession);
    return newSession;
  } catch {
    return null;
  }
}
