import { useState, useEffect } from "react";
import { cn } from "../utils";
import * as api from "../api";
import { ShoppingBag, Droplet, Shirt, CheckCircle, Star, Leaf, Loader2, AlertTriangle, Ticket, ClipboardList } from "lucide-react";

const POINTS_PER_LEVEL = 500;

// Backend rewards don't carry an icon/color — pick one deterministically
// from the title so the same reward always looks the same between reloads.
const STYLE_PALETTE = [
  { icon: ShoppingBag, color: "border-lime-200 bg-lime-50" },
  { icon: Droplet, color: "border-sky-200 bg-sky-50" },
  { icon: Shirt, color: "border-orange-200 bg-orange-50" },
  { icon: Leaf, color: "border-green-200 bg-green-50" },
];

function mapReward(row, index) {
  const style = STYLE_PALETTE[index % STYLE_PALETTE.length];
  return {
    id: row.id,
    title: row.title,
    desc: row.description,
    points: row.points_required,
    stock: row.stock,
    image: row.image_url ? api.resolveAssetUrl(row.image_url) : null,
    icon: style.icon,
    color: style.color,
  };
}

export default function RewardsPage({ user, onRedeemed }) {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [redeemed, setRedeemed] = useState(new Set());
  const [claimingId, setClaimingId] = useState(null);
  const [claimError, setClaimError] = useState(null);
  const [voucher, setVoucher] = useState(null); // { title, code }

  // Every voucher ever redeemed — this is what keeps a claimed reward
  // visible until the person actually uses it, instead of only showing
  // once as a toast that's gone after a refresh.
  const [vouchers, setVouchers] = useState([]);
  const [vouchersLoading, setVouchersLoading] = useState(true);
  const loadVouchers = () => {
    setVouchersLoading(true);
    api.getMyVouchers()
      .then((res) => setVouchers(res.data || []))
      .catch(() => {})
      .finally(() => setVouchersLoading(false));
  };
  useEffect(() => { loadVouchers(); }, []);

  // Recent activity — how many reports this person has filed in the last
  // 7 days, shown alongside the points balance.
  const [recentReportCount, setRecentReportCount] = useState(null);
  useEffect(() => {
    api.getMyReports()
      .then((res) => {
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const count = (res.reports || []).filter((r) => {
          const t = new Date(r.created_at || r.reported_date).getTime();
          return !Number.isNaN(t) && t >= cutoff;
        }).length;
        setRecentReportCount(count);
      })
      .catch(() => {});
  }, []);

  const points = user?.points || 0;

  const level = Math.floor(points / POINTS_PER_LEVEL) + 1;
  const intoLevel = points % POINTS_PER_LEVEL;
  const levelProgressPct = Math.min(100, (intoLevel / POINTS_PER_LEVEL) * 100);

  const loadRewards = () => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    api.getRewards()
      .then((data) => {
        if (cancelled) return;
        setRewards((data.data || []).map(mapReward));
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("Could not load rewards:", err.message);
        setLoadError(true);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  };

  useEffect(() => {
    const cleanup = loadRewards();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRedeem = async (reward) => {
    setClaimError(null);
    setClaimingId(reward.id);
    try {
      const res = await api.claimReward(reward.id);
      setRedeemed((prev) => new Set([...prev, reward.id]));
      setVoucher({ title: reward.title, code: res?.data?.code });
      // Reflect the spent points immediately instead of waiting for App's
      // 20s profile-refresh poll, and re-pull the catalog so stock is current.
      onRedeemed?.();
      loadRewards();
      loadVouchers();
    } catch (err) {
      setClaimError(err.message || "Could not redeem this reward. Please try again.");
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Points Banner */}
      <div className="bg-gradient-to-br from-[#16A34A] to-[#22C55E] rounded-3xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm mb-1">Your Current Points</p>
            <div className="text-5xl font-extrabold">{points.toLocaleString()}</div>
            <p className="text-green-200 text-sm mt-1">pts · Level {level}</p>
          </div>
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <Star className="w-10 h-10 text-white fill-current" />
          </div>
        </div>
        <div className="mt-6">
          <div className="flex justify-between text-xs text-green-100 mb-1.5">
            <span>Progress to Level {level + 1}</span>
            <span>{intoLevel} / {POINTS_PER_LEVEL} pts</span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${levelProgressPct}%` }} />
          </div>
        </div>

        {recentReportCount !== null && (
          <div className="mt-5 pt-4 border-t border-white/20 flex items-center gap-2 text-green-100 text-sm">
            <ClipboardList className="w-4 h-4" />
            <span>
              <strong className="text-white">{recentReportCount}</strong> report{recentReportCount === 1 ? "" : "s"} filed in the last 7 days
            </span>
          </div>
        )}
      </div>

      {/* Just-redeemed confirmation */}
      {voucher && (
        <div className="bg-white border-2 border-green-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-semibold">
              Redeemed "{voucher.title}"! Your voucher code: <span className="font-mono">{voucher.code}</span>
            </span>
          </div>
          <button onClick={() => setVoucher(null)} className="text-xs text-gray-400 hover:text-gray-600">Dismiss</button>
        </div>
      )}

      {claimError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-2 text-red-700 text-sm font-semibold">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {claimError}
        </div>
      )}

      {/* My Vouchers — every reward ever redeemed, stays here (with its code)
          until it's actually used, not just a one-time toast. */}
      {!vouchersLoading && vouchers.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#16A34A]" /> My Vouchers
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
            {vouchers.map((v) => (
              <div key={v.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{v.reward_title}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{v.code}</p>
                </div>
                <span
                  className={cn(
                    "text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0",
                    v.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  )}
                >
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reward Cards */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Rewards</h2>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading rewards…</span>
          </div>
        ) : loadError ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Couldn't load rewards right now. Please try again shortly.
          </div>
        ) : rewards.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No rewards available yet — check back soon.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {rewards.map((r) => {
              const progressPct = Math.min(100, Math.round((points / r.points) * 100));
              const canRedeem = points >= r.points && r.stock > 0;
              const isRedeemed = redeemed.has(r.id);
              const isClaiming = claimingId === r.id;
              return (
                <div key={r.id} className={cn("bg-white rounded-2xl border-2 p-5 shadow-sm flex flex-col", r.color)}>
                  {r.image ? (
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-full h-28 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-black/5">
                        <img src={r.image} alt={r.title} className="max-h-full max-w-full object-contain" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-11 h-11 rounded-xl bg-white/70 flex items-center justify-center">
                        <r.icon className="w-6 h-6 text-gray-700" />
                      </div>
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 mb-1">{r.title}</h3>
                  <p className="text-xs text-gray-500 mb-3 flex-1">{r.desc}</p>

                  {/* Points needed — its own clearly labeled line */}
                  <p className="text-sm font-extrabold text-gray-800 mb-1">{r.points.toLocaleString()} pts</p>
                  <p className="text-[11px] text-gray-400 mb-3">{r.stock > 0 ? `${r.stock} left` : "Out of stock"}</p>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Your progress</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#22C55E] rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleRedeem(r)}
                    disabled={isRedeemed || !canRedeem || isClaiming}
                    className={cn(
                      "w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                      isRedeemed
                        ? "bg-gray-100 text-gray-400 cursor-default"
                        : isClaiming
                        ? "bg-gray-100 text-gray-400 cursor-wait"
                        : canRedeem
                        ? "bg-[#22C55E] text-white hover:bg-[#16A34A]"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {isClaiming ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Redeeming…</>
                    ) : isRedeemed ? (
                      <><CheckCircle className="w-3.5 h-3.5" /> Redeemed</>
                    ) : r.stock <= 0 ? "Out of stock" : canRedeem ? "Redeem" : `Need ${(r.points - points).toLocaleString()} more pts`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
