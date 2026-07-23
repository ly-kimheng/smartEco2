import React, { useState, useRef, useEffect } from "react";
import { Plus, Pencil, Trash2, Gift, Package, Upload, X as XIcon } from "lucide-react";
import { resolveAssetUrl } from "../../api";
import Modal from "../components/Modal";

const EMPTY_FORM = { title: "", description: "", pointsRequired: "", imageUrl: "", stock: "" };

export default function RewardsView({ rewards, onCreate, onUpdate, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const fileInputRef = useRef(null);

  // Build/revoke an object URL for whichever image (freshly picked file, or
  // the existing saved one) should be previewed in the modal.
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(form.imageUrl ? resolveAssetUrl(form.imageUrl) : null);
  }, [imageFile, form.imageUrl]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setShowModal(true);
  };

  const openEdit = (reward) => {
    setEditingId(reward.id);
    setForm({
      title: reward.title || "",
      description: reward.description || "",
      pointsRequired: reward.points_required ?? "",
      imageUrl: reward.image_url || "",
      stock: reward.stock ?? "",
    });
    setImageFile(null);
    setShowModal(true);
  };

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setForm((f) => ({ ...f, imageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!form.title.trim() || form.pointsRequired === "") return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        pointsRequired: Number(form.pointsRequired),
        imageUrl: form.imageUrl.trim() || null,
        imageFile,
        stock: Number(form.stock) || 0,
      };
      if (editingId) {
        await onUpdate(editingId, payload);
      } else {
        await onCreate(payload);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await onDelete(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">
            Rewards Catalog
          </h1>
          <p className="text-slate-500 text-sm font-sans">
            Manage what citizens can redeem their eco-points for.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#16A34A] text-white text-sm font-semibold hover:bg-[#15803d] transition-colors shadow-xs hover:shadow-md cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Reward</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {rewards.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl border border-emerald-50 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden group"
          >
            <div className="h-36 bg-slate-100 overflow-hidden flex items-center justify-center">
              {r.image_url ? (
                <img src={resolveAssetUrl(r.image_url)} alt={r.title} className="w-full h-full object-cover" />
              ) : (
                <Gift className="w-10 h-10 text-slate-300" />
              )}
            </div>
            <div className="p-5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display font-bold text-slate-900 text-base leading-snug">{r.title}</h3>
                <span className="shrink-0 text-xs font-bold text-[#16A34A] bg-[#16A34A]/10 px-2 py-1 rounded-lg">
                  {r.points_required} pts
                </span>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2">{r.description}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                <Package className="w-3.5 h-3.5" />
                <span>{r.stock} in stock</span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => openEdit(r)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:border-[#16A34A] hover:text-[#16A34A] transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                {confirmDeleteId === r.id ? (
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    Confirm?
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(r.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-red-500 text-xs font-bold hover:border-red-400 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={openCreate}
          className="bg-white rounded-2xl p-6 shadow-xs border-2 border-dashed border-slate-200 hover:border-[#16A34A] flex items-center justify-center text-slate-400 hover:text-[#16A34A] transition-all duration-300 cursor-pointer font-display font-bold text-base gap-2 group min-h-[220px]"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span>+ New Reward</span>
        </button>
      </div>

      {rewards.length === 0 && (
        <p className="text-center text-slate-400 text-sm py-6">No rewards yet — add the first one above.</p>
      )}

      <Modal
        title={editingId ? "Edit Reward" : "Add Reward"}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="sm"
      >
        <div className="space-y-4 font-sans">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Heavy Canvas Tote Bag"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-700 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short description shown to citizens"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-700 placeholder-slate-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">Points Required</label>
              <input
                type="number"
                min="0"
                value={form.pointsRequired}
                onChange={(e) => setForm((f) => ({ ...f, pointsRequired: e.target.value }))}
                placeholder="100"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-700 placeholder-slate-400"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">Stock</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                placeholder="50"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-700 placeholder-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">Image</label>
            {previewUrl ? (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 mb-2">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-semibold hover:border-[#16A34A] hover:text-[#16A34A] transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              {imageFile ? imageFile.name : "Upload a photo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFilePick}
              className="hidden"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">JPEG, PNG or WEBP, up to 5MB.</p>

            <div className="flex items-center gap-2 my-2">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="text-[11px] text-slate-400 font-semibold">OR paste a link</span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>
            <input
              type="text"
              value={form.imageUrl}
              onChange={(e) => {
                setImageFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                setForm((f) => ({ ...f, imageUrl: e.target.value }));
              }}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-700 placeholder-slate-400"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[#16A34A] text-white font-bold text-sm hover:bg-[#15803d] transition-all shadow-xs hover:shadow-md cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : editingId ? "Save Changes" : "Create Reward"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
