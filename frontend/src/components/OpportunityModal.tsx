import type { Opportunity } from "../types";
import type { Session } from "../auth/auth";
import { buttonStyle, cardStyle } from "../ui/styles";

function formatType(t: Opportunity["opportunity_type"]) {
  switch (t) {
    case "internship": return "Стажировка";
    case "vacancy": return "Вакансия";
    case "mentoring": return "Менторство";
    case "event": return "Мероприятие";
  }
}

function formatFormat(f: Opportunity["work_format"]) {
  switch (f) {
    case "office": return "Офис";
    case "hybrid": return "Гибрид";
    case "remote": return "Удалённо";
  }
}

function salaryText(o: Opportunity) {
  const a = o.salary_from;
  const b = o.salary_to;
  if (a == null && b == null) return null;
  if (a != null && b != null) return `${a.toLocaleString("ru-RU")}–${b.toLocaleString("ru-RU")} ₽`;
  if (a != null) return `от ${a.toLocaleString("ru-RU")} ₽`;
  return `до ${b!.toLocaleString("ru-RU")} ₽`;
}

type Props = {
  opportunity: Opportunity;
  session: Session | null;
  onClose: () => void;
  onApply: (id: number) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
};

export function OpportunityModal({ opportunity: o, session, onClose, onApply, isFavorite, onToggleFavorite }: Props) {
  const salary = salaryText(o);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ ...cardStyle, background: "#0f1829", maxWidth: 640, width: "100%", maxHeight: "85vh", overflowY: "auto", position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8 }}>
          {onToggleFavorite && (
            <button
              type="button"
              title={isFavorite ? "Убрать из избранного" : "В избранное"}
              style={{
                ...buttonStyle,
                padding: "6px 10px",
                background: isFavorite ? "rgba(245,158,11,0.18)" : buttonStyle.background,
                borderColor: isFavorite ? "rgba(245,158,11,0.6)" : "var(--border)",
                fontSize: 16,
              }}
              onClick={() => onToggleFavorite(o.id)}
            >
              {isFavorite ? "★" : "☆"}
            </button>
          )}
          <button
            type="button"
            style={{ ...buttonStyle, padding: "6px 10px" }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div style={{ paddingRight: onToggleFavorite ? 88 : 44 }}>
          {o.company_name && (
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>{o.company_name}</div>
          )}
          <div style={{ fontWeight: 800, fontSize: 20 }}>{o.title}</div>

          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", color: "var(--muted)", fontSize: 13 }}>
            <span>{formatType(o.opportunity_type)}</span>
            <span>•</span>
            <span>{formatFormat(o.work_format)}</span>
            {o.city && <><span>•</span><span>{o.city}{o.address ? `, ${o.address}` : ""}</span></>}
            {salary && <><span>•</span><span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700 }}>{salary}</span></>}
          </div>

          {o.tags?.length ? (
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {o.tags.map((t) => (
                <span
                  key={t.id}
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.85)",
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.06)",
                    padding: "2px 8px",
                    borderRadius: 999,
                  }}
                >
                  {t.name}
                </span>
              ))}
            </div>
          ) : null}

          {o.description ? (
            <>
              <div style={{ marginTop: 16, marginBottom: 8, height: 1, background: "var(--border)" }} />
              <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginBottom: 6 }}>Описание</div>
              <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                {o.description}
              </div>
            </>
          ) : null}

          <div style={{ marginTop: 16, marginBottom: 8, height: 1, background: "var(--border)" }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 24px", fontSize: 12, color: "var(--muted)" }}>
            <span>Опубликовано: <b style={{ color: "var(--text)" }}>{new Date(o.published_at).toLocaleDateString("ru-RU")}</b></span>
            {o.expires_at && (
              <span>Действует до: <b style={{ color: "var(--text)" }}>{new Date(o.expires_at).toLocaleDateString("ru-RU")}</b></span>
            )}
            {o.event_date && (
              <span>Дата события: <b style={{ color: "var(--text)" }}>{new Date(o.event_date).toLocaleDateString("ru-RU")}</b></span>
            )}
            {o.scheduled_at && (
              <span>Запланировано: <b style={{ color: "var(--text)" }}>{new Date(o.scheduled_at).toLocaleDateString("ru-RU")}</b></span>
            )}
          </div>

          {session?.role === "applicant" && (
            <button
              type="button"
              style={{ ...buttonStyle, marginTop: 16, background: "rgba(124,58,237,0.22)", borderColor: "rgba(124,58,237,0.55)" }}
              onClick={() => onApply(o.id)}
            >
              Откликнуться
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
