import React, { useState, useRef, useEffect, useCallback } from "react";
import { Bell, Search, ChevronDown, Menu, LogOut } from "lucide-react";
import { ADMIN_USER } from "../data";
import * as api from "../../api";

export default function Header({ onMenuClick, onSearchChange, searchValue = "", user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadNotifications = useCallback(() => {
    api.getNotifications()
      .then((res) => setNotifications(res.data || []))
      .catch(() => {});
  }, []);

  // Auto-refresh so new reports / completed tasks show up without a manual reload.
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 20000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await Promise.allSettled(unread.map((n) => api.markNotificationRead(n.id)));
  };

  const displayName = user?.name || ADMIN_USER.name;
  const displayRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ADMIN_USER.role;
  const initials = (user?.name || ADMIN_USER.name)
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 z-20 bg-white/80 backdrop-blur-md border-b border-emerald-50 h-16 flex items-center px-6 justify-between transition-all duration-300">
      {/* Mobile Toggle & Optional Search */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Beautiful Custom Search Bar from the Screenshot */}
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search reports, users, places..."
            className="w-full pl-11 pr-4 py-2 rounded-full border border-slate-200/80 bg-[#F4FBF6] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] focus:bg-white text-slate-700 placeholder-slate-400 transition-all duration-200"
          />
        </div>
      </div>

      {/* User Actions / Icons */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-[#16A34A] hover:bg-emerald-50 transition-all cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#16A34A] border-2 border-white animate-pulse" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs font-semibold text-[#16A34A] hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet</div>
                )}
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) {
                        api.markNotificationRead(n.id).catch(() => {});
                        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
                      }
                    }}
                    className={`px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 ${!n.is_read ? "bg-emerald-50/40" : ""}`}
                  >
                    <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200/80 hidden sm:block" />

        {/* User Profile */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 rounded-xl p-1.5 transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-[#16A34A] text-white text-xs font-bold flex items-center justify-center shadow-xs">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-900 leading-none group-hover:text-[#16A34A] transition-colors">
                {displayName}
              </p>
              <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 mt-1 leading-none">
                {displayRole}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block transition-transform group-hover:translate-y-0.5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setMenuOpen(false); onLogout?.(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
