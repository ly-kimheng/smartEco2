import { useState } from "react";
import { C, ICONS, cap } from "../constants";
import { Icon, StatusBadge, ProgressBar } from "../components/UI";
import { LOCATIONS } from "../data/tasks";

// Opens Google Maps turn-by-turn directions to the task's location. Uses the
// precise lat/lng we already have for known districts, and falls back to a
// text search (place name + city) for anything that didn't match a known key.
function directionsUrl(task) {
  const loc = task.locKey ? LOCATIONS[task.locKey] : null;
  const destination = loc ? `${loc.lat},${loc.lng}` : `${task.loc}, Phnom Penh, Cambodia`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export default function TaskDetailPage({ task, onBack, onStartTask, onUpdateProgress, onViewMap }) {
  const [checked, setChecked] = useState(task.reqs.map(() => false));
  const toggle = i => setChecked(prev => prev.map((v, idx) => idx === i ? !v : v));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Sub-header */}
      <div style={{ padding: "0 16px", height: 44, display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.bd}`, flexShrink: 0, background: C.w }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.g5, padding: 6, borderRadius: 7 }}>
          <Icon d={ICONS.arrowLeft} size={16} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 14, color: C.g9 }}>Task details</span>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Hero image(s) — before photo always, after photo too once uploaded */}
        {task.afterImg ? (
          <div style={{ display: "flex" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <img src={task.img} alt={`${task.title} — before`} style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
              <span style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>Before</span>
            </div>
            <div style={{ position: "relative", flex: 1 }}>
              <img src={task.afterImg} alt={`${task.title} — after`} style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
              <span style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>After</span>
            </div>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <img src={task.img} alt={task.title} style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.35),transparent)" }} />
          </div>
        )}

        {/* Info section */}
        <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.bd}` }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
            <h2 style={{ fontWeight: 700, color: C.g9, fontSize: 15, lineHeight: 1.4 }}>{task.title}</h2>
            <StatusBadge status={task.status} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.g5, marginBottom: 5 }}>
            <Icon d={ICONS.mapPin} size={13} color={C.em} /> {task.loc}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.g5, marginBottom: 5 }}>
            <Icon d={ICONS.calendar} size={13} color={C.em} /> {task.date}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
            <Icon d={ICONS.alertCircle} size={13} color="#f59e0b" />
            <span style={{ fontWeight: 600, color: task.priority === "high" ? C.r6 : task.priority === "medium" ? C.a6 : C.g5 }}>
              {cap(task.priority)} priority
            </span>
          </div>
        </div>

        {/* Description */}
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.bd}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.g5, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 7 }}>Description</div>
          <p style={{ fontSize: 13, color: C.g7, lineHeight: 1.6 }}>{task.desc}</p>
        </div>

        {/* Requirements */}
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.bd}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.g5, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Requirements</div>
          {task.reqs.map((r, i) => (
            <div key={i} onClick={() => toggle(i)} style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", marginBottom: 9 }}>
              <Icon d={checked[i] ? ICONS.checkSquare : ICONS.square} size={15} color={checked[i] ? C.em : C.g3} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: checked[i] ? C.g4 : C.g7, textDecoration: checked[i] ? "line-through" : "none", lineHeight: 1.45 }}>
                {r}
              </span>
            </div>
          ))}
        </div>

        {/* Progress (not for assigned) */}
        {task.status !== "assigned" && (
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.bd}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: C.g5, textTransform: "uppercase", letterSpacing: ".06em" }}>Progress</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.em6 }}>{task.progress}%</span>
            </div>
            <ProgressBar value={task.progress} height={9} />
          </div>
        )}

        {/* View on map / get directions */}
        <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            onClick={() => onViewMap(task.locKey)}
            style={{ background: C.em5, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          >
            <Icon d={ICONS.mapPin} size={16} color={C.em} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.em7 }}>View location on map</div>
              <div style={{ fontSize: 11, color: C.em6 }}>{task.loc} — Phnom Penh</div>
            </div>
            <Icon d={ICONS.chevronRight} size={14} color={C.em6} />
          </div>

          <a
            href={directionsUrl(task)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: C.em, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textDecoration: "none" }}
          >
            <Icon d={ICONS.navigation} size={16} color="#fff" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Get directions</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)" }}>Open turn-by-turn navigation in Google Maps</div>
            </div>
            <Icon d={ICONS.chevronRight} size={14} color="#fff" />
          </a>
        </div>
      </div>

      {/* CTA */}
      <div style={{ borderTop: `1px solid ${C.bd}`, padding: 14, background: C.w, flexShrink: 0 }}>
        {task.status === "assigned" && (
          <button
            onClick={() => onStartTask(task.id)}
            style={{ width: "100%", padding: "13px", borderRadius: 11, background: C.em, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
          >
            <Icon d={ICONS.play} size={14} color="#fff" /> Start task
          </button>
        )}
        {task.status === "in_progress" && (
          <button
            onClick={() => onUpdateProgress(task)}
            style={{ width: "100%", padding: "13px", borderRadius: 11, background: C.em, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
          >
            <Icon d={ICONS.trending} size={14} color="#fff" /> Update progress
          </button>
        )}
        {task.status === "completed" && (
          <div style={{ width: "100%", padding: "13px", borderRadius: 11, background: C.em5, color: C.em7, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, border: `1px solid ${C.em1}` }}>
            <Icon d={ICONS.checkCircle} size={15} color={C.em7} /> Task completed
          </div>
        )}
      </div>
    </div>
  );
}
