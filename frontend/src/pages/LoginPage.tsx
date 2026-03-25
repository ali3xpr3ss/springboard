import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { login } from "../api";
import { saveSession } from "../auth/auth";
import { inputStyle, primaryButtonStyle } from "../ui/styles";

export function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      background: "radial-gradient(ellipse 700px 500px at 50% 20%, rgba(59,130,246,0.07), transparent 60%), var(--bg)",
    }}>
      <div style={{ width: "100%", maxWidth: 440 }} className="fade-up">

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
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>Войдите в свой аккаунт</div>
        </div>

        {/* Card */}
        <div style={{ border: "1px solid var(--border)", background: "var(--panel)", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div className="accent-stripe" />

          <div style={{ padding: "24px 24px 28px" }}>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="you@company.com" type="email" autoComplete="email" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Пароль</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} placeholder="••••••••" type="password" autoComplete="current-password" />
              </div>

              {error && (
                <div style={{ color: "#92400E", fontSize: 13, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              <button
                type="button"
                style={{ ...primaryButtonStyle, width: "100%", marginTop: 4, padding: "12px 18px", fontSize: 15 }}
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  try {
                    const s = await login({ email, password });
                    saveSession(s);
                    nav("/cabinet");
                  } catch (e: any) {
                    setError(e?.message ?? "Ошибка входа");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? "Входим…" : "Войти"}
              </button>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--muted)" }}>
          Нет аккаунта?{" "}
          <Link to="/register" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Зарегистрироваться</Link>
        </div>
      </div>
    </div>
  );
}
