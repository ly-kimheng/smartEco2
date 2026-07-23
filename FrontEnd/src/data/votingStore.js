// src/data/votingStore.js
//
// Shared MOCK "backend" for the community voting feature.
// Persists to localStorage so the Citizen Dashboard, Admin "Voting" view,
// and the Cleanup Team app all read/write the exact same data set — voting
// as a citizen, prioritizing as an admin, and viewing the priority spot as
// a cleanup crew all stay in sync during a demo, without needing the real
// backend running.
//
// Swap this out for real `api.js` calls later — every function here mirrors
// what the real votable-reports/vote endpoints already do (see BackEnd
// models/Report.js) so the switch is a drop-in.

import { LOCATIONS } from "../cleanup-team/data/tasks";

// Districts are the single canonical list — reused by every screen so a
// district picked on the Dashboard is the exact same key the Cleanup Team
// app already filters tasks by.
export const VOTING_DISTRICTS = LOCATIONS;

const STORAGE_KEY = "smarteco_mock_voting_reports_v1";
const VOTER_KEY = "smarteco_mock_voter_id";

// How recent a vote must be to count toward "trending" (rising fast).
const TREND_WINDOW_MS = 45 * 60 * 1000; // 45 minutes

// ── Voter identity (per-browser, so guests still get a stable id) ─────────
export function getVoterId(user) {
  if (user?.email) return `user:${user.email}`;
  let id = localStorage.getItem(VOTER_KEY);
  if (!id) {
    id = `guest:${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(VOTER_KEY, id);
  }
  return id;
}

// ── Seed generation ─────────────────────────────────────────────────────
// Builds a vote_log of past-vote timestamps (ms epoch). `burst` votes land
// inside the trending window (so that report reads as "rising fast" right
// when the demo data is first generated); the rest are spread further back
// so total vote_count still looks realistic.
function genVoteLog(total, burst = 0, spanHours = 72) {
  const now = Date.now();
  const log = [];
  for (let i = 0; i < burst; i++) {
    log.push(now - Math.floor(Math.random() * TREND_WINDOW_MS * 0.8));
  }
  for (let i = 0; i < total - burst; i++) {
    log.push(now - (TREND_WINDOW_MS + Math.floor(Math.random() * spanHours * 60 * 60 * 1000)));
  }
  return log.sort((a, b) => a - b);
}

function daysAgo(n) {
  const d = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

// The actual editable seed content — change titles/descriptions/image_url/
// votes here. Kept as a module-level constant (rather than built fresh
// inside buildSeed()) so seedSignature() below can hash it and detect when
// you've edited it, even though the live data is cached in localStorage.
const SEED_RAW = [
  {
    id: "vote-101", title: "Illegal Dumping — Riverside Path", district: "russeikeo",
    category: "Illegal Dumping", location: LOCATIONS.russeikeo.name,
    description: "Large pile of household waste dumped near the roadside, blocking part of the walking path.",
    image_url: "https://bol-community.org/wp-content/uploads/2022/06/electronic-recycling-scaled.jpeg",
    createdDaysAgo: 3, votes: 34, burst: 9, admin_prioritized: false,
  },
  {
    id: "vote-102", title: "Overflowing Bin — Central Market", district: "prekleap",
    category: "Overflowing Bin", location: LOCATIONS.prekleap.name,
    description: "Public bin near the market has been overflowing for several days, attracting pests.",
    image_url: "https://cambojanews.com/wp-content/uploads/2021/09/A-woman-drops-garbage-on-a-trash-pile-on-a-street-768x515.jpg",
    createdDaysAgo: 4, votes: 21, burst: 2, admin_prioritized: true,
  },
  {
    id: "vote-103", title: "Litter Along Riverside Walk", district: "chroychongva",
    category: "Litter", location: LOCATIONS.chroychongva.name,
    description: "Scattered plastic bottles and food packaging along the riverside walking area.",
    image_url: "https://thumbs.dreamstime.com/b/food-waste-plastic-waste-market-city-centre-battambang-cambodia-cambodia-battambang-november-cambodia-157693651.jpg",
    createdDaysAgo: 2, votes: 12, burst: 1, admin_prioritized: false,
  },
  {
    id: "vote-104", title: "Construction Debris Left on Sidewalk", district: "boeungkengkang",
    category: "Construction Waste", location: LOCATIONS.boeungkengkang.name,
    description: "Leftover bricks, wood, and cement bags block half the sidewalk near the school crossing.",
    image_url: "https://images.indianexpress.com/2019/04/cambodia-1-1.jpg",
    createdDaysAgo: 1, votes: 18, burst: 10, admin_prioritized: false,
  },
  {
    id: "vote-105", title: "Hazardous Waste Spill Near Canal", district: "chbaompov",
    category: "Hazardous Waste", location: LOCATIONS.chbaompov.name,
    description: "Unknown chemical drums leaking near the canal bank — residents worried about runoff.",
    image_url: "https://i.guim.co.uk/img/media/198662c46b4b3c576c37a093eb0e2009a292762d/0_0_4744_3163/master/4744.jpg?w=1300&q=55&auto=format&usm=12&fit=max&s=e77fdccefd2bb60e0d4cd014efb0ae7e",
    createdDaysAgo: 5, votes: 27, burst: 3, admin_prioritized: false,
  },
  {
    id: "vote-106", title: "Overflowing Bins — Back Alley", district: "russeikeo",
    category: "Overflowing Bin", location: LOCATIONS.russeikeo.name,
    description: "Three bins behind the row of shops haven't been collected in over a week.",
    image_url: "https://tse1.mm.bing.net/th/id/OIP.49A6Zj2LY8X7AGuudBeAEQHaEp?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
    createdDaysAgo: 6, votes: 9, burst: 0, admin_prioritized: false,
  },
  {
    id: "vote-107", title: "Street Litter Near Bus Stop", district: "prekleap",
    category: "Litter", location: LOCATIONS.prekleap.name,
    description: "Food wrappers and cups pile up daily around the bus stop bench.",
    image_url: "https://tse3.mm.bing.net/th/id/OIP.ZXc6ChH1p8OMdQLWmKniHQHaEq?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
    createdDaysAgo: 2, votes: 6, burst: 0, admin_prioritized: false,
  },
  {
    id: "vote-108", title: "Blocked Storm Drain", district: "chroychongva",
    category: "Drainage", location: LOCATIONS.chroychongva.name,
    description: "Leaves and plastic waste are blocking the drain — flooding risk if rain picks up.",
    image_url: "https://tse3.mm.bing.net/th/id/OIP.4ycMcOiY_v0HE08uoJsxPQHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
    createdDaysAgo: 0, votes: 15, burst: 13, admin_prioritized: false,
  },
  {
    id: "vote-109", title: "Dumped Furniture on Empty Lot", district: "chbaompov",
    category: "Illegal Dumping", location: LOCATIONS.chbaompov.name,
    description: "Old mattresses and a broken sofa dumped on the vacant lot behind the pagoda.",
    image_url: "https://c8.alamy.com/comp/DD0ARK/a-garbage-dump-on-the-outskirts-of-the-city-phnom-penh-cambodia-DD0ARK.jpg",
    createdDaysAgo: 7, votes: 8, burst: 0, admin_prioritized: false,
  },
];

// Cheap fingerprint of the editable seed content (id + image_url is enough —
// that's the field people actually edit). Stored alongside the cached
// reports so load() can tell "you edited SEED_RAW" apart from "there's
// just live vote data sitting in localStorage" and reseed automatically
// instead of silently serving a stale cached image.
function seedSignature() {
  return SEED_RAW.map((r) => `${r.id}:${r.image_url}`).join("|");
}

function buildSeed() {
  return SEED_RAW.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    district: r.district,
    location: r.location,
    category: r.category,
    image_url: r.image_url,
    created_at: daysAgo(r.createdDaysAgo),
    status: "Pending",
    admin_prioritized: r.admin_prioritized,
    voted_by: [],
    vote_log: genVoteLog(r.votes, r.burst),
  }));
}

// ── Persistence ─────────────────────────────────────────────────────────
function persist(reports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ signature: seedSignature(), reports }));
  // Lets other components mounted in the same tab react immediately
  // (localStorage's native "storage" event only fires for *other* tabs).
  window.dispatchEvent(new CustomEvent("smarteco:voting-updated"));
  return reports;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Old cache format was a bare array with no signature — treat as stale.
      const cachedSignature = Array.isArray(parsed) ? null : parsed.signature;
      if (cachedSignature === seedSignature()) {
        return Array.isArray(parsed) ? parsed : parsed.reports;
      }
      // SEED_RAW was edited (e.g. an image_url changed) since this browser
      // last cached it — reseed so the new content actually shows up,
      // instead of silently serving whatever was cached before the edit.
    }
  } catch {
    // fall through to reseed
  }
  const seeded = buildSeed();
  persist(seeded);
  return seeded;
}

export function subscribe(callback) {
  const handler = () => callback(load());
  window.addEventListener("smarteco:voting-updated", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("smarteco:voting-updated", handler);
    window.removeEventListener("storage", handler);
  };
}

export function resetVotingDemoData() {
  const seeded = buildSeed();
  persist(seeded);
  return seeded;
}

// ── Derived stats ───────────────────────────────────────────────────────
export function getVoteCount(report) {
  return report.vote_log.length;
}

// "Trending" = how many votes landed in the last TREND_WINDOW_MS — this is
// what makes a report jump to the top of the Cleanup Team's priority spot
// even if its *total* vote count is lower than an older report's.
export function getTrendScore(report, now = Date.now()) {
  return report.vote_log.filter((ts) => now - ts <= TREND_WINDOW_MS).length;
}

export function hasUserVoted(report, voterId) {
  return report.voted_by.includes(voterId);
}

// Ranking used everywhere reports are listed for voting: admin-prioritized
// first, then whichever report is rising fastest right now, then total votes.
export function rankReports(reports, now = Date.now()) {
  return [...reports].sort((a, b) => {
    if (a.admin_prioritized !== b.admin_prioritized) return a.admin_prioritized ? -1 : 1;
    const trendDiff = getTrendScore(b, now) - getTrendScore(a, now);
    if (trendDiff !== 0) return trendDiff;
    const voteDiff = getVoteCount(b) - getVoteCount(a);
    if (voteDiff !== 0) return voteDiff;
    return new Date(b.created_at) - new Date(a.created_at);
  });
}

// ── Public API ───────────────────────────────────────────────────────────
export function getVotingReports({ district = null } = {}) {
  const reports = load().filter((r) => r.status !== "Resolved");
  const scoped = district ? reports.filter((r) => r.district === district) : reports;
  return rankReports(scoped);
}

export function toggleVote(reportId, voterId) {
  const reports = load();
  const idx = reports.findIndex((r) => r.id === reportId);
  if (idx === -1) return null;

  const report = { ...reports[idx], voted_by: [...reports[idx].voted_by], vote_log: [...reports[idx].vote_log] };
  const already = report.voted_by.includes(voterId);

  if (already) {
    report.voted_by = report.voted_by.filter((v) => v !== voterId);
    // Drop the most recent timestamp to keep vote_log length in sync with voted_by-driven demo votes.
    report.vote_log = report.vote_log.slice(0, -1);
  } else {
    report.voted_by.push(voterId);
    report.vote_log.push(Date.now());
  }

  reports[idx] = report;
  persist(reports);
  return report;
}

export function setPrioritized(reportId, value) {
  const reports = load();
  const idx = reports.findIndex((r) => r.id === reportId);
  if (idx === -1) return null;
  reports[idx] = { ...reports[idx], admin_prioritized: value };
  persist(reports);
  return reports[idx];
}

export function setReportStatus(reportId, status) {
  const reports = load();
  const idx = reports.findIndex((r) => r.id === reportId);
  if (idx === -1) return null;
  reports[idx] = { ...reports[idx], status };
  persist(reports);
  return reports[idx];
}

// One "priority spot" per district — the report the Cleanup Team should
// head to first. Admin-prioritized wins outright; otherwise whichever
// report is trending / has the most votes in that district right now.
export function getDistrictPriorities() {
  const reports = load().filter((r) => r.status !== "Resolved");
  const byDistrict = {};
  Object.keys(VOTING_DISTRICTS).forEach((key) => {
    const inDistrict = reports.filter((r) => r.district === key);
    if (inDistrict.length === 0) { byDistrict[key] = null; return; }
    byDistrict[key] = rankReports(inDistrict)[0];
  });
  return byDistrict;
}

export function getTopPriority(district = null) {
  const reports = getVotingReports({ district });
  return reports[0] || null;
}
