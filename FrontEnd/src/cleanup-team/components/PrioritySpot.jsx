import { useState, useEffect } from "react";
import { C, ICONS } from "../constants";
import { Icon } from "./UI";
import {
  VOTING_DISTRICTS,
  getTopPriority,
  getDistrictPriorities,
  getVoteCount,
  getTrendScore,
  subscribe,
} from "../../data/votingStore";

// Shown at the top of the Tasks tab — the report citizens are voting for the
// most (or that Admin manually prioritized) for whichever district the crew
// has selected. With "All Districts" selected it shows one leader strip per
// district instead, so the whole crew can see where's hottest right now.
export function PrioritySpot({ district }) {
  const [, forceTick] = useState(0);
  useEffect(() => subscribe(() => forceTick((t) => t + 1)), []);

  if (district) {
    const top = getTopPriority(district);
    if (!top) return null;
    const loc = VOTING_DISTRICTS[district];
    const trend = getTrendScore(top);

    return (
      <div style={{
        margin: "10px 14px 0", padding: 12, borderRadius: 14,
        background: top.admin_prioritized ? "#fff1f2" : "#fffbeb",
        border: `1px solid ${top.admin_prioritized ? "#fecdd3" : "#fde68a"}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: top.admin_prioritized ? "#fecdd3" : "#fde68a",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon d={ICONS.trending} size={16} color={top.admin_prioritized ? "#e11d48" : "#d97706"} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: top.admin_prioritized ? "#e11d48" : "#d97706" }}>
            {top.admin_prioritized ? "Admin Priority Spot" : trend >= 3 ? "Trending Priority Spot" : "Top Voted Spot"} · {loc.name}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.g9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {top.title}
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.g6, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
          <Icon d={ICONS.checkSquare} size={12} color={C.g5} />
          {getVoteCount(top)} votes
        </div>
      </div>
    );
  }

  // All Districts: a compact strip, one card per district's current leader.
  const leaders = getDistrictPriorities();
  const entries = Object.entries(VOTING_DISTRICTS).filter(([key]) => leaders[key]);
  if (entries.length === 0) return null;

  return (
    <div style={{ margin: "10px 14px 0", display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
      {entries.map(([key, loc]) => {
        const top = leaders[key];
        const trend = getTrendScore(top);
        return (
          <div key={key} style={{
            flex: "0 0 auto", minWidth: 190, padding: 10, borderRadius: 12,
            background: C.w, border: `1px solid ${C.bd}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: loc.color }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.g7 }}>{loc.name}</span>
              {top.admin_prioritized && <Icon d={ICONS.trending} size={11} color="#e11d48" />}
              {!top.admin_prioritized && trend >= 3 && <Icon d={ICONS.trending} size={11} color="#d97706" />}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.g8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {top.title}
            </div>
            <div style={{ fontSize: 10, color: C.g4, marginTop: 2 }}>{getVoteCount(top)} votes</div>
          </div>
        );
      })}
    </div>
  );
}
