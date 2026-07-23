import { useState, useEffect, useMemo } from "react";
import { Trash2, FileText, CheckCircle, Users, ThumbsUp, Calendar, MapPin, Lock, Hand, Leaf, Flame, ChevronDown } from "lucide-react";
import { cn } from "../utils";
import * as api from "../api";
import {
  VOTING_DISTRICTS,
  getVotingReports,
  toggleVote,
  getVoterId,
  hasUserVoted,
  getVoteCount,
  getTrendScore,
  subscribe,
} from "../data/votingStore";

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=400&h=220&fit=crop&auto=format";
const CARDS_PER_PAGE = 3;

export default function DashboardPage({ user, isLoggedIn, onRequireAuth, onNavigate, onShowOnMap }) {
  // Voting section is backed by the shared mock store (src/data/votingStore.js)
  // so a vote cast here, a "prioritize" set by admin, and the priority spot
  // shown to the Cleanup Team all stay in sync during a demo.
  const [districtFilter, setDistrictFilter] = useState(null); // null = All Districts
  const [reports, setReports] = useState(() => getVotingReports({ district: districtFilter }));
  const [showAll, setShowAll] = useState(false);
  const [votingId, setVotingId] = useState(null);
  const voterId = useMemo(() => getVoterId(user), [user]);

  // Community-wide totals — same numbers admin's dashboard shows, since
  // both read from the same real database via the same underlying query.
  const [communityStats, setCommunityStats] = useState(null);
  useEffect(() => {
    let cancelled = false;
    api.getCommunityStats()
      .then((data) => { if (!cancelled) setCommunityStats(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setReports(getVotingReports({ district: districtFilter }));
    setShowAll(false);
    const unsubscribe = subscribe(() => setReports(getVotingReports({ district: districtFilter })));
    return unsubscribe;
  }, [districtFilter]);

  const visibleCards = showAll ? reports : reports.slice(0, CARDS_PER_PAGE);

  const handleVote = (report) => {
    // Voting requires an account — bounce guests to sign in / register first.
    if (!isLoggedIn) {
      onRequireAuth?.("login");
      return;
    }
    setVotingId(report.id);
    toggleVote(report.id, voterId);
    setReports(getVotingReports({ district: districtFilter }));
    setVotingId(null);
  };

  return (
    <div className="space-y-8">

      {/* ── Hero Banner ── */}
      <div className="relative rounded-3xl overflow-hidden">
        <img
          src="/images/hero-banner.png"
          alt="SmartEco hero"
          className="w-full h-auto block"
        />
        {/* gradient only covers the left ~45% so it never bleeds over the trash cans */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#16A34A]/80 via-[#16A34A]/50 to-transparent" style={{ width: "55%" }} />
        <div className="absolute inset-0 flex items-center">
          <div className="relative z-10 px-4 sm:px-7 lg:px-12 max-w-[52%]">
            <p className="text-green-100 font-medium mb-0.5 sm:mb-1 text-[10px] sm:text-xs lg:text-sm flex items-center gap-1.5">
              Welcome back, {user.name} <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline" />
            </p>
            <h1 className="font-extrabold text-white leading-tight drop-shadow-sm text-sm sm:text-2xl lg:text-4xl flex items-center gap-2 flex-wrap">
              Let's Make Our Community Cleaner and Greener <Leaf className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 inline" />
            </h1>
            <p className="text-green-100 leading-relaxed mt-1 sm:mt-3 max-w-xs hidden sm:block text-xs lg:text-sm">
              Report waste, protect our environment, and help build a better future for Cambodia.
            </p>
          </div>
        </div>
      </div>

      {/* ── Community Impact ── */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Community Impact</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: FileText,    label: "Total Reports",    value: communityStats ? communityStats.totalReports.toLocaleString() : "—", color: "text-blue-600 bg-blue-50" },
            { icon: CheckCircle, label: "Resolved Reports", value: communityStats ? communityStats.resolvedReports.toLocaleString() : "—", color: "text-green-600 bg-green-50" },
            { icon: Users,       label: "Active Users",     value: communityStats ? communityStats.totalUsers.toLocaleString() : "—", color: "text-purple-600 bg-purple-50" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Vote for Cleanup Priority ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900">Vote for Cleanup Priority</h2>
          <div className="flex items-center gap-3">
            {!isLoggedIn && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Sign in to vote
              </span>
            )}
            <div className="relative">
              <select
                value={districtFilter || ""}
                onChange={(e) => setDistrictFilter(e.target.value || null)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] cursor-pointer"
              >
                <option value="">All Districts</option>
                {Object.entries(VOTING_DISTRICTS).map(([key, loc]) => (
                  <option key={key} value={key}>{loc.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">No open reports to vote on in this district right now.</div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleCards.map((card) => {
                const voted = hasUserVoted(card, voterId);
                const count = getVoteCount(card);
                const trending = getTrendScore(card) >= 3;
                return (
                  <div key={card.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="relative h-40 bg-gray-100">
                      <img src={card.image_url ? api.resolveAssetUrl(card.image_url) : PLACEHOLDER_IMG} alt={card.location} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full text-gray-700">
                        {card.category}
                      </div>
                      {card.admin_prioritized && (
                        <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <Flame className="w-3 h-3" /> Priority
                        </div>
                      )}
                      {!card.admin_prioritized && trending && (
                        <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <Flame className="w-3 h-3" /> Trending
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-sm">{card.title}</h3>
                        <div className="flex items-center gap-1 text-gray-400 text-xs whitespace-nowrap">
                          <Calendar className="w-3 h-3" />
                          {(card.created_at || "").toString().slice(0, 10)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onShowOnMap?.(card.location)}
                        title="Show real location on the map"
                        className="flex items-center gap-1.5 text-xs text-gray-500 mb-2 hover:text-[#16A34A] transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#22C55E]" />
                        <span className="font-medium underline decoration-dotted underline-offset-2">{card.location}</span>
                      </button>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{card.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                          <ThumbsUp className="w-3.5 h-3.5 text-gray-400" /> {count} votes
                        </span>
                        <button
                          onClick={() => handleVote(card)}
                          disabled={votingId === card.id}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border disabled:opacity-60",
                            voted
                              ? "bg-green-50 text-green-700 border-green-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                              : "bg-[#22C55E] text-white border-transparent hover:bg-[#16A34A]"
                          )}
                          title={!isLoggedIn ? "Sign in to vote" : voted ? "Click to unvote" : "Click to vote"}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          {!isLoggedIn ? "Sign in to vote" : voted ? "Voted · Undo" : "Vote"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {reports.length > CARDS_PER_PAGE && (
              <div className="flex justify-center mt-5">
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="px-5 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:text-[#16A34A] hover:border-[#16A34A] transition-colors"
                >
                  {showAll ? "Show Less" : `View More (${reports.length - CARDS_PER_PAGE} more)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
