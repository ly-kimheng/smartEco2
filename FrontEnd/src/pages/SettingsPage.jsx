import { useState } from "react";
import { Users, AlertTriangle, Bell, Sun, Moon, CheckCircle } from "lucide-react";
import { cn } from "../utils";

export default function SettingsPage({ user, darkMode, onDarkMode }) {
  const [profile, setProfile] = useState({
    name: user.name,
    email: user.email,
    phone: "+855 12 345 678",
  });
  const [saved, setSaved] = useState(false);
  const [notifs, setNotifs] = useState({ email: true, push: true });
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Profile */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-[#22C55E]" />
          </div>
          Profile Settings
        </h2>

        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-[#22C55E] flex items-center justify-center text-white font-bold text-xl">
              {user.avatar}
            </div>
            <button className="px-3 py-1.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-[#22C55E] hover:text-[#22C55E] transition-all">
              Change Photo
            </button>
          </div>

          {["name", "email", "phone"].map((f) => (
            <div key={f}>
              <label className="block text-sm font-semibold text-gray-700 mb-1 capitalize">{f}</label>
              <input
                type={f === "email" ? "email" : "text"}
                value={profile[f]}
                onChange={(e) => setProfile({ ...profile, [f]: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/40 focus:border-[#22C55E]"
              />
            </div>
          ))}

          <button
            onClick={handleSave}
            className={cn(
              "px-6 py-2.5 rounded-xl font-semibold text-sm transition-all",
              saved ? "bg-green-100 text-green-700" : "bg-[#22C55E] text-white hover:bg-[#16A34A]"
            )}
          >
            {saved ? <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Saved</span> : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5 text-blue-500" />
          </div>
          Change Password
        </h2>
        <div className="space-y-3">
          {[
            { key: "current", label: "Current Password" },
            { key: "newPw", label: "New Password" },
            { key: "confirm", label: "Confirm New Password" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
              <input
                type="password"
                value={pwForm[key]}
                onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/40 focus:border-[#22C55E]"
              />
            </div>
          ))}
          <button className="px-6 py-2.5 rounded-xl bg-[#22C55E] text-white font-semibold text-sm hover:bg-[#16A34A] transition-colors">
            Update Password
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
            <Bell className="w-3.5 h-3.5 text-amber-500" />
          </div>
          Notification Preferences
        </h2>
        <div className="space-y-3">
          {[
            { key: "email", label: "Email Notifications", desc: "Get updates via email" },
            { key: "push", label: "Push Notifications", desc: "Browser push alerts" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <button
                onClick={() => setNotifs({ ...notifs, [key]: !notifs[key] })}
                style={{
                  position: "relative",
                  width: 44,
                  height: 24,
                  borderRadius: 9999,
                  backgroundColor: notifs[key] ? "#22C55E" : "#D1D5DB",
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
                    left: notifs[key] ? 23 : 3,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    backgroundColor: "white",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    transition: "left 0.2s",
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
            {darkMode
              ? <Moon className="w-3.5 h-3.5 text-gray-500" />
              : <Sun className="w-3.5 h-3.5 text-gray-500" />
            }
          </div>
          Appearance
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Dark Mode</p>
            <p className="text-xs text-gray-400">Switch to dark theme</p>
          </div>
          <button
            onClick={() => onDarkMode(!darkMode)}
            style={{
              position: "relative",
              width: 44,
              height: 24,
              borderRadius: 9999,
              backgroundColor: darkMode ? "#22C55E" : "#D1D5DB",
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
                left: darkMode ? 23 : 3,
                width: 18,
                height: 18,
                borderRadius: "50%",
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "left 0.2s",
              }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
