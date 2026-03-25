import type { Opportunity } from "../types";
import { buttonStyle } from "../ui/styles";

const TYPE_META: Record<Opportunity["opportunity_type"], { label: string; color: string; bg: string }> = {
  vacancy:    { label: "Вакансия",    color: "#3B82F6", bg: "rgba(59,130,246,0.1)"  },
  internship: { label: "Стажировка",  color: "#16A34A", bg: "rgba(34,197,94,0.1)"   },
  mentoring:  { label: "Менторство",  color: "#8B5CF6", bg: "rgba(139,92,246,0.1)"  },
  event:      { label: "Мероприятие", color: "#D97706", bg: "rgba(245,158,11,0.1)"  },
};

const FORMAT_LABEL: Record<Opportunity["work_format"], string> = {
  office: "Офис",
  hybrid: "Гибрид",
  remote: "Удалённо",
};

function salaryText(o: Opportunity) {
  const a = o.salary_from;
  const b = o.salary_to;
  if (a == null && b == null) return null;
  if (a != null && b != null) return `${a.toLocaleString("ru-RU")}–${b.toLocaleString("ru-RU")} ₽`;
  if (a != null) return `от ${a.toLocaleString("ru-RU")} ₽`;
  return `до ${b!.toLocaleString("ru-RU")} ₽`;
}

export function OpportunityCard(props: {
  o: Opportunity;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onFocus?: () => void;
}) {
  const { o, isFavorite, onToggleFavorite, onFocus } = props;
  const salary = salaryText(o);
  const meta = TYPE_META[o.opportunity_type];

  return (
    <div
      className={onFocus ? "card-hover" : undefined}
      style={{
        border: "1px solid var(--border)",
        background: "var(--panel)",
        borderRadius: 14,
        padding: "14px 14px 14px 18px",
        boxShadow: "var(--shadow-sm)",
        cursor: onFocus ? "pointer" : "default",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        borderLeft: `3px solid ${meta.color}`,
      }}
      onClick={onFocus}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Company */}
        {o.company_name && (
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4, fontWeight: 500 }}>{o.company_name}</div>
        )}

        {/* Title + favorite badge */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", lineHeight: 1.3 }}>{o.title}</div>
          {isFavorite && (
            <span style={{ fontSize: 11, fontWeight: 600, color: "#D97706", border: "1px solid rgba(245,158,11,0.4)", background: "rgba(245,158,11,0.09)", padding: "2px 8px", borderRadius: 999 }}>
              ★ Избранное
            </span>
          )}
        </div>

        {/* Meta row */}
        <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {/* Type badge */}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}30`, padding: "2px 9px", borderRadius: 999 }}>
            {meta.label}
          </span>
          {/* Format */}
          <span style={{ fontSize: 12, color: "var(--muted)", background: "var(--panel2)", border: "1px solid var(--border)", padding: "2px 9px", borderRadius: 999 }}>
            {FORMAT_LABEL[o.work_format]}
          </span>
          {/* City */}
          {o.city && (
            <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {o.city}
            </span>
          )}
          {/* Salary */}
          {salary && (
            <span style={{ fontSize: 12, fontWeight: 700, color: "#16A34A", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", padding: "2px 9px", borderRadius: 999 }}>
              {salary}
            </span>
          )}
        </div>

        {/* Tags */}
        {o.tags?.length ? (
          <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {o.tags.slice(0, 6).map((t) => (
              <span
                key={t.id}
                className="tag-pill"
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  border: "1px solid var(--border)",
                  background: "var(--panel2)",
                  padding: "2px 8px",
                  borderRadius: 999,
                }}
              >
                {t.name}
              </span>
            ))}
          </div>
        ) : null}

        {/* Description */}
        {o.description && (
          <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 13, lineHeight: 1.55, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
            {o.description.slice(0, 200)}{o.description.length > 200 ? "…" : ""}
          </div>
        )}
      </div>

      {/* Favorite button */}
      <button
        type="button"
        style={{
          ...buttonStyle,
          flexShrink: 0,
          padding: "8px 10px",
          borderRadius: 10,
          fontSize: 16,
          borderColor: isFavorite ? "rgba(245,158,11,0.45)" : "var(--border)",
          background: isFavorite ? "rgba(245,158,11,0.1)" : "var(--panel2)",
          color: isFavorite ? "#D97706" : "var(--muted)",
        }}
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(o.id); }}
        aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
        title={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
      >
        {isFavorite ? "★" : "☆"}
      </button>
    </div>
  );
}
