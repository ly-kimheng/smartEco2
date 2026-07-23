import { C, NAV_ITEMS } from "../constants";
import { Icon } from "./UI";

// ── BOTTOM NAV — mobile only (hidden on desktop via CSS, since nav lives in the header there) ──
export function BottomNav({ active, onNav }) {
  return (
    <nav className="bottom-nav-mobile" style={{
      flexShrink: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)",
      borderTop: `1px solid ${C.bd}`, boxShadow: "0 -2px 12px rgba(0,0,0,0.05)", zIndex: 30,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", padding: "6px 10px" }}>
        {NAV_ITEMS.map(it => {
          const on = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onNav(it.id)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "5px 18px", borderRadius: 10, background: "none", border: "none", cursor: "pointer", color: on ? C.em : C.g4 }}
            >
              <div style={{ padding: 5, borderRadius: 10, background: on ? C.em5 : "transparent" }}>
                <Icon d={it.icon} size={19} color={on ? C.em : C.g4} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600 }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
