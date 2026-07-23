import { useState, useEffect } from "react";
import { X, Eye, Leaf } from "lucide-react";
import { cn } from "../utils";
import * as api from "../api";

// ── Login Form ────────────────────────────────────────────────────────────────
function LoginForm({ onLogin, onSwitch, onClose }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "At least 6 characters";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const data = await api.login({ email: form.email, password: form.password });
      api.saveSession(data.token, data.user);
      onLogin(data.user);
      onClose();
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (key) =>
    cn(
      "w-full px-4 py-3 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]/40 focus:border-[#22C55E] transition-all",
      errors[key] ? "border-red-300" : "border-gray-200"
    );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
          <Leaf className="w-5 h-5 text-[#22C55E]" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Welcome back</h2>
          <p className="text-xs text-gray-400">Sign in to your SmartEco account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {errors.form}
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            className={inputCls("email")}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-sm font-semibold text-gray-700">Password</label>
            <button type="button" className="text-xs text-[#22C55E] font-medium hover:underline">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className={cn(inputCls("password"), "pr-10")}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-[#22C55E] text-white font-bold text-sm hover:bg-[#16A34A] transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Signing in...
            </>
          ) : "Sign In"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        Don't have an account?{" "}
        <button onClick={onSwitch} className="text-[#22C55E] font-semibold hover:underline">
          Create one
        </button>
      </p>
    </div>
  );
}

// ── Register Form ─────────────────────────────────────────────────────────────
function RegisterForm({ onLogin, onSwitch, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "At least 8 characters";
    if (!form.confirm) e.confirm = "Please confirm your password";
    else if (form.confirm !== form.password) e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const data = await api.registerCitizen({ name: form.name, email: form.email, password: form.password });
      api.saveSession(data.token, data.user);
      onLogin(data.user);
      onClose();
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const pw = form.password;
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-green-500"][strength];

  const inputCls = (key) =>
    cn(
      "w-full px-4 py-3 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]/40 focus:border-[#22C55E] transition-all",
      errors[key] ? "border-red-300" : "border-gray-200"
    );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
          <Leaf className="w-5 h-5 text-[#22C55E]" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Create account</h2>
          <p className="text-xs text-gray-400">Join the SmartEco community today</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
        {errors.form && (
          <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {errors.form}
          </div>
        )}
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
          <input type="text" autoComplete="off" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sophea Keo" className={inputCls("name")} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Email address</label>
          <input type="email" autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className={inputCls("email")} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 8 characters"
              className={cn(inputCls("password"), "pr-10")}
            />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <Eye className="w-4 h-4" />
            </button>
          </div>
          {form.password && (
            <div className="mt-1.5">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i <= strength ? strengthColor : "bg-gray-200")} />
                ))}
              </div>
              <p className="text-xs text-gray-400">{strengthLabel} password</p>
            </div>
          )}
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        {/* Confirm */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
          <input type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="••••••••" className={inputCls("confirm")} />
          {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-[#22C55E] text-white font-bold text-sm hover:bg-[#16A34A] transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Creating account...
            </>
          ) : "Create Account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <button onClick={onSwitch} className="text-[#22C55E] font-semibold hover:underline">Sign in</button>
      </p>
    </div>
  );
}

// ── Modal Shell ───────────────────────────────────────────────────────────────
export function AuthModal({ mode, onClose, onLogin }) {
  // mode: "login" | "register"
  const [view, setView] = useState(mode);

  // sync if parent changes mode after open
  useEffect(() => { setView(mode); }, [mode]);

  // close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Green accent strip at top */}
        <div className="h-1.5 bg-gradient-to-r from-[#16A34A] to-[#22C55E] rounded-t-3xl" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-7">
          {view === "login" ? (
            <LoginForm
              onLogin={onLogin}
              onSwitch={() => setView("register")}
              onClose={onClose}
            />
          ) : (
            <RegisterForm
              onLogin={onLogin}
              onSwitch={() => setView("login")}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
