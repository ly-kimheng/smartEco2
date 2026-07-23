import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, useMap } from "react-leaflet";
// The cleanup-team shell renders standalone (it never mounts the citizen
// WasteMapPage), so Leaflet's own stylesheet has to be pulled in here —
// without it, panes/markers/popups have no positioning rules at all.
import "leaflet/dist/leaflet.css";
import { C } from "../constants";
import { LOCATIONS, PHNOM_PENH_CENTER } from "../data/tasks";
import { StatusBadge } from "./UI";

const STATUS_COLOR = { in_progress: "#3b82f6", assigned: "#f59e0b", completed: "#10b981" };

// Tasks only carry a district (locKey), not an exact street address — scatter
// each task a small, deterministic distance from its district's center so
// multiple tasks in the same district render as separate pins instead of
// stacking into one. Deterministic = the same task always lands in the same
// spot, so pins don't jump around every time the list refreshes.
function hashOffset(id) {
  let h = 0;
  const s = String(id);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const angle = (h % 360) * (Math.PI / 180);
  const dist = 0.0015 + ((h >> 8) % 100) / 100 * 0.0025; // ~150m-400m from center
  return { dLat: Math.sin(angle) * dist, dLng: Math.cos(angle) * dist };
}

// Recenters/zooms the map whenever the selected district changes
function FlyToDistrict({ district }) {
  const map = useMap();
  useEffect(() => {
    if (district && LOCATIONS[district]) {
      const loc = LOCATIONS[district];
      map.flyTo([loc.lat, loc.lng], 15, { duration: 0.6 });
    } else {
      map.flyTo([PHNOM_PENH_CENTER.lat, PHNOM_PENH_CENTER.lng], 12, { duration: 0.6 });
    }
  }, [district]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Turn each task into its own map point. Tasks whose location didn't match
// one of the known districts (locKey is null) still get plotted — near the
// city center, scattered by their raw location text — instead of silently
// disappearing from the map.
function buildTaskPoints(tasks) {
  return tasks.map(t => {
    const base = t.locKey && LOCATIONS[t.locKey] ? LOCATIONS[t.locKey] : PHNOM_PENH_CENTER;
    const { dLat, dLng } = hashOffset(t.id);
    return {
      task: t,
      lat: base.lat + dLat,
      lng: base.lng + dLng,
      color: t.locKey && LOCATIONS[t.locKey] ? LOCATIONS[t.locKey].color : "#64748b",
      matched: Boolean(t.locKey && LOCATIONS[t.locKey]),
    };
  });
}

export function GpsMap({ tasks, district, onTaskSelect }) {
  // When a district is selected, only show tasks that actually belong to it.
  // "All districts" also shows tasks whose location couldn't be matched to a
  // known district, so nothing assigned ever silently vanishes from the map.
  const visibleTasks = district ? tasks.filter(t => t.locKey === district) : tasks;
  const points = buildTaskPoints(visibleTasks);

  return (
    <MapContainer
      center={[PHNOM_PENH_CENTER.lat, PHNOM_PENH_CENTER.lng]}
      zoom={12}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToDistrict district={district} />

      {points.map(p => {
        const ringColor = STATUS_COLOR[p.task.status] || "#64748b";
        return (
          <CircleMarker
            key={p.task.id}
            center={[p.lat, p.lng]}
            radius={10}
            pathOptions={{ color: ringColor, weight: 3, fillColor: p.color, fillOpacity: 0.85 }}
            eventHandlers={{ click: () => onTaskSelect(p.task) }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              <span style={{ fontWeight: 700, fontSize: 11 }}>{p.task.title}</span>
            </Tooltip>
            <Popup>
              <div style={{ minWidth: 180, fontFamily: "Inter,sans-serif" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.g9, marginBottom: 4 }}>{p.task.title}</div>
                <div style={{ fontSize: 11, color: C.g5, marginBottom: 8 }}>
                  {p.matched ? p.task.loc : `${p.task.loc} (location not on file — showing near city center)`}
                </div>
                <div
                  onClick={() => onTaskSelect(p.task)}
                  style={{ cursor: "pointer" }}
                >
                  <StatusBadge status={p.task.status} />
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
