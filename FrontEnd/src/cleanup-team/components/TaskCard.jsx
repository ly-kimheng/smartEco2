import { C, ICONS } from "../constants";
import { Icon, PriorityBadge, StatusBadge, ProgressBar } from "./UI";

export function TaskCard({ task, onSelect, onStart }) {
  return (
    <div
      onClick={onSelect}
      style={{
        position: "relative", display: "flex", gap: 22, background: C.w, borderRadius: 18,
        border: `1px solid ${C.bd}`, padding: 20, cursor: "pointer",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "box-shadow .15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
    >
      {/* Priority badge — pinned to the top-right corner, above the actions column */}
      <div style={{ position: "absolute", top: 12, right: 20 }}>
        <PriorityBadge priority={task.priority} />
      </div>

      <img
        src={task.img} alt={task.title}
        style={{ width: 150, height: 130, borderRadius: 14, objectFit: "cover", flexShrink: 0 }}
      />

      {/* Middle: title / meta / status */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8, paddingRight: 70 }}>
        <span style={{ fontWeight: 800, fontSize: 19, color: C.g9, letterSpacing: "-.01em" }}>
          {task.title}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.g5 }}>
          <Icon d={ICONS.mapPin} size={14} color={C.em} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.loc}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.g5 }}>
          <Icon d={ICONS.calendar} size={14} color={C.em} />
          {task.date}
        </div>

        <div style={{ marginTop: 2, display: "flex", alignItems: "center", gap: 10 }}>
          <StatusBadge status={task.status} />

          {task.status === "in_progress" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, maxWidth: 140 }}>
              <ProgressBar value={task.progress} height={5} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.em6, flexShrink: 0 }}>{task.progress}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: stacked actions — paddingTop reserves space so the priority
          badge (pinned top-right of the card) never sits over these buttons */}
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 8, minWidth: 150, paddingTop: 40 }}>
        <button
          onClick={e => { e.stopPropagation(); onSelect(); }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: C.w, color: C.em6, border: `1.5px solid ${C.em}`, cursor: "pointer",
          }}
        >
          <Icon d={ICONS.eye} size={14} color={C.em6} /> View Details
        </button>

        {task.status === "assigned" && (
          <button
            onClick={e => { e.stopPropagation(); onStart(task.id); }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: C.em, color: "#fff", border: "none", cursor: "pointer",
              boxShadow: "0 2px 8px rgba(16,185,129,0.28)",
            }}
          >
            <Icon d={ICONS.play} size={13} color="#fff" /> Start Task
          </button>
        )}

        {task.status === "completed" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 16px", fontSize: 13, color: C.em7, fontWeight: 700 }}>
            <Icon d={ICONS.checkCircle} size={15} color={C.em7} /> Done
          </div>
        )}
      </div>
    </div>
  );
}
