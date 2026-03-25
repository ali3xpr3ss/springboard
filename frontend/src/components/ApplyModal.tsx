import { useState } from "react";
import type { Session } from "../auth/auth";
import { applyToOpportunity } from "../api";
import { buttonStyle, cardStyle, inputStyle } from "../ui/styles";

type Props = {
  opportunityId: number;
  opportunityTitle: string;
  session: Session;
  onClose: () => void;
  onSuccess: () => void;
};

export function ApplyModal({ opportunityId, opportunityTitle, session, onClose, onSuccess }: Props) {
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await applyToOpportunity(session, opportunityId, coverLetter.trim() || null);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Ошибка отправки");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ ...cardStyle, background: "#0f1829", maxWidth: 520, width: "100%", position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          style={{ ...buttonStyle, position: "absolute", top: 12, right: 12, padding: "6px 10px" }}
          onClick={onClose}
        >
          ✕
        </button>

        <div style={{ fontWeight: 800, fontSize: 18, paddingRight: 40 }}>Откликнуться</div>
        <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 13 }}>{opportunityTitle}</div>

        <textarea
          style={{ ...inputStyle, marginTop: 14, minHeight: 120, resize: "vertical" }}
          placeholder="Сопроводительное письмо (необязательно)"
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          rows={5}
        />

        {error && (
          <div style={{ marginTop: 10, color: "rgba(245,158,11,0.95)", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, padding: "8px 12px", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <button
            type="button"
            style={{ ...buttonStyle, flex: 1, background: "rgba(124,58,237,0.22)", borderColor: "rgba(124,58,237,0.55)" }}
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Отправляем…" : "Отправить отклик"}
          </button>
          <button type="button" style={buttonStyle} onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
