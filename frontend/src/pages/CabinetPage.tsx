import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

import { loadSession, saveSession } from "../auth/auth";
import { buttonStyle } from "../ui/styles";

const ROLE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  applicant: { label: "Соискатель",   color: "#3B82F6", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.3)"  },
  employer:  { label: "Работодатель", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.3)"  },
  curator:   { label: "Куратор",      color: "#D97706", bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.35)" },
};

function roleHome(role: string | undefined) {
  if (role === "employer") return "/cabinet/employer";
  if (role === "curator")  return "/cabinet/curator";
  return "/cabinet/applicant";
}

export function CabinetLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const s = loadSession();
  if (!s) return <Navigate to="/login" replace />;

  const base   = roleHome(s.role);
  const inRoot = loc.pathname === "/cabinet" || loc.pathname === "/cabinet/";
  if (inRoot) return <Navigate to={base} replace />;

  const roleMeta = ROLE_META[s.role ?? ""] ?? ROLE_META.applicant;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 16px 40px" }}>

      {/* Top bar */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--muted)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          На главную
        </Link>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          style={{ ...buttonStyle, padding: "8px 14px", fontSize: 13, color: "#DC2626", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}
          onClick={() => { saveSession(null); nav("/"); }}
        >
          Выйти
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, alignItems: "start" }}>

        {/* Sidebar */}
        <aside style={{ position: "sticky", top: 24 }}>
          <div style={{ border: "1px solid var(--border)", background: "var(--panel)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            {/* Accent top based on role */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${roleMeta.color}, ${roleMeta.color}66)` }} />
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: roleMeta.bg, border: `1px solid ${roleMeta.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={roleMeta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>Личный кабинет</div>
                  <span style={{ display: "inline-block", fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 999, marginTop: 3, color: roleMeta.color, background: roleMeta.bg, border: `1px solid ${roleMeta.border}` }}>
                    {roleMeta.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section style={{ minWidth: 0 }}>
          <Outlet />
        </section>
      </div>
    </div>
  );
}

export function CabinetIndex() {
  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--panel)", borderRadius: 16, padding: 16, boxShadow: "var(--shadow-sm)" }}>
      Загрузка…
    </div>
  );
}
