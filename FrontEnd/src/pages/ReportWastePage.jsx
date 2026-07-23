import { useState, useRef, useEffect } from "react";
import { Trash2, MapPin, Camera, CheckCircle, RotateCcw, Locate, X, AlertTriangle, ChevronDown, Circle } from "lucide-react";
import { cn } from "../utils";
import * as api from "../api";
import { LOCATIONS } from "../cleanup-team/data/tasks";

// Supported districts with approx bounding boxes for GPS matching.
// Names come from the single canonical LOCATIONS list (same one the
// Cleanup Team app and the community-voting store use) so a report filed
// here always lands in a district admin/cleanup team recognize — instead
// of each screen keeping its own, independently-spelled copy of the name.
const DISTRICTS = [
  {
    name: LOCATIONS.russeikeo.name,
    bounds: { latMin: 11.595, latMax: 11.650, lngMin: 104.880, lngMax: 104.930 },
  },
  {
    name: LOCATIONS.prekleap.name,
    // Prek Leap sangkat sits within Khan Chroy Changvar, along the river just
    // north of the Chroy Changvar bridge — previously this box still had the
    // old "Prek Pnov" coordinates from a plain text rename, which is a
    // different area further west and caused real GPS scans to miss it.
    bounds: { latMin: 11.640, latMax: 11.700, lngMin: 104.900, lngMax: 104.960 },
  },
  {
    name: LOCATIONS.chroychongva.name,
    bounds: { latMin: 11.575, latMax: 11.640, lngMin: 104.920, lngMax: 104.970 },
  },
  {
    name: LOCATIONS.chbaompov.name,
    bounds: { latMin: 11.530, latMax: 11.580, lngMin: 104.940, lngMax: 104.990 },
  },
  {
    name: LOCATIONS.boeungkengkang.name,
    bounds: { latMin: 11.545, latMax: 11.575, lngMin: 104.910, lngMax: 104.940 },
  },
];

function districtFromCoords(lat, lng) {
  return DISTRICTS.find(
    (d) => lat >= d.bounds.latMin && lat <= d.bounds.latMax && lng >= d.bounds.lngMin && lng <= d.bounds.lngMax
  ) || null;
}

export default function ReportWastePage() {
  const [form, setForm] = useState({ wasteType: "", description: "", district: "", severity: "" });
  const [coords, setCoords] = useState(null);
  const [image, setImage] = useState(null); // preview URL
  const [imageFile, setImageFile] = useState(null); // actual File for upload
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Daily submission cap (2 reports / 24h) — checked on load so the person
  // finds out before filling out the whole form, not after clicking submit.
  const [limitStatus, setLimitStatus] = useState(null); // { max, used, remaining, nextSlotAt, hoursRemaining }
  const loadLimitStatus = () => {
    api.getReportLimitStatus().then(setLimitStatus).catch(() => {});
  };
  useEffect(() => { loadLimitStatus(); }, []);
  const limitReached = limitStatus && limitStatus.remaining <= 0;

  // Live "hh:mm:ss until your next slot" countdown, driven off the server's
  // nextSlotAt timestamp. Recomputed every second while the cap is in effect.
  const [countdown, setCountdown] = useState("");
  useEffect(() => {
    if (!limitReached || !limitStatus?.nextSlotAt) { setCountdown(""); return; }
    const target = new Date(limitStatus.nextSlotAt).getTime();
    const tick = () => {
      const msLeft = target - Date.now();
      if (msLeft <= 0) {
        setCountdown("00:00:00");
        loadLimitStatus(); // slot should be free now — refresh to lift the cap
        return;
      }
      const h = Math.floor(msLeft / 3600000);
      const m = Math.floor((msLeft % 3600000) / 60000);
      const s = Math.floor((msLeft % 60000) / 1000);
      setCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [limitReached, limitStatus?.nextSlotAt]);

  // Location state
  const [districtOpen, setDistrictOpen] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null); // null | "unsupported" | "out-of-zone" | "denied"
  const [showMap, setShowMap] = useState(false);
  const [pinError, setPinError] = useState(false); // true when the last map click was outside supported areas
  const districtRef = useRef(null);
  const fileRef = useRef(null);
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const pinMarkerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (districtRef.current && !districtRef.current.contains(e.target)) setDistrictOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectDistrict = (name) => {
    setForm((f) => ({ ...f, district: name }));
    setCoords(null);
    setGpsError(null);
    setPinError(false);
    setDistrictOpen(false);
  };

  const detectGPS = () => {
    if (!navigator.geolocation) { setGpsError("unsupported"); return; }
    setGpsLoading(true);
    setGpsError(null);
    setPinError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        const match = districtFromCoords(lat, lng);
        if (match) {
          setForm((f) => ({ ...f, district: match.name }));
          setGpsError(null);
        } else {
          setForm((f) => ({ ...f, district: "" }));
          setGpsError("out-of-zone");
        }
        setGpsLoading(false);
      },
      () => { setGpsError("denied"); setGpsLoading(false); },
      { timeout: 8000 }
    );
  };

  const handleMapPin = (lat, lng) => {
    setCoords({ lat, lng });
    const match = districtFromCoords(lat, lng);
    if (match) {
      setForm((f) => ({ ...f, district: match.name }));
      setPinError(false);
      setGpsError(null);
    } else {
      setForm((f) => ({ ...f, district: "" }));
      setPinError(true);
    }
  };

  // Load Leaflet once, then draw the 5 supported-district boundaries and wire
  // up click-to-pin. Re-run whenever the map panel is opened.
  useEffect(() => {
    if (!showMap || !mapContainerRef.current) return;

    function drawDistrictsAndPin(L, map) {
      DISTRICTS.forEach((d) => {
        L.rectangle(
          [[d.bounds.latMin, d.bounds.lngMin], [d.bounds.latMax, d.bounds.lngMax]],
          { color: "#22C55E", weight: 1, fillColor: "#22C55E", fillOpacity: 0.08 }
        ).addTo(map).bindTooltip(d.name, { sticky: true });
      });

      if (coords) {
        pinMarkerRef.current = L.marker([coords.lat, coords.lng]).addTo(map);
      }

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        if (pinMarkerRef.current) pinMarkerRef.current.remove();
        pinMarkerRef.current = L.marker([lat, lng]).addTo(map);
        handleMapPin(lat, lng);
      });
    }

    if (leafletMapRef.current) {
      // Map already initialized — just make sure it re-renders in its (possibly newly-visible) container
      setTimeout(() => leafletMapRef.current.invalidateSize(), 50);
      return;
    }

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    function init() {
      const L = window.L;
      if (!L || leafletMapRef.current) return;
      const map = L.map(mapContainerRef.current, { center: [11.62, 104.92], zoom: 12 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      leafletMapRef.current = map;
      drawDistrictsAndPin(L, map);
      setTimeout(() => map.invalidateSize(), 50);
    }

    if (window.L) {
      init();
    } else if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = init;
      document.head.appendChild(script);
    } else {
      // script tag already added by another instance — poll until it's ready
      const interval = setInterval(() => {
        if (window.L) { clearInterval(interval); init(); }
      }, 150);
      return () => clearInterval(interval);
    }
  }, [showMap]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tear down the map instance if the whole form is reset/unmounted
  useEffect(() => () => { leafletMapRef.current?.remove(); leafletMapRef.current = null; }, []);

  const validate = () => {
    const e = {};
    if (!form.wasteType)       e.wasteType = "Please select a waste type";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.district)        e.district = "Please select a district";
    if (!form.severity)        e.severity = "Please select a severity level";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (limitReached) return; // button is disabled too, but guard just in case
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    setErrors({});
    try {
      const fd = new FormData();
      fd.append("title", `${form.wasteType} — ${form.district}`);
      fd.append("description", form.description);
      fd.append("location", form.district);
      fd.append("category", form.wasteType);
      fd.append("priority", form.severity);
      if (imageFile) fd.append("image", imageFile);

      await api.submitReport(fd);
      setSubmitted(true);
      loadLimitStatus(); // one slot just got used up — refresh the count
    } catch (err) {
      setErrors({ form: err.message });
      loadLimitStatus(); // in case the server rejected it for being over the cap
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({ wasteType: "", description: "", district: "", severity: "" });
    setCoords(null);
    setImage(null);
    setImageFile(null);
    setErrors({});
    setGpsError(null);
    setSubmitted(false);
    setPinError(false);
    setShowMap(false);
    if (pinMarkerRef.current) { pinMarkerRef.current.remove(); pinMarkerRef.current = null; }
  };

  const fieldCls = "border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]/40 focus:border-[#22C55E] transition-all w-full";

  if (submitted) {
    return (
      <div className="max-w-md mx-auto mt-10 text-center bg-white rounded-3xl p-10 shadow-sm border border-gray-100">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-[#22C55E]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted!</h2>
        <p className="text-sm text-gray-500 mb-1 flex items-center justify-center gap-1">
          <MapPin className="w-4 h-4 text-[#22C55E]" /> District: <strong>{form.district}</strong>
        </p>
        {coords && <p className="text-xs text-gray-400 mb-4">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>}
        <p className="text-gray-500 mb-6">Thank you for helping keep Cambodia clean. Your report has been received and will be reviewed shortly.</p>
        <button onClick={handleReset} className="px-6 py-3 rounded-2xl bg-[#22C55E] text-white font-semibold hover:bg-[#16A34A] transition-colors">
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Report Waste</h1>
            <p className="text-sm text-gray-400">Help us keep our community clean</p>
          </div>
          {limitStatus && !limitReached && (
            <span className="ml-auto text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
              {limitStatus.remaining}/{limitStatus.max} reports left today
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Waste Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Waste Type *</label>
            <select value={form.wasteType} onChange={(e) => setForm({ ...form, wasteType: e.target.value })} className={fieldCls}>
              <option value="">Select waste type</option>
              {["Illegal Dumping", "Overflowing Bin", "Hazardous Waste", "Construction Waste", "Litter", "Sewage"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.wasteType && <p className="text-red-500 text-xs mt-1">{errors.wasteType}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the waste issue in detail..."
              className={cn(fieldCls, "resize-none")}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Upload Image</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#22C55E] hover:bg-green-50/40 transition-all"
            >
              {image ? (
                <div className="relative inline-block">
                  <img src={image} alt="Preview" className="h-32 mx-auto rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setImage(null); setImageFile(null); }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Click to upload a photo</p>
                  <p className="text-xs text-gray-300 mt-1">PNG, JPG up to 10MB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImage(URL.createObjectURL(f)); setImageFile(f); } }} />
          </div>

          {/* Location — District picker + GPS */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location *</label>
            <div className="flex gap-2" ref={districtRef}>

              {/* District dropdown */}
              <div className="relative flex-1">
                <button
                  type="button"
                  onClick={() => setDistrictOpen((v) => !v)}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all text-left",
                    form.district
                      ? "border-[#22C55E] text-gray-700 bg-white"
                      : "border-gray-200 text-gray-400 bg-white",
                    errors.district && !form.district && "border-red-300"
                  )}
                >
                  <span
                    role="button"
                    title="Pin your location on the map"
                    onClick={(e) => { e.stopPropagation(); setDistrictOpen(false); setShowMap((v) => !v); }}
                    className={cn(
                      "flex-shrink-0 rounded-lg p-0.5 -m-0.5 transition-colors",
                      showMap ? "bg-[#16A34A] text-white" : "text-[#22C55E] hover:bg-green-100"
                    )}
                  >
                    <MapPin className="w-4 h-4" />
                  </span>
                  <span className="flex-1">{form.district || "Select district in Phnom Penh"}</span>
                  <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", districtOpen && "rotate-180")} />
                </button>

                {districtOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
                    {DISTRICTS.map((d) => (
                      <button
                        key={d.name}
                        type="button"
                        onClick={() => selectDistrict(d.name)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-green-50 transition-colors text-left text-sm border-b border-gray-50 last:border-0",
                          form.district === d.name ? "text-[#16A34A] font-semibold bg-green-50" : "text-gray-700"
                        )}
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#22C55E] flex-shrink-0" />
                        {d.name}
                        {form.district === d.name && <CheckCircle className="w-3.5 h-3.5 ml-auto text-[#22C55E]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* GPS button */}
              <button
                type="button"
                onClick={detectGPS}
                disabled={gpsLoading}
                title="Use my current location"
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-[#22C55E] text-[#22C55E] text-xs font-semibold hover:bg-green-50 transition-all disabled:opacity-60"
              >
                {gpsLoading ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <Locate className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Use GPS</span>
              </button>
            </div>

            {/* GPS status messages */}
            {gpsError === "out-of-zone" && (
              <div className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-700">Location not available</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    We currently only support: Russey Keo, Prek Leap, Chroy Changvar, Chbar Ampov, and Boeng Keng Kang. Please select your district manually.
                  </p>
                </div>
              </div>
            )}
            {gpsError === "denied" && (
              <p className="text-amber-600 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Location access was denied. Please select your district from the list.
              </p>
            )}
            {gpsError === "unsupported" && (
              <p className="text-gray-400 text-xs mt-1.5">GPS is not supported on this device. Please select your district manually.</p>
            )}
            {coords && !gpsError && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                <CheckCircle className="w-3 h-3" />
                GPS locked · {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </div>
            )}

            {/* Pin-on-map panel */}
            {showMap && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">
                  Tap anywhere inside a highlighted area to drop a pin — that sets your district automatically.
                </p>
                <div ref={mapContainerRef} className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 280, width: "100%" }} />
                {pinError && (
                  <div className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-700">That spot is outside our supported areas</p>
                      <p className="text-xs text-amber-600 mt-0.5">Please tap inside one of the highlighted zones, or select your district manually below.</p>
                    </div>
                  </div>
                )}
                {coords && !pinError && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Pinned · {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                  </div>
                )}
              </div>
            )}

            {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Severity Level *</label>
            <div className="flex gap-3">
              {[
                { value: "low",    label: "Low",    dot: "text-green-500",  color: "border-green-300 text-green-700 bg-green-50" },
                { value: "medium", label: "Medium", dot: "text-yellow-500", color: "border-yellow-300 text-yellow-700 bg-yellow-50" },
                { value: "high",   label: "High",   dot: "text-red-500",    color: "border-red-300 text-red-700 bg-red-50" },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setForm({ ...form, severity: s.value })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all",
                    form.severity === s.value ? s.color : "border-gray-200 text-gray-500 hover:border-gray-300"
                  )}
                >
                  <Circle className={cn("w-2.5 h-2.5 fill-current", s.dot)} />
                  {s.label}
                </button>
              ))}
            </div>
            {errors.severity && <p className="text-red-500 text-xs mt-1">{errors.severity}</p>}
          </div>

          {/* Daily report cap reached */}
          {limitReached && (
            <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                You've reached today's limit of {limitStatus.max} reports.
                {countdown
                  ? <> Next report slot opens in <strong className="font-mono">{countdown}</strong>.</>
                  : limitStatus.hoursRemaining
                    ? ` Please wait about ${limitStatus.hoursRemaining} hour${limitStatus.hoursRemaining === 1 ? "" : "s"} before submitting another.`
                    : " Please try again later."}
              </span>
            </div>
          )}

          {/* Submission error */}
          {errors.form && (
            <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {errors.form}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || limitReached}
              className="flex-1 py-3 rounded-2xl bg-[#22C55E] text-white font-bold hover:bg-[#16A34A] transition-colors shadow-sm disabled:opacity-70"
            >
              {submitting ? "Submitting…" : limitReached ? `Daily limit reached${countdown ? ` — ${countdown}` : ""}` : "Submit Report"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
