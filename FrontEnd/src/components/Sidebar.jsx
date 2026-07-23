import { Home, Camera, MapPin, FileText, Recycle, Settings, Leaf, X, Gift } from "lucide-react";
import { cn } from "../utils";

const NAV_ITEMS = [
  { to: "home",       icon: Home,    label: "Dashboard" },
  { to: "report",     icon: Camera,  label: "Report Waste" },
  { to: "map",        icon: MapPin,  label: "Waste Map" },
  { to: "my-reports", icon: FileText, label: "My Reports" },
  { to: "recycling",  icon: Recycle, label: "Recycling Guide" },
  { to: "settings",   icon: Settings, label: "Settings" },
];

export function Sidebar({ open, onClose, currentPage, onNavigate }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 flex flex-col z-40 transition-transform duration-300 bg-[#16A34A]",
          "hidden lg:flex"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/20">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <Leaf className="w-5 h-5 text-[#16A34A]" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">SmartEco</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <button
              key={to}
              onClick={() => onNavigate(to)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                currentPage === to
                  ? "bg-white text-[#16A34A] shadow-sm"
                  : "text-white/85 hover:bg-white/15 hover:text-white"
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Footer image card */}
        <div className="mx-3 mb-4 rounded-2xl overflow-hidden shadow-lg relative">
          <img
            src="/images/sidebar-footer.webp"
            alt="Together We Can Build A Cleaner Cambodia"
            className="w-full object-cover"
            style={{ maxHeight: 200 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none rounded-2xl" />
        </div>
      </aside>
    </>
  );
}
