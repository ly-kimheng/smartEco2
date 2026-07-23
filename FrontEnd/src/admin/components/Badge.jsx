import React from "react";

const STATUS_STYLE = {
  // Report Statuses
  Pending: "bg-amber-50 text-amber-700 border border-amber-200/50",
  Approved: "bg-blue-50 text-blue-700 border border-blue-200/50",
  Assigned: "bg-purple-50 text-purple-700 border border-purple-200/50",
  Resolved: "bg-emerald-50 text-emerald-700 border border-emerald-200/50",
  Rejected: "bg-rose-50 text-rose-700 border border-rose-200/50",
  
  // Task Statuses
  "in progress": "bg-sky-50 text-sky-700 border border-sky-200/50",
  pending: "bg-amber-50 text-amber-700 border border-amber-200/50",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200/50",

  // Roles
  Admin: "bg-rose-50 text-rose-700 border border-rose-200/50",
  Moderator: "bg-indigo-50 text-indigo-700 border border-indigo-200/50",
  User: "bg-slate-50 text-slate-700 border border-slate-200/50",

  // User status
  active: "bg-emerald-50 text-emerald-700 border border-emerald-200/50",
  banned: "bg-rose-50 text-rose-700 border border-rose-200/50",
};

export default function Badge({ label, style }) {
  const finalStyle = style || STATUS_STYLE[label] || "bg-slate-50 text-slate-700 border border-slate-200/50";
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${finalStyle}`}>
      {label}
    </span>
  );
}
