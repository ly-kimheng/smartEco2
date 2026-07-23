import React from "react";
import { Clock, TrendingUp, BarChart2, Zap, Award } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import StatCard from "../components/StatCard";

export default function AnalyticsView({ categories, trendData }) {
  // Simple summary indicators
  const avgResolutionTime = "3.8 Days";
  const totalReportsCount = categories.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">
          Performance Analytics
        </h1>
        <p className="text-slate-500 text-sm font-sans">
          In-depth reports tracking, average crew resolution timelines, and category distribution.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          label="Avg Resolution Time"
          value={avgResolutionTime}
          change="-0.4d vs last week"
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={Zap}
          label="Weekly Submission Rate"
          value="94 reports"
          change="+18% vs last week"
          iconBgColor="bg-amber-50"
          iconColor="text-amber-500"
        />
        <StatCard
          icon={Award}
          label="Eco Rewards Points Issued"
          value="18,450 pts"
          change="+12% this month"
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={BarChart2}
          label="Resolution Efficiency"
          value="96.2%"
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Analytics Charts & Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Area Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-emerald-50 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-slate-900 text-lg">
                Six-Month Trend
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Resolution rates vs incoming volume
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-[#16A34A]" />
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="gResRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
                    fontSize: "12px"
                  }}
                />
                <Area type="monotone" dataKey="resolved" stroke="#16A34A" strokeWidth={2.5} fillOpacity={1} fill="url(#gResRate)" name="Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Distribution progress bars */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-emerald-50 hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
          <div>
            <h2 className="font-display font-bold text-slate-900 text-lg">
              Report Distribution
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Comparative volume by waste classification tag
            </p>
          </div>

          <div className="space-y-4 my-4 flex-1 flex flex-col justify-center font-sans">
            {categories.map(c => {
              const percentage = Math.round((c.count / totalReportsCount) * 100) || 0;
              return (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 font-sans">{c.name}</span>
                    <span className="text-slate-900">{percentage}% ({c.count} reports)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${percentage}%`, backgroundColor: c.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
