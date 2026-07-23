import React, { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle, Clock, UserCheck, Flame } from "lucide-react";
import Badge from "../components/Badge";
import Modal from "../components/Modal";

export default function TasksView({ tasks, cleanupCrew = [], reports = [], onAssignTask, prefillReportId, onPrefillConsumed }) {
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [taskForm, setTaskForm] = useState({
    task: "",
    description: "",
    reportId: "",
    assignedTo: "",
    location: "",
    priority: "medium",
  });

  const resetForm = () =>
    setTaskForm({ task: "", description: "", reportId: "", assignedTo: "", location: "", priority: "medium" });

  // Picking a related report auto-fills location so admins don't retype it.
  const handleReportChange = (reportId) => {
    const report = reports.find((r) => String(r.rawId) === String(reportId));
    setTaskForm((prev) => ({
      ...prev,
      reportId,
      location: report ? report.location : prev.location,
      task: prev.task || (report ? report.title : prev.task),
    }));
  };

  // A high-vote report was flagged from the Reports tab — jump straight into
  // the assign modal with it pre-selected and priority bumped to High.
  useEffect(() => {
    if (!prefillReportId) return;
    const report = reports.find((r) => String(r.rawId) === String(prefillReportId));
    if (report) {
      setTaskForm((prev) => ({
        ...prev,
        reportId: prefillReportId,
        location: report.location,
        task: prev.task || report.title,
        priority: "high",
      }));
      setShowAdd(true);
    }
    onPrefillConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillReportId, reports]);

  const addTask = async () => {
    if (!taskForm.task || !taskForm.assignedTo || !taskForm.location) {
      alert("Please enter a task description, crew assignee, and location.");
      return;
    }
    setSubmitting(true);
    try {
      await onAssignTask({
        reportId: taskForm.reportId || null,
        assignedTo: taskForm.assignedTo,
        title: taskForm.task,
        description: taskForm.description || null,
        location: taskForm.location,
        priority: taskForm.priority,
      });
      resetForm();
      setShowAdd(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">
            Cleanup Tasks
          </h1>
          <p className="text-slate-500 text-sm font-sans">
            Dispatch municipal sanitation crews, schedule hazardous collections, and monitor resolution timelines.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#16A34A] text-white text-sm font-semibold hover:bg-[#15803d] transition-colors shadow-xs hover:shadow-md cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Assign Cleanup Task</span>
        </button>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-emerald-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left font-sans">
            <thead>
              <tr className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100 bg-slate-50/20">
                <th className="px-6 py-4">Task Details</th>
                <th className="px-6 py-4 hidden md:table-cell">Associated Report ID</th>
                <th className="px-6 py-4">Crew/Assignee</th>
                <th className="px-6 py-4 hidden md:table-cell">Last Update</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tasks.map(t => (
                <tr key={t.id} className="hover:bg-emerald-50/10 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900 group-hover:text-[#16A34A] transition-colors">
                      {t.task}
                    </p>
                    <p className="text-xs text-slate-400 font-mono font-bold mt-1 uppercase tracking-wider">{t.id}</p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="font-mono text-xs bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600 font-bold border border-slate-200/50">
                      {t.report}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5 text-sm">
                      <UserCheck className="w-4 h-4 text-slate-400" />
                      <span>{t.assignee}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-slate-500 font-sans font-medium">
                    {t.due}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 min-w-[110px]">
                      <Badge label={t.status} />
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#16A34A] transition-all"
                            style={{ width: `${t.progress ?? 0}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 tabular-nums">{t.progress ?? 0}%</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tasks.length === 0 && (
            <div className="text-center py-12 px-4 space-y-1">
              <p className="text-slate-400 font-semibold">No cleanup tasks dispatched</p>
              <p className="text-slate-400 text-xs">Click "Assign Cleanup Task" to deploy your team.</p>
            </div>
          )}
        </div>
      </div>

      {/* Note: status changes (in progress / completed) are driven by the cleanup
          team from their own app once a task is dispatched, and flow back here
          automatically via notifications + the next data refresh. */}

      {/* Task Creation Modal */}
      <Modal
        title="Deploy Cleanup Crew"
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        maxWidth="md"
      >
        <div className="space-y-4 font-sans">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">Task Description</label>
            <input
              type="text"
              value={taskForm.task}
              onChange={e => setTaskForm(prev => ({ ...prev, task: e.target.value }))}
              placeholder="e.g. Remove mattress at 44 Elm St"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-700 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">Related Report (Optional)</label>
            <select
              value={taskForm.reportId}
              onChange={e => handleReportChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-700 bg-white"
            >
              <option value="">— None —</option>
              {reports.map(r => (
                <option key={r.rawId} value={r.rawId}>
                  {r.id} — {r.title}{r.voteCount ? ` (${r.voteCount} votes)` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">Crew Assignee</label>
              <select
                value={taskForm.assignedTo}
                onChange={e => setTaskForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-700 bg-white"
              >
                <option value="">Select crew…</option>
                {cleanupCrew.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.district ? ` — ${c.district}` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">Priority</label>
              <select
                value={taskForm.priority}
                onChange={e => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-700 bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">Location</label>
            <input
              type="text"
              value={taskForm.location}
              onChange={e => setTaskForm(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g. Prek Leap"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-700 placeholder-slate-400"
            />
          </div>

          <button
            onClick={addTask}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#16A34A] text-white font-bold text-sm hover:bg-[#15803d] transition-all shadow-xs hover:shadow-md cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Dispatching…" : "Deploy Dispatch Team"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
