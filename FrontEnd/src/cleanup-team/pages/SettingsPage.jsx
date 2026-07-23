import { useState } from "react";
import { C, ICONS } from "../constants";
import { Icon } from "../components/UI";
import * as api from "../../api";

function StatusLine({ status }) {
  if (!status) return null;
  const ok = status.type === "ok";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: ok ? C.em7 : "#dc2626" }}>
      <Icon d={ok ? ICONS.checkCircle : ICONS.alertCircle} size={14} color={ok ? C.em7 : "#dc2626"} />
      {status.msg}
    </div>
  );
}

export default function SettingsPage({ authUser, onBack, onLogout, onProfileUpdated }) {
  // ── Profile (name only — email is assigned by the admin and stays fixed) ──
  const [name, setName] = useState(authUser.name || "");
  const [profileStatus, setProfileStatus] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const saveProfile = async () => {
    if (!name.trim()) { setProfileStatus({ type: "err", msg: "Name can't be empty." }); return; }
    setSavingProfile(true);
    setProfileStatus(null);
    try {
      const res = await api.updateProfile({ name: name.trim() });
      setProfileStatus({ type: "ok", msg: "Name updated successfully." });
      if (res?.user) onProfileUpdated?.(res.user);
    } catch (err) {
      setProfileStatus({ type: "err", msg: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Password ──
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

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 9, border: `1px solid ${C.g2}`,
    background: C.g0, fontSize: 13, color: C.g9, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: C.g7, display: "block", marginBottom: 5 };
  const cardStyle = { background: C.w, borderRadius: 14, border: `1px solid ${C.bd}`, padding: 18 };
  const btnStyle = (disabled) => ({
    padding: "10px 20px", borderRadius: 10, background: disabled ? C.g2 : C.em,
    color: "#fff", fontWeight: 700, fontSize: 13, border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
  });

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.bg }}>
      {/* Sub-header */}
      <div style={{ padding: "0 16px", height: 44, display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.bd}`, flexShrink: 0, background: C.w }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.g5, padding: 6, borderRadius: 7 }}>
          <Icon d={ICONS.arrowLeft} size={16} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 14, color: C.g9 }}>Settings</span>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "18px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Profile */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: C.em, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
              {(authUser.name || "?").split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.g9 }}>Profile</div>
              <div style={{ fontSize: 12, color: C.g4 }}>Update the name shown across the app</div>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Full name</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Email address</label>
            <input style={{ ...inputStyle, background: C.g1, color: C.g5, cursor: "not-allowed" }} value={authUser.email || ""} readOnly disabled />
            <p style={{ fontSize: 11, color: C.g4, marginTop: 5 }}>Your email is set by your admin and can't be changed here.</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <StatusLine status={profileStatus} />
            <button onClick={saveProfile} disabled={savingProfile} style={btnStyle(savingProfile)}>
              {savingProfile ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>

        {/* Password */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: C.b5, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon d={ICONS.lock} size={18} color={C.b6} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.g9 }}>Change password</div>
              <div style={{ fontSize: 12, color: C.g4 }}>Use a password you don't use anywhere else</div>
            </div>
          </div>

          {[
            { key: "current", label: "Current password" },
            { key: "newPw", label: "New password" },
            { key: "confirm", label: "Confirm new password" },
          ].map(({ key, label }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={labelStyle}>{label}</label>
              <input
                style={inputStyle}
                type="password"
                value={pwForm[key]}
                onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          ))}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <StatusLine status={pwStatus} />
            <button onClick={savePassword} disabled={savingPw} style={btnStyle(savingPw)}>
              {savingPw ? "Updating…" : "Update password"}
            </button>
          </div>
        </div>

        {/* Logout */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.g9 }}>Log out</div>
              <div style={{ fontSize: 12, color: C.g4 }}>Sign out of your cleanup crew account on this device</div>
            </div>
            <button
              onClick={onLogout}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 10, background: "#fef2f2", color: "#dc2626", fontWeight: 700, fontSize: 13, border: "1px solid #fee2e2", cursor: "pointer" }}
            >
              <Icon d={ICONS.logOut} size={14} color="#dc2626" /> Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
