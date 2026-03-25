import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { register } from "../api";
import { saveSession } from "../auth/auth";
import { buttonStyle, inputStyle, primaryButtonStyle } from "../ui/styles";

type Role = "applicant" | "employer";

const ROLE_OPTIONS: { id: Role; label: string; icon: string; desc: string }[] = [
  { id: "applicant", label: "Соискатель",   icon: "👤", desc: "Ищу работу или стажировку" },
  { id: "employer",  label: "Работодатель", icon: "🏢", desc: "Публикую вакансии"         },
];

export function RegisterPage() {
  const nav = useNavigate();
  const [role, setRole]               = useState<Role>("applicant");
  const [email, setEmail]             = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword]       = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!email.trim() || !displayName.trim() || password.length < 6) return false;
    if (role === "employer" && !companyName.trim()) return false;
    return true;
  }, [role, email, displayName, password, companyName]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      background: "radial-gradient(ellipse 700px 500px at 50% 20%, rgba(59,130,246,0.07), transparent 60%), var(--bg)",
    }}>
      <div style={{ width: "100%", maxWidth: 500 }} className="fade-up">

        {/* Logo mark */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, margin: "0 auto 12px",
            background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(59,130,246,0.35)",
          }}>
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
              <path d="M3 13 L9 4 L15 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 13 L9 8 L12 13" stroke="rgba(255,255,255,0.55)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontWeight: 800, fontSize: 22, color: "var(--text)" }}>Трамплин</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>Создайте аккаунт</div>
        </div>

        {/* Card */}
        <div style={{ border: "1px solid var(--border)", background: "var(--panel)", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div className="accent-stripe" />

          <div style={{ padding: "24px 24px 28px" }}>

            {/* Role selector */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Я — кто?</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {ROLE_OPTIONS.map((r) => {
                  const active = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      style={{
                        ...buttonStyle,
                        padding: "10px 8px",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        borderRadius: 12,
                        borderColor: active ? "rgba(59,130,246,0.5)" : "var(--border)",
                        background: active ? "rgba(59,130,246,0.07)" : "var(--panel2)",
                        color: active ? "#3B82F6" : "var(--text)",
                        boxShadow: active ? "0 0 0 3px rgba(59,130,246,0.1)" : "none",
                        fontWeight: active ? 600 : 400,
                      }}
                      onClick={() => setRole(r.id)}
                    >
                      <span style={{ fontSize: 18 }}>{r.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{r.label}</span>
                      <span style={{ fontSize: 10, color: active ? "rgba(59,130,246,0.75)" : "var(--muted)", lineHeight: 1.3 }}>{r.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="you@company.com" type="email" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Отображаемое имя</label>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputStyle} placeholder="Иван Иванов" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Пароль</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} placeholder="Минимум 6 символов" type="password" />
              </div>

              {role === "employer" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Название компании</label>
                    <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={inputStyle} placeholder="ООО «Компания»" />
                  </div>
                  <div style={{ fontSize: 12, color: "#92400E", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "10px 12px", lineHeight: 1.5 }}>
                    После регистрации профиль будет в статусе <b>«на проверке»</b>. Куратор одобрит/отклонит доступ.
                  </div>
                </>
              )}

              {error && (
                <div style={{ color: "#92400E", fontSize: 13, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={!canSubmit || loading}
                style={{ ...primaryButtonStyle, width: "100%", marginTop: 4, padding: "12px 18px", fontSize: 15, opacity: canSubmit ? 1 : 0.5 }}
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  try {
                    const s = await register({ email, display_name: displayName, password, role, company_name: role === "employer" ? companyName : undefined });
                    saveSession(s);
                    nav("/cabinet");
                  } catch (e: any) {
                    setError(e?.message ?? "Ошибка регистрации");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? "Создаём аккаунт…" : "Зарегистрироваться"}
              </button>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--muted)" }}>
          Уже есть аккаунт?{" "}
          <Link to="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Войти</Link>
        </div>
      </div>
    </div>
  );
}
