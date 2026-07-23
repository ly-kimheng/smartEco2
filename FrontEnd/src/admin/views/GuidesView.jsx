import React, { useState, useRef, useEffect } from "react";
import { Plus, Pencil, Trash2, BookOpen, Eye, EyeOff, Upload, X as XIcon } from "lucide-react";
import { resolveAssetUrl } from "../../api";
import Modal from "../components/Modal";

const EMPTY_FORM = { title: "", category: "General", content: "", imageUrl: "", isPublished: true };

export default function GuidesView({ guides, onCreate, onUpdate, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const fileInputRef = useRef(null);

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

  const openEdit = (guide) => {
    setEditingId(guide.id);
    setForm({
      title: guide.title || "",
      category: guide.category || "General",
      content: guide.content || "",
      imageUrl: guide.image_url || "",
      isPublished: !!guide.is_published,
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
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category.trim() || "General",
        content: form.content.trim(),
        imageUrl: form.imageUrl.trim() || null,
        imageFile,
        isPublished: form.isPublished,
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

  const togglePublish = async (guide) => {
    await onUpdate(guide.id, {
      title: guide.title,
      category: guide.category,
      content: guide.content,
      imageUrl: guide.image_url,
      isPublished: !guide.is_published,
    });
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
            Tips &amp; Guides
          </h1>
          <p className="text-slate-500 text-sm font-sans">
            Manage the recycling tips and educational content shown to citizens.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#16A34A] text-white text-sm font-semibold hover:bg-[#15803d] transition-colors shadow-xs hover:shadow-md cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Guide</span>
        </button>
      </div>

      <div className="space-y-3">
        {guides.map((g) => (
          <div
            key={g.id}
            className="bg-white rounded-2xl border border-emerald-50 shadow-xs hover:shadow-md transition-all duration-300 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#16A34A]/10 flex items-center justify-center shrink-0 overflow-hidden">
              {g.image_url ? (
                <img src={resolveAssetUrl(g.image_url)} alt={g.title} className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-5 h-5 text-[#16A34A]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-slate-900 text-base">{g.title}</h3>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {g.category}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    g.is_published ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-amber-100 text-amber-600"
                  }`}
                >
                  {g.is_published ? "Published" : "Draft"}
                </span>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2 mt-1">{g.content}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => togglePublish(g)}
                title={g.is_published ? "Unpublish" : "Publish"}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:border-[#16A34A] hover:text-[#16A34A] transition-colors cursor-pointer"
              >
                {g.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => openEdit(g)}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:border-[#16A34A] hover:text-[#16A34A] transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
              {confirmDeleteId === g.id ? (
                <button
                  onClick={() => handleDelete(g.id)}
                  className="px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Confirm?
                </button>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(g.id)}
                  className="p-2 rounded-xl border border-slate-200 text-red-500 hover:border-red-400 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {guides.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-6">No guides yet — add the first one above.</p>
        )}
      </div>

      <Modal
        title={editingId ? "Edit Guide" : "Add Guide"}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="md"
      >
        <div className="space-y-4 font-sans">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. How to recycle glass properly"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-700 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">Category</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="e.g. Glass, Plastic, E-Waste, General"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-700 placeholder-slate-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Write the tip or guide content shown to citizens"
              rows={5}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-700 placeholder-slate-400 resize-none"
            />
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

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-[#16A34A] focus:ring-[#16A34A]/30"
            />
            <span className="text-sm font-semibold text-slate-600">Publish immediately (visible to citizens)</span>
          </label>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[#16A34A] text-white font-bold text-sm hover:bg-[#15803d] transition-all shadow-xs hover:shadow-md cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : editingId ? "Save Changes" : "Create Guide"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
