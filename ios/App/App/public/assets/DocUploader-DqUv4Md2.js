import { r as reactExports, j as jsxRuntimeExports } from "./react-core-B1rSPtcn.js";
const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});
const API_BASE = "https://egchat-api.onrender.com".replace(/\/api$/, "");
async function uploadDocToServer(file, docName) {
  const token = localStorage.getItem("token") || localStorage.getItem("egchat_token") || "";
  const formData = new FormData();
  formData.append("file", file);
  formData.append("docName", docName);
  formData.append("category", "documents");
  const res = await fetch(`${API_BASE}/api/upload/document`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
    signal: AbortSignal.timeout(3e4)
  });
  if (!res.ok) {
    if (res.status === 404 || res.status === 405) {
      return "local";
    }
    throw new Error(`Error ${res.status}`);
  }
  const data = await res.json();
  return data.url || data.path || "uploaded";
}
const DocUploader = ({
  docs,
  onChange,
  accentColor = "#3B7DD8",
  doneColor = "#2E9E6B"
}) => {
  const [files, setFiles] = reactExports.useState({});
  const inputRefs = reactExports.useRef({});
  const cameraRefs = reactExports.useRef({});
  const doneCount = docs.filter((d) => files[d]?.uploaded).length;
  const progress = docs.length > 0 ? doneCount / docs.length * 100 : 0;
  const handleFile = async (docName, file) => {
    if (file.size > 10 * 1024 * 1024) {
      setFiles((prev) => {
        const next = { ...prev, [docName]: { name: file.name, size: file.size, type: file.type, dataUrl: "", uploaded: false, uploading: false, error: "Archivo demasiado grande (máx 10MB)" } };
        onChange(next);
        return next;
      });
      return;
    }
    let dataUrl = "";
    try {
      dataUrl = await readAsDataUrl(file);
    } catch {
    }
    setFiles((prev) => {
      const next = { ...prev, [docName]: { name: file.name, size: file.size, type: file.type, dataUrl, uploaded: false, uploading: true } };
      onChange(next);
      return next;
    });
    try {
      await uploadDocToServer(file, docName);
      setFiles((prev) => {
        const next = { ...prev, [docName]: { ...prev[docName], uploading: false, uploaded: true } };
        onChange(next);
        return next;
      });
    } catch (err) {
      setFiles((prev) => {
        const next = { ...prev, [docName]: { ...prev[docName], uploading: false, uploaded: true, error: void 0 } };
        onChange(next);
        return next;
      });
    }
  };
  const removeDoc = (docName) => {
    setFiles((prev) => {
      const next = { ...prev, [docName]: null };
      onChange(next);
      return next;
    });
  };
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const isImage = (type) => type.startsWith("image/");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#EFF6FF", borderRadius: "12px", padding: "12px 14px", marginBottom: "14px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "700", color: "#1D4ED8" }, children: "📎 Documentos requeridos" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#3B82F6", fontWeight: "600" }, children: [
          doneCount,
          "/",
          docs.length,
          " subidos"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "#DBEAFE", borderRadius: "4px", height: "6px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: doneCount === docs.length ? doneColor : accentColor, borderRadius: "4px", height: "6px", width: `${progress}%`, transition: "width 0.4s ease" } }) })
    ] }),
    docs.map((doc, i) => {
      const f = files[doc];
      const isDone = f?.uploaded;
      const isUploading = f?.uploading;
      const hasError = f?.error;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "14px", padding: "14px", marginBottom: "10px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${isDone ? "#BBF7D0" : "#F0F2F5"}` }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: isDone ? "0" : "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "42px", height: "42px", borderRadius: "10px", background: isDone ? "#F0FAF5" : "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }, children: isDone && f?.dataUrl && isImage(f.type) ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: f.dataUrl, alt: doc, style: { width: "100%", height: "100%", objectFit: "cover" } }) : isDone ? /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: doneColor, strokeWidth: "2.5", strokeLinecap: "round", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "#8A9BB5", strokeWidth: "1.8", strokeLinecap: "round", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "14 2 14 8 20 8" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "700", color: "#1A2B4A", marginBottom: "2px" }, children: doc }),
            isDone && f ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: doneColor, fontWeight: "600" }, children: [
              "✓ ",
              f.name,
              " · ",
              formatSize(f.size)
            ] }) : isUploading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: accentColor }, children: "⏳ Subiendo..." }) : hasError ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#DC2626" }, children: [
              "⚠️ ",
              hasError
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "#8A9BB5" }, children: "Pendiente · PDF, JPG, PNG (máx 10MB)" })
          ] }),
          isDone && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => removeDoc(doc), style: { background: "#FEE2E2", border: "none", borderRadius: "8px", padding: "4px 8px", fontSize: "11px", color: "#DC2626", cursor: "pointer", flexShrink: 0 }, children: "Cambiar" })
        ] }),
        !isDone && !isUploading && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { flex: 1, background: "#EFF5FD", border: `1.5px solid ${accentColor}`, borderRadius: "10px", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700", color: accentColor }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "17 8 12 3 7 8" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "3", x2: "12", y2: "15" })
            ] }),
            "Subir archivo",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                ref: (el) => {
                  inputRefs.current[doc] = el;
                },
                type: "file",
                accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx,.heic",
                style: { display: "none" },
                onChange: (e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(doc, file);
                  e.target.value = "";
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { flex: 1, background: "#F0FAF5", border: `1.5px solid ${doneColor}`, borderRadius: "10px", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700", color: doneColor }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "13", r: "4" })
            ] }),
            "Tomar foto",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                ref: (el) => {
                  cameraRefs.current[doc] = el;
                },
                type: "file",
                accept: "image/*",
                capture: "environment",
                style: { display: "none" },
                onChange: (e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(doc, file);
                  e.target.value = "";
                }
              }
            )
          ] })
        ] }),
        isUploading && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: "#EFF5FD", borderRadius: "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "16px", height: "16px", border: `2px solid ${accentColor}20`, borderTop: `2px solid ${accentColor}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "12px", color: accentColor, fontWeight: "600" }, children: "Subiendo documento..." })
        ] })
      ] }, i);
    }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `@keyframes spin { to { transform: rotate(360deg); } }` })
  ] });
};
export {
  DocUploader as D
};
