import { Leaf, Sprout, MapPin, Map, Trophy } from "lucide-react";

export function AuthShell({ children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left – green brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#15803d] to-[#22C55E] p-12 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute bottom-10 right-0 w-96 h-96 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md">
            <Leaf className="w-5 h-5 text-[#16A34A]" />
          </div>
          <span className="text-white font-extrabold text-2xl">SmartEco</span>
        </div>

        <div className="relative">
          <Sprout className="w-12 h-12 mb-6 text-white" />
          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Together for a Cleaner, Greener Cambodia
          </h2>
          <p className="text-green-100 text-lg leading-relaxed">
            Join our community of eco-warriors. Report waste, earn rewards, and help build a better future.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {[
              { Icon: MapPin, text: "Report waste locations near you" },
              { Icon: Map, text: "View live waste hotspot maps" },
              { Icon: Trophy, text: "Earn points and community badges" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-white/90 text-sm">
                <item.Icon className="w-5 h-5 flex-shrink-0" />
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex gap-6 text-white/80 text-sm">
          {[
            { value: "1,245+", label: "Reports" },
            { value: "978", label: "Resolved" },
            { value: "530", label: "Members" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-green-200">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right – form panel */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 bg-[#F0F7F0]">
        {children}
      </div>
    </div>
  );
}
