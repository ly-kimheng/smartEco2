import React, { useState, useEffect, useRef } from "react";
import { Search, Eye, CheckCircle, XCircle, Trash2, RefreshCw, AlertTriangle, Calendar, MapPin, User as UserIcon, Tag, Camera, Star, ImageOff, Upload, ThumbsUp, Flame } from "lucide-react";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import Avatar from "../components/Avatar";
import * as api from "../../api";

const PRIORITY_COLORS = {
  High: "text-rose-500",
  Medium: "text-amber-500",
  Low: "text-slate-400"
};

const FILTERS = ["All", "Pending", "Approved", "Assigned", "Resolved", "Rejected"];

// The quick-action pills in the report detail popup used to include
// "Assigned" as a one-click status, which silently auto-picked a crew
// member behind the scenes (district match, or whoever was least busy) with
// no way to see who it landed on before it happened — confusing, and it
// duplicated the explicit "Assign / Reassign Cleanup Crew" picker below it,
// which lets the admin choose exactly who gets it. Keeping just the one.
const QUICK_ACTION_STATUSES = FILTERS.filter((f) => f !== "All" && f !== "Assigned");

// Reports at/above this many community votes are flagged as high demand so
// admins know to prioritize a cleanup task for them.
const HIGH_VOTE_THRESHOLD = 15;

export default function ReportsView({ reports, setReports, onReplaceAfterImage, onRemoveAfterImage, onPrioritize, cleanupCrew = [], onReassign }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [viewReport, setViewReport] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [assignForm, setAssignForm] = useState({ assignedTo: "", priority: "medium" });
  const [savingAssignment, setSavingAssignment] = useState(false);
  const fileInputRef = useRef(null);

  // Prefill the assignment form with whatever this report is currently set
  // to whenever a different report is opened.
  useEffect(() => {
    if (!viewReport) return;
    setAssignForm({
      assignedTo: viewReport.assignedTo ? String(viewReport.assignedTo) : "",
      priority: (viewReport.priority || "medium").toLowerCase(),
    });
  }, [viewReport]);

  const handleSaveAssignment = async () => {
    if (!viewReport) return;
    setSavingAssignment(true);
    try {
      await onReassign?.(viewReport.rawId, {
        assignedTo: assignForm.assignedTo || null,
        priority: assignForm.priority,
      });
    } finally {
      setSavingAssignment(false);
    }
  };

  // Fetch citizen feedback for the report currently open in the modal
  useEffect(() => {
    if (!viewReport) { setFeedback([]); return; }
    if (viewReport.status !== "Resolved") { setFeedback([]); return; }
    let cancelled = false;
    setFeedbackLoading(true);
    api.getAdminReportDetail(viewReport.rawId)
      .then((res) => { if (!cancelled) setFeedback(res.data?.feedback || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setFeedbackLoading(false); });
    return () => { cancelled = true; };
  }, [viewReport]);

  const handlePickAfterPhoto = () => fileInputRef.current?.click();

  const handleAfterPhotoSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !viewReport) return;
    setSavingPhoto(true);
    try {
      await onReplaceAfterImage?.(viewReport.id, file);
      setViewReport((curr) => curr ? { ...curr, afterImageUrl: URL.createObjectURL(file) } : null);
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleRemoveAfterPhoto = async () => {
    if (!viewReport) return;
    if (!confirm("Remove the after-cleanup photo from this report?")) return;
    setSavingPhoto(true);
    try {
      await onRemoveAfterImage?.(viewReport.id);
      setViewReport((curr) => curr ? { ...curr, afterImageUrl: null } : null);
    } finally {
      setSavingPhoto(false);
    }
  };

  // Filter & Search Logic
  const filtered = reports.filter(r => {
    const matchesFilter = filter === "All" || r.status === filter;
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const updateStatus = (id, status) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    if (viewReport && viewReport.id === id) {
      setViewReport(curr => curr ? { ...curr, status } : null);
    }
  };

  const deleteReport = (id) => {
    if (confirm(`Are you sure you want to delete report ${id}?`)) {
      setReports(prev => prev.filter(r => r.id !== id));
      if (viewReport && viewReport.id === id) {
        setViewReport(null);
      }
    }
  };

  const resetReports = () => {
    setSearch("");
    setFilter("All");
  };

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">
            Waste Reports
          </h1>
          <p className="text-slate-500 text-sm font-sans">
            Review, approve, assign crews, or reject submitted community waste reports.
          </p>
        </div>
        <button
          onClick={resetReports}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Reports Table Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-emerald-50 overflow-hidden">
        {/* Search & Tabs bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, title, location..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-700 placeholder-slate-400 transition-all duration-150"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filter === f
                    ? "bg-[#16A34A] text-white shadow-xs"
                    : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left font-sans">
            <thead>
              <tr className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100 bg-slate-50/20">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Title / Location</th>
                <th className="px-6 py-4 hidden md:table-cell">Category</th>
                <th className="px-6 py-4 hidden lg:table-cell">Reporter</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 hidden md:table-cell">Priority</th>
                <th className="px-6 py-4 hidden sm:table-cell">Votes</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-emerald-50/10 transition-colors group">
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs font-bold">{r.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900 leading-snug group-hover:text-[#16A34A] transition-colors">
                      {r.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{r.location}</span>
                    </p>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium hidden md:table-cell">
                    {r.category}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={r.reporterInitials} />
                      <span className="font-semibold text-slate-700">{r.reporter}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge label={r.status} />
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className={`font-bold flex items-center gap-1 ${PRIORITY_COLORS[r.priority]}`}>
                      {r.priority === "High" && <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />}
                      <span>{r.priority}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className={`flex items-center gap-1.5 font-bold text-xs px-2 py-1 rounded-lg w-fit ${
                      r.voteCount >= HIGH_VOTE_THRESHOLD
                        ? "bg-rose-50 text-rose-600"
                        : "bg-slate-50 text-slate-500"
                    }`}>
                      {r.voteCount >= HIGH_VOTE_THRESHOLD
                        ? <Flame className="w-3.5 h-3.5" />
                        : <ThumbsUp className="w-3.5 h-3.5" />}
                      {r.voteCount || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setViewReport(r)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {r.voteCount >= HIGH_VOTE_THRESHOLD && r.status !== "Resolved" && (
                        <button
                          onClick={() => onPrioritize?.(r.rawId)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="High demand — assign a cleanup task"
                        >
                          <Flame className="w-4 h-4" />
                        </button>
                      )}
                      {r.status === "Pending" && (
                        <>
                          <button
                            onClick={() => updateStatus(r.id, "Approved")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#16A34A] hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Approve Report"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(r.id, "Rejected")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Reject Report"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteReport(r.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 px-4 space-y-2">
              <p className="text-slate-400 font-semibold text-base">No reports found matching your filters</p>
              <p className="text-slate-400 text-xs">Try adjusting your filters or search keywords.</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Viewer Modal */}
      <Modal
        title={`Report Details — ${viewReport?.id}`}
        isOpen={!!viewReport}
        onClose={() => setViewReport(null)}
        maxWidth="md"
      >
        {viewReport && (
          <div className="space-y-5">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
              <div>
                <span className="text-[10px] tracking-wider uppercase font-extrabold text-slate-400">Title</span>
                <p className="font-display font-bold text-slate-900 text-lg leading-snug mt-0.5">
                  {viewReport.title}
                </p>
              </div>

              {viewReport.description && (
                <div>
                  <span className="text-[10px] tracking-wider uppercase font-extrabold text-slate-400">Description</span>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed font-sans">
                    {viewReport.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border-t border-slate-200/60 pt-4 font-sans">
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location</span>
                    <span className="font-semibold text-slate-800">{viewReport.location}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date Reported</span>
                    <span className="font-semibold text-slate-800">{viewReport.date}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <Tag className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</span>
                    <span className="font-semibold text-slate-800">{viewReport.category}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <UserIcon className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reporter</span>
                    <span className="font-semibold text-slate-800">{viewReport.reporter}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/60 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                  <Badge label={viewReport.status} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority:</span>
                  <span className={`font-bold text-sm ${PRIORITY_COLORS[viewReport.priority]}`}>{viewReport.priority}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Votes:</span>
                  <span className={`font-bold text-sm flex items-center gap-1 ${
                    (viewReport.voteCount || 0) >= HIGH_VOTE_THRESHOLD ? "text-rose-500" : "text-slate-700"
                  }`}>
                    {(viewReport.voteCount || 0) >= HIGH_VOTE_THRESHOLD && <Flame className="w-3.5 h-3.5" />}
                    {viewReport.voteCount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Before / After photos */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] tracking-wider uppercase font-extrabold text-slate-400 block mb-1.5">Before</span>
                {viewReport.imageUrl ? (
                  <img src={viewReport.imageUrl} alt="Before cleanup" className="w-full h-32 object-cover rounded-xl border border-slate-100" />
                ) : (
                  <div className="w-full h-32 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                    <ImageOff className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div>
                <span className="text-[10px] tracking-wider uppercase font-extrabold text-slate-400 block mb-1.5">After cleanup</span>
                {viewReport.afterImageUrl ? (
                  <div className="relative group">
                    <img src={viewReport.afterImageUrl} alt="After cleanup" className="w-full h-32 object-cover rounded-xl border border-slate-100" />
                    {/* Admin can override the crew's photo — replace or remove it */}
                    <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={handlePickAfterPhoto}
                        disabled={savingPhoto}
                        title="Replace photo"
                        className="p-2 rounded-full bg-white/90 text-slate-700 hover:bg-white hover:text-[#16A34A] transition-colors disabled:opacity-60"
                      >
                        {savingPhoto ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={handleRemoveAfterPhoto}
                        disabled={savingPhoto}
                        title="Remove photo"
                        className="p-2 rounded-full bg-white/90 text-slate-700 hover:bg-white hover:text-rose-500 transition-colors disabled:opacity-60"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-300 px-2 text-center">
                    <Camera className="w-5 h-5" />
                    <span className="text-[11px] font-medium text-slate-400">Awaiting cleanup team photo</span>
                    <button
                      onClick={handlePickAfterPhoto}
                      disabled={savingPhoto}
                      className="text-[11px] font-semibold text-[#16A34A] hover:underline disabled:opacity-60"
                    >
                      {savingPhoto ? "Uploading…" : "Upload manually instead"}
                    </button>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAfterPhotoSelected} />
              </div>
            </div>

            {/* Citizen feedback */}
            {viewReport.status === "Resolved" && (
              <div className="border-t border-slate-200/60 pt-4">
                <span className="text-[10px] tracking-wider uppercase font-extrabold text-slate-400 block mb-2">Citizen Feedback</span>
                {feedbackLoading ? (
                  <p className="text-xs text-slate-400">Loading…</p>
                ) : feedback.length === 0 ? (
                  <p className="text-xs text-slate-400">No feedback submitted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {feedback.map((f) => (
                      <div key={f.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-700">{f.user_name || "Citizen"}</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i <= f.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                            ))}
                          </div>
                        </div>
                        {f.comment && <p className="text-xs text-slate-600">{f.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cleanup progress — reported live by the cleanup-team app */}
            {viewReport.taskProgress !== null && viewReport.taskProgress !== undefined && (
              <div className="border-t border-slate-200/60 pt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] tracking-wider uppercase font-extrabold text-slate-400">Cleanup Progress</span>
                  <span className="text-xs font-bold text-slate-600 tabular-nums">{viewReport.taskProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#16A34A] transition-all" style={{ width: `${viewReport.taskProgress}%` }} />
                </div>
              </div>
            )}

            {/* Assign / reassign cleanup crew — editable any time, not just at first dispatch */}
            {viewReport.status !== "Resolved" && viewReport.status !== "Rejected" && (
              <div className="border-t border-slate-200/60 pt-4 space-y-2">
                <span className="text-[10px] tracking-wider uppercase font-extrabold text-slate-400 block">
                  Assign / Reassign Cleanup Crew
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={assignForm.assignedTo}
                    onChange={(e) => setAssignForm((f) => ({ ...f, assignedTo: e.target.value }))}
                    className="text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
                  >
                    <option value="">Unassigned</option>
                    {cleanupCrew.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.district ? ` — ${c.district}` : ""}</option>
                    ))}
                  </select>
                  <select
                    value={assignForm.priority}
                    onChange={(e) => setAssignForm((f) => ({ ...f, priority: e.target.value }))}
                    className="text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
                  >
                    <option value="low">Low priority</option>
                    <option value="medium">Medium priority</option>
                    <option value="high">High priority</option>
                  </select>
                </div>
                <button
                  onClick={handleSaveAssignment}
                  disabled={savingAssignment}
                  className="w-full py-2 rounded-xl bg-[#16A34A] text-white text-xs font-bold hover:bg-[#15803d] transition-colors disabled:opacity-60"
                >
                  {savingAssignment ? "Saving…" : viewReport.assigneeName ? "Update Assignment" : "Assign Crew"}
                </button>
                {viewReport.assigneeName && (
                  <p className="text-[11px] text-slate-400">Currently assigned to <span className="font-semibold text-slate-600">{viewReport.assigneeName}</span></p>
                )}
              </div>
            )}

            {/* Quick Actions Panel */}
            <div className="space-y-2">
              <span className="text-[10px] tracking-wider uppercase font-extrabold text-slate-400 block mb-1">
                Update Report Status
              </span>
              <div className="flex gap-2 flex-wrap">
                {QUICK_ACTION_STATUSES.map(status => (
                  <button
                    key={status}
                    onClick={() => updateStatus(viewReport.id, status)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex-1 ${
                      viewReport.status === status
                        ? "bg-[#16A34A] text-white border-[#16A34A] shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:border-[#16A34A] hover:bg-emerald-50/20"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
