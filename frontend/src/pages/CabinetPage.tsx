import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

import { loadSession, saveSession } from "../auth/auth";
import { buttonStyle, cardStyle } from "../ui/styles";

function roleHome(role: string | undefined) {
  if (role === "employer") return "/cabinet/employer";
  if (role === "curator") return "/cabinet/curator";
  return "/cabinet/applicant";
}

export function CabinetLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const s = loadSession();
  if (!s) return <Navigate to="/login" replace />;

  const base = roleHome(s.role);
  const inRoot = loc.pathname === "/cabinet" || loc.pathname === "/cabinet/";
  if (inRoot) return <Navigate to={base} replace />;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 16px 28px" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
        <Link to="/" style={{ color: "var(--muted)", textDecoration: "none" }}>
          ← На главную
        </Link>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            saveSession(null);
            nav("/");
          }}
        >
          Выйти
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, alignItems: "start" }}>
        <aside style={{ position: "sticky", top: 86 }}>
          <div style={cardStyle}>
            <div style={{ fontWeight: 900 }}>Личный кабинет</div>
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
              Роль: <b style={{ color: "var(--text)" }}>{{ applicant: "Соискатель", employer: "Работодатель", curator: "Куратор" }[s.role ?? ""] ?? "—"}</b>
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
  return <div style={cardStyle}>Загрузка…</div>;
}

