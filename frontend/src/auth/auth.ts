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

