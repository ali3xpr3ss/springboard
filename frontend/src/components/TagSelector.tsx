import type { TagCategory, TagOut } from "../types";
import { buttonStyle } from "../ui/styles";

const CATEGORY_LABELS: Record<TagCategory, string> = {
  tech: "Технологии",
  level: "Уровень",
  employment: "Занятость",
  other: "Другое",
};

type Props = {
  tags: TagOut[];
  selected: Set<number>;
  onChange: (next: Set<number>) => void;
  groupByCategory?: boolean;
};

export function TagSelector({ tags, selected, onChange, groupByCategory = true }: Props) {
  function toggle(id: number) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  if (!groupByCategory) {
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {tags.map((tag) => {
          const active = selected.has(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              style={{
                ...buttonStyle,
                padding: "6px 10px",
                fontSize: 13,
                background: active ? "rgba(124,58,237,0.22)" : buttonStyle.background,
                borderColor: active ? "rgba(124,58,237,0.55)" : "var(--border)",
              }}
              onClick={() => toggle(tag.id)}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
    );
  }

  const groups = new Map<TagCategory, TagOut[]>();
  for (const tag of tags) {
    const cat = tag.category as TagCategory;
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(tag);
  }

  const categoryOrder: TagCategory[] = ["tech", "level", "employment", "other"];

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {categoryOrder.map((cat) => {
        const group = groups.get(cat);
        if (!group?.length) return null;
        return (
          <div key={cat}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{CATEGORY_LABELS[cat]}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {group.map((tag) => {
                const active = selected.has(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    style={{
                      ...buttonStyle,
                      padding: "6px 10px",
                      fontSize: 13,
                      background: active ? "rgba(124,58,237,0.22)" : buttonStyle.background,
                      borderColor: active ? "rgba(124,58,237,0.55)" : "var(--border)",
                    }}
                    onClick={() => toggle(tag.id)}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
