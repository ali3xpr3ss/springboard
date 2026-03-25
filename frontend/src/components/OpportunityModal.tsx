import type { Opportunity } from "../types";
import type { Session } from "../auth/auth";
import { buttonStyle, primaryButtonStyle } from "../ui/styles";

const TYPE_META: Record<Opportunity["opportunity_type"], { label: string; color: string; bg: string }> = {
  vacancy:    { label: "Вакансия",    color: "#3B82F6", bg: "rgba(59,130,246,0.1)"  },
  internship: { label: "Стажировка",  color: "#16A34A", bg: "rgba(34,197,94,0.1)"   },
  mentoring:  { label: "Менторство",  color: "#8B5CF6", bg: "rgba(139,92,246,0.1)"  },
  event:      { label: "Мероприятие", color: "#D97706", bg: "rgba(245,158,11,0.1)"  },
};

const FORMAT_LABEL: Record<Opportunity["work_format"], string> = {
  office: "Офис", hybrid: "Гибрид", remote: "Удалённо",
};

function salaryText(o: Opportunity) {
  const a = o.salary_from, b = o.salary_to;
  if (a == null && b == null) return null;
  if (a != null && b != null) return `${a.toLocaleString("ru-RU")}–${b.toLocaleString("ru-RU")} ₽`;
  if (a != null) return `от ${a.toLocaleString("ru-RU")} ₽`;
  return `до ${b!.toLocaleString("ru-RU")} ₽`;
}

type Props = {
  opportunity: Opportunity;
  session: Session | null;
  onClose: () => void;
  onApply: (id: number, type: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
  hideApply?: boolean;
};

export function OpportunityModal({ opportunity: o, session, onClose, onApply, isFavorite, onToggleFavorite, hideApply }: Props) {
  const salary = salaryText(o);
  const meta = TYPE_META[o.opportunity_type];

  return (
    <div
      className="modal-overlay"
      style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.45)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        className="modal-card"
        style={{ border: "1px solid var(--border)", background: "var(--panel)", borderRadius: 20, maxWidth: 660, width: "100%", maxHeight: "88vh", overflowY: "auto", position: "relative", boxShadow: "var(--shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Colour stripe based on type */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}88)`, borderRadius: "20px 20px 0 0" }} />

        {/* Controls */}
        <div style={{ position: "absolute", top: 16, right: 14, display: "flex", gap: 6 }}>
          {onToggleFavorite && (
            <button
              type="button"
              title={isFavorite ? "Убрать из избранного" : "В избранное"}
              style={{ ...buttonStyle, padding: "7px 10px", borderRadius: 10, background: isFavorite ? "rgba(245,158,11,0.1)" : "var(--panel2)", borderColor: isFavorite ? "rgba(245,158,11,0.5)" : "var(--border)", color: isFavorite ? "#D97706" : "var(--muted)", fontSize: 16 }}
              onClick={() => onToggleFavorite(o.id)}
            >
              {isFavorite ? "★" : "☆"}
            </button>
          )}
          <button
            type="button"
            style={{ ...buttonStyle, padding: "7px 10px", borderRadius: 10, color: "var(--muted)" }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "20px 22px 24px", paddingRight: onToggleFavorite ? 96 : 56 }}>
          {/* Company */}
          {o.company_name && (
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{o.company_name}</div>
          )}

          {/* Title */}
          <div style={{ fontWeight: 800, fontSize: 22, color: "var(--text)", lineHeight: 1.25, marginBottom: 12 }}>{o.title}</div>

          {/* Meta badges */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}30`, padding: "3px 10px", borderRadius: 999 }}>{meta.label}</span>
            <span style={{ fontSize: 12, color: "var(--muted)", background: "var(--panel2)", border: "1px solid var(--border)", padding: "3px 10px", borderRadius: 999 }}>{FORMAT_LABEL[o.work_format]}</span>
            {o.city && (
              <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {o.city}{o.address ? `, ${o.address}` : ""}
              </span>
            )}
            {salary && (
              <span style={{ fontSize: 13, fontWeight: 700, color: "#16A34A", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", padding: "3px 10px", borderRadius: 999 }}>{salary}</span>
            )}
          </div>

          {/* Tags */}
          {o.tags?.length ? (
            <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {o.tags.map((t) => (
                <span key={t.id} className="tag-pill" style={{ fontSize: 12, color: "var(--muted)", border: "1px solid var(--border)", background: "var(--panel2)", padding: "3px 10px", borderRadius: 999 }}>
                  {t.name}
                </span>
              ))}
            </div>
          ) : null}

          {/* Description */}
          {o.description && (
            <>
              <div style={{ marginTop: 18, marginBottom: 10, height: 1, background: "var(--border)" }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Описание</div>
              <div style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{o.description}</div>
            </>
          )}

          {/* Dates */}
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Опубликовано: <b style={{ color: "var(--text)" }}>{new Date(o.published_at).toLocaleDateString("ru-RU")}</b></span>
            {o.expires_at  && <span style={{ fontSize: 12, color: "var(--muted)" }}>Действует до: <b style={{ color: "var(--text)" }}>{new Date(o.expires_at).toLocaleDateString("ru-RU")}</b></span>}
            {o.event_date  && <span style={{ fontSize: 12, color: "var(--muted)" }}>Дата события: <b style={{ color: "var(--text)" }}>{new Date(o.event_date).toLocaleDateString("ru-RU")}</b></span>}
            {o.scheduled_at && <span style={{ fontSize: 12, color: "var(--muted)" }}>Запланировано: <b style={{ color: "var(--text)" }}>{new Date(o.scheduled_at).toLocaleDateString("ru-RU")}</b></span>}
          </div>

          {/* Apply */}
          {session?.role === "applicant" && !hideApply && (
            <button
              type="button"
              style={{ ...primaryButtonStyle, marginTop: 18, padding: "12px 22px", fontSize: 15 }}
              onClick={() => onApply(o.id, o.opportunity_type)}
            >
              {o.opportunity_type === "event" ? "Зарегистрироваться →" : "Откликнуться →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
