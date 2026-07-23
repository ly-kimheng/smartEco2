import React, { useState, useRef, useEffect } from "react";
import { User, Lock, Bell, CheckCircle, AlertCircle, DatabaseBackup, Download, Upload, TriangleAlert } from "lucide-react";
import * as api from "../../api";
import Modal from "../components/Modal";

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        position: "relative",
        width: 44,
        height: 24,
        borderRadius: 9999,
        backgroundColor: checked ? "#16A34A" : "#D1D5DB",
        border: "none",
        cursor: "pointer",
        transition: "background-color 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          backgroundColor: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

export default function SettingsView({ user, onProfileUpdated }) {
  // ── Profile ────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "" });
  const [profileStatus, setProfileStatus] = useState(null); // { type: 'ok'|'err', msg }
  const [savingProfile, setSavingProfile] = useState(false);

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileStatus(null);
    try {
      const res = await api.updateProfile({ name: profile.name, email: profile.email });
      setProfileStatus({ type: "ok", msg: "Profile updated successfully." });
      if (onProfileUpdated && res?.user) onProfileUpdated(res.user);
    } catch (err) {
      setProfileStatus({ type: "err", msg: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Password ───────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwStatus, setPwStatus] = useState(null);
  const [savingPw, setSavingPw] = useState(false);

  const savePassword = async () => {
    setPwStatus(null);
    if (!pwForm.current || !pwForm.newPw) {
      setPwStatus({ type: "err", msg: "Fill in your current and new password." });
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwStatus({ type: "err", msg: "New password must be at least 6 characters." });
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwStatus({ type: "err", msg: "New password and confirmation don't match." });
      return;
    }
    setSavingPw(true);
    try {
      await api.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwStatus({ type: "ok", msg: "Password changed successfully." });
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (err) {
      setPwStatus({ type: "err", msg: err.message });
    } finally {
      setSavingPw(false);
    }
  };

  // ── Notifications (local preference — no backend endpoint yet) ─────────
  const [notifs, setNotifs] = useState({
    newReports: true,
    taskUpdates: true,
    userSignups: false,
    weeklyDigest: true,
  });

  // ── Backup & Recovery ────────────────────────────────────────────────────
  const fileInputRef = useRef(null);
  const [backupStatus, setBackupStatus] = useState(null); // { type: 'ok'|'err', msg }
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState(null); // File chosen, awaiting confirm
  const [restoring, setRestoring] = useState(false);
  const [backupTables, setBackupTables] = useState([]);
  const [backupScope, setBackupScope] = useState("__full__"); // "__full__" or a table name

  useEffect(() => {
    api.getBackupTables().then((res) => setBackupTables(res.data || [])).catch(() => {});
  }, []);

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    setBackupStatus(null);
    try {
      const table = backupScope === "__full__" ? undefined : backupScope;
      const { filename } = await api.downloadBackup(table);
      setBackupStatus({ type: "ok", msg: `Backup downloaded as ${filename}.` });
    } catch (err) {
      setBackupStatus({ type: "err", msg: err.message });
    } finally {
      setDownloadingBackup(false);
    }
  };

  const handleFilePicked = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;
    setBackupStatus(null);
    setPendingRestoreFile(file);
  };

  const confirmRestore = async () => {
    if (!pendingRestoreFile) return;
    setRestoring(true);
    setBackupStatus(null);
    try {
      const sqlText = await pendingRestoreFile.text();
      await api.restoreBackup(sqlText);
      setBackupStatus({
        type: "ok",
        msg: `Restore complete. Reload the page to see the restored data.`,
      });
      setPendingRestoreFile(null);
    } catch (err) {
      setBackupStatus({ type: "err", msg: err.message });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm font-sans">Manage your admin profile, password, and notification preferences.</p>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2 font-sans">
          <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-[#16A34A]" />
          </div>
          Admin Profile
        </h2>
        <div className="space-y-3 font-sans">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/40 focus:border-[#16A34A]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/40 focus:border-[#16A34A]"
            />
          </div>

          {profileStatus && (
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${profileStatus.type === "ok" ? "text-green-600" : "text-red-500"}`}>
              {profileStatus.type === "ok" ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {profileStatus.msg}
            </div>
          )}

          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="px-6 py-2.5 rounded-xl bg-[#16A34A] text-white font-semibold text-sm hover:bg-[#15803D] transition-colors disabled:opacity-60"
          >
            {savingProfile ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2 font-sans">
          <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          Change Password
        </h2>
        <div className="space-y-3 font-sans">
          {[
            { key: "current", label: "Current Password" },
            { key: "newPw", label: "New Password" },
            { key: "confirm", label: "Confirm New Password" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
              <input
                type="password"
                value={pwForm[key]}
                onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/40 focus:border-[#16A34A]"
              />
            </div>
          ))}

          {pwStatus && (
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${pwStatus.type === "ok" ? "text-green-600" : "text-red-500"}`}>
              {pwStatus.type === "ok" ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {pwStatus.msg}
            </div>
          )}

          <button
            onClick={savePassword}
            disabled={savingPw}
            className="px-6 py-2.5 rounded-xl bg-[#16A34A] text-white font-semibold text-sm hover:bg-[#15803D] transition-colors disabled:opacity-60"
          >
            {savingPw ? "Updating…" : "Update Password"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2 font-sans">
          <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
            <Bell className="w-3.5 h-3.5 text-amber-500" />
          </div>
          Notification Preferences
        </h2>
        <div className="space-y-3 font-sans">
          {[
            { key: "newReports", label: "New Reports", desc: "Alert when a citizen submits a new waste report" },
            { key: "taskUpdates", label: "Task Updates", desc: "Alert when a cleanup crew updates task status" },
            { key: "userSignups", label: "New User Signups", desc: "Alert when a new citizen account is created" },
            { key: "weeklyDigest", label: "Weekly Digest", desc: "Summary email of platform activity" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
              <Toggle checked={notifs[key]} onChange={() => setNotifs({ ...notifs, [key]: !notifs[key] })} />
            </div>
          ))}
          <p className="text-xs text-slate-400 pt-1">Preferences are saved on this device.</p>
        </div>
      </div>

      {/* Backup & Recovery */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2 font-sans">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
            <DatabaseBackup className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          Data Backup &amp; Recovery
        </h2>
        <div className="space-y-4 font-sans">
          <div className="flex items-start justify-between gap-4 py-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">Download Backup</p>
              <p className="text-xs text-slate-400 mb-2">
                Exports a real, portable <code className="bg-slate-100 px-1 rounded">.sql</code> file (restorable here or with{" "}
                <code className="bg-slate-100 px-1 rounded">mysql {"<"} backup.sql</code>). <strong>Full database</strong> is
                recommended — data is linked across tables (reports ↔ users ↔ tasks, etc.), so a single-table backup won't
                capture everything on its own.
              </p>
              <select
                value={backupScope}
                onChange={(e) => setBackupScope(e.target.value)}
                className="w-full sm:w-64 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/40 focus:border-[#16A34A]"
              >
                <option value="__full__">Full database (recommended)</option>
                {backupTables.map((t) => (
                  <option key={t} value={t}>
                    Single table: {t}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleDownloadBackup}
              disabled={downloadingBackup}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#16A34A] text-white font-semibold text-sm hover:bg-[#15803D] transition-colors disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              {downloadingBackup ? "Preparing…" : "Download Backup"}
            </button>
          </div>

          <div className="flex items-start justify-between gap-4 py-2 border-t border-slate-100 pt-4">
            <div>
              <p className="text-sm font-medium text-slate-800">Restore from Backup</p>
              <p className="text-xs text-slate-400">
                Runs a downloaded <code className="bg-slate-100 px-1 rounded">.sql</code> backup against the database. A full
                backup replaces everything; a single-table backup only touches that one table.
              </p>
            </div>
            <div className="shrink-0">
              <input ref={fileInputRef} type="file" accept=".sql,text/plain,application/sql" onChange={handleFilePicked} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-slate-700 font-semibold text-sm border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Choose Backup File…
              </button>
            </div>
          </div>

          {backupStatus && (
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${backupStatus.type === "ok" ? "text-green-600" : "text-red-500"}`}>
              {backupStatus.type === "ok" ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
              {backupStatus.msg}
            </div>
          )}
        </div>
      </div>

      {/* Restore confirmation */}
      <Modal
        isOpen={!!pendingRestoreFile}
        onClose={() => (restoring ? null : setPendingRestoreFile(null))}
        title="Restore Database from Backup"
        maxWidth="sm"
      >
        <div className="space-y-4 font-sans">
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
            <TriangleAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">
              This runs the SQL in <strong>{pendingRestoreFile?.name}</strong> directly against the database. If it's a{" "}
              <strong>full backup</strong>, every table is dropped and reloaded — all current data is replaced. If it's a{" "}
              <strong>single-table backup</strong>, only that one table is affected. Either way, there's no undo from within
              the app.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setPendingRestoreFile(null)}
              disabled={restoring}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-700 font-semibold text-sm border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={confirmRestore}
              disabled={restoring}
              className="px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {restoring ? "Restoring…" : "Yes, Overwrite Everything"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
