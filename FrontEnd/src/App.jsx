import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { AuthModal } from "./components/AuthModal";
import { GuestGate } from "./components/GuestGate";
import { cn } from "./utils";
import * as api from "./api";

import DashboardPage from "./pages/DashboardPage";
import ReportWastePage from "./pages/ReportWastePage";
import WasteMapPage from "./pages/WasteMapPage";
import MyReportsPage from "./pages/MyReportsPage";
import RecyclingGuidePage from "./pages/RecyclingGuidePage";
import RewardsPage from "./pages/RewardsPage";
import SettingsPage from "./pages/SettingsPage";

import AdminDashboard from "./admin/AdminDashboard";
import CleanupTeamApp from "./cleanup-team/CleanupTeamApp";

function toDisplayUser(rawUser) {
  if (!rawUser) return { name: "Guest", email: "", avatar: "?", points: 0 };
  const initials = (rawUser.name || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return { ...rawUser, avatar: initials };
}

export default function App() {
  const [page, setPage] = useState("home");
  const [authUser, setAuthUser] = useState(null); // { id, name, email, points, role }
  const [darkMode, setDarkMode] = useState(false);
  const [authModal, setAuthModal] = useState(null); // null | "login" | "register"
  const [pendingPage, setPendingPage] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [focusReportId, setFocusReportId] = useState(null);
  const [mapDistrictFilter, setMapDistrictFilter] = useState(null);

  // Restore session on load (token saved by AuthModal on a previous visit)
  useEffect(() => {
    const token = api.getToken();
    const storedUser = api.getStoredUser();
    if (token && storedUser) {
      setAuthUser(storedUser);
    }
    setBootstrapped(true);
  }, []);

  const isLoggedIn = !!authUser;
  const isAdmin = authUser?.role === "admin";
  const isCleanupTeam = authUser?.role === "cleanup_team";
  const user = toDisplayUser(authUser);

  const handleNavigate = (to) => {
    if (to === "login") { setAuthModal("login"); return; }
    if (to === "register") { setAuthModal("register"); return; }
    setPage(to);
  };

  const handleLogin = (rawUser) => {
    setAuthUser(rawUser);
    setAuthModal(null);
    if (rawUser.role === "admin" || rawUser.role === "cleanup_team") {
      // These roles land on their own dedicated shell, not the citizen page flow.
      setPendingPage(null);
      return;
    }
    if (pendingPage) { setPage(pendingPage); setPendingPage(null); }
    else setPage("home");
  };

  const handleProfileUpdated = (updatedUser) => {
    setAuthUser((prev) => {
      const next = { ...prev, ...updatedUser };
      const token = api.getToken();
      if (token) api.saveSession(token, next);
      return next;
    });
  };

  const handleLogout = () => {
    api.clearSession();
    api.logout();
    setAuthUser(null);
    setPage("home");
  };

  // The backend credits points the moment a report is resolved (see
  // Task.complete() / AdminService.updateReportStatus), but authUser is only
  // ever set at login/register — nothing re-fetches it after that, so the
  // Rewards page would otherwise keep showing whatever points you had at
  // login forever. Poll the citizen's own profile so `points` stays current.
  // Admin/cleanup-team accounts don't have a points balance, so skip them.
  const refreshProfile = () => {
    if (!authUser || isAdmin || isCleanupTeam) return;
    api.getProfile()
      .then((res) => { if (res?.user) handleProfileUpdated(res.user); })
      .catch(() => {});
  };

  useEffect(() => {
    if (!authUser || isAdmin || isCleanupTeam) return;
    refreshProfile();
    const interval = setInterval(refreshProfile, 20000);
    return () => clearInterval(interval);
  }, [authUser?.id, isAdmin, isCleanupTeam]); // eslint-disable-line react-hooks/exhaustive-deps

  const openAuth = (mode, target) => {
    setPendingPage(target || null);
    setAuthModal(mode);
  };

  const handleViewCleanup = (reportId) => {
    setFocusReportId(reportId);
    setPage("my-reports");
  };

  // Used by the Dashboard's vote-card location icon to jump straight into the
  // in-app Map page (pre-filtered to that district) instead of an external site.
  const handleShowOnMap = (district) => {
    setMapDistrictFilter(district);
    setPage("map");
  };

  const PROTECTED = ["report", "my-reports"];

  const renderPage = () => {
    if (PROTECTED.includes(page) && !isLoggedIn) {
      const names = { report: "Report Waste", "my-reports": "My Reports" };
      return (
        <GuestGate
          pageName={names[page]}
          onLogin={() => openAuth("login", page)}
          onRegister={() => openAuth("register", page)}
        />
      );
    }

    switch (page) {
      case "home":       return <DashboardPage user={user} isLoggedIn={isLoggedIn} onRequireAuth={(mode) => openAuth(mode, "home")} onNavigate={handleNavigate} onShowOnMap={handleShowOnMap} />;
      case "report":     return <ReportWastePage />;
      case "map":        return <WasteMapPage initialDistrict={mapDistrictFilter} onDistrictConsumed={() => setMapDistrictFilter(null)} />;
      case "my-reports": return <MyReportsPage focusReportId={focusReportId} onFocusHandled={() => setFocusReportId(null)} />;
      case "recycling":  return <RecyclingGuidePage />;
      case "rewards":    return <RewardsPage user={user} onRedeemed={refreshProfile} />;
      case "settings":   return <SettingsPage user={user} darkMode={darkMode} onDarkMode={(val) => { setDarkMode(val); document.documentElement.classList.toggle("dark", val); }} />;
      default:           return <DashboardPage user={user} onNavigate={handleNavigate} />;
    }
  };

  // Wait for the session-restore check before deciding which shell to render,
  // so a logged-in admin doesn't flash the citizen UI on refresh.
  if (!bootstrapped) return null;

  // Admin accounts get their own dedicated dashboard shell — no citizen header/nav.
  if (isAdmin) {
    return <AdminDashboard user={authUser} onLogout={handleLogout} onProfileUpdated={handleProfileUpdated} />;
  }

  // Cleanup Team accounts get their own dedicated shell too.
  if (isCleanupTeam) {
    return <CleanupTeamApp authUser={authUser} onLogout={handleLogout} onProfileUpdated={handleProfileUpdated} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => { setAuthModal(null); setPendingPage(null); }}
          onLogin={handleLogin}
        />
      )}

      <Header
        isLoggedIn={isLoggedIn}
        onLogin={() => setAuthModal("login")}
        onRegister={() => setAuthModal("register")}
        onLogout={handleLogout}
        user={user}
        onNavigate={handleNavigate}
        currentPage={page}
        onViewCleanup={handleViewCleanup}
      />

      <main className="pt-16 pb-20 lg:pb-0 min-h-screen bg-gray-50">
        <div className="p-4 lg:p-8 max-w-6xl mx-auto">
          {renderPage()}
        </div>
      </main>

      <BottomNav
        currentPage={page}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
