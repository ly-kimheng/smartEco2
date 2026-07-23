export const ADMIN_USER = {
  name: "Tom Wright",
  role: "Super Admin",
  initials: "TW",
  email: "tom.wright@smarteco.gov"
};

export const INITIAL_TREND_DATA = [
  { month: "Jan", submitted: 32, resolved: 30 },
  { month: "Feb", submitted: 44, resolved: 41 },
  { month: "Mar", submitted: 48, resolved: 44 },
  { month: "Apr", submitted: 55, resolved: 51 },
  { month: "May", submitted: 78, resolved: 74 },
  { month: "Jun", submitted: 92, resolved: 88 },
];

export const INITIAL_CATEGORY_DATA = [
  { name: "General Waste", value: 142, color: "#3B82F6" },
  { name: "Hazardous Waste", value: 67, color: "#EF4444" },
  { name: "Bulky Waste", value: 54, color: "#F59E0B" },
  { name: "Electronic Waste", value: 38, color: "#8B5CF6" },
  { name: "Environmental", value: 91, color: "#22C55E" },
];

export const INITIAL_REPORTS = [
  {
    id: "RPT-001",
    title: "Illegal dumping near Riverside Park",
    location: "Riverside Dr, Block 4",
    category: "Hazardous Waste",
    reporter: "Maya Chen",
    reporterInitials: "MC",
    status: "Pending",
    priority: "High",
    description: "Several drums containing unidentified liquid waste dumped near the riverbank. Strong chemical smell detected by local joggers.",
    date: "2026-06-24"
  },
  {
    id: "RPT-002",
    title: "Overflowing bins at Market Square",
    location: "Market Sq, Unit 12",
    category: "General Waste",
    reporter: "James Osei",
    reporterInitials: "JO",
    status: "Approved",
    priority: "Medium",
    description: "Trash bins outside the public market are completely full, attracting rodents and causing spillover on the sidewalk.",
    date: "2026-06-23"
  },
  {
    id: "RPT-003",
    title: "Abandoned mattress blocking sidewalk",
    location: "Elm St, #88",
    category: "Bulky Waste",
    reporter: "Sara Novak",
    reporterInitials: "SN",
    status: "Assigned",
    priority: "Medium",
    description: "A king-size memory foam mattress has been dumped on the curb, blocking pedestrian access and wheelchair ramps.",
    date: "2026-06-22"
  },
  {
    id: "RPT-004",
    title: "Chemical spill in alley",
    location: "Pine Alley, Zone B",
    category: "Hazardous Waste",
    reporter: "Derek Liu",
    reporterInitials: "DL",
    status: "Resolved",
    priority: "High",
    description: "Dark oily substance leaking from a container behind the automotive workshop. City team cleaned using absorbing pads.",
    date: "2026-06-21"
  },
  {
    id: "RPT-005",
    title: "Plastic waste in creek",
    location: "Creek Trail, Km 3",
    category: "Environmental",
    reporter: "Ana Flores",
    reporterInitials: "AF",
    status: "Pending",
    priority: "High",
    description: "Substantial build-up of plastic bottles, bags, and polystyrene packaging floating near the main water outlet.",
    date: "2026-06-20"
  },
  {
    id: "RPT-006",
    title: "Broken glass in playground",
    location: "Oak Ave School Park",
    category: "General Waste",
    reporter: "Tom Wright",
    reporterInitials: "TW",
    status: "Rejected",
    priority: "Low",
    description: "Reported shattered bottles near the swing set. Checked and verified that a general park cleaner already swept it.",
    date: "2026-06-19"
  },
  {
    id: "RPT-007",
    title: "E-waste dumped near school",
    location: "Oak Ave School",
    category: "Electronic Waste",
    reporter: "Priya Shah",
    reporterInitials: "PS",
    status: "Pending",
    priority: "Medium",
    description: "Old computer monitors, keyboards, and broken cathode ray tubes left near the sports field entrance.",
    date: "2026-06-18"
  },
];

export const INITIAL_USERS = [
  { id: 1, name: "Maya Chen", email: "maya@example.com", initials: "MC", role: "User", reports: 12, points: 1450, joined: "2025-01-15", status: "active" },
  { id: 2, name: "James Osei", email: "james@example.com", initials: "JO", role: "User", reports: 8, points: 970, joined: "2025-02-08", status: "active" },
  { id: 3, name: "Sara Novak", email: "sara@example.com", initials: "SN", role: "Moderator", reports: 25, points: 3200, joined: "2024-11-20", status: "active" },
  { id: 4, name: "Derek Liu", email: "derek@example.com", initials: "DL", role: "User", reports: 5, points: 620, joined: "2025-03-01", status: "banned" },
  { id: 5, name: "Ana Flores", email: "ana@example.com", initials: "AF", role: "User", reports: 18, points: 2100, joined: "2024-12-10", status: "active" },
  { id: 6, name: "Priya Shah", email: "priya@example.com", initials: "PS", role: "User", reports: 7, points: 880, joined: "2025-04-22", status: "active" },
];

export const INITIAL_TASKS = [
  { id: "TSK-001", task: "Remove mattress — Elm St #88", report: "RPT-003", assignee: "City Crew B", due: "2026-06-27", status: "in progress" },
  { id: "TSK-002", task: "Empty bins — Market Square", report: "RPT-002", assignee: "City Crew A", due: "2026-06-26", status: "pending" },
  { id: "TSK-003", task: "Chemical hazmat — Pine Alley", report: "RPT-004", assignee: "Hazmat Unit", due: "2026-06-25", status: "completed" },
  { id: "TSK-004", task: "Creek cleanup — Trail Km 3", report: "RPT-005", assignee: "Env. Team", due: "2026-06-29", status: "pending" },
  { id: "TSK-005", task: "E-waste removal — Oak Ave School", report: "RPT-007", assignee: "Recycle Co.", due: "2026-06-28", status: "in progress" },
];

export const INITIAL_CATEGORIES = [
  { name: "General Waste", count: 142, color: "#3B82F6" },
  { name: "Hazardous Waste", count: 67, color: "#EF4444" },
  { name: "Bulky Waste", count: 54, color: "#F59E0B" },
  { name: "Electronic Waste", count: 38, color: "#8B5CF6" },
  { name: "Environmental", count: 91, color: "#22C55E" },
];

export const INITIAL_FEEDBACK = [
  { id: 1, name: "Maya Chen", initials: "MC", date: "2026-06-24", tag: "UX", stars: 5, comment: "The platform is very easy to use! Love how quick reports are reviewed and categorized." },
  { id: 2, name: "James Osei", initials: "JO", date: "2026-06-23", tag: "Feature Request", stars: 4, comment: "Would be great to add push notifications or SMS alerts when my report status changes from pending to resolved." },
  { id: 3, name: "Ana Flores", initials: "AF", date: "2026-06-22", tag: "Performance", stars: 2, comment: "Cleanup took 3 weeks for a resolved environmental report. Please speed up the response team deployment." },
  { id: 4, name: "Priya Shah", initials: "PS", date: "2026-06-21", tag: "Rewards", stars: 5, comment: "The eco reward points system is really motivating! I've already redeemed local cafe vouchers." },
];
