import { C, ICONS } from "../constants";
import { Icon } from "./UI";

export function CompletionModal({ task, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      />

      {/* Card */}
      <div style={{
        position: "relative", background: C.w, borderRadius: 16,
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)", width: "92%", maxWidth: 380,
        padding: 28, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
      }}>
        <button
          onClick={onCancel}
          style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", color: C.g4 }}
        >
          <Icon d={ICONS.x} size={17} />
        </button>

        <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.em5, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Icon d={ICONS.checkCircle} size={40} color={C.em} />
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.g9, marginBottom: 6 }}>Mark as completed?</h2>
        <p style={{ color: C.g5, fontSize: 13, marginBottom: 3 }}>Are you sure you want to mark</p>
        <p style={{ color: C.g8, fontWeight: 600, fontSize: 13, marginBottom: 3 }}>"{task.title}"</p>
        <p style={{ color: C.g5, fontSize: 13, marginBottom: 24 }}>as completed? This cannot be undone.</p>

        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1px solid ${C.g2}`, background: C.w, color: C.g6, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: C.em, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            Yes, complete
          </button>
        </div>
      </div>
    </div>
  );
}
