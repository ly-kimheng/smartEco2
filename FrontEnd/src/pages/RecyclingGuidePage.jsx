import { useState } from "react";
import { CheckCircle, ChevronRight, Droplet, Newspaper, GlassWater, Cylinder, Laptop } from "lucide-react";
import { RECYCLE_CATEGORIES } from "../data/mockData";
import { cn } from "../utils";

// Maps the icon name stored in mockData.js to the actual lucide-react component.
const CATEGORY_ICONS = { Droplet, Newspaper, GlassWater, Cylinder, Laptop };

export default function RecyclingGuidePage() {
  const [active, setActive] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recycling Guide</h1>
        <p className="text-gray-500 text-sm mt-1">Learn how to recycle different materials properly</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {RECYCLE_CATEGORIES.map((cat) => {
          const CategoryIcon = CATEGORY_ICONS[cat.icon];
          return (
          <div
            key={cat.name}
            className={cn(
              "bg-white rounded-2xl border shadow-sm overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform duration-200",
              cat.color
            )}
            onClick={() => setActive(active === cat.name ? null : cat.name)}
          >
            {/* Image */}
            <div className="h-40 overflow-hidden bg-gray-100">
              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
            </div>

            <div className="p-5">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", cat.iconBg)}>
                {CategoryIcon && <CategoryIcon className="w-5 h-5 text-gray-700" />}
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{cat.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{cat.desc}</p>

              {/* Expandable Tips */}
              {active === cat.name && (
                <div className="overflow-hidden">
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recycling Tips</p>
                    <ul className="space-y-1.5">
                      {cat.tips.map((tip) => (
                        <li key={tip} className="flex items-start gap-2 text-xs text-gray-600">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <button className="mt-2 text-xs text-[#22C55E] font-semibold flex items-center gap-1">
                {active === cat.name ? "Show less" : "Show tips"}
                <ChevronRight
                  className={cn("w-3.5 h-3.5 transition-transform", active === cat.name && "rotate-90")}
                />
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
