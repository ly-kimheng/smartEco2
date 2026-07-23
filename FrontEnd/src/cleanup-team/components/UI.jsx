import { ICONS, C, cap, statusLabel } from "../constants";

// ── SVG ICON ──
export function Icon({ d, size = 16, color = "currentColor", style }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={style}
    >
      {Array.isArray(d)
        ? d.map((path, i) => <path key={i} d={path} />)
        : <path d={d} />}
    </svg>
  );
}

// ── PRIORITY BADGE ──
export function PriorityBadge({ priority }) {
  const styles = {
    high:   { background: C.r5, color: C.r6, border: `1px solid ${C.r1}` },
    medium: { background: C.a5, color: C.a6, border: `1px solid ${C.a1}` },
    low:    { background: C.g1, color: C.g5, border: `1px solid ${C.g2}` },
  };
  return (
    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, fontWeight: 600, flexShrink: 0, ...styles[priority] }}>
      {cap(priority)}
    </span>
  );
}

// ── STATUS BADGE ──
export function StatusBadge({ status }) {
  const styles = {
    in_progress: { background: C.b5, color: C.b6, border: `1px solid ${C.b1}` },
    completed:   { background: C.em5, color: C.em7, border: `1px solid ${C.em1}` },
    assigned:    { background: C.g1, color: C.g5, border: `1px solid ${C.g2}` },
  };
  return (
    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, fontWeight: 600, flexShrink: 0, ...styles[status] }}>
      {statusLabel(status)}
    </span>
  );
}

// ── PROGRESS BAR ──
export function ProgressBar({ value, height = 8 }) {
  return (
    <div style={{ width: "100%", height, borderRadius: 999, background: C.em5 }}>
      <div style={{ height, borderRadius: 999, background: C.em, width: `${value}%`, transition: "width .4s" }} />
    </div>
  );
}
