export const INITIAL_TASKS = [
  {
    id: 1, title: "Clean Roadside Area", loc: "Russey Keo", locKey: "russeikeo",
    date: "Jun 28, 2026", priority: "high", status: "in_progress", progress: 65,
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop",
    desc: "Remove litter, plastic bags, and debris along the 400 m stretch of the roadside. Sort recyclables from general waste and document the haul weight.",
    reqs: ["Wear high-visibility vest and gloves", "Bring labelled waste bags (general + recycle)", "Take before and after photos", "Log total waste weight in the app"],
  },
  {
    id: 2, title: "Overflowing Bin Collection", loc: "Prek Leap", locKey: "prekleap",
    date: "Jun 29, 2026", priority: "high", status: "assigned", progress: 0,
    img: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400&h=200&fit=crop",
    desc: "Three public bins near the park entrance are overflowing. Clear the immediate area, bag the excess waste, and coordinate a council collection truck pickup.",
    reqs: ["Coordinate with council driver (contact in app)", "Clear 5 m radius around each bin", "Attach bin-full report to this task"],
  },
  {
    id: 3, title: "Park Cleanup Drive", loc: "Boeng Keng Kang", locKey: "boeungkengkang",
    date: "Jun 30, 2026", priority: "medium", status: "assigned", progress: 0,
    img: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=400&h=200&fit=crop",
    desc: "Weekend community cleanup covering all park trails, picnic areas, and the lakeside promenade. Lead a volunteer team of 12.",
    reqs: ["Brief volunteers on segregation guidelines", "Set up waste stations every 200 m", "Submit volunteer sign-in sheet", "Post event photos to community board"],
  },
  {
    id: 4, title: "Drainage Cleaning", loc: "Chroy Changvar", locKey: "chroychongva",
    date: "Jul 1, 2026", priority: "medium", status: "in_progress", progress: 30,
    img: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop",
    desc: "Clear blockage in the open monsoon drain caused by accumulated leaves, silt, and plastic waste. Prevent flooding risk ahead of the wet season.",
    reqs: ["Safety boots and chemical-resistant gloves required", "Use long-handled tools — no direct contact with drain water", "Photograph blockage before and after", "Report any cracked drain panels to maintenance"],
  },
  {
    id: 5, title: "Uncollected Waste Removal", loc: "Chbar Ampov", locKey: "chbaompov",
    date: "Jun 27, 2026", priority: "low", status: "completed", progress: 100,
    img: "https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=400&h=200&fit=crop",
    desc: "Resident-reported pile of uncollected household waste at the back alley. Waste has been sitting for 5 days. Clear, bag, and arrange emergency pickup.",
    reqs: ["Assess volume before starting", "Separate bulky items for special disposal", "Leave area clean with no residual litter"],
  },
];

// SVG map coords (x,y) kept for any legacy use, plus real-world lat/lng for the GPS map
export const LOCATIONS = {
  russeikeo:      { name: "Russey Keo",       x: 310, y: 110, color: "#ef4444", lat: 11.6177, lng: 104.8919 },
  prekleap:       { name: "Prek Leap",        x: 200, y: 60,  color: "#f97316", lat: 11.6650, lng: 104.9300 },
  boeungkengkang: { name: "Boeng Keng Kang", x: 355, y: 290, color: "#3b82f6", lat: 11.5512, lng: 104.9270 },
  chroychongva:   { name: "Chroy Changvar",   x: 390, y: 155, color: "#8b5cf6", lat: 11.5897, lng: 104.9282 },
  chbaompov:      { name: "Chbar Ampov",      x: 380, y: 370, color: "#10b981", lat: 11.5410, lng: 104.9514 },
};

// Center of Phnom Penh for the GPS map's initial view
export const PHNOM_PENH_CENTER = { lat: 11.5639, lng: 104.9007 };
