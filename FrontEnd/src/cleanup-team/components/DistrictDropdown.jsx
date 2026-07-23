import { useState, useRef, useEffect } from "react";
import { C, ICONS } from "../constants";
import { LOCATIONS } from "../data/tasks";
import { Icon } from "./UI";

export function DistrictDropdown({ district, tasks, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const counts = {};
  tasks.forEach(t => { if (t.locKey) counts[t.locKey] = (counts[t.locKey] || 0) + 1; });

  const current = district ? LOCATIONS[district] : null;

  function select(key) {
    onChange(key);
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "7px 12px", borderRadius: 9, fontSize: 13, fontWeight: 600,
          border: `1px solid ${current ? "transparent" : C.g2}`,
          background: current ? current.color : C.w,
          color: current ? "#fff" : C.g6,
          cursor: "pointer", whiteSpace: "nowrap",
        }}
      >
        {current
          ? <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", flexShrink: 0 }} />
          : <Icon d={ICONS.map} size={14} color={C.g5} />
        }
        {current ? current.name : "All Districts"}
        <Icon d={ICONS.chevronDown} size={13} color={current ? "#fff" : C.g4} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 60,
          width: 240, background: C.w, borderRadius: 12, border: `1px solid ${C.bd}`,
          boxShadow: "0 12px 32px rgba(0,0,0,0.14)", overflow: "hidden",
          animation: "districtSlideDown .15s ease-out",
        }}>
          <style>{`@keyframes districtSlideDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>

          <button
            onClick={() => select(null)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", border: "none", background: district === null ? C.em5 : "transparent",
              cursor: "pointer", textAlign: "left",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: district === null ? C.em7 : C.g7 }}>
              <Icon d={ICONS.map} size={13} color={district === null ? C.em7 : C.g5} />
              All Districts
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: district === null ? C.em7 : C.g4 }}>{tasks.length}</span>
          </button>

          <div style={{ height: 1, background: C.bd, margin: "2px 0" }} />

          {Object.entries(LOCATIONS).map(([key, loc]) => {
            const on = district === key;
            const count = counts[key] || 0;
            return (
              <button
                key={key}
                onClick={() => select(key)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", border: "none", background: on ? C.g0 : "transparent",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: on ? 700 : 500, color: C.g7 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: loc.color, flexShrink: 0 }} />
                  {loc.name}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.g4, background: C.g1, borderRadius: 999, padding: "1px 7px" }}>{count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
