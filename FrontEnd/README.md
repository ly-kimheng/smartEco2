# SmartEco – React JS

A community waste-reporting web app for Cambodia, built with **React 18 + Vite + Tailwind CSS + Leaflet**.

## Project Structure

```
smarteco/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AuthShell.jsx      # Two-column auth layout wrapper
│   │   ├── Counter.jsx        # Animated number counter
│   │   ├── Header.jsx         # Top navigation bar
│   │   └── Sidebar.jsx        # Left sidebar navigation
│   ├── data/
│   │   └── mockData.js        # Shared mock data & constants
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ReportWastePage.jsx
│   │   ├── WasteMapPage.jsx   # ← Real Leaflet map (OpenStreetMap)
│   │   ├── MyReportsPage.jsx
│   │   ├── RecyclingGuidePage.jsx
│   │   ├── RewardsPage.jsx
│   │   └── SettingsPage.jsx
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   └── utils.js
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Build for production
npm run build
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Map (WasteMapPage)

Uses **Leaflet** with **OpenStreetMap** tiles — completely free, no API key required.

- Real interactive map centered on Phnom Penh
- Color-coded markers by severity (🔴 High / 🟡 Medium / 🟢 Low)
- Click any marker to see a popup with type, location, date, and severity
- Filter markers by waste type or search by location name

## Pages

| Page | Route key | Description |
|------|-----------|-------------|
| Landing | `landing` | Public hero + features + stats |
| Login | `login` | Email/password sign-in with validation |
| Register | `register` | Sign-up with password strength meter |
| Dashboard | `home` | Hero banner, impact stats, voting cards |
| Report Waste | `report` | Form with image upload & severity picker |
| Waste Map | `map` | Real Leaflet map with OpenStreetMap tiles |
| My Reports | `my-reports` | Table of user's submitted reports |
| Recycling Guide | `recycling` | Expandable material cards with tips |
| Rewards | `rewards` | Points balance + redeemable rewards |
| Settings | `settings` | Profile, password, notifications, dark mode |

## Tech Stack

- **React 18** – UI library
- **Vite** – Build tool & dev server
- **Tailwind CSS 3** – Utility-first styling
- **Lucide React** – Icon set
- **Leaflet 1.9 + OpenStreetMap** – Real interactive map, free, no API key
