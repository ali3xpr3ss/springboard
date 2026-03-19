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
};

export function OpportunityModal({ opportunity: o, session, onClose, onApply }: Props) {
  const salary = salaryText(o);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ ...cardStyle, maxWidth: 640, width: "100%", maxHeight: "85vh", overflowY: "auto", position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          style={{ ...buttonStyle, position: "absolute", top: 12, right: 12, padding: "6px 10px" }}
          onClick={onClose}
        >
          ✕
        </button>

        <div style={{ paddingRight: 40 }}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>{o.title}</div>

          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", color: "var(--muted)", fontSize: 13 }}>
            <span>{formatType(o.opportunity_type)}</span>
            <span>•</span>
            <span>{formatFormat(o.work_format)}</span>
            {o.city && <><span>•</span><span>{o.city}</span></>}
            {salary && <><span>•</span><span style={{ color: "rgba(255,255,255,0.9)" }}>{salary}</span></>}
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
            <div style={{ marginTop: 14, color: "var(--muted)", fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
              {o.description}
            </div>
          ) : null}

          <div style={{ marginTop: 14, display: "flex", gap: 16, fontSize: 12, color: "var(--muted)" }}>
            {o.expires_at && <span>Действует до: {new Date(o.expires_at).toLocaleDateString("ru-RU")}</span>}
            {o.event_date && <span>Дата события: {new Date(o.event_date).toLocaleDateString("ru-RU")}</span>}
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
