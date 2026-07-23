import React from "react";
import { FileText, Clock, Users, CheckCircle } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import StatCard from "../components/StatCard";

export default function DashboardView({
  reports,
  users,
  categories,
  trendData,
  stats
}) {
  // Prefer live numbers from /api/admin/stats when available; fall back to
  // deriving them from whatever report/user lists we have on hand.
  const totalReports = stats ? stats.totalReports : reports.length;
  const pendingReports = stats ? stats.pendingReports : reports.filter(r => r.status === "Pending").length;
  const activeUsersCount = stats ? stats.totalUsers : users.filter(u => u.status === "active").length;
  const resolvedReports = stats ? stats.resolvedReports : reports.filter(r => r.status === "Resolved").length;

  // Prepare Pie Chart data from categories
  const pieData = categories.map(c => ({
    name: c.name,
    value: c.count,
    color: c.color
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Heading */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-slate-500 text-sm font-sans">
          Welcome back, Tom. Here is the operational overview for SmartEco today.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Total Reports"
          value={totalReports.toLocaleString()}
          change="+14% this month"
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={Clock}
          label="Pending Review"
          value={pendingReports.toLocaleString()}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          icon={Users}
          label="Active Users"
          value={activeUsersCount.toLocaleString()}
          change="+8% this month"
          iconBgColor="bg-green-50"
          iconColor="text-[#16A34A]"
        />
        <StatCard
          icon={CheckCircle}
          label="Resolved Reports"
          value={resolvedReports.toLocaleString()}
          change="+22% this month"
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-xs border border-emerald-50 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-slate-900 text-lg">
                Reports vs Resolved Trends
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Monthly trends of environmental reports submitted and resolved
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
              Last 6 Months
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="submitted"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSubmitted)"
                  name="Submitted"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stroke="#16A34A"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorResolved)"
                  name="Resolved"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex gap-4 mt-4 border-t border-slate-50 pt-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold font-sans">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Submitted Waste Reports</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold font-sans">
              <div className="w-3 h-3 rounded-full bg-[#16A34A]" />
              <span>Successfully Resolved</span>
            </div>
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-emerald-50 hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
          <div>
            <h2 className="font-display font-bold text-slate-900 text-lg">
              Reports by Category
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Breakdown of classifications
            </p>
          </div>

          <div className="h-44 w-full flex items-center justify-center my-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-800">
                {categories.reduce((acc, curr) => acc + curr.count, 0)}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                Reports
              </span>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-50 pt-4">
            {pieData.slice(0, 5).map((entry) => (
              <div key={entry.name} className="flex items-center justify-between text-xs font-sans font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-600">{entry.name}</span>
                </div>
                <span className="font-bold text-slate-900">{entry.value} reports</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
