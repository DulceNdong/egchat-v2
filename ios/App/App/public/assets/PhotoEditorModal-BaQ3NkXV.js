import { R as React, j as jsxRuntimeExports } from "./react-core-B1rSPtcn.js";
const FILTERS = [
  { id: "none", label: "Original", fn: (b, c, s) => `brightness(${b}%) contrast(${c}%) saturate(${s}%)` },
  { id: "bw", label: "B&N", fn: (b, c, s) => `grayscale(100%) brightness(${b}%) contrast(${c}%)` },
  { id: "warm", label: "Cálido", fn: (b, c, s) => `sepia(40%) saturate(${s * 1.2}%) brightness(${b}%) contrast(${c}%)` },
  { id: "cool", label: "Frío", fn: (b, c, s) => `hue-rotate(30deg) saturate(${s * 1.1}%) brightness(${b}%) contrast(${c}%)` },
  { id: "vivid", label: "Vívido", fn: (b, c, s) => `saturate(${s * 1.8}%) contrast(${c * 1.1}%) brightness(${b}%)` },
  { id: "fade", label: "Fade", fn: (b, c, s) => `opacity(0.88) saturate(${s * 0.7}%) brightness(${b * 1.05}%) contrast(${c * 0.9}%)` },
  { id: "drama", label: "Drama", fn: (b, c, s) => `contrast(${c * 1.3}%) brightness(${b * 0.9}%) saturate(${s * 1.2}%)` },
  { id: "retro", label: "Retro", fn: (b, c, s) => `sepia(60%) hue-rotate(-10deg) saturate(${s * 0.8}%) brightness(${b}%)` }
];
const PhotoEditorModal = ({ photoUrl, chatId, onClose, onSend }) => {
  const canvasRef = React.useRef(null);
  const imgRef = React.useRef(null);
  const [tool, setTool] = React.useState("filters");
  const [filter, setFilter] = React.useState("none");
  const [brightness, setBrightness] = React.useState(100);
  const [contrast, setContrast] = React.useState(100);
  const [saturation, setSaturation] = React.useState(100);
  const [rotation, setRotation] = React.useState(0);
  const [flipH, setFlipH] = React.useState(false);
  const [caption, setCaption] = React.useState("");
  const [overlayText, setOverlayText] = React.useState("");
  const [showTextInput, setShowTextInput] = React.useState(false);
  const [textInput, setTextInput] = React.useState("");
  const currentFilterDef = FILTERS.find((f) => f.id === filter) || FILTERS[0];
  const cssFilter = currentFilterDef.fn(brightness, contrast, saturation);
  const transform = `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`;
  const exportAndSend = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(rotation * Math.PI / 180);
    if (flipH) ctx.scale(-1, 1);
    ctx.translate(-w / 2, -h / 2);
    ctx.filter = cssFilter;
    ctx.drawImage(img, 0, 0, w, h);
    ctx.restore();
    if (overlayText) {
      ctx.font = `bold ${Math.max(24, w / 20)}px sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = Math.max(2, w / 200);
      ctx.textAlign = "center";
      ctx.strokeText(overlayText, w / 2, h - h / 8);
      ctx.fillText(overlayText, w / 2, h - h / 8);
    }
    const url = canvas.toDataURL("image/jpeg", 0.95);
    onSend(chatId, caption, url);
  };
  const TOOLS = [
    { id: "filters", label: "Filtros", icon: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" })
    ] }) },
    { id: "adjust", label: "Ajustar", icon: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "4", y1: "21", x2: "4", y2: "14" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "4", y1: "10", x2: "4", y2: "3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "21", x2: "12", y2: "12" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "8", x2: "12", y2: "3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "20", y1: "21", x2: "20", y2: "16" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "20", y1: "12", x2: "20", y2: "3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "1", y1: "14", x2: "7", y2: "14" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "8", x2: "15", y2: "8" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "17", y1: "16", x2: "23", y2: "16" })
    ] }) },
    { id: "rotate", label: "Rotar", icon: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "23 4 23 10 17 10" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M20.49 15a9 9 0 1 1-2.12-9.36L23 10" })
    ] }) },
    { id: "text", label: "Texto", icon: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "4 7 4 4 20 4 20 7" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "20", x2: "15", y2: "20" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "4", x2: "12", y2: "20" })
    ] }) }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "fixed", inset: 0, background: "#1a1a1a", zIndex: 5e3, display: "flex", flexDirection: "column" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "rgba(0,0,0,0.6)", flexShrink: 0 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, style: { background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "6px", display: "flex" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "15 18 9 12 15 6" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "14px", fontWeight: "600", color: "#fff" }, children: "Editar foto" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: exportAndSend,
          style: { background: "#00c8a0", border: "none", borderRadius: "20px", padding: "7px 18px", color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer" },
          children: "Enviar"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#111", position: "relative" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          ref: imgRef,
          src: photoUrl,
          alt: "edit",
          style: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain", filter: cssFilter, transform, transition: "all 0.2s" },
          crossOrigin: "anonymous"
        }
      ),
      overlayText && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", bottom: "12%", left: 0, right: 0, textAlign: "center", fontSize: "22px", fontWeight: "800", color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.8)", pointerEvents: "none", padding: "0 16px" }, children: overlayText }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("canvas", { ref: canvasRef, style: { display: "none" } })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(0,0,0,0.85)", flexShrink: 0 }, children: [
      tool === "filters" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "10px 16px 8px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "8px", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "4px" }, children: FILTERS.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setFilter(f.id),
          style: { flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", padding: "4px" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "52px", height: "52px", borderRadius: "10px", overflow: "hidden", border: `2px solid ${filter === f.id ? "#00c8a0" : "transparent"}`, position: "relative" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: photoUrl, alt: f.label, style: { width: "100%", height: "100%", objectFit: "cover", filter: f.fn(brightness, contrast, saturation) } }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "10px", color: filter === f.id ? "#00c8a0" : "rgba(255,255,255,0.7)", fontWeight: filter === f.id ? "700" : "500" }, children: f.label })
          ]
        },
        f.id
      )) }) }),
      tool === "adjust" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "12px 20px 8px" }, children: [
        [
          { label: "Brillo", value: brightness, set: setBrightness, min: 50, max: 150 },
          { label: "Contraste", value: contrast, set: setContrast, min: 50, max: 200 },
          { label: "Saturación", value: saturation, set: setSaturation, min: 0, max: 200 }
        ].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "4px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "11px", color: "rgba(255,255,255,0.7)", fontWeight: "600" }, children: s.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "11px", color: "#00c8a0", fontWeight: "700" }, children: [
              s.value,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "range",
              min: s.min,
              max: s.max,
              value: s.value,
              onChange: (e) => s.set(parseInt(e.target.value)),
              style: { width: "100%", accentColor: "#00c8a0", cursor: "pointer" }
            }
          )
        ] }, s.label)),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              setBrightness(100);
              setContrast(100);
              setSaturation(100);
            },
            style: { background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "8px", padding: "6px 14px", color: "rgba(255,255,255,0.7)", fontSize: "11px", cursor: "pointer", fontWeight: "600" },
            children: "Restablecer"
          }
        )
      ] }),
      tool === "rotate" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "12px 20px 8px", display: "flex", gap: "10px", flexWrap: "wrap" }, children: [
        [
          { label: "↺ -90°", action: () => setRotation((r) => (r - 90 + 360) % 360) },
          { label: "↻ +90°", action: () => setRotation((r) => (r + 90) % 360) },
          { label: "↔ Voltear", action: () => setFlipH((p) => !p) },
          { label: "⟳ Restablecer", action: () => {
            setRotation(0);
            setFlipH(false);
          } }
        ].map((b) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: b.action,
            style: { background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "10px", padding: "9px 16px", color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
            children: b.label
          },
          b.label
        )),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { width: "100%", marginTop: "4px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "4px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "11px", color: "rgba(255,255,255,0.7)", fontWeight: "600" }, children: "Ángulo libre" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "11px", color: "#00c8a0", fontWeight: "700" }, children: [
              rotation,
              "°"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "range",
              min: "0",
              max: "359",
              value: rotation,
              onChange: (e) => setRotation(parseInt(e.target.value)),
              style: { width: "100%", accentColor: "#00c8a0", cursor: "pointer" }
            }
          )
        ] })
      ] }),
      tool === "text" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "12px 20px 8px" }, children: [
        showTextInput ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px", alignItems: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              autoFocus: true,
              value: textInput,
              onChange: (e) => setTextInput(e.target.value),
              placeholder: "Escribe el texto...",
              style: { flex: 1, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "10px", padding: "9px 14px", color: "#fff", fontSize: "13px", outline: "none", fontFamily: "inherit" }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => {
                setOverlayText(textInput);
                setShowTextInput(false);
              },
              style: { background: "#00c8a0", border: "none", borderRadius: "10px", padding: "9px 16px", color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer" },
              children: "OK"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => {
                setShowTextInput(false);
                setTextInput("");
              },
              style: { background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "10px", padding: "9px 12px", color: "#fff", fontSize: "12px", cursor: "pointer" },
              children: "✕"
            }
          )
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => {
                setTextInput(overlayText);
                setShowTextInput(true);
              },
              style: { background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "10px", padding: "9px 18px", color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
              children: overlayText ? "✏️ Editar texto" : "+ Añadir texto"
            }
          ),
          overlayText && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setOverlayText(""),
              style: { background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "9px 14px", color: "#EF4444", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
              children: "Quitar texto"
            }
          )
        ] }),
        overlayText && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "8px", fontSize: "12px", color: "rgba(255,255,255,0.5)" }, children: [
          'Vista previa: "',
          overlayText,
          '"'
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "6px 0" }, children: TOOLS.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setTool(t.id),
          style: { flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", padding: "8px 4px", color: tool === t.id ? "#00c8a0" : "rgba(255,255,255,0.5)", transition: "color 0.15s" },
          children: [
            t.icon,
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "10px", fontWeight: tool === t.id ? "700" : "500" }, children: t.label })
          ]
        },
        t.id
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "8px 16px 16px", display: "flex", alignItems: "center", gap: "10px", borderTop: "1px solid rgba(255,255,255,0.08)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: "24px", padding: "0 16px", height: "40px", display: "flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.15)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            value: caption,
            onChange: (e) => setCaption(e.target.value),
            placeholder: "Añade un pie de foto...",
            style: { flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: "13px", fontFamily: "inherit" }
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: exportAndSend,
            style: { width: "44px", height: "44px", borderRadius: "50%", background: "#00c8a0", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,200,160,0.4)" },
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "#fff", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "22", y1: "2", x2: "11", y2: "13" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })
            ] })
          }
        )
      ] })
    ] })
  ] });
};
export {
  PhotoEditorModal
};
