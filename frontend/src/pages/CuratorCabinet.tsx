import { useEffect, useState } from "react";

import { loadSession } from "../auth/auth";
import { buttonStyle, cardStyle } from "../ui/styles";

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8000";

type PendingEmployer = {
  id: number;
  user_id: number;
  company_name: string;
  inn?: string | null;
  corp_email_domain?: string | null;
  verification_status: string;
};

type PendingOpportunity = {
  id: number;
  title: string;
  employer_id: number;
  opportunity_type: string;
  work_format: string;
  city?: string | null;
  status: string;
};

export function CuratorCabinet() {
  const session = loadSession();
  const [emp, setEmp] = useState<PendingEmployer[]>([]);
  const [opp, setOpp] = useState<PendingOpportunity[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!session) return;
    setError(null);
    try {
      const [eRes, oRes] = await Promise.all([
        fetch(`${API_BASE}/curator/employers/pending`, { headers: { Authorization: `Bearer ${session.access_token}` } }),
        fetch(`${API_BASE}/curator/opportunities/pending`, { headers: { Authorization: `Bearer ${session.access_token}` } }),
      ]);
      if (!eRes.ok) throw new Error(await eRes.text());
      if (!oRes.ok) throw new Error(await oRes.text());
      setEmp(await eRes.json());
      setOpp(await oRes.json());
    } catch (e: any) {
      setError(e?.message ?? "Ошибка");
    }
  }

  useEffect(() => {
    reload();
  }, []);

  if (!session) return <div style={cardStyle}>Нужно войти.</div>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={cardStyle}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Куратор: верификация компаний</div>
        {error ? <div style={{ marginTop: 10, color: "rgba(245,158,11,0.95)", whiteSpace: "pre-wrap" }}>{error}</div> : null}
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {emp.length ? (
            emp.map((e) => (
              <div key={e.id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 12 }}>
                <div style={{ fontWeight: 800 }}>{e.company_name}</div>
                <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>
                  INN: {e.inn ?? "—"} • домен: {e.corp_email_domain ?? "—"}
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    style={{ ...buttonStyle, background: "rgba(34,197,94,0.18)", borderColor: "rgba(34,197,94,0.5)" }}
                    onClick={async () => {
                      await fetch(`${API_BASE}/curator/employers/${e.id}/verify?action=approve`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${session.access_token}` },
                      });
                      reload();
                    }}
                  >
                    Одобрить
                  </button>
                  <button
                    type="button"
                    style={{ ...buttonStyle, background: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.45)" }}
                    onClick={async () => {
                      await fetch(`${API_BASE}/curator/employers/${e.id}/verify?action=reject`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${session.access_token}` },
                      });
                      reload();
                    }}
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>Нет компаний на проверке.</div>
          )}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Куратор: модерация карточек</div>
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {opp.length ? (
            opp.map((o) => (
              <div key={o.id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 12 }}>
                <div style={{ fontWeight: 800 }}>{o.title}</div>
                <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>
                  {o.opportunity_type} • {o.work_format} • {o.city ?? "—"} • статус: {o.status}
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    style={{ ...buttonStyle, background: "rgba(34,197,94,0.18)", borderColor: "rgba(34,197,94,0.5)" }}
                    onClick={async () => {
                      await fetch(`${API_BASE}/curator/opportunities/${o.id}/moderate?action=approve`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${session.access_token}` },
                      });
                      reload();
                    }}
                  >
                    Опубликовать
                  </button>
                  <button
                    type="button"
                    style={{ ...buttonStyle, background: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.45)" }}
                    onClick={async () => {
                      await fetch(`${API_BASE}/curator/opportunities/${o.id}/moderate?action=reject`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${session.access_token}` },
                      });
                      reload();
                    }}
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>Нет карточек на модерации.</div>
          )}
        </div>
      </div>
    </div>
  );
}

