import { useState, useEffect } from "react";
import { Eye, Edit, Trash2, X, CheckCircle, Save, AlertTriangle, Star, ImageOff, Clock, MapPin } from "lucide-react";
import { cn, statusColor, statusLabel } from "../utils";
import * as api from "../api";

const WASTE_TYPES = ["Illegal Dumping", "Overflowing Bin", "Hazardous Waste", "Construction Waste", "Litter", "Sewage"];
const DISTRICTS = ["Russey Keo", "Prek Leap", "Chroy Changvar", "Chbar Ampov", "Boeng Keng Kang"];

const ONE_HOUR_MS = 60 * 60 * 1000;

// Backend statuses (Pending/Approved/Assigned/Resolved/Rejected) collapse into
// the 3 buckets this UI already knows how to color/label.
function toUiStatus(backendStatus) {
  if (backendStatus === "Resolved") return "resolved";
  if (backendStatus === "Approved" || backendStatus === "Assigned") return "in_progress";
  return "pending";
}

function mapRow(row) {
  return {
    id: `RPT-${String(row.id).padStart(3, "0")}`,
    rawId: row.id,
    type: row.category,
    location: row.location,
    status: toUiStatus(row.status),
    date: (row.reported_date || row.created_at || "").toString().slice(0, 10),
    title: row.title,
    description: row.description,
    imageUrl: row.image_url ? api.resolveAssetUrl(row.image_url) : null,
    afterImageUrl: row.after_image_url ? api.resolveAssetUrl(row.after_image_url) : null,
    createdAt: row.created_at,
  };
}

function minutesLeftToDelete(createdAt) {
  if (!createdAt) return 0;
  const elapsed = Date.now() - new Date(createdAt).getTime();
  const remaining = ONE_HOUR_MS - elapsed;
  return Math.max(0, Math.ceil(remaining / 60000));
}

export default function MyReportsPage({ focusReportId, onFocusHandled }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewReport, setViewReport] = useState(null);
  const [editReport, setEditReport] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getMyReports()
      .then((data) => { if (!cancelled) setReports((data.reports || []).map(mapRow)); })
      .catch((err) => {
        if (cancelled) return;
        // Don't surface raw server errors to the user — just show the empty state.
        console.warn("Could not load reports:", err.message);
        setReports([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Deep-link from a "cleanup completed" notification straight into that report's detail view.
  useEffect(() => {
    if (!focusReportId || reports.length === 0) return;
    const target = reports.find((r) => r.rawId === focusReportId);
    if (target) setViewReport(target);
    onFocusHandled?.();
  }, [focusReportId, reports]); // eslint-disable-line react-hooks/exhaustive-deps

  const openView = (r) => setViewReport(r);
  const openEdit = (r) => { setEditReport(r); setEditForm({ ...r }); setSaved(false); };
  const openDelete = (id) => setDeleteId(id);

  const handleSave = () => {
    // Note: the backend doesn't expose a citizen "edit report" endpoint yet,
    // so this updates the view locally only (it will reset on next reload).
    setReports((prev) => prev.map((r) => r.id === editForm.id ? { ...editForm } : r));
    setSaved(true);
    setTimeout(() => { setEditReport(null); setSaved(false); }, 900);
  };

  const handleDelete = async () => {
    const target = reports.find((r) => r.id === deleteId);
    setDeleteId(null);
    if (!target) return;
    const prevReports = reports;
    setReports((prev) => prev.filter((r) => r.id !== target.id));
    try {
      await api.deleteMyReport(target.rawId);
    } catch (err) {
      setReports(prevReports); // revert on failure
      alert(`Could not delete report: ${err.message}`);
    }
  };

  const canDelete = (r) => minutesLeftToDelete(r.createdAt) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Track the waste reports you've submitted.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading your reports…</div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Trash2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No recent report</p>
            <p className="text-xs text-gray-300 mt-1">Reports you submit will show up here.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Report ID", "Waste Type", "Location", "Status", "Date", "Actions"].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reports.map((r) => {
                    const deletable = canDelete(r);
                    return (
                      <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{r.id}</td>
                        <td className="px-6 py-4 font-medium text-gray-800">{r.type}</td>
                        <td className="px-6 py-4 text-gray-500">{r.location}</td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", statusColor(r.status))}>
                            {statusLabel(r.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{r.date}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openView(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View"><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                            <button
                              onClick={() => deletable && openDelete(r.id)}
                              disabled={!deletable}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                deletable ? "text-gray-400 hover:text-red-600 hover:bg-red-50" : "text-gray-200 cursor-not-allowed"
                              )}
                              title={deletable ? "Delete" : "Deletion window (1 hour) has passed"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-50">
              {reports.map((r) => {
                const deletable = canDelete(r);
                return (
                  <div key={r.id} className="px-5 py-4">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{r.type}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.id} · {r.date}</p>
                      </div>
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", statusColor(r.status))}>
                        {statusLabel(r.status)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.location}</p>
                    <div className="flex gap-2">
                      <button onClick={() => openView(r)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors">
                        <Eye className="w-3 h-3" /> View
                      </button>
                      <button onClick={() => openEdit(r)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:border-amber-300 hover:text-amber-600 transition-colors">
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => deletable && openDelete(r.id)}
                        disabled={!deletable}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs transition-colors",
                          deletable ? "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600" : "border-gray-100 text-gray-300 cursor-not-allowed"
                        )}
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── View Modal ── */}
      {viewReport && (
        <ReportDetailModal
          report={viewReport}
          onClose={() => setViewReport(null)}
        />
      )}

      {/* ── Edit Modal ── */}
      {editReport && (
        <Modal onClose={() => setEditReport(null)}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Edit Report</h2>
            <button onClick={() => setEditReport(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">WASTE TYPE</label>
              <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} className={fieldCls}>
                {WASTE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">DISTRICT</label>
              <select value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} className={fieldCls}>
                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                {/* keep existing location even if not in district list */}
                {!DISTRICTS.includes(editForm.location) && <option value={editForm.location}>{editForm.location}</option>}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">DATE</label>
              <input type="text" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className={fieldCls} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all",
                saved ? "bg-green-100 text-green-700" : "bg-[#22C55E] text-white hover:bg-[#16A34A]"
              )}
            >
              {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
            <button onClick={() => setEditReport(null)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteId && (
        <Modal onClose={() => setDeleteId(null)}>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Report?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete <strong>{deleteId}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors">
                Yes, Delete
              </button>
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Detail modal: before/after photos + feedback for completed cleanups ─────
function ReportDetailModal({ report, onClose }) {
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const isResolved = report.status === "resolved";
  const alreadyGaveFeedback = feedbackList.length > 0;

  useEffect(() => {
    if (!isResolved) return;
    let cancelled = false;
    setFeedbackLoading(true);
    api.getReportFeedback(report.rawId)
      .then((data) => { if (!cancelled) setFeedbackList(data.feedback || []); })
      .catch(() => {}) // feedback is optional; ignore failures
      .finally(() => { if (!cancelled) setFeedbackLoading(false); });
    return () => { cancelled = true; };
  }, [isResolved, report.rawId]);

  const handleSubmitFeedback = async () => {
    if (!rating) { setSubmitError("Please choose a star rating"); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await api.submitFeedback(report.rawId, { rating, comment });
      setFeedbackList((prev) => [result.feedback, ...prev]);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} wide>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900">Report Details</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
      </div>

      <div className="space-y-3">
        <Row label="Report ID" value={<span className="font-mono text-xs">{report.id}</span>} />
        <Row label="Waste Type" value={report.type} />
        <Row label="Location" value={report.location} />
        <Row label="Date" value={report.date} />
        <Row label="Status" value={
          <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", statusColor(report.status))}>
            {statusLabel(report.status)}
          </span>
        } />
      </div>

      {/* Before / after photos */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Before</p>
          {report.imageUrl ? (
            <img src={report.imageUrl} alt="Before cleanup" className="w-full h-32 object-cover rounded-xl border border-gray-100" />
          ) : (
            <div className="w-full h-32 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-300">
              <ImageOff className="w-6 h-6" />
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">After cleanup</p>
          {report.afterImageUrl ? (
            <img src={report.afterImageUrl} alt="After cleanup" className="w-full h-32 object-cover rounded-xl border border-gray-100" />
          ) : (
            <div className="w-full h-32 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xs text-center px-2">
              {isResolved ? "No photo uploaded" : "Pending cleanup"}
            </div>
          )}
        </div>
      </div>

      {/* Feedback */}
      {isResolved && report.afterImageUrl && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-800 mb-2">Your feedback</p>
          {feedbackLoading ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : alreadyGaveFeedback ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={cn("w-4 h-4", i <= feedbackList[0].rating ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
                ))}
              </div>
              {feedbackList[0].comment && <p className="text-sm text-gray-600">{feedbackList[0].comment}</p>}
              <p className="text-xs text-gray-400 mt-1">Thanks for letting us know!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} onClick={() => setRating(i)}>
                    <Star className={cn("w-6 h-6 transition-colors", i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200 hover:text-amber-200")} />
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How did the cleanup go? (optional)"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
              />
              {submitError && <p className="text-xs text-red-500">{submitError}</p>}
              <button
                onClick={handleSubmitFeedback}
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-[#22C55E] text-white font-semibold text-sm hover:bg-[#16A34A] transition-colors disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit Feedback"}
              </button>
            </div>
          )}
        </div>
      )}

      <button onClick={onClose} className="mt-6 w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors">Close</button>
    </Modal>
  );
}

const fieldCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]";

function Modal({ children, onClose, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative bg-white rounded-3xl shadow-2xl w-full p-6 z-10 max-h-[90vh] overflow-y-auto", wide ? "max-w-md" : "max-w-sm")}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-gray-700 font-medium">{value}</span>
    </div>
  );
}
