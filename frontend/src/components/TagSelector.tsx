import type { TagCategory, TagOut } from "../types";
import { buttonStyle } from "../ui/styles";

const CATEGORY_LABELS: Record<TagCategory, string> = {
  tech:       "Технологии",
  level:      "Уровень",
  employment: "Занятость",
  other:      "Другое",
};

type Props = {
  tags: TagOut[];
  selected: Set<number>;
  onChange: (next: Set<number>) => void;
  groupByCategory?: boolean;
};

function TagBtn({ tag, active, onToggle }: { tag: TagOut; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="tag-pill"
      style={{
        ...buttonStyle,
        padding: "4px 10px",
        fontSize: 12,
        borderRadius: 999,
        background: active ? "rgba(59,130,246,0.1)" : "var(--panel2)",
        borderColor: active ? "rgba(59,130,246,0.45)" : "var(--border)",
        color: active ? "#3B82F6" : "var(--text)",
        fontWeight: active ? 600 : 400,
      }}
      onClick={onToggle}
    >
      {tag.name}
    </button>
  );
}

export function TagSelector({ tags, selected, onChange, groupByCategory = true }: Props) {
  function toggle(id: number) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  if (!groupByCategory) {
    return (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {tags.map((tag) => (
          <TagBtn key={tag.id} tag={tag} active={selected.has(tag.id)} onToggle={() => toggle(tag.id)} />
        ))}
      </div>
    );
  }

  const groups = new Map<TagCategory, TagOut[]>();
  for (const tag of tags) {
    const cat = tag.category as TagCategory;
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(tag);
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {(["tech", "level", "employment", "other"] as TagCategory[]).map((cat) => {
        const group = groups.get(cat);
        if (!group?.length) return null;
        return (
          <div key={cat}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              {CATEGORY_LABELS[cat]}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {group.map((tag) => (
                <TagBtn key={tag.id} tag={tag} active={selected.has(tag.id)} onToggle={() => toggle(tag.id)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
