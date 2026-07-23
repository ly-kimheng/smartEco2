import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, LogOut, Check, Gift, Settings, ChevronDown, Leaf, UserPlus, Home, MapPin, Camera, Recycle, FileText, ImageIcon } from "lucide-react";
import { cn } from "../utils";
import * as api from "../api";

const NAV_ITEMS = [
  { to: "home",       icon: Home,     label: "Home" },
  { to: "map",        icon: MapPin,   label: "Map" },
  { to: "report",     icon: Camera,   label: "Report" },
  { to: "recycling",  icon: Recycle,  label: "Guide" },
  { to: "my-reports", icon: FileText, label: "My Reports" },
];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// Cleanup-completion notifications reference their report as "Report #123" —
// pull that id out so we can deep-link to the after photo + feedback form.
function extractReportId(message) {
  const match = /#(\d+)/.exec(message || "");
  return match ? Number(match[1]) : null;
}

export function Header({ isLoggedIn, onLogin, onRegister, onLogout, user, onNavigate, currentPage, onViewCleanup }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const loadNotifs = useCallback(() => {
    if (!isLoggedIn) return;
    api.getNotifications()
      .then((res) => setNotifs(res.data || []))
      .catch(() => {});
  }, [isLoggedIn]);

  useEffect(() => {
    loadNotifs();
    if (!isLoggedIn) return;
    const interval = setInterval(loadNotifs, 20000);
    return () => clearInterval(interval);
  }, [loadNotifs, isLoggedIn]);

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  const markOne = async (id) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try { await api.markNotificationRead(id); } catch {}
  };
  const markAll = async () => {
    const unread = notifs.filter((n) => !n.is_read);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await Promise.allSettled(unread.map((n) => api.markNotificationRead(n.id)));
  };

  const handleNotifClick = (n) => {
    markOne(n.id);
    if (n.type === "cleanup_completed") {
      const reportId = extractReportId(n.message);
      setNotifOpen(false);
      if (reportId) onViewCleanup?.(reportId);
      else onNavigate("my-reports");
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-20 flex items-center px-6 lg:px-10">

      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0 mr-4">
        <div className="w-8 h-8 rounded-lg bg-[#16A34A] flex items-center justify-center">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-[#16A34A] text-lg tracking-tight hidden sm:block">SmartEco</span>
      </div>

      {/* Desktop Nav — right-aligned, evenly spaced, fills the space left by the removed search bar */}
      <nav className="hidden lg:flex items-center gap-6 mr-6 flex-1 justify-end">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = currentPage === to;
          return (
            <button
              key={to}
              onClick={() => onNavigate(to)}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium transition-colors whitespace-nowrap py-1",
                active
                  ? "text-[#16A34A]"
                  : "text-gray-500 hover:text-gray-800"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Mobile: push everything to the right since search is gone */}
      <div className="flex-1 lg:hidden" />

      {/* Right side — notifications + auth */}
      <div className="flex items-center gap-3 shrink-0">
        {isLoggedIn && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((v) => { if (!v) loadNotifs(); return !v; })}
              className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[#22C55E] text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50" style={{ width: 340 }}>
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-800">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#22C55E] text-white text-[10px] font-bold">{unreadCount}</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAll} className="text-xs text-[#22C55E] font-medium hover:underline flex items-center gap-1">
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifs.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-gray-400">No notifications yet</div>
                  )}
                  {notifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={cn("w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors group", !n.is_read && "bg-green-50/60")}
                    >
                      <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", !n.is_read ? "bg-[#22C55E]" : "bg-gray-200")} />
                      {n.image_url && (
                        <img
                          src={api.resolveAssetUrl(n.image_url)}
                          alt="After cleanup"
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 leading-snug">{n.title}</p>
                        <p className="text-sm text-gray-500 leading-snug">{n.message}</p>
                        {n.type === "cleanup_completed" && (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-[#16A34A]">
                            <ImageIcon className="w-3 h-3" /> View after photo
                          </span>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {isLoggedIn ? (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white text-xs font-bold">
                {user.avatar}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">{user.name}</span>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{user.email || "user@smarteco.com"}</p>
                </div>
                <div className="py-1">
                  <button onClick={() => { onNavigate("rewards"); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Gift className="w-4 h-4 text-[#22C55E]" /> Rewards
                  </button>
                  <button onClick={() => { onNavigate("settings"); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Settings className="w-4 h-4 text-gray-400" /> Settings
                  </button>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button onClick={() => { onLogout(); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button onClick={onRegister} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#22C55E] text-white text-sm font-semibold hover:bg-[#16A34A] transition-colors shadow-sm">
            <UserPlus className="w-4 h-4" />
            <span>Register</span>
          </button>
        )}
      </div>
    </header>
  );
}
