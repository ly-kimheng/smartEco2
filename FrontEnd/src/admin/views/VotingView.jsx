import React, { useState, useEffect } from "react";
import { ThumbsUp, Flame, MapPin, Calendar, CheckCircle, RefreshCw, ChevronDown } from "lucide-react";
import * as api from "../../api";
import {
  VOTING_DISTRICTS,
  getVotingReports,
  getDistrictPriorities,
  getVoteCount,
  getTrendScore,
  setPrioritized,
  setReportStatus,
  subscribe,
  resetVotingDemoData,
} from "../../data/votingStore";

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=400&h=220&fit=crop&auto=format";

export default function VotingView() {
  const [district, setDistrict] = useState(null); // null = All Districts
  const [reports, setReports] = useState(() => getVotingReports({ district: null }));

  useEffect(() => {
    setReports(getVotingReports({ district }));
    const unsubscribe = subscribe(() => setReports(getVotingReports({ district })));
    return unsubscribe;
  }, [district]);

  const leaders = getDistrictPriorities();

  const togglePriority = (report) => setPrioritized(report.id, !report.admin_prioritized);
  const resolveReport = (report) => {
    if (!confirm(`Mark "${report.title}" as resolved and remove it from voting?`)) return;
    setReportStatus(report.id, "Resolved");
  };

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">
            Community Voting
          </h1>
          <p className="text-slate-500 text-sm font-sans">
            See which reports citizens are voting for, filter by district, and prioritize the ones the cleanup team should act on first.
          </p>
        </div>
        <button
          onClick={() => { if (confirm("Reset the demo voting data back to its seeded state?")) resetVotingDemoData(); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* District priority strip — one leader card per district */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Priority Spot by District</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.entries(VOTING_DISTRICTS).map(([key, loc]) => {
            const leader = leaders[key];
            const active = district === key;
            return (
              <button
                key={key}
                onClick={() => setDistrict(active ? null : key)}
                className={`text-left rounded-2xl p-4 border transition-all cursor-pointer ${
                  active ? "border-[#16A34A] bg-emerald-50/50 shadow-sm" : "border-slate-100 bg-white hover:border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: loc.color }} />
                  <span className="font-bold text-slate-800 text-sm">{loc.name}</span>
                </div>
                {leader ? (
                  <>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-1.5">{leader.title}</p>
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      {leader.admin_prioritized ? (
                        <span className="flex items-center gap-1 text-rose-500"><Flame className="w-3.5 h-3.5" /> Prioritized</span>
                      ) : getTrendScore(leader) >= 3 ? (
                        <span className="flex items-center gap-1 text-amber-500"><Flame className="w-3.5 h-3.5" /> Trending</span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-500"><ThumbsUp className="w-3.5 h-3.5" /> {getVoteCount(leader)} votes</span>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-400">No open reports</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* District filter dropdown (mirrors the strip above, useful once list gets long) */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter:</span>
        <div className="relative">
          <select
            value={district || ""}
            onChange={(e) => setDistrict(e.target.value || null)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] cursor-pointer"
          >
            <option value="">All Districts</option>
            {Object.entries(VOTING_DISTRICTS).map(([key, loc]) => (
              <option key={key} value={key}>{loc.name}</option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <span className="text-xs text-slate-400">Sorted by: Prioritized → Trending → Most votes</span>
      </div>

      {/* Reports list */}
      <div className="bg-white rounded-2xl shadow-xs border border-emerald-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left font-sans">
            <thead>
              <tr className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100 bg-slate-50/20">
                <th className="px-6 py-4">Report</th>
                <th className="px-6 py-4 hidden md:table-cell">District</th>
                <th className="px-6 py-4">Votes</th>
                <th className="px-6 py-4 hidden sm:table-cell">Trend (45 min)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.map((r) => {
                const count = getVoteCount(r);
                const trend = getTrendScore(r);
                return (
                  <tr key={r.id} className="hover:bg-emerald-50/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={r.image_url ? api.resolveAssetUrl(r.image_url) : PLACEHOLDER_IMG}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-slate-100"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 leading-snug group-hover:text-[#16A34A] transition-colors">
                            {r.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 font-medium">
                            <Calendar className="w-3 h-3" /> {r.created_at}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {r.location}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 font-bold text-slate-700">
                        <ThumbsUp className="w-3.5 h-3.5 text-slate-400" /> {count}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      {trend >= 3 ? (
                        <span className="flex items-center gap-1 font-bold text-amber-500 text-xs bg-amber-50 px-2 py-1 rounded-lg w-fit">
                          <Flame className="w-3.5 h-3.5" /> +{trend} rising fast
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">+{trend} recently</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => togglePriority(r)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            r.admin_prioritized
                              ? "bg-rose-500 text-white border-rose-500 hover:bg-rose-600"
                              : "bg-white text-rose-500 border-rose-200 hover:bg-rose-50"
                          }`}
                          title={r.admin_prioritized ? "Remove priority" : "Mark as priority for the cleanup team"}
                        >
                          <Flame className="w-3.5 h-3.5" />
                          {r.admin_prioritized ? "Prioritized" : "Prioritize"}
                        </button>
                        <button
                          onClick={() => resolveReport(r)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Mark resolved (removes from voting)"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {reports.length === 0 && (
            <div className="text-center py-12 px-4 space-y-2">
              <p className="text-slate-400 font-semibold text-base">No open reports for this district</p>
              <p className="text-slate-400 text-xs">Try a different district filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
