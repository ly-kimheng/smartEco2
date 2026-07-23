import { C, ICONS } from "../constants";
import { Icon } from "../components/UI";
import { TaskCard } from "../components/TaskCard";
import { LOCATIONS } from "../data/tasks";

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "assigned", label: "Assigned" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

function FilterTabs({ filter, tasks, onFilter, district }) {
  return (
    <div style={{ flexShrink: 0, background: C.w, borderBottom: `1px solid ${C.bd}`, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {FILTER_TABS.map(tab => {
          const on = filter === tab.id;
          const count = tab.id !== "all" ? tasks.filter(t => t.status === tab.id).length : null;
          return (
            <button
              key={tab.id}
              onClick={() => onFilter(tab.id)}
              style={{
                padding: "9px 18px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer",
                border: on ? "none" : `1px solid ${C.bd}`, background: on ? C.em : C.w, color: on ? "#fff" : C.g6,
                display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
                boxShadow: on ? "0 2px 8px rgba(16,185,129,0.28)" : "none",
              }}
            >
              {tab.label}
              {count !== null && (
                <span style={{
                  fontSize: 12, fontWeight: 700, borderRadius: 999, minWidth: 20, height: 20, padding: "0 6px",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: on ? "rgba(255,255,255,0.28)" : C.g1, color: on ? "#fff" : C.g6,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {district && (
        <div style={{ fontSize: 12, color: C.g5, display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: LOCATIONS[district].color }} />
          Filtered to <strong style={{ color: C.g7 }}>{LOCATIONS[district].name}</strong>
        </div>
      )}
    </div>
  );
}

const SECTION_TITLES = {
  all: "All Tasks",
  assigned: "My Assigned Task",
  in_progress: "Tasks In Progress",
  completed: "Completed Tasks",
};

export default function TasksPage({ tasks, filter, onFilter, district, onSelect, onStart }) {
  const districtTasks = tasks.filter(t => district === null || t.locKey === district);
  const filtered = districtTasks.filter(t => filter === "all" || t.status === filter);

  return (
    <>
      <FilterTabs filter={filter} tasks={districtTasks} onFilter={onFilter} district={district} />

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.g9, margin: 0 }}>
              {SECTION_TITLES[filter] || "Tasks"}
            </h2>
            <div style={{ width: 34, height: 4, borderRadius: 999, background: C.em, marginTop: 8 }} />
          </div>

          {filtered.length === 0
            ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 160, color: C.g4 }}>
                <Icon d={ICONS.clipboardList} size={36} color={C.g3} />
                <p style={{ fontSize: 13, fontWeight: 500, marginTop: 8 }}>No tasks match these filters</p>
              </div>
            )
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {filtered.map(t => (
                  <TaskCard key={t.id} task={t} onSelect={() => onSelect(t)} onStart={onStart} />
                ))}
              </div>
            )
          }
        </div>
      </div>
    </>
  );
}
