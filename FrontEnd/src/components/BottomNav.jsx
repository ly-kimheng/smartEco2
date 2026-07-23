import { Home, Camera, MapPin, Recycle, FileText } from "lucide-react";
import { cn } from "../utils";

const NAV_ITEMS = [
  { to: "home",       icon: Home,     label: "Home" },
  { to: "map",        icon: MapPin,   label: "Map" },
  { to: "report",     icon: Camera,   label: "Report" },
  { to: "recycling",  icon: Recycle,  label: "Guide" },
  { to: "my-reports", icon: FileText, label: "My Reports" },
];

export function BottomNav({ currentPage, onNavigate }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-30 flex items-stretch lg:hidden">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
        const active = currentPage === to;
        return (
          <button
            key={to}
            onClick={() => onNavigate(to)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
              active ? "text-[#16A34A]" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
