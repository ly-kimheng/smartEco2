// src/api.js
// Central place for every call to the SmartEco backend.
// Base URL comes from VITE_API_URL (see .env) and falls back to localhost:5000.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SERVER_ORIGIN = BASE_URL.replace(/\/api\/?$/, "");

const TOKEN_KEY = "smarteco_token";
const USER_KEY = "smarteco_user";

// Report images are stored server-side and returned as relative paths like
// "/uploads/reports/xyz.jpg" — resolve them against the backend, not the
// Vite dev server the frontend itself is running on.
export function resolveAssetUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SERVER_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

// ── Session storage helpers ────────────────────────────────────────────────
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── Low level request helper ───────────────────────────────────────────────
async function request(path, { method = "GET", body, isForm = false, auth = true } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch (err) {
    throw new Error("Could not reach the SmartEco server. Is the backend running?");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body (e.g. 204)
  }

  if (!res.ok) {
    // Different controllers put the human-readable reason under different
    // keys ("message" in most places, "error" in a few like rewards/claim) —
    // check both so the real reason (e.g. "Insufficient eco-points balance")
    // actually reaches the UI instead of a generic "Request failed (400)".
    const reason = data && (data.message || data.error);
    const msg = (data && data.detail ? `${reason}: ${data.detail}` : reason) || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

// ── Auth ────────────────────────────────────────────────────────────────────
export function registerCitizen({ name, email, password }) {
  return request("/auth/register", { method: "POST", body: { name, email, password }, auth: false });
}

export function login({ email, password }) {
  return request("/auth/login", { method: "POST", body: { email, password }, auth: false });
}

export function logout() {
  return request("/auth/logout", { method: "POST" }).catch(() => {});
}

export function getProfile() {
  return request("/auth/profile");
}

export function updateProfile({ name, email }) {
  return request("/auth/profile", { method: "PUT", body: { name, email } });
}

export function changePassword({ currentPassword, newPassword }) {
  return request("/auth/password", { method: "PUT", body: { currentPassword, newPassword } });
}

// ── Reports (citizen) ───────────────────────────────────────────────────────
export function submitReport(formData) {
  // formData is a FormData instance built by the caller (supports image upload)
  return request("/reports", { method: "POST", body: formData, isForm: true });
}

export function getMyReports() {
  return request("/reports/my");
}

// How many of today's report "slots" are left, and if none, when the next
// one frees up. Used to warn the user before they fill out the whole form.
export function getReportLimitStatus() {
  return request("/reports/limit-status");
}

export function deleteMyReport(id) {
  return request(`/reports/${id}`, { method: "DELETE" });
}

// ── Voting ───────────────────────────────────────────────────────────────────
export function getVotableReports() {
  return request("/reports/votable");
}

export function getCommunityStats() {
  return request("/reports/community-stats");
}

export function voteReport(id) {
  return request(`/reports/${id}/vote`, { method: "POST" });
}

export function unvoteReport(id) {
  return request(`/reports/${id}/vote`, { method: "DELETE" });
}

// ── Feedback ─────────────────────────────────────────────────────────────────
export function submitFeedback(reportId, { rating, comment }) {
  return request(`/reports/${reportId}/feedback`, { method: "POST", body: { rating, comment } });
}

export function getReportFeedback(reportId) {
  return request(`/reports/${reportId}/feedback`);
}

// ── Notifications ────────────────────────────────────────────────────────────
export function getNotifications() {
  return request("/notifications");
}

export function markNotificationRead(id) {
  return request(`/notifications/${id}/read`, { method: "PATCH" });
}

export function deleteNotification(id) {
  return request(`/notifications/${id}`, { method: "DELETE" });
}

// ── Admin ───────────────────────────────────────────────────────────────────
export function getAdminStats() {
  return request("/admin/stats");
}

export function getAdminReports() {
  return request("/admin/reports");
}

export function getAdminReportDetail(reportId) {
  return request(`/admin/reports/${reportId}`);
}

export function getAdminUsers() {
  return request("/admin/users");
}

export function reassignReportCrew(reportId, { assignedTo, priority }) {
  return request(`/admin/reports/${reportId}/assign`, { method: "PATCH", body: { assignedTo, priority } });
}

// Admin override for the after-cleanup photo — normally set by the cleanup
// team on task completion; admin can replace a bad photo or remove it.
export function replaceReportAfterImage(reportId, afterImageFile) {
  const fd = new FormData();
  fd.append("afterImage", afterImageFile);
  return request(`/admin/reports/${reportId}/after-image`, { method: "PATCH", body: fd, isForm: true });
}

export function removeReportAfterImage(reportId) {
  return request(`/admin/reports/${reportId}/after-image`, { method: "DELETE" });
}

export function updateAdminReportStatus(reportId, status) {
  return request(`/admin/reports/${reportId}/status`, { method: "PATCH", body: { status } });
}

// Admins are authorized (see BackEnd reportController) to delete any report via this route.
export function deleteAdminReport(reportId) {
  return request(`/reports/${reportId}`, { method: "DELETE" });
}

// ── Backup & Recovery ────────────────────────────────────────────────────────
// List of table names available for a single-table backup (full database is
// the default/recommended option — see the Settings page).
export function getBackupTables() {
  return request("/admin/backup/tables");
}

// Downloads a .sql backup and saves it to the user's device. Pass a table
// name to back up just that table; omit it for the full database (default).
// Bypasses the request() helper because the response is a raw file, not a
// { success, data } JSON envelope.
export async function downloadBackup(table) {
  const token = getToken();
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const qs = table ? `?table=${encodeURIComponent(table)}` : "";

  let res;
  try {
    res = await fetch(`${BASE_URL}/admin/backup${qs}`, { headers });
  } catch (err) {
    throw new Error("Could not reach the SmartEco server. Is the backend running?");
  }

  if (!res.ok) {
    let msg = `Backup failed (${res.status})`;
    try {
      const data = await res.json();
      msg = data.error || data.message || msg;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new Error(msg);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : `smarteco_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.sql`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return { filename };
}

// Restores the database from a previously downloaded .sql backup file.
// `sqlText` is the raw file contents (read by the caller with file.text()).
export function restoreBackup(sqlText) {
  return request("/admin/backup/restore", { method: "POST", body: { sql: sqlText } });
}

// Cleanup crew list, used to populate the "assignee" dropdown when dispatching a task.
export function getCleanupTeamList() {
  return request("/admin/cleanup-team");
}

// Every dispatched cleanup task (admin view).
export function getAdminTasks() {
  return request("/admin/tasks");
}

// Dispatch a cleanup crew to a task. Auto-notifies the crew member (and the
// citizen reporter, if reportId is supplied) on the backend.
export function assignTask({ reportId, assignedTo, title, description, location, priority }) {
  return request("/admin/tasks", {
    method: "POST",
    body: { reportId, assignedTo, title, description, location, priority },
  });
}

// ── Rewards ──────────────────────────────────────────────────────────────────
// Full catalog, ordered cheapest-first by the backend.
export function getRewards() {
  return request("/rewards");
}

// Redeems one unit of a reward for the logged-in citizen. Backend checks the
// caller's real points balance and stock server-side — never trust a client
// -side "canAfford" check alone, since points/stock can change between page
// load and the click.
export function claimReward(rewardId) {
  return request("/rewards/claim", { method: "POST", body: { rewardId } });
}

// Every voucher the logged-in citizen has ever redeemed (Active + Redeemed),
// newest first — this is what keeps a redeemed reward visible/available
// until the person actually uses it, instead of only flashing once.
export function getMyVouchers() {
  return request("/rewards/my-vouchers");
}

// Admin-only catalog management (backend enforces the admin role regardless).
// `imageFile` is an optional File object from an <input type="file">; when
// present it's uploaded as multipart form data and takes priority over
// `imageUrl` on the backend. Pass just `imageUrl` (a pasted link) if you'd
// rather not upload a file.
export function createReward({ title, description, pointsRequired, imageUrl, imageFile, stock }) {
  if (imageFile) {
    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description || "");
    fd.append("pointsRequired", pointsRequired);
    fd.append("stock", stock ?? 0);
    fd.append("image", imageFile);
    return request("/rewards/add", { method: "POST", body: fd, isForm: true });
  }
  return request("/rewards/add", {
    method: "POST",
    body: { title, description, pointsRequired, imageUrl, stock },
  });
}

export function updateReward(id, { title, description, pointsRequired, imageUrl, imageFile, stock }) {
  if (imageFile) {
    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description || "");
    fd.append("pointsRequired", pointsRequired);
    fd.append("stock", stock ?? 0);
    fd.append("image", imageFile);
    return request(`/rewards/${id}`, { method: "PUT", body: fd, isForm: true });
  }
  return request(`/rewards/${id}`, {
    method: "PUT",
    body: { title, description, pointsRequired, imageUrl, stock },
  });
}

export function deleteReward(id) {
  return request(`/rewards/${id}`, { method: "DELETE" });
}

// ── Tips & Guides ────────────────────────────────────────────────────────────
// Admins get every guide (including unpublished drafts); everyone else only
// sees published ones — the backend decides which based on req.user.role.
export function getGuides() {
  return request("/guides");
}

export function createGuide({ title, category, content, imageUrl, imageFile, isPublished }) {
  if (imageFile) {
    const fd = new FormData();
    fd.append("title", title);
    fd.append("category", category || "General");
    fd.append("content", content);
    fd.append("isPublished", isPublished === undefined ? true : isPublished);
    fd.append("image", imageFile);
    return request("/guides", { method: "POST", body: fd, isForm: true });
  }
  return request("/guides", {
    method: "POST",
    body: { title, category, content, imageUrl, isPublished },
  });
}

export function updateGuide(id, { title, category, content, imageUrl, imageFile, isPublished }) {
  if (imageFile) {
    const fd = new FormData();
    fd.append("title", title);
    fd.append("category", category || "General");
    fd.append("content", content);
    fd.append("isPublished", isPublished === undefined ? true : isPublished);
    fd.append("image", imageFile);
    return request(`/guides/${id}`, { method: "PUT", body: fd, isForm: true });
  }
  return request(`/guides/${id}`, {
    method: "PUT",
    body: { title, category, content, imageUrl, isPublished },
  });
}

export function deleteGuide(id) {
  return request(`/guides/${id}`, { method: "DELETE" });
}

// ── Cleanup Team ─────────────────────────────────────────────────────────────
export function getCleanupTasks() {
  return request("/cleanup-team/tasks");
}

export function updateCleanupTaskStatus(taskId, status, progress) {
  return request(`/cleanup-team/tasks/${taskId}/status`, { method: "PATCH", body: { status, progress } });
}

export function completeCleanupTask(taskId, afterImageFile) {
  const fd = new FormData();
  fd.append("afterImage", afterImageFile);
  return request(`/cleanup-team/tasks/${taskId}/complete`, { method: "PATCH", body: fd, isForm: true });
}
