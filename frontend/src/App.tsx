import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { fetchOpportunities, fetchTags } from "./api";
import { MapPanel } from "./components/MapPanel";
import { OpportunityCard } from "./components/OpportunityCard";
import { OpportunityModal } from "./components/OpportunityModal";
import { ApplyModal } from "./components/ApplyModal";
import { TagSelector } from "./components/TagSelector";
import { loadSession } from "./auth/auth";
import { loadFavoriteIds, toggleFavorite } from "./storage/favorites";
import type { Opportunity, OpportunityQuery, OpportunityType, TagOut, WorkFormat } from "./types";
import { buttonStyle, inputStyle, primaryButtonStyle } from "./ui/styles";

type ViewMode = "map" | "list";

const TYPE_OPTIONS: { id: OpportunityType; label: string }[] = [
  { id: "vacancy",    label: "Вакансии"     },
  { id: "internship", label: "Стажировки"   },
  { id: "mentoring",  label: "Менторство"   },
  { id: "event",      label: "Мероприятия"  },
];

const FORMAT_OPTIONS: { id: WorkFormat; label: string }[] = [
  { id: "office", label: "Офис"      },
  { id: "hybrid", label: "Гибрид"    },
  { id: "remote", label: "Удалённо"  },
];

export default function App() {
  const nav = useNavigate();
  const session = loadSession();
  const [view, setView]   = useState<ViewMode>("map");
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(() => loadFavoriteIds());

  const [q, setQ]               = useState("");
  const [types, setTypes]       = useState<Set<OpportunityType>>(new Set());
  const [formats, setFormats]   = useState<Set<WorkFormat>>(new Set());
  const [salaryFrom, setSalaryFrom] = useState("");
  const [salaryTo, setSalaryTo]     = useState("");
  const [city, setCity]             = useState("");

  const [allTags, setAllTags] = useState<TagOut[]>([]);
  const [tagIds, setTagIds]   = useState<Set<number>>(new Set());
  const [selectedOpp, setSelectedOpp]   = useState<Opportunity | null>(null);
  const [applyTarget, setApplyTarget]   = useState<{ id: number; type: string } | null>(null);

  useEffect(() => {
    fetchTags().then(setAllTags).catch(() => {});
  }, []);

  const query: OpportunityQuery = useMemo(() => {
    const sf = salaryFrom.trim() ? Number(salaryFrom) : undefined;
    const st = salaryTo.trim()   ? Number(salaryTo)   : undefined;
    return {
      q: q.trim() || undefined,
      types:   types.size   ? Array.from(types)   : undefined,
      formats: formats.size ? Array.from(formats) : undefined,
      tag_ids: tagIds.size  ? Array.from(tagIds)  : undefined,
      salary_from: Number.isFinite(sf as any) ? sf : undefined,
      salary_to:   Number.isFinite(st as any) ? st : undefined,
      city: city.trim() || undefined,
    };
  }, [q, types, formats, tagIds, salaryFrom, salaryTo, city]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchOpportunities(query)
      .then((data) => { if (alive) setItems(data); })
      .catch((e)   => { if (alive) setError(e?.message ?? "Ошибка"); })
      .finally(()  => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [query]);

  const itemsWithCoords = useMemo(
    () => items.filter((o) => typeof o.lat === "number" && typeof o.lng === "number"),
    [items],
  );

  const hasFilters = !!(q || city || salaryFrom || salaryTo || types.size || formats.size || tagIds.size);

  return (
    <div>
      {/* ── Header ──────────────────────────────── */}
      <header
        className="header-accent"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(12px)",
          background: "rgba(255,255,255,0.88)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 16px", display: "flex", gap: 12, alignItems: "center" }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 220 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(59,130,246,0.35)",
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 13 L9 4 L15 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 13 L9 8 L12 13" stroke="rgba(255,255,255,0.55)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.1, color: "var(--text)" }}>Трамплин</div>
              <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 0.2 }}>карьера · стажировки · события</div>
            </div>
          </div>

          {/* Search + view toggle */}
          <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск по названию…"
                style={{ ...inputStyle, paddingLeft: 34 }}
              />
            </div>

            <div style={{ display: "flex", gap: 4, padding: "3px", background: "var(--panel2)", borderRadius: 10, border: "1px solid var(--border)" }}>
              {(["map", "list"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  style={{
                    ...buttonStyle,
                    padding: "6px 14px",
                    fontSize: 13,
                    borderRadius: 7,
                    border: "none",
                    background: view === v ? "var(--panel)" : "transparent",
                    color: view === v ? "var(--accent)" : "var(--muted)",
                    boxShadow: view === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    fontWeight: view === v ? 600 : 400,
                  }}
                  onClick={() => setView(v)}
                >
                  {v === "map" ? "🗺 Карта" : "☰ Список"}
                </button>
              ))}
            </div>
          </div>

          {/* Auth */}
          <div style={{ display: "flex", gap: 8 }}>
            {session ? (
              <button type="button" style={primaryButtonStyle} onClick={() => nav("/cabinet")}>
                Кабинет
              </button>
            ) : (
              <>
                <Link to="/login" style={{ ...buttonStyle, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                  Войти
                </Link>
                <Link to="/register" style={{ ...primaryButtonStyle, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────── */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 16px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>

          {/* ── Sidebar filters ─────────────────── */}
          <aside style={{ position: "sticky", top: 78 }}>
            <div style={{ border: "1px solid var(--border)", borderRadius: 16, background: "var(--panel)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
              {/* Sidebar header */}
              <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, rgba(59,130,246,0.04), transparent)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>Фильтры</span>
                {hasFilters && (
                  <span className="stat-pill" style={{ marginLeft: "auto" }}>
                    {[types.size, formats.size, tagIds.size, q ? 1 : 0, city ? 1 : 0, salaryFrom ? 1 : 0, salaryTo ? 1 : 0].reduce((a, b) => a + b, 0)} активно
                  </span>
                )}
              </div>

              <div style={{ padding: 16, display: "grid", gap: 14 }}>
                {/* City */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Город</label>
                  <input value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} placeholder="Напр. Москва" />
                </div>

                {/* Type */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Тип</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {TYPE_OPTIONS.map((t) => {
                      const active = types.has(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          className="tag-pill"
                          style={{
                            ...buttonStyle,
                            padding: "5px 11px",
                            fontSize: 13,
                            borderRadius: 999,
                            background: active ? "rgba(59,130,246,0.1)" : "var(--panel2)",
                            borderColor: active ? "rgba(59,130,246,0.45)" : "var(--border)",
                            color: active ? "#3B82F6" : "var(--text)",
                            fontWeight: active ? 600 : 400,
                          }}
                          onClick={() => {
                            const next = new Set(types);
                            if (next.has(t.id)) next.delete(t.id);
                            else next.add(t.id);
                            setTypes(next);
                          }}
                        >{t.label}</button>
                      );
                    })}
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Формат</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {FORMAT_OPTIONS.map((t) => {
                      const active = formats.has(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          className="tag-pill"
                          style={{
                            ...buttonStyle,
                            padding: "5px 11px",
                            fontSize: 13,
                            borderRadius: 999,
                            background: active ? "rgba(34,197,94,0.1)" : "var(--panel2)",
                            borderColor: active ? "rgba(34,197,94,0.45)" : "var(--border)",
                            color: active ? "#16A34A" : "var(--text)",
                            fontWeight: active ? 600 : 400,
                          }}
                          onClick={() => {
                            const next = new Set(formats);
                            if (next.has(t.id)) next.delete(t.id);
                            else next.add(t.id);
                            setFormats(next);
                          }}
                        >{t.label}</button>
                      );
                    })}
                  </div>
                </div>

                {/* Tags */}
                {allTags.length > 0 && (
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Теги</label>
                    <TagSelector tags={allTags} selected={tagIds} onChange={setTagIds} />
                  </div>
                )}

                {/* Salary */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Зарплата, ₽</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <input value={salaryFrom} onChange={(e) => setSalaryFrom(e.target.value)} style={inputStyle} inputMode="numeric" placeholder="от" />
                    <input value={salaryTo}   onChange={(e) => setSalaryTo(e.target.value)}   style={inputStyle} inputMode="numeric" placeholder="до" />
                  </div>
                </div>

                {/* Stats + Reset */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, fontSize: 12, color: "var(--muted)" }}>
                    <span className="stat-pill">{items.length}</span>
                    <span style={{ marginLeft: 6 }}>найдено</span>
                    {itemsWithCoords.length > 0 && (
                      <span style={{ marginLeft: 8, color: "#9CA3AF" }}>· {itemsWithCoords.length} на карте</span>
                    )}
                  </div>
                  {hasFilters && (
                    <button
                      type="button"
                      style={{ ...buttonStyle, padding: "6px 12px", fontSize: 12, color: "#DC2626", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}
                      onClick={() => { setQ(""); setCity(""); setSalaryFrom(""); setSalaryTo(""); setTypes(new Set()); setFormats(new Set()); setTagIds(new Set()); }}
                    >
                      Сбросить
                    </button>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* ── Content ─────────────────────────── */}
          <section style={{ display: "grid", gap: 12 }}>
            {loading ? (
              <div style={{ border: "1px solid var(--border)", background: "var(--panel)", borderRadius: 16, padding: 20, display: "flex", gap: 12, alignItems: "center" }}>
                <div className="loading-pulse" style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg, #3B82F6, #60A5FA)" }} />
                <span style={{ color: "var(--muted)", fontSize: 14 }}>Загружаем данные…</span>
              </div>
            ) : error ? (
              <div className="fade-up" style={{ border: "1px solid rgba(245,158,11,0.35)", background: "rgba(255,251,235,0.8)", borderRadius: 16, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#92400E", fontWeight: 600, fontSize: 14 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Ошибка: {error}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#B45309" }}>
                  Подсказка: если бэкенд не запущен, открой <code>http://localhost:8000/health</code>
                </div>
              </div>
            ) : view === "map" ? (
              <MapPanel
                opportunities={itemsWithCoords}
                favoriteIds={favoriteIds}
                onSelect={() => setView("list")}
                onOpenModal={(o) => setSelectedOpp(o)}
              />
            ) : (
              <>
                {items.length ? (
                  <div className="fade-up" style={{ display: "grid", gap: 10 }}>
                    {items.map((o) => (
                      <OpportunityCard
                        key={o.id}
                        o={o}
                        isFavorite={favoriteIds.has(o.id)}
                        onToggleFavorite={(id) => setFavoriteIds(new Set(toggleFavorite(id)))}
                        onFocus={() => setSelectedOpp(o)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="fade-up" style={{ border: "1px solid var(--border)", background: "var(--panel)", borderRadius: 16, padding: "40px 24px", textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                    <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Ничего не найдено</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>Попробуй ослабить фильтры или изменить запрос</div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {selectedOpp && (
        <OpportunityModal
          opportunity={selectedOpp}
          session={session}
          onClose={() => setSelectedOpp(null)}
          onApply={(id, type) => { setApplyTarget({ id, type }); setSelectedOpp(null); }}
          isFavorite={favoriteIds.has(selectedOpp.id)}
          onToggleFavorite={(id) => setFavoriteIds(new Set(toggleFavorite(id)))}
        />
      )}
      {applyTarget !== null && session && (
        <ApplyModal
          opportunityId={applyTarget.id}
          opportunityTitle={items.find((o) => o.id === applyTarget.id)?.title ?? ""}
          opportunityType={applyTarget.type}
          session={session}
          onClose={() => setApplyTarget(null)}
          onSuccess={() => setApplyTarget(null)}
        />
      )}
    </div>
  );
}
