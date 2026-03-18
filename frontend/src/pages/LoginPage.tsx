import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../api";
import { saveSession } from "../auth/auth";
import { buttonStyle, cardStyle, inputStyle } from "../ui/styles";

export function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div style={{ maxWidth: 520, margin: "28px auto", padding: "0 16px" }}>
      <div style={cardStyle}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>Вход</div>
        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="Email" />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            placeholder="Пароль"
            type="password"
          />
          {error ? (
            <div style={{ color: "rgba(245,158,11,0.95)", fontSize: 13, whiteSpace: "pre-wrap" }}>{error}</div>
          ) : null}
          <button
            type="button"
            style={{ ...buttonStyle, background: "rgba(124,58,237,0.22)", borderColor: "rgba(124,58,237,0.55)" }}
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
          <div style={{ color: "var(--muted)", fontSize: 12 }}>
            Тест‑вход куратора (по умолчанию): <b>admin@tramplin.local</b> / <b>admin</b>
          </div>
        </div>
      </div>
    </div>
  );
}

