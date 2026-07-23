import React, { useState } from "react";
import { Plus } from "lucide-react";
import Modal from "../components/Modal";

export default function CategoriesView({ categories, setCategories }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3B82F6");

  const colors = [
    { name: "Blue", hex: "#3B82F6" },
    { name: "Red", hex: "#EF4444" },
    { name: "Amber", hex: "#F59E0B" },
    { name: "Purple", hex: "#8B5CF6" },
    { name: "Emerald", hex: "#10B981" },
    { name: "Pink", hex: "#EC4899" },
    { name: "Indigo", hex: "#6366F1" },
    { name: "Teal", hex: "#14B8A6" },
  ];

  const addCat = () => {
    if (!newName.trim()) return;
    setCategories(prev => [
      ...prev,
      { name: newName.trim(), count: 0, color: newColor }
    ]);
    setNewName("");
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">
            Waste Categories
          </h1>
          <p className="text-slate-500 text-sm font-sans">
            Manage report classification tags and customize theme markers.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#16A34A] text-white text-sm font-semibold hover:bg-[#15803d] transition-colors shadow-xs hover:shadow-md cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Grid - Matching provided screenshot precisely! */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map(c => (
          <div
            key={c.name}
            className="bg-white rounded-2xl p-6 shadow-xs border border-emerald-50 hover:shadow-md transition-all duration-300 flex items-center gap-4 cursor-pointer group hover:border-[#16A34A]/20"
          >
            {/* Round Category Bullet Container matching screenshot */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
              style={{ backgroundColor: `${c.color}15` }}
            >
              <div
                className="w-3.5 h-3.5 rounded-full ring-4 ring-white"
                style={{ backgroundColor: c.color }}
              />
            </div>
            <div>
              <p className="font-display font-bold text-slate-900 text-base leading-snug group-hover:text-[#16A34A] transition-colors">
                {c.name}
              </p>
              <p className="text-sm text-slate-400 font-sans mt-0.5 font-semibold">
                {c.count} reports
              </p>
            </div>
          </div>
        ))}

        {/* Dash bordered card for new category */}
        <button
          onClick={() => setShowAdd(true)}
          className="bg-white rounded-2xl p-6 shadow-xs border-2 border-dashed border-slate-200 hover:border-[#16A34A] flex items-center justify-center text-slate-400 hover:text-[#16A34A] transition-all duration-300 cursor-pointer font-display font-bold text-base gap-2 group min-h-[82px]"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span>+ New Category</span>
        </button>
      </div>

      {/* Add Category Modal */}
      <Modal
        title="Add Waste Category"
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        maxWidth="sm"
      >
        <div className="space-y-4 font-sans">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">Category Name</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Chemical Hazards"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-700 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">Color Badge Marker</label>
            <div className="grid grid-cols-4 gap-2">
              {colors.map(col => (
                <button
                  key={col.hex}
                  onClick={() => setNewColor(col.hex)}
                  className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                    newColor === col.hex
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.hex }} />
                  <span>{col.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={addCat}
            className="w-full py-3 rounded-xl bg-[#16A34A] text-white font-bold text-sm hover:bg-[#15803d] transition-all shadow-xs hover:shadow-md cursor-pointer mt-2"
          >
            Create Category
          </button>
        </div>
      </Modal>
    </div>
  );
}
