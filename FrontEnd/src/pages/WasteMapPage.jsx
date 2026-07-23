import { useState, useEffect, useRef } from "react";
import { Search, Filter, MapPin } from "lucide-react";
import { LOCATIONS } from "../cleanup-team/data/tasks";
import { getVotingReports, getVoteCount, subscribe } from "../data/votingStore";
import { cn } from "../utils";

const SEVERITY_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#22C55E" };
// District filter — built from the same canonical LOCATIONS list the
// Cleanup Team app and the voting store use, so the names always match
// what a report is actually tagged with.
const DISTRICTS = ["All", ...Object.values(LOCATIONS).map((l) => l.name)];

// Voting reports only carry a district, not an exact lat/lng — scatter each
// report a small, deterministic distance from its district's center so
// multiple pins in the same district don't stack exactly on top of each
// other (deterministic = same report always lands in the same spot).
function hashOffset(id) {
  let h = 0;
  for (let i = 0; i < String(id).length; i++) h = (h * 31 + String(id).charCodeAt(i)) >>> 0;
  const angle = (h % 360) * (Math.PI / 180);
  const dist = 0.003 + ((h >> 8) % 100) / 100 * 0.004; // ~300m-800m from center
  return { dLat: Math.sin(angle) * dist, dLng: Math.cos(angle) * dist };
}

// A report that's been admin-prioritized is always urgent. Otherwise, let
// the actual vote count decide the pin color — this is the direct "citizens
// voted this high" signal the map should reflect, not just admin/trend state.
function severityOf(report) {
  if (report.admin_prioritized) return "high";
  const votes = getVoteCount(report);
  if (votes >= 20) return "high";
  if (votes >= 10) return "medium";
  return "low";
}

// Build map markers straight from the live voting reports, so any report
// citizens are voting on is guaranteed to show up on the map.
function buildMarkersFromVotingReports(reports) {
  return reports
    .map((r) => {
      const loc = Object.values(LOCATIONS).find((l) => l.name === r.location);
      if (!loc) return null; // report's district doesn't match a known location — skip rather than mis-plot it
      const { dLat, dLng } = hashOffset(r.id);
      return {
        id: r.id,
        lat: loc.lat + dLat,
        lng: loc.lng + dLng,
        type: r.category,
        title: r.title,
        location: r.location,
        severity: severityOf(r),
        date: r.created_at,
        votes: getVoteCount(r),
      };
    })
    .filter(Boolean);
}

// Inline SVG (matches lucide's MapPin / Calendar glyphs) used inside Leaflet
// popups, which render raw HTML rather than React — real icons instead of emoji.
const SVG_MAP_PIN = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
const SVG_CALENDAR = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>`;
const SVG_THUMBS_UP = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>`;

function markerIconHtml(color, votes) {
  return `
    <div style="position: relative; width: 40px; height: 46px;">
      <div style="
        position: absolute; top: 0; left: 50%; transform: translateX(-50%);
        min-width: 20px; height: 20px; padding: 0 4px; box-sizing: border-box;
        background: white;
        border: 2px solid ${color};
        border-radius: 9999px;
        display: flex; align-items: center; justify-content: center;
        font-family: Inter, sans-serif; font-size: 11px; font-weight: 800; color: ${color};
        box-shadow: 0 1px 4px rgba(0,0,0,0.25);
        z-index: 2;
      ">${votes}</div>
      <div style="
        position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
        width: 32px; height: 32px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
      ">
        <div style="width: 9px; height: 9px; background: white; border-radius: 50%;"></div>
      </div>
    </div>`;
}

function markerPopupHtml(m, color) {
  return `
    <div style="font-family: Inter, sans-serif; min-width: 180px;">
      <div style="font-weight: 700; color: #16A34A; font-size: 13px; margin-bottom: 2px;">${m.type}</div>
      <div style="font-size: 12px; color: #374151; margin-bottom: 4px;">${m.title}</div>
      <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">${SVG_MAP_PIN} ${m.location}</div>
      <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">${SVG_CALENDAR} ${m.date}</div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="
          display: inline-block;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          background: ${color}22;
          color: ${color};
        ">${m.severity.toUpperCase()}</span>
        <span style="display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; color: #6b7280;">
          ${SVG_THUMBS_UP} ${m.votes}
        </span>
      </div>
    </div>
  `;
}

export default function WasteMapPage({ initialDistrict, onDistrictConsumed }) {
  const [filter, setFilter] = useState(initialDistrict || "All");
  const [search, setSearch] = useState("");
  // All open reports currently up for community voting — the same data set
  // the Dashboard's vote cards, the Admin "Voting" view, and the Cleanup
  // Team's priority spot all read from, so a report voted on anywhere shows
  // up here too.
  const [markers, setMarkers] = useState(() => buildMarkersFromVotingReports(getVotingReports({})));
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);

  // Re-derive markers whenever a vote is cast, a report is prioritized, or
  // it's marked resolved (resolved reports drop out automatically).
  useEffect(() => {
    const refresh = () => setMarkers(buildMarkersFromVotingReports(getVotingReports({})));
    refresh();
    return subscribe(refresh);
  }, []);

  // If we arrive here from a "show real location" click on the Dashboard,
  // apply that district as the active filter.
  useEffect(() => {
    if (initialDistrict) {
      setFilter(initialDistrict);
      onDistrictConsumed?.();
    }
  }, [initialDistrict]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = markers.filter((m) => {
    if (filter !== "All" && m.location !== filter) return false;
    if (search && !m.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Initialize Leaflet map once
  useEffect(() => {
    if (leafletMapRef.current || !mapRef.current) return;

    // Dynamically load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Dynamically load Leaflet JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = window.L;

      const map = L.map(mapRef.current, {
        center: [11.5564, 104.9282],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
    };
    document.head.appendChild(script);

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update markers when filter/search changes
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !window.L) return;

    const L = window.L;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add filtered markers
    filtered.forEach((m) => {
      const color = SEVERITY_COLOR[m.severity];

      const icon = L.divIcon({
        className: "",
        html: markerIconHtml(color, m.votes),
        iconSize: [40, 46],
        iconAnchor: [20, 30],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
      marker.bindPopup(markerPopupHtml(m, color));

      markersRef.current.push(marker);
    });

    // When filtered down to a single district/marker (e.g. arriving from the
    // Dashboard's "show real location" click), fly the map to it and open its popup.
    if (filter !== "All" && filtered.length > 0) {
      const target = filtered[0];
      map.flyTo([target.lat, target.lng], 15, { duration: 0.6 });
      markersRef.current[0]?.openPopup();
    }
  }, [markers, filter, search]);

  // Re-run marker update after map loads (slight delay for script load)
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.L && leafletMapRef.current) {
        clearInterval(interval);
        // Trigger re-render by toggling a dummy state update via a ref call
        const L = window.L;
        const map = leafletMapRef.current;
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
        filtered.forEach((m) => {
          const color = SEVERITY_COLOR[m.severity];
          const icon = L.divIcon({
            className: "",
            html: markerIconHtml(color, m.votes),
            iconSize: [40, 46],
            iconAnchor: [20, 30],
            popupAnchor: [0, -32],
          });
          const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
          marker.bindPopup(markerPopupHtml(m, color));
          markersRef.current.push(marker);
        });
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search location..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/40 focus:border-[#22C55E]"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {DISTRICTS.map((d) => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                filter === d ? "bg-[#22C55E] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {d !== "All" && <MapPin className="w-3 h-3" />}
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Real Leaflet Map */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div ref={mapRef} style={{ height: 500, width: "100%" }} />
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p className="text-sm font-semibold text-gray-700 mb-2">Severity Legend</p>
        <div className="flex flex-wrap gap-4">
          {[
            { level: "High", color: "#ef4444" },
            { level: "Medium", color: "#f59e0b" },
            { level: "Low", color: "#22C55E" },
          ].map((l) => (
            <div key={l.level} className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
              {l.level}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
