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
import { buttonStyle, cardStyle, inputStyle } from "./ui/styles";

type ViewMode = "map" | "list";

const TYPE_OPTIONS: { id: OpportunityType; label: string }[] = [
  { id: "vacancy", label: "Вакансии" },
  { id: "internship", label: "Стажировки" },
  { id: "mentoring", label: "Менторство" },
  { id: "event", label: "Мероприятия" },
];

const FORMAT_OPTIONS: { id: WorkFormat; label: string }[] = [
  { id: "office", label: "Офис" },
  { id: "hybrid", label: "Гибрид" },
  { id: "remote", label: "Удалённо" },
];

export default function App() {
  const nav = useNavigate();
  const session = loadSession();
  const [view, setView] = useState<ViewMode>("map");
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(() => loadFavoriteIds());

  const [q, setQ] = useState("");
  const [types, setTypes] = useState<Set<OpportunityType>>(new Set());
  const [formats, setFormats] = useState<Set<WorkFormat>>(new Set());
  const [salaryFrom, setSalaryFrom] = useState<string>("");
  const [salaryTo, setSalaryTo] = useState<string>("");
  const [city, setCity] = useState<string>("");

  const [allTags, setAllTags] = useState<TagOut[]>([]);
  const [tagIds, setTagIds] = useState<Set<number>>(new Set());
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [applyTarget, setApplyTarget] = useState<number | null>(null);

  useEffect(() => {
    fetchTags().then(setAllTags).catch(() => {});
  }, []);

  const query: OpportunityQuery = useMemo(() => {
    const sf = salaryFrom.trim() ? Number(salaryFrom) : undefined;
    const st = salaryTo.trim() ? Number(salaryTo) : undefined;
    return {
      q: q.trim() || undefined,
      types: types.size ? Array.from(types) : undefined,
      formats: formats.size ? Array.from(formats) : undefined,
      tag_ids: tagIds.size ? Array.from(tagIds) : undefined,
      salary_from: Number.isFinite(sf as any) ? sf : undefined,
      salary_to: Number.isFinite(st as any) ? st : undefined,
      city: city.trim() || undefined,
    };
  }, [q, types, formats, tagIds, salaryFrom, salaryTo, city]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchOpportunities(query)
      .then((data) => {
        if (!alive) return;
        setItems(data);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.message ?? "Ошибка");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [query]);

  const itemsWithCoords = useMemo(
    () => items.filter((o) => typeof o.lat === "number" && typeof o.lng === "number"),
    [items],
  );

  return (
    <div>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--border)",
          background: "rgba(11,18,32,0.65)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "16px 16px",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 220 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                background: "linear-gradient(135deg, rgba(124,58,237,1), rgba(34,197,94,1))",
              }}
            />
            <div>
              <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>Трамплин</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>карьера • стажировки • события</div>
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", gap: 10, alignItems: "center" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по названию…"
              style={inputStyle}
            />
            <button
              type="button"
              style={{
                ...buttonStyle,
                background: view === "map" ? "rgba(124,58,237,0.22)" : buttonStyle.background,
                borderColor: view === "map" ? "rgba(124,58,237,0.55)" : "var(--border)",
              }}
              onClick={() => setView("map")}
            >
              Карта
            </button>
            <button
              type="button"
              style={{
                ...buttonStyle,
                background: view === "list" ? "rgba(124,58,237,0.22)" : buttonStyle.background,
                borderColor: view === "list" ? "rgba(124,58,237,0.55)" : "var(--border)",
              }}
              onClick={() => setView("list")}
            >
              Список
            </button>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {session ? (
              <button type="button" style={buttonStyle} onClick={() => nav("/cabinet")}>
                Кабинет
              </button>
            ) : (
              <>
                <Link to="/login" style={{ ...buttonStyle, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                  Вход
                </Link>
                <Link
                  to="/register"
                  style={{
                    ...buttonStyle,
                    borderColor: "rgba(124,58,237,0.55)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 16px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16, alignItems: "start" }}>
          <aside style={{ position: "sticky", top: 86 }}>
            <div style={cardStyle}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Фильтры</div>
              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Город</div>
                  <input value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} placeholder="Напр. Москва" />
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Тип</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {TYPE_OPTIONS.map((t) => {
                      const active = types.has(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          style={{
                            ...buttonStyle,
                            padding: "8px 10px",
                            background: active ? "rgba(124,58,237,0.22)" : buttonStyle.background,
                            borderColor: active ? "rgba(124,58,237,0.55)" : "var(--border)",
                          }}
                          onClick={() => {
                            const next = new Set(types);
                            if (next.has(t.id)) next.delete(t.id);
                            else next.add(t.id);
                            setTypes(next);
                          }}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Формат</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {FORMAT_OPTIONS.map((t) => {
                      const active = formats.has(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          style={{
                            ...buttonStyle,
                            padding: "8px 10px",
                            background: active ? "rgba(34,197,94,0.18)" : buttonStyle.background,
                            borderColor: active ? "rgba(34,197,94,0.5)" : "var(--border)",
                          }}
                          onClick={() => {
                            const next = new Set(formats);
                            if (next.has(t.id)) next.delete(t.id);
                            else next.add(t.id);
                            setFormats(next);
                          }}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {allTags.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Теги</div>
                    <TagSelector tags={allTags} selected={tagIds} onChange={setTagIds} />
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>ЗП от</div>
                    <input value={salaryFrom} onChange={(e) => setSalaryFrom(e.target.value)} style={inputStyle} inputMode="numeric" placeholder="0" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>ЗП до</div>
                    <input value={salaryTo} onChange={(e) => setSalaryTo(e.target.value)} style={inputStyle} inputMode="numeric" placeholder="0" />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    style={{ ...buttonStyle, flex: 1 }}
                    onClick={() => {
                      setQ("");
                      setCity("");
                      setSalaryFrom("");
                      setSalaryTo("");
                      setTypes(new Set());
                      setFormats(new Set());
                      setTagIds(new Set());
                    }}
                  >
                    Сбросить
                  </button>
                </div>

                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  <div>Найдено: <b style={{ color: "var(--text)" }}>{items.length}</b></div>
                  <div>С координатами: <b style={{ color: "var(--text)" }}>{itemsWithCoords.length}</b></div>
                </div>
              </div>
            </div>
          </aside>

          <section style={{ display: "grid", gap: 12 }}>
            {loading ? (
              <div style={cardStyle}>Загрузка…</div>
            ) : error ? (
              <div style={{ ...cardStyle, borderColor: "rgba(245,158,11,0.45)", background: "rgba(245,158,11,0.08)" }}>
                Ошибка: {error}
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
                  Подсказка: если бэкенд не запущен, открой `http://localhost:8000/health`.
                </div>
              </div>
            ) : view === "map" ? (
              <MapPanel
                opportunities={itemsWithCoords}
                favoriteIds={favoriteIds}
                onSelect={() => {
                  setView("list");
                }}
              />
            ) : (
              <>
                {items.length ? (
                  <div style={{ display: "grid", gap: 12 }}>
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
                  <div style={cardStyle}>Ничего не найдено. Попробуй ослабить фильтры.</div>
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
          onApply={(id) => { setApplyTarget(id); setSelectedOpp(null); }}
        />
      )}
      {applyTarget !== null && session && (
        <ApplyModal
          opportunityId={applyTarget}
          opportunityTitle={items.find((o) => o.id === applyTarget)?.title ?? ""}
          session={session}
          onClose={() => setApplyTarget(null)}
          onSuccess={() => setApplyTarget(null)}
        />
      )}
    </div>
  );
}
