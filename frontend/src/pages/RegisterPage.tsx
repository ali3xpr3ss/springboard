import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { register } from "../api";
import { saveSession } from "../auth/auth";
import { buttonStyle, cardStyle, inputStyle } from "../ui/styles";

type Role = "applicant" | "employer" | "curator";

const ROLE_LABEL: Record<Role, string> = {
  applicant: "Соискатель",
  employer: "Работодатель",
  curator: "Куратор",
};

export function RegisterPage() {
  const nav = useNavigate();
  const [role, setRole] = useState<Role>("applicant");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!email.trim() || !displayName.trim() || password.length < 6) return false;
    if (role === "employer" && !companyName.trim()) return false;
    return true;
  }, [role, email, displayName, password, companyName]);

  return (
    <div style={{ maxWidth: 560, margin: "28px auto", padding: "0 16px" }}>
      <div style={cardStyle}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>Регистрация</div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => {
              const active = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  style={{
                    ...buttonStyle,
                    background: active ? "rgba(124,58,237,0.22)" : buttonStyle.background,
                    borderColor: active ? "rgba(124,58,237,0.55)" : "var(--border)",
                  }}
                  onClick={() => setRole(r)}
                >
                  {ROLE_LABEL[r]}
                </button>
              );
            })}
          </div>

          <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="Email" />
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={inputStyle}
            placeholder="Отображаемое имя"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            placeholder="Пароль (мин. 6 символов)"
            type="password"
          />

          {role === "employer" ? (
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={inputStyle}
              placeholder="Название компании (для верификации)"
            />
          ) : null}

          {role === "employer" ? (
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              После регистрации профиль работодателя будет в статусе <b>«на проверке»</b>. Дальше куратор может одобрить/отклонить.
            </div>
          ) : null}

          {error ? (
            <div style={{ color: "rgba(245,158,11,0.95)", fontSize: 13, whiteSpace: "pre-wrap" }}>{error}</div>
          ) : null}

          <button
            type="button"
            disabled={!canSubmit || loading}
            style={{
              ...buttonStyle,
              background: canSubmit ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.06)",
              borderColor: canSubmit ? "rgba(34,197,94,0.5)" : "var(--border)",
            }}
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                const s = await register({
                  email,
                  display_name: displayName,
                  password,
                  role,
                  company_name: role === "employer" ? companyName : undefined,
                });
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
  );
}

