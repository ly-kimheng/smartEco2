import { useState } from "react";
import { C, ICONS } from "../constants";
import { Icon, ProgressBar } from "../components/UI";
import { CompletionModal } from "../components/CompletionModal";

export default function UpdateProgressPage({ task, onSave, onBack }) {
  const [slider, setSlider] = useState(task.progress);
  const [note, setNote] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [photo, setPhoto] = useState(null); // { file, previewUrl }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setPhoto({ file, previewUrl: URL.createObjectURL(file) });
  };

  return (
    <>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 20 }}>
        {/* Sub-header */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(244,247,244,0.92)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.bd}`, padding: "10px 18px", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.g5, padding: 6, borderRadius: 7 }}>
            <Icon d={ICONS.arrowLeft} size={17} />
          </button>
          <h2 style={{ fontWeight: 700, color: C.g9, fontSize: 14 }}>Update progress</h2>
        </div>

        <div style={{ maxWidth: 560, margin: "0 auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Task summary card */}
          <div style={{ background: C.w, borderRadius: 14, border: `1px solid ${C.bd}`, overflow: "hidden" }}>
            <img src={task.img} alt={task.title} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
            <div style={{ padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.g9, marginBottom: 6 }}>{task.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.g5 }}>
                <Icon d={ICONS.mapPin} size={12} color={C.em} /> {task.loc}
              </div>
            </div>
          </div>

          {/* Slider */}
          <div style={{ background: C.w, borderRadius: 14, border: `1px solid ${C.bd}`, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.g8 }}>Completion</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: C.em6 }}>{slider}%</span>
            </div>
            <input
              type="range" min={0} max={100} step={5} value={slider}
              onChange={e => setSlider(+e.target.value)}
              style={{ width: "100%", accentColor: C.em, cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.g4, marginTop: 5 }}>
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <ProgressBar value={slider} height={9} />
            </div>
          </div>

          {/* Note */}
          <div style={{ background: C.w, borderRadius: 14, border: `1px solid ${C.bd}`, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
              <Icon d={ICONS.fileText} size={15} color={C.em} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.g8 }}>Add a note</span>
            </div>
            <textarea
              rows={3} value={note} onChange={e => setNote(e.target.value)}
              placeholder="Describe what you did, any challenges, or observations…"
              style={{ width: "100%", borderRadius: 9, border: `1px solid ${C.g2}`, background: C.g0, padding: "10px 12px", fontSize: 13, color: C.g7, outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>

          {/* Photo upload */}
          <div style={{ background: C.w, borderRadius: 14, border: `1px solid ${C.bd}`, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
              <Icon d={ICONS.camera} size={15} color={C.em} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.g8 }}>Upload after-cleanup photo</span>
              {slider === 100 && <span style={{ fontSize: 10, fontWeight: 700, color: "#dc2626" }}>REQUIRED</span>}
            </div>
            <label style={{ display: "block", cursor: "pointer" }}>
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
              {photo ? (
                <div style={{ position: "relative" }}>
                  <img src={photo.previewUrl} alt="After cleanup preview" style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 10 }} />
                  <div style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, padding: "3px 8px", borderRadius: 6 }}>
                    Tap to change
                  </div>
                </div>
              ) : (
                <div style={{ border: `2px dashed ${C.g2}`, borderRadius: 10, height: 86, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <Icon d={ICONS.upload} size={22} color={C.g3} />
                  <span style={{ fontSize: 11, color: C.g4, fontWeight: 500 }}>Click to upload the after-cleanup photo</span>
                </div>
              )}
            </label>
          </div>

          {/* Save button */}
          <button
            onClick={() => slider === 100 ? setShowModal(true) : onSave(slider, note)}
            disabled={slider === 100 && !photo}
            style={{ width: "100%", padding: "14px", borderRadius: 11, background: (slider === 100 && !photo) ? C.g2 : C.em, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: (slider === 100 && !photo) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
          >
            <Icon d={slider === 100 ? ICONS.checkCircle : ICONS.save} size={15} color="#fff" />
            {slider === 100 ? (photo ? "Mark as completed" : "Add a photo to complete") : "Save progress"}
          </button>
        </div>
      </div>

      {showModal && (
        <CompletionModal
          task={task}
          onConfirm={() => { setShowModal(false); onSave(100, note, photo?.file, photo?.previewUrl); }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  );
}
