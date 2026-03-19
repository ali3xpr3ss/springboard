import { useEffect, useState } from "react";

import { fetchTags, createTag, fetchUsers } from "../api";
import { loadSession } from "../auth/auth";
import type { TagOut, TagCategory, UserOut } from "../types";
import { buttonStyle, cardStyle, inputStyle } from "../ui/styles";

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

type Tab = "employers" | "opportunities" | "tags" | "users";

const tabActiveStyle = { background: "rgba(124,58,237,0.22)", borderColor: "rgba(124,58,237,0.55)" };

const CATEGORY_LABELS: Record<TagCategory, string> = {
  tech: "Технологии",
  level: "Уровень",
  employment: "Занятость",
  other: "Другое",
};

const ROLE_LABELS: Record<string, string> = {
  applicant: "Соискатель",
  employer: "Работодатель",
  curator: "Куратор",
};

const ROLE_COLORS: Record<string, { bg: string; border: string }> = {
  applicant: { bg: "rgba(34,197,94,0.18)", border: "rgba(34,197,94,0.5)" },
  employer: { bg: "rgba(124,58,237,0.22)", border: "rgba(124,58,237,0.55)" },
  curator: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.45)" },
};

export function CuratorCabinet() {
  const session = loadSession();
  const [tab, setTab] = useState<Tab>("employers");

  const [emp, setEmp] = useState<PendingEmployer[]>([]);
  const [opp, setOpp] = useState<PendingOpportunity[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Tags tab
  const [tags, setTags] = useState<TagOut[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagSlug, setNewTagSlug] = useState("");
  const [newTagCategory, setNewTagCategory] = useState<TagCategory>("tech");
  const [tagCreating, setTagCreating] = useState(false);

  // Users tab
  const [users, setUsers] = useState<UserOut[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("");

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
    fetchTags().then(setTags).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab !== "users" || !session) return;
    let alive = true;
    setUsersLoading(true);
    fetchUsers(session, roleFilter || undefined)
      .then((data) => { if (alive) setUsers(data); })
      .catch(() => {})
      .finally(() => { if (alive) setUsersLoading(false); });
    return () => { alive = false; };
  }, [tab, roleFilter]);

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  if (!session) return <div style={cardStyle}>Нужно войти.</div>;

  // Group tags by category
  const tagGroups = new Map<TagCategory, TagOut[]>();
  for (const tag of tags) {
    const cat = tag.category as TagCategory;
    if (!tagGroups.has(cat)) tagGroups.set(cat, []);
    tagGroups.get(cat)!.push(tag);
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={cardStyle}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Панель куратора</div>
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["employers", "opportunities", "tags", "users"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              style={{ ...buttonStyle, ...(tab === t ? tabActiveStyle : {}) }}
              onClick={() => setTab(t)}
            >
              {{ employers: "Компании", opportunities: "Карточки", tags: "Теги", users: "Пользователи" }[t]}
            </button>
          ))}
        </div>
      </div>

      {tab === "employers" && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Верификация компаний</div>
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
                        await fetch(`${API_BASE}/curator/employers/${e.id}/verify?action=approve`, { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
                        reload();
                      }}
                    >
                      Одобрить
                    </button>
                    <button
                      type="button"
                      style={{ ...buttonStyle, background: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.45)" }}
                      onClick={async () => {
                        await fetch(`${API_BASE}/curator/employers/${e.id}/verify?action=reject`, { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
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
      )}

      {tab === "opportunities" && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Модерация карточек</div>
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
                        await fetch(`${API_BASE}/curator/opportunities/${o.id}/moderate?action=approve`, { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
                        reload();
                      }}
                    >
                      Опубликовать
                    </button>
                    <button
                      type="button"
                      style={{ ...buttonStyle, background: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.45)" }}
                      onClick={async () => {
                        await fetch(`${API_BASE}/curator/opportunities/${o.id}/moderate?action=reject`, { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
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
      )}

      {tab === "tags" && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Теги</div>

          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            {(["tech", "level", "employment", "other"] as TagCategory[]).map((cat) => {
              const group = tagGroups.get(cat);
              if (!group?.length) return null;
              return (
                <div key={cat}>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{CATEGORY_LABELS[cat]}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {group.map((tag) => (
                      <span
                        key={tag.id}
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.85)",
                          border: "1px solid var(--border)",
                          background: "rgba(255,255,255,0.06)",
                          padding: "2px 8px",
                          borderRadius: 999,
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16, fontWeight: 600, fontSize: 14 }}>Создать тег</div>
          <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input
                style={inputStyle}
                placeholder="Название"
                value={newTagName}
                onChange={(e) => {
                  setNewTagName(e.target.value);
                  setNewTagSlug(autoSlug(e.target.value));
                }}
              />
              <input
                style={inputStyle}
                placeholder="Slug"
                value={newTagSlug}
                onChange={(e) => setNewTagSlug(e.target.value)}
              />
            </div>
            <select style={inputStyle} value={newTagCategory} onChange={(e) => setNewTagCategory(e.target.value as TagCategory)}>
              <option value="tech">Технологии</option>
              <option value="level">Уровень</option>
              <option value="employment">Занятость</option>
              <option value="other">Другое</option>
            </select>
            <button
              type="button"
              style={{ ...buttonStyle, background: "rgba(124,58,237,0.22)", borderColor: "rgba(124,58,237,0.55)" }}
              disabled={tagCreating || !newTagName.trim() || !newTagSlug.trim()}
              onClick={async () => {
                setTagCreating(true);
                try {
                  const created = await createTag(session, { name: newTagName.trim(), slug: newTagSlug.trim(), category: newTagCategory });
                  setTags((prev) => [created, ...prev]);
                  setNewTagName("");
                  setNewTagSlug("");
                } catch (e: any) {
                  alert(e?.message ?? "Ошибка создания тега");
                } finally {
                  setTagCreating(false);
                }
              }}
            >
              {tagCreating ? "Создаём…" : "Создать тег"}
            </button>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Пользователи</div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[["", "Все"], ["applicant", "Соискатели"], ["employer", "Работодатели"], ["curator", "Кураторы"]].map(([val, label]) => (
              <button
                key={val}
                type="button"
                style={{ ...buttonStyle, ...(roleFilter === val ? tabActiveStyle : {}) }}
                onClick={() => setRoleFilter(val)}
              >
                {label}
              </button>
            ))}
          </div>

          {usersLoading ? (
            <div style={{ marginTop: 10 }}>Загрузка…</div>
          ) : users.length === 0 ? (
            <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 13 }}>Пользователи не найдены.</div>
          ) : (
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {users.map((u) => {
                const rc = ROLE_COLORS[u.role] ?? { bg: "rgba(255,255,255,0.08)", border: "var(--border)" };
                return (
                  <div
                    key={u.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr auto auto auto",
                      gap: 10,
                      alignItems: "center",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: "10px 12px",
                    }}
                  >
                    <div style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis" }}>{u.display_name}</div>
                    <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 999, border: `1px solid ${rc.border}`, background: rc.bg }}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                    <span style={{ fontSize: 12, color: u.is_active ? "rgba(34,197,94,0.9)" : "rgba(245,158,11,0.9)" }}>
                      {u.is_active ? "●" : "○"}
                    </span>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      {new Date(u.created_at).toLocaleDateString("ru-RU")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
