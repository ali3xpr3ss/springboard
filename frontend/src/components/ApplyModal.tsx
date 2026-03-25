import { useState } from "react";
import type { Session } from "../auth/auth";
import { applyToOpportunity } from "../api";
import { buttonStyle, inputStyle, primaryButtonStyle } from "../ui/styles";

type Props = {
  opportunityId: number;
  opportunityTitle: string;
  opportunityType?: string;
  session: Session;
  onClose: () => void;
  onSuccess: () => void;
};

export function ApplyModal({ opportunityId, opportunityTitle, opportunityType, session, onClose, onSuccess }: Props) {
  const isEvent = opportunityType === "event";
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

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
      className="modal-overlay"
      style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.45)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        className="modal-card"
        style={{ border: "1px solid var(--border)", background: "var(--panel)", borderRadius: 20, maxWidth: 520, width: "100%", position: "relative", boxShadow: "var(--shadow-lg)", overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg, #3B82F6, #6366F1)", borderRadius: "20px 20px 0 0" }} />

        <div style={{ padding: "20px 22px 24px" }}>
          <button
            type="button"
            style={{ ...buttonStyle, position: "absolute", top: 14, right: 14, padding: "6px 10px", borderRadius: 10, color: "var(--muted)" }}
            onClick={onClose}
          >
            ✕
          </button>

          <div style={{ paddingRight: 44 }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)" }}>{isEvent ? "Регистрация на мероприятие" : "Откликнуться"}</div>
            <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 13 }}>{opportunityTitle}</div>
          </div>

          {isEvent ? (
            <div style={{ marginTop: 16, padding: "14px 16px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
              Нажмите «Подтвердить», чтобы зарегистрироваться на мероприятие. Организаторы получат уведомление с вашими контактными данными.
            </div>
          ) : (
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
                Сопроводительное письмо <span style={{ fontWeight: 400 }}>(необязательно)</span>
              </label>
              <textarea
                style={{ ...inputStyle, minHeight: 130, resize: "vertical" }}
                placeholder="Расскажите, почему вас заинтересовала эта позиция…"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={5}
              />
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, color: "#92400E", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "10px 12px", fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button
              type="button"
              style={{ ...primaryButtonStyle, flex: 1, padding: "11px 18px", fontSize: 14 }}
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Отправляем…" : isEvent ? "Подтвердить регистрацию →" : "Отправить отклик →"}
            </button>
            <button type="button" style={{ ...buttonStyle, padding: "11px 16px" }} onClick={onClose}>
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
