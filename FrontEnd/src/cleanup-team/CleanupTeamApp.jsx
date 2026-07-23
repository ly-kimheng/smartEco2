import { useState, useEffect, useCallback } from "react";
import { C } from "./constants";
import { LOCATIONS } from "./data/tasks";
import * as api from "../api";
import "./styles.css";

import { AppHeader } from "./components/AppHeader";
import { BottomNav } from "./components/Navigation";

import TasksPage from "./pages/TasksPage";
import TaskDetailPage from "./pages/TaskDetailPage";
import UpdateProgressPage from "./pages/UpdateProgressPage";
import MapPage from "./pages/MapPage";
import TaskCompletedPage from "./pages/TaskCompletedPage";
import SettingsPage from "./pages/SettingsPage";

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=400&h=200&fit=crop";
const DEFAULT_REQS = [
  "Wear high-visibility vest and gloves",
  "Take before and after photos",
  "Leave the area clean with no residual litter",
];

function normalize(s) {
  return (s || "").toLowerCase().replace(/[^a-z]/g, "");
}

function findLocKey(locationName) {
  const target = normalize(locationName);
  const entry = Object.entries(LOCATIONS).find(([, loc]) => normalize(loc.name) === target);
  if (entry) return entry[0];
  // Fuzzy fallback — match by shared prefix
  const fuzzy = Object.entries(LOCATIONS).find(([, loc]) => normalize(loc.name).startsWith(target.slice(0, 5)));
  return fuzzy ? fuzzy[0] : null;
}

// Turn a backend task row into the task shape this UI already knows how to render.
function mapTaskToUI(row) {
  // The backend now tracks a real 0-100 progress value. Fall back to the
  // old 3-state guess only if a row somehow has no progress recorded
  // (e.g. data from before the `tasks.progress` column existed).
  const progress = row.progress !== undefined && row.progress !== null
    ? row.progress
    : (row.status === "completed" ? 100 : row.status === "in_progress" ? 50 : 0);

  return {
    id: row.id,
    title: row.title,
    loc: row.location,
    locKey: findLocKey(row.location),
    date: (row.created_at || "").toString().slice(0, 10),
    priority: row.priority || "medium",
    status: row.status,
    progress,
    img: row.before_image_url ? api.resolveAssetUrl(row.before_image_url) : PLACEHOLDER_IMG,
    afterImg: row.after_image_url ? api.resolveAssetUrl(row.after_image_url) : null,
    desc: row.description,
    reqs: DEFAULT_REQS,
  };
}

export default function CleanupTeamApp({ authUser, onLogout, onProfileUpdated }) {
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState(null);

  const user = {
    name: authUser.name,
    initials: (authUser.name || "?").split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase(),
    email: authUser.email,
    isGuest: false,
    id: authUser.id,
  };

  // Navigation
  const [nav, setNav] = useState("tasks");       // tasks | map
  const [view, setView] = useState("list");        // list | detail | update | done | settings

  // Selected items
  const [selTask, setSelTask] = useState(null);
  const [updTask, setUpdTask] = useState(null);
  const [doneTask, setDoneTask] = useState(null);

  // Filters — district is shared between Tasks tab and Map tab
  const [filter, setFilter] = useState("all");
  const [district, setDistrict] = useState(null); // null = all districts

  const loadTasks = useCallback(() => {
    setTasksLoading(true);
    setTasksError(null);
    api.getCleanupTasks()
      .then((res) => setTasks((res.tasks || []).map(mapTaskToUI)))
      .catch((err) => setTasksError(err.message))
      .finally(() => setTasksLoading(false));
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // Notifications (new task assignments show up here automatically).
  const [notifications, setNotifications] = useState([]);
  const loadNotifications = useCallback(() => {
    api.getNotifications().then((res) => setNotifications(res.data || [])).catch(() => {});
  }, []);
  useEffect(() => {
    loadNotifications();
    // Poll both notifications and tasks so a freshly-dispatched task appears
    // without the crew member needing to manually refresh.
    const interval = setInterval(() => {
      loadNotifications();
      loadTasks();
    }, 20000);
    return () => clearInterval(interval);
  }, [loadNotifications, loadTasks]);

  const markNotificationRead = useCallback((id) => {
    api.markNotificationRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    const unread = notifications.filter((n) => !n.is_read);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    Promise.allSettled(unread.map((n) => api.markNotificationRead(n.id)));
  }, [notifications]);

  // ── ACTIONS ──
  function startTask(id) {
    const startingProgress = Math.max(tasks.find(t => t.id === id)?.progress || 0, 30);
    api.updateCleanupTaskStatus(id, "in_progress", startingProgress).catch(() => {});
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: "in_progress", progress: startingProgress } : t));
    setSelTask(prev => prev && prev.id === id ? { ...prev, status: "in_progress", progress: startingProgress } : prev);
  }

  function openDetail(task) {
    setSelTask(tasks.find(t => t.id === task.id) || task);
    setView("detail");
  }

  function openUpdate(task) {
    setUpdTask(tasks.find(t => t.id === task.id) || task);
    setView("update");
  }

  // progress: 0-100 slider value. afterPhotoFile: required when progress === 100.
  // afterPhotoPreviewUrl: local object-URL preview of that same file, so the
  // "Task completed" screen can show the after photo immediately without
  // waiting on the server round-trip.
  async function saveProgress(progress, _note, afterPhotoFile, afterPhotoPreviewUrl) {
    if (progress === 100) {
      if (!afterPhotoFile) {
        alert("Please upload an after-cleanup photo before marking this task as completed.");
        return;
      }
      try {
        await api.completeCleanupTask(updTask.id, afterPhotoFile);
        await loadTasks();
        const updated = { ...updTask, status: "completed", progress: 100, afterImg: afterPhotoPreviewUrl || updTask.afterImg };
        setSelTask(updated);
        setDoneTask(updated);
        setView("done");
      } catch (err) {
        alert(`Could not mark task as completed: ${err.message}`);
        return;
      }
    } else {
      api.updateCleanupTaskStatus(updTask.id, "in_progress", progress).catch(() => {});
      const updated = { ...updTask, progress, status: "in_progress" };
      setTasks(prev => prev.map(t => t.id === updTask.id ? updated : t));
      setSelTask(updated);
      setView("detail");
    }
    setUpdTask(null);
  }

  // Jumps straight to the Map tab, filtered to that task's district
  function handleViewMap(locKey) {
    setDistrict(locKey);
    setNav("map");
    setView("list");
  }

  function handleNav(id) {
    setNav(id);
    setView("list");
  }

  function openSettings() {
    setView("settings");
  }

  function handleLogout() {
    onLogout();
  }

  // ── SHELL ──
  const shell = children => (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: C.bg, overflow: "hidden", fontFamily: "'Inter',system-ui,sans-serif" }}>
      {children}
    </div>
  );

  // Header includes logo, nav tabs (desktop), district dropdown, notifications, and account menu
  const header = (showNav = true) => (
    <>
      <AppHeader
        user={user}
        onLogout={handleLogout}
        onSettings={openSettings}
        nav={nav}
        onNav={handleNav}
        tasks={tasks}
        district={district}
        onDistrict={setDistrict}
        showNav={showNav}
        notifications={notifications}
        onMarkNotificationRead={markNotificationRead}
        onMarkAllNotificationsRead={markAllNotificationsRead}
      />
      {tasksError && (
        <div style={{ background: "#fef2f2", color: "#dc2626", fontSize: 12, padding: "8px 16px", textAlign: "center" }}>
          Couldn't load tasks from the server: {tasksError}
        </div>
      )}
    </>
  );

  // ── SETTINGS ──
  if (view === "settings") return shell(<>
    {header(false)}
    <SettingsPage
      authUser={authUser}
      onBack={() => setView("list")}
      onLogout={handleLogout}
      onProfileUpdated={onProfileUpdated}
    />
    <BottomNav active={nav} onNav={handleNav} />
  </>);

  // ── TASK COMPLETED ──
  if (view === "done" && doneTask) return shell(<>
    {header(false)}
    <TaskCompletedPage task={doneTask} onBack={() => { setDoneTask(null); setView("list"); setNav("tasks"); }} />
    <BottomNav active={nav} onNav={handleNav} />
  </>);

  // ── UPDATE PROGRESS ──
  if (view === "update" && updTask) return shell(<>
    {header(false)}
    <UpdateProgressPage task={updTask} onSave={saveProgress} onBack={() => setView("detail")} />
    <BottomNav active={nav} onNav={handleNav} />
  </>);

  // ── TASK DETAIL ──
  if (view === "detail" && selTask) return shell(<>
    {header(false)}
    <div style={{ flex: 1, overflow: "hidden", background: "#fff" }}>
      <TaskDetailPage
        task={selTask}
        onBack={() => setView("list")}
        onStartTask={id => startTask(id)}
        onUpdateProgress={openUpdate}
        onViewMap={handleViewMap}
      />
    </div>
    <BottomNav active={nav} onNav={handleNav} />
  </>);

  // ── MAIN DASHBOARD ──
  return shell(<>
    {header(true)}

    {tasksLoading ? (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.g4, fontSize: 13 }}>
        Loading tasks…
      </div>
    ) : (
      <>
        {nav === "tasks" && (
          <TasksPage
            tasks={tasks}
            filter={filter}
            onFilter={setFilter}
            district={district}
            onSelect={openDetail}
            onStart={startTask}
          />
        )}

        {nav === "map" && (
          <MapPage
            tasks={tasks}
            district={district}
            onTaskSelect={t => openDetail(t)}
          />
        )}
      </>
    )}

    <BottomNav active={nav} onNav={handleNav} />
  </>);
}
