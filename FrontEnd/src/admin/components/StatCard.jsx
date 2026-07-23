import React from "react";
import { TrendingUp } from "lucide-react";

export default function StatCard({
  icon: Icon,
  label,
  value,
  change,
  iconBgColor = "bg-green-50",
  iconColor = "text-[#16A34A]"
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-emerald-50 hover:border-emerald-100 transition-all duration-300 flex flex-col gap-3 group hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500 font-medium font-sans">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${iconBgColor} ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">{value}</p>
      {change ? (
        <p className="text-xs text-[#16A34A] font-semibold flex items-center gap-1 mt-0.5">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{change}</span>
        </p>
      ) : (
        <p className="text-xs text-slate-400 font-medium mt-0.5">Stable activity</p>
      )}
    </div>
  );
}
