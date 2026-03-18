import { useEffect, useState } from "react";

import { loadSession } from "../auth/auth";
import { buttonStyle, cardStyle, inputStyle } from "../ui/styles";

type ApplicantProfile = {
  full_name?: string | null;
  university?: string | null;
  graduation_year?: number | null;
  bio?: string | null;
  resume_url?: string | null;
  github_url?: string | null;
  privacy_resume: string;
  privacy_applications: string;
};

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8000";

export function ApplicantCabinet() {
  const session = loadSession();
  const [p, setP] = useState<ApplicantProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setError(null);
    fetch(`${API_BASE}/applicant/me`, { headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {} })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return await r.json();
      })
      .then((data) => {
        if (!alive) return;
        setP(data);
      })
      .catch((e: any) => {
        if (!alive) return;
        setError(e?.message ?? "Ошибка");
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!session) return <div style={cardStyle}>Нужно войти.</div>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={cardStyle}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Профиль соискателя</div>
        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>
          Настройки приватности: кто видит резюме и историю откликов.
        </div>

        {error ? <div style={{ marginTop: 10, color: "rgba(245,158,11,0.95)", whiteSpace: "pre-wrap" }}>{error}</div> : null}
        {!p ? <div style={{ marginTop: 10 }}>Загрузка…</div> : null}

        {p ? (
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input
                style={inputStyle}
                placeholder="ФИО"
                value={p.full_name ?? ""}
                onChange={(e) => setP({ ...p, full_name: e.target.value })}
              />
              <input
                style={inputStyle}
                placeholder="ВУЗ"
                value={p.university ?? ""}
                onChange={(e) => setP({ ...p, university: e.target.value })}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input
                style={inputStyle}
                placeholder="Год выпуска"
                inputMode="numeric"
                value={p.graduation_year ?? ""}
                onChange={(e) =>
                  setP({ ...p, graduation_year: e.target.value.trim() ? Number(e.target.value) : null })
                }
              />
              <input
                style={inputStyle}
                placeholder="GitHub URL"
                value={p.github_url ?? ""}
                onChange={(e) => setP({ ...p, github_url: e.target.value })}
              />
            </div>
            <input
              style={inputStyle}
              placeholder="Ссылка на резюме (URL)"
              value={p.resume_url ?? ""}
              onChange={(e) => setP({ ...p, resume_url: e.target.value })}
            />
            <textarea
              style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
              placeholder="О себе"
              value={p.bio ?? ""}
              onChange={(e) => setP({ ...p, bio: e.target.value })}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Резюме видят</div>
                <select
                  style={inputStyle}
                  value={p.privacy_resume}
                  onChange={(e) => setP({ ...p, privacy_resume: e.target.value })}
                >
                  <option value="private">Только я</option>
                  <option value="contacts">Контакты</option>
                  <option value="all_auth">Все авторизованные</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Отклики видят</div>
                <select
                  style={inputStyle}
                  value={p.privacy_applications}
                  onChange={(e) => setP({ ...p, privacy_applications: e.target.value })}
                >
                  <option value="private">Только я</option>
                  <option value="contacts">Контакты</option>
                  <option value="all_auth">Все авторизованные</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              style={{ ...buttonStyle, background: "rgba(34,197,94,0.18)", borderColor: "rgba(34,197,94,0.5)" }}
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                setError(null);
                try {
                  const res = await fetch(`${API_BASE}/applicant/me`, {
                    method: "PUT",
                    headers: {
                      "content-type": "application/json",
                      Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify(p),
                  });
                  if (!res.ok) throw new Error(await res.text());
                  setP(await res.json());
                } catch (e: any) {
                  setError(e?.message ?? "Ошибка сохранения");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Сохраняем…" : "Сохранить"}
            </button>
          </div>
        ) : null}
      </div>

      <div style={cardStyle}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Отклики / Избранное / Контакты</div>
        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>
          Следующим шагом подключу: отклики на возможности, синхронизацию избранного и профессиональные контакты.
        </div>
      </div>
    </div>
  );
}

