import { C, ICONS } from "../constants";
import { LOCATIONS } from "../data/tasks";
import { Icon } from "../components/UI";
import { GpsMap } from "../components/GpsMap";

export default function MapPage({ tasks, district, onTaskSelect }) {
  const label = district ? LOCATIONS[district].name : "all districts";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Status strip */}
      <div style={{ flexShrink: 0, background: "#fff", borderBottom: `1px solid ${C.bd}`, padding: "8px 16px", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.g5 }}>
        <Icon d={ICONS.map} size={13} color={C.em} />
        Showing cleanup zones in <strong style={{ color: C.g8 }}>{label}</strong> &middot; Phnom Penh, Cambodia
      </div>

      {/* Legend */}
      {/*
        zIndex: 0 here (not just position:relative) is what matters — it gives
        this wrapper its own stacking context, so Leaflet's internal panes
        (which use z-index up to ~700 internally) stay contained inside the
        map instead of climbing above the header's notification/account
        dropdowns, which used to render *below* the map.
      */}
      <div style={{ position: "relative", flex: 1, zIndex: 0 }}>
        <GpsMap tasks={tasks} district={district} onTaskSelect={onTaskSelect} />

        <div style={{ position: "absolute", bottom: 12, left: 12, zIndex: 500, background: "rgba(255,255,255,0.95)", borderRadius: 10, border: `1px solid ${C.bd}`, padding: "10px 14px", fontSize: 11 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.g7, marginBottom: 5 }}>Task status</div>
          {[["#3b82f6", "In progress"], ["#f59e0b", "Assigned"], ["#10b981", "Completed"]].map(([col, lbl]) => (
            <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, color: C.g7 }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: col, flexShrink: 0 }} />
              {lbl}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
