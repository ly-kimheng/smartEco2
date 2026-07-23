import { C, ICONS } from "../constants";
import { Icon, ProgressBar } from "../components/UI";

export default function TaskCompletedPage({ task, onBack }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px 40px", background: C.bg }}>
      {/* Check icon */}
      <div style={{ width: 84, height: 84, borderRadius: "50%", background: C.em5, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, boxShadow: "0 4px 20px rgba(16,185,129,0.15)" }}>
        <Icon d={ICONS.checkCircle} size={48} color={C.em} />
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 700, color: C.g9, marginBottom: 8 }}>Task completed!</h1>
      <p style={{ color: C.g5, fontSize: 14, textAlign: "center", maxWidth: 320, marginBottom: 28 }}>
        Great work. Your contribution helps keep the community clean and green.
      </p>

      {/* Task summary card */}
      <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 14, border: `1px solid ${C.bd}`, padding: 18, marginBottom: 20 }}>
        <img src={task.afterImg || task.img} alt={task.title} style={{ width: "100%", height: 116, objectFit: "cover", borderRadius: 10, marginBottom: 14, display: "block" }} />
        <h3 style={{ fontWeight: 700, color: C.g9, fontSize: 15, marginBottom: 8 }}>{task.title}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.g5, marginBottom: 4 }}>
          <Icon d={ICONS.mapPin} size={13} color={C.em} /> {task.loc}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.g5, marginBottom: 14 }}>
          <Icon d={ICONS.calendar} size={13} color={C.em} /> Completed on {task.date}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.em7 }}>Progress</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.em7 }}>100%</span>
        </div>
        <ProgressBar value={100} height={9} />
      </div>

      <button
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 7, padding: "12px 28px", borderRadius: 11, background: C.em, color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer" }}
      >
        <Icon d={ICONS.arrowLeft} size={15} color="#fff" /> Back to tasks
      </button>
    </div>
  );
}
