import type { Opportunity } from "../types";
import { buttonStyle, cardStyle } from "../ui/styles";

function formatType(t: Opportunity["opportunity_type"]) {
  switch (t) {
    case "internship":
      return "Стажировка";
    case "vacancy":
      return "Вакансия";
    case "mentoring":
      return "Менторство";
    case "event":
      return "Мероприятие";
  }
}

function formatFormat(f: Opportunity["work_format"]) {
  switch (f) {
    case "office":
      return "Офис";
    case "hybrid":
      return "Гибрид";
    case "remote":
      return "Удалённо";
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

export function OpportunityCard(props: {
  o: Opportunity;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onFocus?: () => void;
}) {
  const { o, isFavorite, onToggleFavorite, onFocus } = props;
  const salary = salaryText(o);

  return (
    <div style={{ ...cardStyle, cursor: onFocus ? "pointer" : "default" }} onClick={onFocus}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis" }}>
              {o.title}
            </div>
            {isFavorite ? (
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.9)",
                  border: "1px solid rgba(34,197,94,0.5)",
                  background: "rgba(34,197,94,0.15)",
                  padding: "2px 8px",
                  borderRadius: 999,
                }}
              >
                Избранное
              </span>
            ) : null}
          </div>

          <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap", color: "var(--muted)" }}>
            <span>{formatType(o.opportunity_type)}</span>
            <span>•</span>
            <span>{formatFormat(o.work_format)}</span>
            {o.city ? (
              <>
                <span>•</span>
                <span>{o.city}</span>
              </>
            ) : null}
            {salary ? (
              <>
                <span>•</span>
                <span style={{ color: "rgba(255,255,255,0.9)" }}>{salary}</span>
              </>
            ) : null}
          </div>

          {o.tags?.length ? (
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {o.tags.slice(0, 6).map((t) => (
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
        </div>

        <button
          type="button"
          style={{
            ...buttonStyle,
            padding: "8px 10px",
            borderColor: isFavorite ? "rgba(34,197,94,0.5)" : "var(--border)",
            background: isFavorite ? "rgba(34,197,94,0.12)" : buttonStyle.background,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(o.id);
          }}
          aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
          title={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
        >
          {isFavorite ? "★" : "☆"}
        </button>
      </div>

      {o.description ? (
        <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 13, lineHeight: 1.45 }}>
          {o.description.slice(0, 220)}
          {o.description.length > 220 ? "…" : ""}
        </div>
      ) : null}
    </div>
  );
}

