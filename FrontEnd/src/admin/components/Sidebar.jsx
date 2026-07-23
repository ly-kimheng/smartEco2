import React from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  ClipboardList,
  BarChart2,
  Tag,
  MessageSquare,
  ThumbsUp,
  Settings,
  LogOut,
  Leaf,
  Heart,
  X,
  Gift,
  BookOpen
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "reports", label: "Reports", icon: FileText, badgeKey: "reports" },
  { id: "users", label: "Users", icon: Users },
  { id: "tasks", label: "Cleanup Tasks", icon: ClipboardList, badgeKey: "tasks" },
  { id: "voting", label: "Voting", icon: ThumbsUp },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "categories", label: "Categories", icon: Tag },
  { id: "rewards", label: "Rewards", icon: Gift },
  { id: "guides", label: "Tips & Guides", icon: BookOpen },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
];

export default function Sidebar({
  page,
  setPage,
  open,
  onClose,
  reportsCount,
  tasksCount,
  onLogout
}) {
  return (
    <>
      {/* Backdrop for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 flex flex-col z-40 transition-transform duration-300 ease-out bg-[#16A34A] text-white shadow-xl ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-md flex-shrink-0">
            <Leaf className="w-5 h-5 text-[#16A34A]" />
          </div>
          <span className="font-display font-black text-xl tracking-tight text-white">
            SmartEco
          </span>
          <button
            onClick={onClose}
            className="ml-auto lg:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto font-sans">
          {NAV_ITEMS.map(({ id, label, icon: Icon, badgeKey }) => {
            const isActive = page === id;
            let badgeCount = 0;
            if (badgeKey === "reports") badgeCount = reportsCount;
            if (badgeKey === "tasks") badgeCount = tasksCount;

            return (
              <button
                key={id}
                onClick={() => {
                  setPage(id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-white text-[#16A34A] shadow-md scale-[1.02]"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {badgeCount > 0 && (
                  <span
                    className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full transition-colors ${
                      isActive
                        ? "bg-[#16A34A] text-white"
                        : "bg-white/20 text-white"
                    }`}
                  >
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Motivational Card from Image */}
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-[#15803D]/60 text-center space-y-2 border border-white/10 backdrop-blur-xs">
          <Leaf className="w-6 h-6 mx-auto text-white animate-bounce" />
          <p className="text-white text-xs font-bold leading-relaxed tracking-wide font-sans flex items-center justify-center gap-1">
            Together We Can Build A Cleaner World <Heart className="w-3.5 h-3.5 fill-current" />
          </p>
        </div>

        {/* Footer Settings & Logout */}
        <div className="px-3 pb-5 space-y-0.5 border-t border-white/10 pt-4">
          <button
            onClick={() => {
              setPage("settings");
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              page === "settings"
                ? "bg-white text-[#16A34A] shadow-md"
                : "text-white/85 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
