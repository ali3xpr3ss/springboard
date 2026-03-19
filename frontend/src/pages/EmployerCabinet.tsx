import { useEffect, useState } from "react";

import type { Opportunity, OpportunityType, WorkFormat } from "../types";
import { fetchEmployerApplications, fetchEmployerOpportunities, deleteOpportunity, updateApplicationStatus } from "../api";
import type { EmployerApplicationOut, ApplicationStatus } from "../types";
import { loadSession } from "../auth/auth";
import { buttonStyle, cardStyle, inputStyle } from "../ui/styles";

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8000";

type EmployerProfile = {
  company_name: string;
  industry?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
  verification_status: string;
  inn?: string | null;
  corp_email_domain?: string | null;
};

type Tab = "profile" | "create" | "vacancies" | "applications";

const tabActiveStyle = { background: "rgba(124,58,237,0.22)", borderColor: "rgba(124,58,237,0.55)" };

const STATUS_COLORS: Record<string, { bg: string; border: string }> = {
  active: { bg: "rgba(34,197,94,0.18)", border: "rgba(34,197,94,0.5)" },
  pending_moderation: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.45)" },
};

const APP_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "На рассмотрении",
  accepted: "Принят",
  rejected: "Отклонён",
  reserve: "Резерв",
};

export function EmployerCabinet() {
  const session = loadSession();
  const [tab, setTab] = useState<Tab>("profile");

  const [p, setP] = useState<EmployerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [creating, setCreating] = useState(false);
  const [newOpp, setNewOpp] = useState<{
    title: string;
    description: string;
    opportunity_type: OpportunityType;
    work_format: WorkFormat;
    city: string;
    address: string;
    lat: string;
    lng: string;
    salary_from: string;
    salary_to: string;
  }>({
    title: "",
    description: "",
    opportunity_type: "vacancy",
    work_format: "remote",
    city: "",
    address: "",
    lat: "",
    lng: "",
    salary_from: "",
    salary_to: "",
  });

  const [vacancies, setVacancies] = useState<Opportunity[]>([]);
  const [vacanciesLoading, setVacanciesLoading] = useState(false);

  const [appsList, setAppsList] = useState<EmployerApplicationOut[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!session) return;
    setError(null);
    fetch(`${API_BASE}/employer/me`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(async (r) => { if (!r.ok) throw new Error(await r.text()); return r.json(); })
      .then((data) => { if (alive) setP(data); })
      .catch((e: any) => { if (alive) setError(e?.message ?? "Ошибка"); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (tab !== "vacancies" || !session) return;
    let alive = true;
    setVacanciesLoading(true);
    fetchEmployerOpportunities(session)
      .then((data) => { if (alive) setVacancies(data); })
      .catch(() => {})
      .finally(() => { if (alive) setVacanciesLoading(false); });
    return () => { alive = false; };
  }, [tab]);

  useEffect(() => {
    if (tab !== "applications" || !session) return;
    let alive = true;
    setAppsLoading(true);
    fetchEmployerApplications(session)
      .then((data) => { if (alive) setAppsList(data); })
      .catch(() => {})
      .finally(() => { if (alive) setAppsLoading(false); });
    return () => { alive = false; };
  }, [tab]);

  if (!session) return <div style={cardStyle}>Нужно войти.</div>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={cardStyle}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Кабинет работодателя</div>
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["profile", "create", "vacancies", "applications"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              style={{ ...buttonStyle, ...(tab === t ? tabActiveStyle : {}) }}
              onClick={() => setTab(t)}
            >
              {{ profile: "Профиль", create: "Создать", vacancies: "Вакансии", applications: "Заявки" }[t]}
            </button>
          ))}
        </div>
      </div>

      {tab === "profile" && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Профиль компании</div>
          {error ? <div style={{ marginTop: 10, color: "rgba(245,158,11,0.95)", whiteSpace: "pre-wrap" }}>{error}</div> : null}
          {!p ? <div style={{ marginTop: 10 }}>Загрузка…</div> : null}
          {p ? (
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input style={inputStyle} value={p.company_name ?? ""} onChange={(e) => setP({ ...p, company_name: e.target.value })} placeholder="Название компании" />
                <input style={inputStyle} value={p.industry ?? ""} onChange={(e) => setP({ ...p, industry: e.target.value })} placeholder="Сфера деятельности" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input style={inputStyle} value={p.website_url ?? ""} onChange={(e) => setP({ ...p, website_url: e.target.value })} placeholder="Сайт" />
                <input style={inputStyle} value={p.logo_url ?? ""} onChange={(e) => setP({ ...p, logo_url: e.target.value })} placeholder="Логотип (URL)" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input style={inputStyle} value={p.inn ?? ""} onChange={(e) => setP({ ...p, inn: e.target.value })} placeholder="ИНН (для верификации)" />
                <input style={inputStyle} value={p.corp_email_domain ?? ""} onChange={(e) => setP({ ...p, corp_email_domain: e.target.value })} placeholder="Домен корп. почты" />
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Статус верификации: <b style={{ color: "var(--text)" }}>{p.verification_status}</b>
              </div>
              <button
                type="button"
                style={{ ...buttonStyle, background: "rgba(34,197,94,0.18)", borderColor: "rgba(34,197,94,0.5)" }}
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  setError(null);
                  try {
                    const res = await fetch(`${API_BASE}/employer/me`, {
                      method: "PUT",
                      headers: { "content-type": "application/json", Authorization: `Bearer ${session.access_token}` },
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
      )}

      {tab === "create" && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Создать возможность</div>
          <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 12 }}>
            Созданные возможности попадают на модерацию. Куратор одобряет — они появляются на главной.
          </div>
          {error ? <div style={{ marginTop: 10, color: "rgba(245,158,11,0.95)", whiteSpace: "pre-wrap" }}>{error}</div> : null}
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <input style={inputStyle} placeholder="Название позиции / мероприятия" value={newOpp.title} onChange={(e) => setNewOpp({ ...newOpp, title: e.target.value })} />
            <textarea style={{ ...inputStyle, minHeight: 110, resize: "vertical" }} placeholder="Краткое описание" value={newOpp.description} onChange={(e) => setNewOpp({ ...newOpp, description: e.target.value })} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <select style={inputStyle} value={newOpp.opportunity_type} onChange={(e) => setNewOpp({ ...newOpp, opportunity_type: e.target.value as any })}>
                <option value="vacancy">Вакансия</option>
                <option value="internship">Стажировка</option>
                <option value="mentoring">Менторская программа</option>
                <option value="event">Карьерное мероприятие</option>
              </select>
              <select style={inputStyle} value={newOpp.work_format} onChange={(e) => setNewOpp({ ...newOpp, work_format: e.target.value as any })}>
                <option value="office">Офис</option>
                <option value="hybrid">Гибрид</option>
                <option value="remote">Удалённо</option>
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input style={inputStyle} placeholder="Город" value={newOpp.city} onChange={(e) => setNewOpp({ ...newOpp, city: e.target.value })} />
              <input style={inputStyle} placeholder="Адрес" value={newOpp.address} onChange={(e) => setNewOpp({ ...newOpp, address: e.target.value })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input style={inputStyle} placeholder="lat" inputMode="decimal" value={newOpp.lat} onChange={(e) => setNewOpp({ ...newOpp, lat: e.target.value })} />
              <input style={inputStyle} placeholder="lng" inputMode="decimal" value={newOpp.lng} onChange={(e) => setNewOpp({ ...newOpp, lng: e.target.value })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input style={inputStyle} placeholder="ЗП от" inputMode="numeric" value={newOpp.salary_from} onChange={(e) => setNewOpp({ ...newOpp, salary_from: e.target.value })} />
              <input style={inputStyle} placeholder="ЗП до" inputMode="numeric" value={newOpp.salary_to} onChange={(e) => setNewOpp({ ...newOpp, salary_to: e.target.value })} />
            </div>
            <button
              type="button"
              style={{ ...buttonStyle, background: "rgba(124,58,237,0.22)", borderColor: "rgba(124,58,237,0.55)" }}
              disabled={creating || !newOpp.title.trim()}
              onClick={async () => {
                setCreating(true);
                setError(null);
                try {
                  const payload: any = {
                    title: newOpp.title,
                    description: newOpp.description || null,
                    opportunity_type: newOpp.opportunity_type,
                    work_format: newOpp.work_format,
                    city: newOpp.city || null,
                    address: newOpp.address || null,
                    lat: newOpp.lat.trim() ? Number(newOpp.lat) : null,
                    lng: newOpp.lng.trim() ? Number(newOpp.lng) : null,
                    salary_from: newOpp.salary_from.trim() ? Number(newOpp.salary_from) : null,
                    salary_to: newOpp.salary_to.trim() ? Number(newOpp.salary_to) : null,
                    tag_ids: [],
                  };
                  const res = await fetch(`${API_BASE}/opportunities`, {
                    method: "POST",
                    headers: { "content-type": "application/json", Authorization: `Bearer ${session.access_token}` },
                    body: JSON.stringify(payload),
                  });
                  if (!res.ok) throw new Error(await res.text());
                  const created: Opportunity = await res.json();
                  setNewOpp({ ...newOpp, title: "", description: "" });
                  alert(`Создано (#${created.id}). Статус: ${created.status}`);
                } catch (e: any) {
                  setError(e?.message ?? "Ошибка создания");
                } finally {
                  setCreating(false);
                }
              }}
            >
              {creating ? "Создаём…" : "Создать"}
            </button>
          </div>
        </div>
      )}

      {tab === "vacancies" && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Мои вакансии</div>
          {vacanciesLoading ? (
            <div style={{ marginTop: 10 }}>Загрузка…</div>
          ) : vacancies.length === 0 ? (
            <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 13 }}>Вакансий пока нет.</div>
          ) : (
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {vacancies.map((v) => {
                const sc = STATUS_COLORS[v.status] ?? { bg: "rgba(255,255,255,0.08)", border: "var(--border)" };
                return (
                  <div key={v.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>{v.title}</div>
                      <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 12 }}>
                        {v.opportunity_type} • {v.work_format}{v.city ? ` • ${v.city}` : ""}
                      </div>
                    </div>
                    <span style={{ flexShrink: 0, fontSize: 12, padding: "3px 10px", borderRadius: 999, border: `1px solid ${sc.border}`, background: sc.bg }}>
                      {v.status}
                    </span>
                    <button
                      type="button"
                      style={{ ...buttonStyle, padding: "6px 10px", fontSize: 12, background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.4)" }}
                      onClick={async () => {
                        if (!window.confirm(`Удалить «${v.title}»?`)) return;
                        try {
                          await deleteOpportunity(session, v.id);
                          setVacancies((prev) => prev.filter((x) => x.id !== v.id));
                        } catch (e: any) {
                          alert(e?.message ?? "Ошибка удаления");
                        }
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "applications" && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Отклики</div>
          {appsLoading ? (
            <div style={{ marginTop: 10 }}>Загрузка…</div>
          ) : appsList.length === 0 ? (
            <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 13 }}>Откликов пока нет.</div>
          ) : (
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {appsList.map((app) => (
                <div key={app.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{app.applicant_full_name ?? "Аноним"}</div>
                      <div style={{ marginTop: 2, color: "var(--muted)", fontSize: 12 }}>
                        {app.opportunity_title} • {new Date(app.created_at).toLocaleDateString("ru-RU")}
                      </div>
                      {app.cover_letter && (
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12, lineHeight: 1.4 }}>
                          {app.cover_letter.slice(0, 120)}{app.cover_letter.length > 120 ? "…" : ""}
                        </div>
                      )}
                    </div>
                    <select
                      style={{ ...inputStyle, width: "auto", flexShrink: 0 }}
                      value={app.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value as ApplicationStatus;
                        try {
                          const updated = await updateApplicationStatus(session, app.id, newStatus);
                          setAppsList((prev) => prev.map((a) => (a.id === app.id ? updated : a)));
                        } catch {}
                      }}
                    >
                      {(Object.keys(APP_STATUS_LABELS) as ApplicationStatus[]).map((s) => (
                        <option key={s} value={s}>{APP_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
