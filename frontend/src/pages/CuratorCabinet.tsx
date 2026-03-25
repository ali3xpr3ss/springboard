import { useEffect, useState } from "react";

import { fetchTags, createTag, fetchUsers, fetchCuratorMe, createCurator, setUserActive, authedFetch } from "../api";
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

type Tab = "employers" | "opportunities" | "tags" | "users" | "curators";

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
  const [isAdmin, setIsAdmin] = useState(false);

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

  // Curators tab
  const [newCurEmail, setNewCurEmail] = useState("");
  const [newCurName, setNewCurName] = useState("");
  const [newCurPass, setNewCurPass] = useState("");
  const [curCreating, setCurCreating] = useState(false);
  const [curError, setCurError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetchCuratorMe(session)
      .then((data) => setIsAdmin(data.is_admin))
      .catch(() => {});
    reload();
    fetchTags().then(setTags).catch(() => {});
  }, []);

  async function reload() {
    if (!session) return;
    setError(null);
    try {
      const [eRes, oRes] = await Promise.all([
        authedFetch(session, `${API_BASE}/curator/employers/pending`),
        authedFetch(session, `${API_BASE}/curator/opportunities/pending`),
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

  const tagGroups = new Map<TagCategory, TagOut[]>();
  for (const tag of tags) {
    const cat = tag.category as TagCategory;
    if (!tagGroups.has(cat)) tagGroups.set(cat, []);
    tagGroups.get(cat)!.push(tag);
  }

  const visibleTabs: { id: Tab; label: string }[] = [
    { id: "employers", label: "Компании" },
    { id: "opportunities", label: "Карточки" },
    { id: "tags", label: "Теги" },
    { id: "users", label: "Пользователи" },
    ...(isAdmin ? [{ id: "curators" as Tab, label: "Кураторы" }] : []),
  ];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={cardStyle}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Панель куратора{isAdmin ? " (Администратор)" : ""}</div>
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {visibleTabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              style={{ ...buttonStyle, ...(tab === id ? tabActiveStyle : {}) }}
              onClick={() => setTab(id)}
            >
              {label}
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
                        await authedFetch(session, `${API_BASE}/curator/employers/${e.id}/verify?action=approve`, { method: "POST" });
                        reload();
                      }}
                    >
                      Одобрить
                    </button>
                    <button
                      type="button"
                      style={{ ...buttonStyle, background: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.45)" }}
                      onClick={async () => {
                        await authedFetch(session, `${API_BASE}/curator/employers/${e.id}/verify?action=reject`, { method: "POST" });
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
                        await authedFetch(session, `${API_BASE}/curator/opportunities/${o.id}/moderate?action=approve`, { method: "POST" });
                        reload();
                      }}
                    >
                      Опубликовать
                    </button>
                    <button
                      type="button"
                      style={{ ...buttonStyle, background: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.45)" }}
                      onClick={async () => {
                        await authedFetch(session, `${API_BASE}/curator/opportunities/${o.id}/moderate?action=reject`, { method: "POST" });
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
                const isSelf = u.id === session.user_id;
                return (
                  <div
                    key={u.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr auto auto auto auto",
                      gap: 10,
                      alignItems: "center",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      opacity: u.is_active ? 1 : 0.6,
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
                    <button
                      type="button"
                      disabled={isSelf}
                      style={{
                        ...buttonStyle,
                        padding: "4px 10px",
                        fontSize: 11,
                        opacity: isSelf ? 0.4 : 1,
                        cursor: isSelf ? "not-allowed" : "pointer",
                        background: u.is_active ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
                        borderColor: u.is_active ? "rgba(239,68,68,0.45)" : "rgba(34,197,94,0.45)",
                      }}
                      onClick={async () => {
                        if (isSelf) return;
                        try {
                          const updated = await setUserActive(session, u.id, !u.is_active);
                          setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
                        } catch (e: any) {
                          alert(e?.message ?? "Ошибка");
                        }
                      }}
                    >
                      {u.is_active ? "Заблокировать" : "Разблокировать"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "curators" && isAdmin && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Создать куратора</div>
          <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted)" }}>
            Только администратор может создавать учётные записи кураторов.
          </div>
          {curError && <div style={{ marginTop: 10, color: "rgba(245,158,11,0.95)", whiteSpace: "pre-wrap" }}>{curError}</div>}
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <input style={inputStyle} placeholder="Email куратора" value={newCurEmail} onChange={(e) => setNewCurEmail(e.target.value)} />
            <input style={inputStyle} placeholder="Отображаемое имя" value={newCurName} onChange={(e) => setNewCurName(e.target.value)} />
            <input style={inputStyle} type="password" placeholder="Пароль (мин. 6 символов)" value={newCurPass} onChange={(e) => setNewCurPass(e.target.value)} />
            <button
              type="button"
              style={{ ...buttonStyle, background: "rgba(124,58,237,0.22)", borderColor: "rgba(124,58,237,0.55)" }}
              disabled={curCreating || !newCurEmail.trim() || !newCurName.trim() || newCurPass.length < 6}
              onClick={async () => {
                setCurCreating(true);
                setCurError(null);
                try {
                  await createCurator(session, { email: newCurEmail.trim(), display_name: newCurName.trim(), password: newCurPass });
                  setNewCurEmail("");
                  setNewCurName("");
                  setNewCurPass("");
                  alert("Куратор создан");
                  // refresh users list
                  fetchUsers(session, "curator").then((data) => setUsers(data)).catch(() => {});
                } catch (e: any) {
                  setCurError(e?.message ?? "Ошибка создания куратора");
                } finally {
                  setCurCreating(false);
                }
              }}
            >
              {curCreating ? "Создаём…" : "Создать куратора"}
            </button>
          </div>

          <div style={{ marginTop: 20, fontWeight: 600, fontSize: 14 }}>Список кураторов</div>
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            {users
              .filter((u) => u.role === "curator")
              .map((u) => (
                <div key={u.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ flex: 1, fontSize: 13 }}>{u.email}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>{u.display_name}</div>
                  <span style={{ fontSize: 11, color: u.is_active ? "rgba(34,197,94,0.9)" : "rgba(245,158,11,0.9)" }}>
                    {u.is_active ? "● Активен" : "○ Заблокирован"}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
