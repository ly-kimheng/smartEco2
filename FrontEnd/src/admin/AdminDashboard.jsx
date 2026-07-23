import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import * as api from "../api";

// Import Views
import DashboardView from "./views/DashboardView";
import ReportsView from "./views/ReportsView";
import UsersView from "./views/UsersView";
import TasksView from "./views/TasksView";
import VotingView from "./views/VotingView";
import AnalyticsView from "./views/AnalyticsView";
import CategoriesView from "./views/CategoriesView";
import FeedbackView from "./views/FeedbackView";
import RewardsView from "./views/RewardsView";
import GuidesView from "./views/GuidesView";
import SettingsView from "./views/SettingsView";

// Initial constants (used as fallback / for views not yet backed by an API)
import {
  INITIAL_TREND_DATA,
  INITIAL_CATEGORIES,
  INITIAL_FEEDBACK
} from "./data";

// Turn a DB report row (see BackEnd reports table) into the shape the admin views expect.
function mapReport(row) {
  const category = row.category || "General Waste";
  // Priority now comes straight from what the citizen picked when filing the
  // report (reports.priority) — no more guessing from category or defaulting
  // to Medium regardless of what was actually submitted.
  const priority = row.priority ? row.priority[0].toUpperCase() + row.priority.slice(1) : "Medium";
  const reporterName = row.reporter_name || row.reportedBy || row.reported_by || "Unknown";
  const initials = reporterName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return {
    id: `RPT-${String(row.id).padStart(3, "0")}`,
    rawId: row.id,
    title: row.title,
    location: row.location,
    category,
    reporter: reporterName,
    reporterInitials: initials || "?",
    status: row.status || "Pending",
    priority,
    voteCount: Number(row.vote_count) || 0,
    description: row.description,
    date: (row.reported_date || row.created_at || "").toString().slice(0, 10),
    imageUrl: row.image_url ? api.resolveAssetUrl(row.image_url) : null,
    // The photo the cleanup crew is working from — same as the citizen's
    // photo unless admin has overridden it on the task directly.
    beforeImageUrl: row.before_image_url ? api.resolveAssetUrl(row.before_image_url) : null,
    afterImageUrl: row.after_image_url ? api.resolveAssetUrl(row.after_image_url) : null,
    completedAt: row.completed_at || null,
    // Cleanup progress (0-100), reported live by the cleanup-team app.
    taskProgress: row.task_progress ?? null,
    taskStatus: row.task_status || null,
    assignedTo: row.assigned_to || null,
    assigneeName: row.assignee_name || null,
  };
}

// Turn a DB user row into the shape UsersView expects.
function mapUser(row) {
  const initials = (row.name || "")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    initials: initials || "?",
    role: "User",
    reports: Number(row.reports_count) || 0,
    points: Number(row.points) || 0,
    joined: (row.created_at || "").toString().slice(0, 10),
    // There's no "banned" column in the DB yet — this is cosmetic/local only
    // until that's added, so a ban here won't survive a refresh.
    status: "active",
  };
}

// Turn a DB task row (see BackEnd tasks table) into the shape TasksView expects.
function mapTask(row) {
  return {
    id: `TSK-${String(row.id).padStart(3, "0")}`,
    rawId: row.id,
    task: row.title,
    report: row.report_id ? `RPT-${String(row.report_id).padStart(3, "0")}` : "N/A",
    reportId: row.report_id,
    assignee: row.assignee_name || "Unassigned",
    assignedTo: row.assigned_to,
    location: row.location,
    priority: row.priority,
    due: (row.completed_at || row.created_at || "").toString().slice(0, 10),
    status: row.status === "in_progress" ? "in progress" : row.status,
    progress: row.progress ?? (row.status === "completed" ? 100 : row.status === "in_progress" ? 50 : 0),
  };
}

export default function AdminDashboard({ user, onLogout, onProfileUpdated }) {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Backend-connected state
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Views without a dedicated backend endpoint yet stay on local mock data.
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [cleanupCrew, setCleanupCrew] = useState([]);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [feedback, setFeedback] = useState(INITIAL_FEEDBACK);
  const [trendData, setTrendData] = useState(INITIAL_TREND_DATA);
  const [rewards, setRewards] = useState([]);
  const [guides, setGuides] = useState([]);

  // Global search text (from Header input)
  const [searchText, setSearchText] = useState("");

  // Set when admin clicks "Prioritize" on a high-vote report in Reports tab;
  // consumed by TasksView to auto-open the assign modal on that report.
  const [prefillReportId, setPrefillReportId] = useState(null);
  const prioritizeReport = useCallback((rawId) => {
    setPrefillReportId(rawId);
    setPage("tasks");
  }, []);

  const loadData = useCallback(async (silent = false) => {
    // On the initial load (and any manual retry) show the full loading
    // state. Background polls stay silent so the dashboard doesn't flash
    // a loading spinner every 30s while an admin is mid-task.
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const [statsRes, reportsRes, tasksRes, crewRes, usersRes, rewardsRes, guidesRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminReports(),
        api.getAdminTasks(),
        api.getCleanupTeamList(),
        api.getAdminUsers(),
        api.getRewards(),
        api.getGuides(),
      ]);
      setStats(statsRes.data);
      setReports((reportsRes.data || []).map(mapReport));
      setTasks((tasksRes.data || []).map(mapTask));
      setCleanupCrew(crewRes.data || []);
      setUsers((usersRes.data || []).map(mapUser));
      setRewards(rewardsRes.data || []);
      setGuides(guidesRes.data || []);
    } catch (err) {
      // A background poll failing shouldn't blank out a dashboard the
      // admin is actively looking at with an error screen — only surface
      // the error banner for the foreground (non-silent) load.
      if (!silent) setLoadError(err.message);
      console.error("Admin dashboard failed to load live data:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Background poll — picks up changes made elsewhere (a citizen's points
  // crediting when a crew resolves their report, a crew updating task
  // progress, a new report coming in) without the admin needing to
  // manually refresh the page. Matches the polling already used on the
  // citizen app (20s, profile) and cleanup-team app (20s, tasks).
  useEffect(() => {
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const updateReportStatus = useCallback(async (id, status) => {
    const target = reports.find((r) => r.id === id);
    if (!target) return;
    // Optimistic update
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await api.updateAdminReportStatus(target.rawId, status);
    } catch (err) {
      // Revert on failure and surface the error
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: target.status } : r)));
      alert(`Could not update report status: ${err.message}`);
    }
  }, [reports]);

  // Admin override on the "after cleanup" photo — normally the cleanup team
  // sets this when they finish their task; admin can replace or remove it.
  const replaceAfterImage = useCallback(async (id, afterImageFile) => {
    const target = reports.find((r) => r.id === id);
    if (!target) return;
    try {
      const res = await api.replaceReportAfterImage(target.rawId, afterImageFile);
      const updated = mapReport(res.data);
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      alert(`Could not replace the after-cleanup photo: ${err.message}`);
    }
  }, [reports]);

  const removeAfterImage = useCallback(async (id) => {
    const target = reports.find((r) => r.id === id);
    if (!target) return;
    try {
      const res = await api.removeReportAfterImage(target.rawId);
      const updated = mapReport(res.data);
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      alert(`Could not remove the after-cleanup photo: ${err.message}`);
    }
  }, [reports]);

  // Adapter so ReportsView (built for local setReports) can call our async updater
  const setReportsAdapter = (updater) => {
    const prevList = reports;
    const nextList = typeof updater === "function" ? updater(prevList) : updater;

    // Detect which report(s) changed status and push those to the backend
    nextList.forEach((next) => {
      const prev = prevList.find((r) => r.id === next.id);
      if (prev && prev.status !== next.status) {
        updateReportStatus(next.id, next.status);
      }
    });

    // Detect deletions (present in prev, missing in next) and persist them too
    prevList.forEach((prev) => {
      const stillThere = nextList.find((r) => r.id === prev.id);
      if (!stillThere) {
        api.deleteAdminReport(prev.rawId).catch((err) => {
          alert(`Could not delete report on the server: ${err.message}`);
          loadData(); // resync with server state
        });
      }
    });

    setReports(nextList);
  };

  // Dispatch a cleanup crew to a task. The backend auto-notifies the crew
  // member (and the citizen reporter, if linked) — see BackEnd adminService.assignTask.
  const dispatchTask = useCallback(async ({ reportId, assignedTo, title, description, location, priority }) => {
    try {
      await api.assignTask({ reportId, assignedTo, title, description, location, priority });
      await loadData(); // resync tasks + reports (status may have flipped to "In Progress")
    } catch (err) {
      alert(`Could not assign task: ${err.message}`);
    }
  }, [loadData]);

  // Assign or reassign a crew (and/or priority) directly from the Reports
  // page — same backend action as the Tasks page's dispatch, just reachable
  // without leaving the report you're already looking at.
  const reassignReport = useCallback(async (reportId, { assignedTo, priority }) => {
    try {
      await api.reassignReportCrew(reportId, { assignedTo, priority });
      await loadData(); // resync reports + tasks (status may have moved to Approved)
    } catch (err) {
      alert(`Could not update the assignment: ${err.message}`);
    }
  }, [loadData]);

  // ── Rewards catalog CRUD ──────────────────────────────────────────────────
  const createReward = useCallback(async (payload) => {
    try {
      const res = await api.createReward(payload);
      setRewards((prev) => [...prev, res.data]);
    } catch (err) {
      alert(`Could not create reward: ${err.message}`);
    }
  }, []);

  const updateReward = useCallback(async (id, payload) => {
    try {
      const res = await api.updateReward(id, payload);
      setRewards((prev) => prev.map((r) => (r.id === id ? res.data : r)));
    } catch (err) {
      alert(`Could not update reward: ${err.message}`);
    }
  }, []);

  const deleteReward = useCallback(async (id) => {
    try {
      await api.deleteReward(id);
      setRewards((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(`Could not delete reward: ${err.message}`);
    }
  }, []);

  // ── Tips & Guides CRUD ────────────────────────────────────────────────────
  const createGuide = useCallback(async (payload) => {
    try {
      const res = await api.createGuide(payload);
      setGuides((prev) => [res.data, ...prev]);
    } catch (err) {
      alert(`Could not create guide: ${err.message}`);
    }
  }, []);

  const updateGuide = useCallback(async (id, payload) => {
    try {
      const res = await api.updateGuide(id, payload);
      setGuides((prev) => prev.map((g) => (g.id === id ? res.data : g)));
    } catch (err) {
      alert(`Could not update guide: ${err.message}`);
    }
  }, []);

  const deleteGuide = useCallback(async (id) => {
    try {
      await api.deleteGuide(id);
      setGuides((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      alert(`Could not delete guide: ${err.message}`);
    }
  }, []);

  const renderActiveView = () => {
    switch (page) {
      case "dashboard":
        return (
          <DashboardView
            reports={reports}
            users={users}
            categories={categories}
            trendData={trendData}
            stats={stats}
          />
        );
      case "reports":
        return <ReportsView reports={reports} setReports={setReportsAdapter} onReplaceAfterImage={replaceAfterImage} onRemoveAfterImage={removeAfterImage} onPrioritize={prioritizeReport} cleanupCrew={cleanupCrew} onReassign={reassignReport} />;
      case "users":
        return <UsersView users={users} setUsers={setUsers} />;
      case "tasks":
        return <TasksView tasks={tasks} cleanupCrew={cleanupCrew} reports={reports} onAssignTask={dispatchTask} prefillReportId={prefillReportId} onPrefillConsumed={() => setPrefillReportId(null)} />;
      case "voting":
        return <VotingView />;
      case "analytics":
        return <AnalyticsView categories={categories} trendData={trendData} />;
      case "categories":
        return (
          <CategoriesView
            categories={categories}
            setCategories={setCategories}
          />
        );
      case "feedback":
        return <FeedbackView feedback={feedback} />;
      case "rewards":
        return (
          <RewardsView
            rewards={rewards}
            onCreate={createReward}
            onUpdate={updateReward}
            onDelete={deleteReward}
          />
        );
      case "guides":
        return (
          <GuidesView
            guides={guides}
            onCreate={createGuide}
            onUpdate={updateGuide}
            onDelete={deleteGuide}
          />
        );
      case "settings":
        return <SettingsView user={user} onProfileUpdated={onProfileUpdated} />;
      default:
        return (
          <DashboardView
            reports={reports}
            users={users}
            categories={categories}
            trendData={trendData}
            stats={stats}
          />
        );
    }
  };

  // Badge count numbers
  const pendingReportsCount = reports.filter(r => r.status === "Pending").length;
  const pendingTasksCount = tasks.filter(t => t.status !== "completed").length;

  return (
    <div className="min-h-screen bg-[#F4FCF6] font-display selection:bg-[#16A34A]/20 selection:text-[#16A34A]">
      {/* Sidebar Navigation */}
      <Sidebar
        page={page}
        setPage={setPage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        reportsCount={pendingReportsCount}
        tasksCount={pendingTasksCount}
        onLogout={onLogout}
      />

      {/* Header Bar */}
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        searchValue={searchText}
        onSearchChange={(val) => {
          setSearchText(val);
          // If search is performed, route user to the search page or reports page to see live filtered results
          if (val && page !== "reports" && page !== "users") {
            setPage("reports");
          }
        }}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <main className="lg:ml-64 pt-16 min-h-screen transition-all duration-300">
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
          {loading ? (
            <div className="py-24 text-center text-slate-400 text-sm">Loading dashboard data…</div>
          ) : (
            renderActiveView()
          )}
        </div>
      </main>
    </div>
  );
}
