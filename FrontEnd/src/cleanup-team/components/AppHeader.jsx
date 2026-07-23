import { useState, useRef, useEffect } from "react";
import { C, ICONS, NAV_ITEMS } from "../constants";
import { Icon } from "./UI";
import { DistrictDropdown } from "./DistrictDropdown";

function HeaderNav({ active, onNav }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
      {NAV_ITEMS.map(it => {
        const on = active === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onNav(it.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: on ? C.em5 : "transparent", color: on ? C.em7 : C.g6,
              border: "none", cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            <Icon d={it.icon} size={15} color={on ? C.em7 : C.g5} />
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

export function AppHeader({
  user, onLogout, onSettings, nav, onNav, tasks, district, onDistrict, showNav = true,
  notifications = [], onMarkNotificationRead, onMarkAllNotificationsRead,
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const menuRef = useRef(null);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Close either popover when clicking outside of it
  useEffect(() => {
    function onClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header style={{
      flexShrink: 0, background: C.w, borderBottom: `1px solid ${C.bd}`,
      padding: "0 18px", minHeight: 52, display: "flex", alignItems: "center",
      gap: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", position: "relative", zIndex: 100,
      flexWrap: "wrap", rowGap: 8, paddingTop: 8, paddingBottom: 8,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: C.em, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={ICONS.leaf} size={15} color="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: 15, color: C.g9, letterSpacing: "-.02em" }}>
          CleanUp<span style={{ color: C.em }}>Team</span>
        </span>
      </div>

      {/* Nav tabs — desktop only, lives in the header (mobile gets the bottom nav) */}
      {showNav && (
        <div className="header-nav-desktop" style={{ flex: 1 }}>
          <HeaderNav active={nav} onNav={onNav} />
        </div>
      )}
      {!showNav && <div style={{ flex: 1 }} />}

      {/* District dropdown — only meaningful on the Tasks view */}
      {showNav && nav === "tasks" && (
        <DistrictDropdown district={district} tasks={tasks} onChange={onDistrict} />
      )}

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, position: "relative" }}>
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setNotifOpen(o => !o); setMenuOpen(false); }}
            style={{ width: 34, height: 34, borderRadius: 9, background: "none", border: "none", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", color: C.g6 }}
          >
            <Icon d={ICONS.bell} size={17} />
            {unreadCount > 0 && (
              <span style={{ position: "absolute", top: 5, right: 5, width: 7, height: 7, borderRadius: "50%", background: "#ef4444" }} />
            )}
          </button>

          {notifOpen && (
            <div style={{ position: "absolute", right: 0, top: 42, width: 280, background: C.w, borderRadius: 14, border: `1px solid ${C.bd}`, boxShadow: "0 8px 28px rgba(0,0,0,0.11)", zIndex: 200, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.bd}`, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: C.g9 }}>Notifications</span>
                {unreadCount > 0 && (
                  <span style={{ fontSize: 11, color: C.em, fontWeight: 600, cursor: "pointer" }} onClick={() => onMarkAllNotificationsRead?.()}>Mark all read</span>
                )}
              </div>
              <div style={{ maxHeight: 260, overflowY: "auto" }}>
                {notifications.length === 0 && (
                  <div style={{ padding: "20px 14px", textAlign: "center", fontSize: 12, color: C.g4 }}>No notifications yet</div>
                )}
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && onMarkNotificationRead?.(n.id)}
                    style={{ padding: "10px 14px", display: "flex", gap: 10, borderBottom: `1px solid rgba(0,0,0,0.04)`, cursor: "pointer", background: !n.is_read ? "rgba(16,163,74,0.06)" : "transparent" }}
                  >
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: !n.is_read ? C.em : "transparent", flexShrink: 0, marginTop: 4 }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: C.g8, lineHeight: 1.4, marginBottom: 2 }}>{n.title}</p>
                      <p style={{ fontSize: 12, color: C.g7, lineHeight: 1.4, marginBottom: 2 }}>{n.message}</p>
                      <p style={{ fontSize: 11, color: C.g4 }}>{(n.created_at || "").toString().slice(0, 16).replace("T", " ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setMenuOpen(o => !o); setNotifOpen(false); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px 4px 4px", borderRadius: 9, background: "none", border: "none", cursor: "pointer" }}
          >
            <div style={{ width: 26, height: 26, borderRadius: 7, background: C.em, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
              {user.initials}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.g8 }}>{user.name}</span>
            <Icon d={ICONS.chevronDown} size={13} color={C.g4} style={{ transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
          </button>

          {menuOpen && (
            <div style={{ position: "absolute", right: 0, top: 42, width: 200, background: C.w, borderRadius: 14, border: `1px solid ${C.bd}`, boxShadow: "0 8px 28px rgba(0,0,0,0.11)", zIndex: 200, overflow: "hidden" }}>
              <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.bd}` }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.g9, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</p>
                <p style={{ fontSize: 11, color: C.g4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</p>
              </div>
              <button
                onClick={() => { setMenuOpen(false); onSettings?.(); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: 600, color: C.g7 }}
              >
                <Icon d={ICONS.settings} size={15} color={C.g5} /> Settings
              </button>
              <button
                onClick={() => { setMenuOpen(false); onLogout(); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#dc2626" }}
              >
                <Icon d={ICONS.logOut} size={15} color="#dc2626" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
