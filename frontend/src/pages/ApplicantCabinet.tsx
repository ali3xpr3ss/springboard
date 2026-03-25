import { useEffect, useState } from "react";

import {
  fetchMyApplications,
  fetchTags,
  fetchOpportunity,
  uploadFile,
  authedFetch,
} from "../api";
import { loadSession } from "../auth/auth";
import { loadFavoriteIds, toggleFavorite } from "../storage/favorites";
import { TagSelector } from "../components/TagSelector";
import { Pagination } from "../components/Pagination";
import { OpportunityModal } from "../components/OpportunityModal";
import { ApplyModal } from "../components/ApplyModal";
import type { ApplicationOut, ApplicationStatus, Opportunity, TagOut } from "../types";
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
  skill_tag_ids?: number[];
};

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8000";

type Tab = "profile" | "applications" | "skills" | "favorites";

const STATUS_MAP: Record<ApplicationStatus, { bg: string; border: string; label: string }> = {
  pending:  { bg: "rgba(255,255,255,0.08)", border: "var(--border)",          label: "На рассмотрении" },
  accepted: { bg: "rgba(34,197,94,0.18)",   border: "rgba(34,197,94,0.5)",    label: "Принят" },
  rejected: { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.45)", label: "Отклонён" },
  reserve:  { bg: "rgba(124,58,237,0.22)",  border: "rgba(124,58,237,0.55)", label: "Резерв" },
};

const tabActiveStyle = { background: "rgba(124,58,237,0.22)", borderColor: "rgba(124,58,237,0.55)" };

const TAB_LABELS: Record<Tab, string> = {
  profile: "Профиль",
  applications: "Отклики",
  skills: "Навыки",
  favorites: "Избранное",
};

export function ApplicantCabinet() {
  const session = loadSession();
  const [tab, setTab] = useState<Tab>("profile");

  const [p, setP] = useState<ApplicantProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);

  const [apps, setApps] = useState<ApplicationOut[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsPage, setAppsPage] = useState(1);
  const [selectedAppOpp, setSelectedAppOpp] = useState<Opportunity | null>(null);

  const [techTags, setTechTags] = useState<TagOut[]>([]);
  const [skillIds, setSkillIds] = useState<Set<number>>(new Set());
  const [skillSaving, setSkillSaving] = useState(false);

  const [favIds, setFavIds] = useState<Set<number>>(() => loadFavoriteIds());
  const [favItems, setFavItems] = useState<Opportunity[]>([]);
  const [favLoading, setFavLoading] = useState(false);
  const [selectedFavOpp, setSelectedFavOpp] = useState<Opportunity | null>(null);
  const [favApplyTarget, setFavApplyTarget] = useState<number | null>(null);

  useEffect(() => {
    if (!session) return;
    let alive = true;
    setError(null);
    Promise.all([
      authedFetch(session, `${API_BASE}/applicant/me`)
        .then(async (r) => { if (!r.ok) throw new Error(await r.text()); return r.json(); }),
      fetchTags("tech"),
    ]).then(([profile, tags]) => {
      if (!alive) return;
      setP(profile);
      setSkillIds(new Set(profile.skill_tag_ids ?? []));
      setTechTags(tags);
    }).catch((e: any) => {
      if (!alive) return;
      setError(e?.message ?? "Ошибка");
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (tab !== "applications" || !session) return;
    let alive = true;
    setAppsLoading(true);
    fetchMyApplications(session)
      .then((data) => { if (alive) setApps(data); })
      .catch(() => {})
      .finally(() => { if (alive) setAppsLoading(false); });
    return () => { alive = false; };
  }, [tab]);

  useEffect(() => {
    if (tab !== "favorites") return;
    const ids = loadFavoriteIds();
    setFavIds(ids);
    if (ids.size === 0) { setFavItems([]); return; }
    let alive = true;
    setFavLoading(true);
    Promise.all(Array.from(ids).map((id) => fetchOpportunity(id).catch(() => null)))
      .then((results) => {
        if (!alive) return;
        setFavItems(results.filter((o): o is Opportunity => o !== null));
      })
      .finally(() => { if (alive) setFavLoading(false); });
    return () => { alive = false; };
  }, [tab]);

  if (!session) return <div style={cardStyle}>Нужно войти.</div>;

  const PAGE_SIZE = 10;
  const appsPage_items = apps.slice((appsPage - 1) * PAGE_SIZE, appsPage * PAGE_SIZE);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={cardStyle}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Кабинет соискателя</div>
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["profile", "applications", "skills", "favorites"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              style={{ ...buttonStyle, ...(tab === t ? tabActiveStyle : {}) }}
              onClick={() => setTab(t)}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {tab === "profile" && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Профиль</div>
          <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 12 }}>
            Настройки приватности: кто видит резюме и историю откликов.
          </div>

          {error ? <div style={{ marginTop: 10, color: "rgba(245,158,11,0.95)", whiteSpace: "pre-wrap" }}>{error}</div> : null}
          {!p ? <div style={{ marginTop: 10 }}>Загрузка…</div> : null}

          {p ? (
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input style={inputStyle} placeholder="ФИО" value={p.full_name ?? ""} onChange={(e) => setP({ ...p, full_name: e.target.value })} />
                <input style={inputStyle} placeholder="ВУЗ" value={p.university ?? ""} onChange={(e) => setP({ ...p, university: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input style={inputStyle} placeholder="Год выпуска" inputMode="numeric" value={p.graduation_year ?? ""} onChange={(e) => setP({ ...p, graduation_year: e.target.value.trim() ? Number(e.target.value) : null })} />
                <input style={inputStyle} placeholder="GitHub URL" value={p.github_url ?? ""} onChange={(e) => setP({ ...p, github_url: e.target.value })} />
              </div>

              <div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Резюме / портфолио</div>
                {p.resume_url && (
                  <div style={{ marginBottom: 6, fontSize: 12 }}>
                    <a href={p.resume_url} target="_blank" rel="noreferrer" style={{ color: "rgba(124,58,237,0.9)" }}>
                      {p.resume_url.includes("/static/") ? "Загруженный файл" : p.resume_url}
                    </a>
                  </div>
                )}
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  disabled={resumeUploading}
                  style={{ display: "block", fontSize: 12, color: "var(--muted)" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setResumeUploading(true);
                    try {
                      const { url } = await uploadFile(session, file);
                      setP({ ...p, resume_url: url });
                    } catch (err: any) {
                      setError(err?.message ?? "Ошибка загрузки");
                    } finally {
                      setResumeUploading(false);
                    }
                  }}
                />
                {resumeUploading && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Загрузка…</div>}
              </div>

              <textarea style={{ ...inputStyle, minHeight: 110, resize: "vertical" }} placeholder="О себе" value={p.bio ?? ""} onChange={(e) => setP({ ...p, bio: e.target.value })} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Резюме видят</div>
                  <select style={inputStyle} value={p.privacy_resume} onChange={(e) => setP({ ...p, privacy_resume: e.target.value })}>
                    <option value="private">Только я</option>
                    <option value="contacts">Контакты</option>
                    <option value="all_auth">Все авторизованные</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Отклики видят</div>
                  <select style={inputStyle} value={p.privacy_applications} onChange={(e) => setP({ ...p, privacy_applications: e.target.value })}>
                    <option value="private">Только я</option>
                    <option value="contacts">Контакты</option>
                    <option value="all_auth">Все авторизованные</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                style={{ ...buttonStyle, background: "rgba(34,197,94,0.18)", borderColor: "rgba(34,197,94,0.5)" }}
                disabled={saving || resumeUploading}
                onClick={async () => {
                  setSaving(true);
                  setError(null);
                  try {
                    const res = await authedFetch(session, `${API_BASE}/applicant/me`, {
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

      {tab === "applications" && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Мои отклики</div>
          {appsLoading ? (
            <div style={{ marginTop: 10 }}>Загрузка…</div>
          ) : apps.length === 0 ? (
            <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 13 }}>Откликов пока нет.</div>
          ) : (
            <>
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {appsPage_items.map((app) => {
                  const s = STATUS_MAP[app.status];
                  return (
                    <div
                      key={app.id}
                      style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12, display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}
                      onClick={() => setSelectedAppOpp(app.opportunity)}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{app.opportunity.title}</div>
                        {app.opportunity.company_name && (
                          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{app.opportunity.company_name}</div>
                        )}
                        <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 12 }}>
                          Отклик: {new Date(app.created_at).toLocaleDateString("ru-RU")}
                        </div>
                        {app.cover_letter && (
                          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12, lineHeight: 1.4 }}>
                            {app.cover_letter.slice(0, 120)}{app.cover_letter.length > 120 ? "…" : ""}
                          </div>
                        )}
                      </div>
                      <span style={{ flexShrink: 0, fontSize: 12, padding: "3px 10px", borderRadius: 999, border: `1px solid ${s.border}`, background: s.bg }}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Pagination total={apps.length} page={appsPage} pageSize={PAGE_SIZE} onChange={setAppsPage} />
            </>
          )}
        </div>
      )}

      {tab === "skills" && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Навыки</div>
          <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 12 }}>Выбери технологии, которыми владеешь.</div>
          <div style={{ marginTop: 12 }}>
            {techTags.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Теги не загружены.</div>
            ) : (
              <TagSelector tags={techTags} selected={skillIds} onChange={setSkillIds} groupByCategory={false} />
            )}
          </div>
          <button
            type="button"
            style={{ ...buttonStyle, marginTop: 14, background: "rgba(34,197,94,0.18)", borderColor: "rgba(34,197,94,0.5)" }}
            disabled={skillSaving}
            onClick={async () => {
              setSkillSaving(true);
              try {
                const res = await authedFetch(session, `${API_BASE}/applicant/me`, {
                  method: "PUT",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ skill_tag_ids: Array.from(skillIds) }),
                });
                if (!res.ok) throw new Error(await res.text());
                const updated = await res.json();
                setSkillIds(new Set(updated.skill_tag_ids ?? []));
              } catch {
              } finally {
                setSkillSaving(false);
              }
            }}
          >
            {skillSaving ? "Сохраняем…" : "Сохранить навыки"}
          </button>
        </div>
      )}

      {tab === "favorites" && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Избранное</div>
          {favLoading ? (
            <div style={{ marginTop: 10 }}>Загрузка…</div>
          ) : favItems.length === 0 ? (
            <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 13 }}>
              Нет избранных вакансий. Добавляй интересные позиции на главной странице с помощью ★.
            </div>
          ) : (
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {favItems.map((o) => {
                const salary = (() => {
                  const a = o.salary_from, b = o.salary_to;
                  if (a == null && b == null) return null;
                  if (a != null && b != null) return `${a.toLocaleString("ru-RU")}–${b.toLocaleString("ru-RU")} ₽`;
                  if (a != null) return `от ${a.toLocaleString("ru-RU")} ₽`;
                  return `до ${b!.toLocaleString("ru-RU")} ₽`;
                })();
                return (
                  <div
                    key={o.id}
                    style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12, cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start" }}
                    onClick={() => setSelectedFavOpp(o)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {o.company_name && (
                        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>{o.company_name}</div>
                      )}
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{o.title}</div>
                      <div style={{ marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap", color: "var(--muted)", fontSize: 12 }}>
                        {o.city && <span>{o.city}</span>}
                        {salary && <span style={{ color: "rgba(255,255,255,0.85)" }}>{salary}</span>}
                      </div>
                      {o.tags?.length ? (
                        <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {o.tags.slice(0, 4).map((t) => (
                            <span key={t.id} style={{ fontSize: 11, border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)", padding: "1px 7px", borderRadius: 999 }}>
                              {t.name}
                            </span>
                          ))}
                          {o.tags.length > 4 && <span style={{ fontSize: 11, color: "var(--muted)" }}>+{o.tags.length - 4}</span>}
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      title="Убрать из избранного"
                      style={{ ...buttonStyle, flexShrink: 0, padding: "6px 10px", fontSize: 15, background: "rgba(245,158,11,0.18)", borderColor: "rgba(245,158,11,0.6)" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = new Set(toggleFavorite(o.id));
                        setFavIds(next);
                        setFavItems((prev) => prev.filter((x) => x.id !== o.id));
                      }}
                    >
                      ★
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedAppOpp && (
        <OpportunityModal
          opportunity={selectedAppOpp}
          session={session}
          onClose={() => setSelectedAppOpp(null)}
          onApply={() => setSelectedAppOpp(null)}
        />
      )}

      {selectedFavOpp && (
        <OpportunityModal
          opportunity={selectedFavOpp}
          session={session}
          onClose={() => setSelectedFavOpp(null)}
          onApply={(id) => { setFavApplyTarget(id); setSelectedFavOpp(null); }}
          isFavorite={favIds.has(selectedFavOpp.id)}
          onToggleFavorite={(id) => {
            const next = new Set(toggleFavorite(id));
            setFavIds(next);
            if (!next.has(id)) {
              setFavItems((prev) => prev.filter((x) => x.id !== id));
              setSelectedFavOpp(null);
            }
          }}
        />
      )}
      {favApplyTarget !== null && session && (
        <ApplyModal
          opportunityId={favApplyTarget}
          opportunityTitle={favItems.find((o) => o.id === favApplyTarget)?.title ?? ""}
          session={session}
          onClose={() => setFavApplyTarget(null)}
          onSuccess={() => setFavApplyTarget(null)}
        />
      )}
    </div>
  );
}
