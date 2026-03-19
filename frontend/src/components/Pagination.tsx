import { buttonStyle } from "../ui/styles";

type Props = {
  total: number;
  page: number;
  pageSize: number;
  onChange: (page: number) => void;
};

export function Pagination({ total, page, pageSize, onChange }: Props) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const activeStyle = {
    background: "rgba(124,58,237,0.22)",
    borderColor: "rgba(124,58,237,0.55)",
  };

  function pageNums(): (number | "...")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const result: (number | "...")[] = [];
    result.push(1);
    if (page > 3) result.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      result.push(i);
    }
    if (page < totalPages - 2) result.push("...");
    result.push(totalPages);
    return result;
  }

  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginTop: 12 }}>
      <button
        type="button"
        style={{ ...buttonStyle, padding: "8px 12px", opacity: page === 1 ? 0.4 : 1 }}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        ← Пред
      </button>

      {pageNums().map((n, i) =>
        n === "..." ? (
          <span key={`e${i}`} style={{ ...buttonStyle, padding: "8px 10px", cursor: "default", opacity: 0.5 }}>
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            style={{ ...buttonStyle, padding: "8px 12px", ...(n === page ? activeStyle : {}) }}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ),
      )}

      <button
        type="button"
        style={{ ...buttonStyle, padding: "8px 12px", opacity: page === totalPages ? 0.4 : 1 }}
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        След →
      </button>
    </div>
  );
}
