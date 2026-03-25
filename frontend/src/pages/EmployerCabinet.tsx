import { useEffect, useRef, useState } from "react";

import type { Opportunity, OpportunityType, WorkFormat } from "../types";
import {
  fetchEmployerApplications,
  fetchEmployerOpportunities,
  deleteOpportunity,
  updateApplicationStatus,
  uploadFile,
  authedFetch,
  toggleOpportunityStatus,
  updateOpportunity,
} from "../api";
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

const tabActiveStyle = { background: "rgba(59,130,246,0.1)", borderColor: "rgba(59,130,246,0.45)", color: "#3B82F6" };

const STATUS_COLORS: Record<string, { bg: string; border: string; label: string; color: string }> = {
  active:             { bg: "rgba(34,197,94,0.1)",    border: "rgba(34,197,94,0.4)",    label: "Активна",        color: "#16A34A" },
  pending_moderation: { bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.4)",   label: "На модерации",   color: "#D97706" },
  scheduled:          { bg: "rgba(99,102,241,0.1)",   border: "rgba(99,102,241,0.4)",   label: "Запланирована",  color: "#6366F1" },
  closed:             { bg: "rgba(107,114,128,0.1)",  border: "rgba(107,114,128,0.35)", label: "Закрыта",        color: "#6B7280" },
  draft:              { bg: "var(--panel2)",           border: "var(--border)",          label: "Черновик",       color: "var(--muted)" },
};

const VERIFICATION_BADGE: Record<string, { bg: string; border: string; label: string; color: string }> = {
  pending:  { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.4)",  label: "На проверке",  color: "#D97706" },
  approved: { bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.4)",   label: "Верифицирован", color: "#16A34A" },
  rejected: { bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.35)",  label: "Отклонён",     color: "#DC2626" },
};

const APP_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "На рассмотрении",
  accepted: "Принят",
  rejected: "Отклонён",
  reserve: "Резерв",
};

const VAC_STATUS_OPTIONS = [
  { value: "", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "pending_moderation", label: "На модерации" },
  { value: "scheduled", label: "Запланированные" },
  { value: "closed", label: "Закрытые" },
];

const APP_STATUS_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "pending", label: "На рассмотрении" },
  { value: "accepted", label: "Принят" },
  { value: "rejected", label: "Отклонён" },
  { value: "reserve", label: "Резерв" },
];

export function EmployerCabinet() {
  const session = loadSession();
  const [tab, setTab] = useState<Tab>("profile");

  const [p, setP] = useState<EmployerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [innError, setInnError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const [creating, setCreating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [useScheduled, setUseScheduled] = useState(false);
  const [newOpp, setNewOpp] = useState<{
    title: string;
    description: string;
    opportunity_type: OpportunityType;
    work_format: WorkFormat;
    city: string;
    address: string;
    lat: number | null;
    lng: number | null;
    salary_from: string;
    salary_to: string;
    scheduled_at: string;
  }>({
    title: "",
    description: "",
    opportunity_type: "vacancy",
    work_format: "remote",
    city: "",
    address: "",
    lat: null,
    lng: null,
    salary_from: "",
    salary_to: "",
    scheduled_at: "",
  });

  const [editingVac, setEditingVac] = useState<Opportunity | null>(null);
  const [editVacData, setEditVacData] = useState<{
    title: string;
    description: string;
    city: string;
    address: string;
    salary_from: string;
    salary_to: string;
  }>({ title: "", description: "", city: "", address: "", salary_from: "", salary_to: "" });
  const [editVacSaving, setEditVacSaving] = useState(false);

  const [vacancies, setVacancies] = useState<Opportunity[]>([]);
  const [vacanciesLoading, setVacanciesLoading] = useState(false);
  const [vacStatus, setVacStatus] = useState("");

  const [appsList, setAppsList] = useState<EmployerApplicationOut[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsQ, setAppsQ] = useState("");
  const [appsStatus, setAppsStatus] = useState("");
  const appsQTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    if (!session) return;
    setError(null);
    authedFetch(session, `${API_BASE}/employer/me`)
      .then(async (r) => { if (!r.ok) throw new Error(await r.text()); return r.json(); })
      .then((data) => { if (alive) setP(data); })
      .catch((e: any) => { if (alive) setError(e?.message ?? "Ошибка"); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (tab !== "vacancies" || !session) return;
    let alive = true;
    setVacanciesLoading(true);
    fetchEmployerOpportunities(session, vacStatus ? { status: vacStatus } : undefined)
      .then((data) => { if (alive) setVacancies(data); })
      .catch(() => {})
      .finally(() => { if (alive) setVacanciesLoading(false); });
    return () => { alive = false; };
  }, [tab, vacStatus]);

  useEffect(() => {
    if (tab !== "applications" || !session) return;
    let alive = true;
    setAppsLoading(true);
    fetchEmployerApplications(session, {
      q: appsQ.trim() || undefined,
      status: appsStatus || undefined,
    })
      .then((data) => { if (alive) setAppsList(data); })
      .catch(() => {})
      .finally(() => { if (alive) setAppsLoading(false); });
    return () => { alive = false; };
  }, [tab, appsStatus]);

  // debounce для поиска по имени
  useEffect(() => {
    if (tab !== "applications" || !session) return;
    if (appsQTimer.current) clearTimeout(appsQTimer.current);
    appsQTimer.current = setTimeout(() => {
      setAppsLoading(true);
      fetchEmployerApplications(session, {
        q: appsQ.trim() || undefined,
        status: appsStatus || undefined,
      })
        .then((data) => setAppsList(data))
        .catch(() => {})
        .finally(() => setAppsLoading(false));
    }, 300);
    return () => { if (appsQTimer.current) clearTimeout(appsQTimer.current); };
  }, [appsQ]);

  if (!session) return <div style={cardStyle}>Нужно войти.</div>;

  const verBadge = p ? (VERIFICATION_BADGE[p.verification_status] ?? VERIFICATION_BADGE.pending) : null;
  const isVerified = p?.verification_status === "approved";

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={cardStyle}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Кабинет работодателя</div>
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["profile", "create", "vacancies", "applications"] as Tab[]).map((t) => {
            const disabled = t === "create" && !isVerified;
            return (
              <button
                key={t}
                type="button"
                style={{
                  ...buttonStyle,
                  ...(tab === t ? tabActiveStyle : {}),
                  opacity: disabled ? 0.5 : 1,
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
                onClick={() => { if (!disabled) setTab(t); }}
                title={disabled ? "Доступно после верификации компании" : undefined}
              >
                {{ profile: "Профиль", create: "Создать", vacancies: "Вакансии", applications: "Заявки" }[t]}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "profile" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Профиль компании</div>
            {verBadge && (
              <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 999, border: `1px solid ${verBadge.border}`, background: verBadge.bg, color: verBadge.color, fontWeight: 500 }}>
                {verBadge.label}
              </span>
            )}
          </div>
          {!isVerified && p && (
            <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.3)", fontSize: 13, color: "#92400E" }}>
              Заполните ИНН и домен корпоративной почты, сохраните профиль. После проверки куратором вы сможете создавать вакансии.
            </div>
          )}
          {error ? <div style={{ marginBottom: 12, color: "#B45309", whiteSpace: "pre-wrap", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>{error}</div> : null}
          {!p ? <div style={{ color: "var(--muted)" }}>Загрузка…</div> : null}
          {p ? (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input style={inputStyle} value={p.company_name ?? ""} onChange={(e) => setP({ ...p, company_name: e.target.value })} placeholder="Название компании" />
                <input style={inputStyle} value={p.industry ?? ""} onChange={(e) => setP({ ...p, industry: e.target.value })} placeholder="Сфера деятельности" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input style={inputStyle} value={p.website_url ?? ""} onChange={(e) => setP({ ...p, website_url: e.target.value })} placeholder="Сайт" />
                <div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Логотип</div>
                  {p.logo_url && (
                    <img src={p.logo_url} alt="logo" style={{ width: 52, height: 52, objectFit: "contain", borderRadius: 8, marginBottom: 6, border: "1px solid var(--border)" }} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={logoUploading}
                    style={{ display: "block", fontSize: 13, color: "var(--muted)" }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setLogoUploading(true);
                      try {
                        const { url } = await uploadFile(session, file);
                        setP({ ...p, logo_url: url });
                      } catch (err: any) {
                        setError(err?.message ?? "Ошибка загрузки");
                      } finally {
                        setLogoUploading(false);
                      }
                    }}
                  />
                  {logoUploading && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Загрузка…</div>}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <input
                    style={{ ...inputStyle, borderColor: innError ? "rgba(239,68,68,0.6)" : undefined }}
                    value={p.inn ?? ""}
                    onChange={(e) => {
                      setP({ ...p, inn: e.target.value });
                      setInnError(null);
                    }}
                    placeholder="ИНН (10 или 12 цифр)"
                  />
                  {innError && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}>{innError}</div>}
                </div>
                <input style={inputStyle} value={p.corp_email_domain ?? ""} onChange={(e) => setP({ ...p, corp_email_domain: e.target.value })} placeholder="Домен корп. почты (напр. company.ru)" />
              </div>
              <button
                type="button"
                style={{ ...buttonStyle, background: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.45)", color: "#16A34A" }}
                disabled={saving || logoUploading}
                onClick={async () => {
                  if (p.inn && !/^\d{10}$|^\d{12}$/.test(p.inn)) {
                    setInnError("ИНН должен содержать 10 или 12 цифр");
                    return;
                  }
                  setSaving(true);
                  setError(null);
                  try {
                    const res = await authedFetch(session, `${API_BASE}/employer/me`, {
                      method: "PUT",
                      headers: { "content-type": "application/json" },
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
          <div style={{ fontWeight: 600, fontSize: 15 }}>Создать публикацию</div>
          <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 13 }}>
            Новые публикации проходят модерацию. Куратор одобряет — они появляются на главной странице.
          </div>
          {error ? <div style={{ marginTop: 12, color: "#B45309", whiteSpace: "pre-wrap", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>{error}</div> : null}
          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
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
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="Адрес (улица, дом)"
                  value={newOpp.address}
                  onChange={(e) => setNewOpp({ ...newOpp, address: e.target.value, lat: null, lng: null })}
                />
                <button
                  type="button"
                  title="Найти координаты по адресу"
                  style={{ ...buttonStyle, flexShrink: 0, padding: "0 10px", fontSize: 16 }}
                  disabled={geocoding || !newOpp.address.trim()}
                  onClick={async () => {
                    const q = [newOpp.city, newOpp.address].filter(Boolean).join(", ");
                    if (!q) return;
                    setGeocoding(true);
                    try {
                      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, { headers: { "Accept-Language": "ru" } });
                      const data = await r.json();
                      if (data[0]) {
                        setNewOpp((prev) => ({ ...prev, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }));
                      } else {
                        alert("Адрес не найден. Уточните город или улицу.");
                      }
                    } catch {
                      alert("Ошибка геокодирования");
                    } finally {
                      setGeocoding(false);
                    }
                  }}
                >
                  {geocoding ? "…" : "📍"}
                </button>
              </div>
            </div>
            {newOpp.lat !== null && newOpp.lng !== null && (
              <div style={{ fontSize: 12, color: "#16A34A" }}>
                Координаты найдены: {newOpp.lat.toFixed(5)}, {newOpp.lng.toFixed(5)}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input style={inputStyle} placeholder="ЗП от" inputMode="numeric" value={newOpp.salary_from} onChange={(e) => setNewOpp({ ...newOpp, salary_from: e.target.value })} />
              <input style={inputStyle} placeholder="ЗП до" inputMode="numeric" value={newOpp.salary_to} onChange={(e) => setNewOpp({ ...newOpp, salary_to: e.target.value })} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", color: "var(--text)" }}>
              <input
                type="checkbox"
                checked={useScheduled}
                onChange={(e) => {
                  setUseScheduled(e.target.checked);
                  if (!e.target.checked) setNewOpp({ ...newOpp, scheduled_at: "" });
                }}
              />
              Запланировать публикацию
            </label>
            {useScheduled && (
              <div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Дата и время публикации</div>
                <input
                  type="datetime-local"
                  style={inputStyle}
                  value={newOpp.scheduled_at}
                  onChange={(e) => setNewOpp({ ...newOpp, scheduled_at: e.target.value })}
                />
              </div>
            )}
            <button
              type="button"
              style={{ ...buttonStyle, background: "rgba(59,130,246,0.1)", borderColor: "rgba(59,130,246,0.45)", color: "#3B82F6" }}
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
                    lat: newOpp.lat,
                    lng: newOpp.lng,
                    salary_from: newOpp.salary_from.trim() ? Number(newOpp.salary_from) : null,
                    salary_to: newOpp.salary_to.trim() ? Number(newOpp.salary_to) : null,
                    scheduled_at: useScheduled && newOpp.scheduled_at ? new Date(newOpp.scheduled_at).toISOString() : null,
                    tag_ids: [],
                  };
                  const res = await authedFetch(session, `${API_BASE}/opportunities`, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  if (!res.ok) throw new Error(await res.text());
                  const created: Opportunity = await res.json();
                  setNewOpp({ title: "", description: "", opportunity_type: "vacancy", work_format: "remote", city: "", address: "", lat: null, lng: null, salary_from: "", salary_to: "", scheduled_at: "" });
                  setUseScheduled(false);
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
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>Мои вакансии</div>
            <select
              style={{ ...inputStyle, width: "auto" }}
              value={vacStatus}
              onChange={(e) => setVacStatus(e.target.value)}
            >
              {VAC_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {vacanciesLoading ? (
            <div style={{ color: "var(--muted)" }}>Загрузка…</div>
          ) : vacancies.length === 0 ? (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>Вакансий не найдено.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {vacancies.map((v) => {
                const sc = STATUS_COLORS[v.status] ?? { bg: "var(--panel2)", border: "var(--border)", label: v.status, color: "var(--muted)" };
                const isExpanded = editingVac?.id === v.id;
                return (
                  <div key={v.id} style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--panel)" }}>
                    <div
                      style={{ padding: 12, display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}
                      onClick={() => {
                        if (isExpanded) {
                          setEditingVac(null);
                        } else {
                          setEditingVac(v);
                          setEditVacData({
                            title: v.title,
                            description: v.description ?? "",
                            city: v.city ?? "",
                            address: v.address ?? "",
                            salary_from: v.salary_from != null ? String(v.salary_from) : "",
                            salary_to: v.salary_to != null ? String(v.salary_to) : "",
                          });
                        }
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: "var(--text)" }}>{v.title}</div>
                        <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 13 }}>
                          {v.opportunity_type} • {v.work_format}{v.city ? ` • ${v.city}` : ""}
                        </div>
                        {v.status === "scheduled" && v.scheduled_at && (
                          <div style={{ marginTop: 3, fontSize: 12, color: "#6366F1" }}>
                            Публикация: {new Date(v.scheduled_at).toLocaleString("ru-RU")}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        title={v.status === "active" ? "Деактивировать" : v.status === "closed" ? "Активировать" : undefined}
                        style={{
                          ...buttonStyle,
                          flexShrink: 0,
                          fontSize: 12,
                          padding: "4px 10px",
                          background: sc.bg,
                          borderColor: sc.border,
                          color: sc.color,
                          fontWeight: 500,
                          cursor: (v.status === "active" || v.status === "closed") ? "pointer" : "default",
                        }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (v.status !== "active" && v.status !== "closed") return;
                          try {
                            const updated = await toggleOpportunityStatus(session, v.id);
                            setVacancies((prev) => prev.map((x) => x.id === v.id ? updated : x));
                          } catch (err: any) {
                            alert(err?.message ?? "Ошибка");
                          }
                        }}
                      >
                        {sc.label}
                      </button>
                      <button
                        type="button"
                        style={{ ...buttonStyle, flexShrink: 0, padding: "6px 10px", fontSize: 12, background: "rgba(239,68,68,0.07)", borderColor: "rgba(239,68,68,0.35)", color: "#DC2626" }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm(`Удалить «${v.title}»?`)) return;
                          try {
                            await deleteOpportunity(session, v.id);
                            setVacancies((prev) => prev.filter((x) => x.id !== v.id));
                            if (editingVac?.id === v.id) setEditingVac(null);
                          } catch (err: any) {
                            alert(err?.message ?? "Ошибка удаления");
                          }
                        }}
                      >
                        Удалить
                      </button>
                    </div>

                    {isExpanded && (
                      <div style={{ borderTop: "1px solid var(--border)", padding: 14, display: "grid", gap: 10, background: "var(--panel2)" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 2 }}>Редактировать</div>
                        <input style={inputStyle} placeholder="Название" value={editVacData.title} onChange={(e) => setEditVacData({ ...editVacData, title: e.target.value })} />
                        <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} placeholder="Описание" value={editVacData.description} onChange={(e) => setEditVacData({ ...editVacData, description: e.target.value })} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <input style={inputStyle} placeholder="Город" value={editVacData.city} onChange={(e) => setEditVacData({ ...editVacData, city: e.target.value })} />
                          <input style={inputStyle} placeholder="Адрес" value={editVacData.address} onChange={(e) => setEditVacData({ ...editVacData, address: e.target.value })} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <input style={inputStyle} placeholder="ЗП от" inputMode="numeric" value={editVacData.salary_from} onChange={(e) => setEditVacData({ ...editVacData, salary_from: e.target.value })} />
                          <input style={inputStyle} placeholder="ЗП до" inputMode="numeric" value={editVacData.salary_to} onChange={(e) => setEditVacData({ ...editVacData, salary_to: e.target.value })} />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            style={{ ...buttonStyle, background: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.45)", color: "#16A34A" }}
                            disabled={editVacSaving || !editVacData.title.trim()}
                            onClick={async () => {
                              setEditVacSaving(true);
                              try {
                                const updated = await updateOpportunity(session, v.id, {
                                  title: editVacData.title,
                                  description: editVacData.description || null,
                                  city: editVacData.city || null,
                                  address: editVacData.address || null,
                                  salary_from: editVacData.salary_from.trim() ? Number(editVacData.salary_from) : null,
                                  salary_to: editVacData.salary_to.trim() ? Number(editVacData.salary_to) : null,
                                });
                                setVacancies((prev) => prev.map((x) => x.id === v.id ? updated : x));
                                setEditingVac(null);
                              } catch (err: any) {
                                alert(err?.message ?? "Ошибка сохранения");
                              } finally {
                                setEditVacSaving(false);
                              }
                            }}
                          >
                            {editVacSaving ? "Сохраняем…" : "Сохранить"}
                          </button>
                          <button type="button" style={buttonStyle} onClick={() => setEditingVac(null)}>Отмена</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "applications" && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>Отклики</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <input
              style={{ ...inputStyle, flex: 1, minWidth: 160 }}
              placeholder="Поиск по имени соискателя…"
              value={appsQ}
              onChange={(e) => setAppsQ(e.target.value)}
            />
            <select
              style={{ ...inputStyle, width: "auto" }}
              value={appsStatus}
              onChange={(e) => setAppsStatus(e.target.value)}
            >
              {APP_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {appsLoading ? (
            <div style={{ color: "var(--muted)" }}>Загрузка…</div>
          ) : appsList.length === 0 ? (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>Откликов не найдено.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {appsList.map((app) => (
                <div key={app.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12, background: "var(--panel)" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{app.applicant_full_name ?? "Аноним"}</div>
                      <div style={{ marginTop: 2, color: "var(--muted)", fontSize: 13 }}>
                        {app.opportunity_title} • {new Date(app.created_at).toLocaleDateString("ru-RU")}
                      </div>
                      {app.cover_letter && (
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13, lineHeight: 1.4 }}>
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
