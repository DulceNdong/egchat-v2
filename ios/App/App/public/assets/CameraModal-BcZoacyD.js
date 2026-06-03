import { R as React, j as jsxRuntimeExports } from "./react-core-B1rSPtcn.js";
const CameraModal = ({ chatId, onClose, onPhotoTaken }) => {
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const [camReady, setCamReady] = React.useState(false);
  const [camError, setCamError] = React.useState("");
  const [facingMode, setFacingMode] = React.useState("environment");
  const [flash, setFlash] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);
  const startCamera = React.useCallback(async () => {
    setCamReady(false);
    setCamError("");
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 3840, min: 1280 },
          height: { ideal: 2160, min: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCamReady(true);
        };
      }
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCamReady(true);
          };
        }
      } catch (e) {
        let errorMsg = e.message || "No se pudo acceder a la cámara";
        if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
          errorMsg = "Permiso denegado. Ve a Ajustes del navegador → Permisos → Cámara y actívala para este sitio.";
        } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
          errorMsg = "No se encontró cámara en este dispositivo.";
        } else if (e.name === "NotReadableError" || e.name === "TrackStartError") {
          errorMsg = "La cámara está siendo usada por otra app. Cierra otras apps y vuelve a intentarlo.";
        } else if (e.name === "OverconstrainedError") {
          errorMsg = "La cámara no soporta la resolución requerida.";
        }
        setCamError(errorMsg);
      }
    }
  }, [facingMode]);
  React.useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);
  const capture = () => {
    if (!videoRef.current || !canvasRef.current || !camReady) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (facingMode === "user") {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0);
    const url = c.toDataURL("image/jpeg", 1);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onPhotoTaken(url, chatId);
  };
  const pickFromGallery = () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/*";
    inp.onchange = () => {
      if (inp.files?.[0]) {
        const r = new FileReader();
        r.onload = (e) => {
          streamRef.current?.getTracks().forEach((t) => t.stop());
          onPhotoTaken(e.target?.result, chatId);
        };
        r.readAsDataURL(inp.files[0]);
      }
    };
    inp.click();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "fixed", inset: 0, background: "#000", zIndex: 5e3, display: "flex", flexDirection: "column" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(0,0,0,0.5)", flexShrink: 0 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
            onClose();
          },
          style: { background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "6px", display: "flex", borderRadius: "50%" },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "15 18 9 12 15 6" }) })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "14px", fontWeight: "600", color: "#fff" }, children: "Cámara" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setFacingMode((p) => p === "environment" ? "user" : "environment"),
          style: { background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", cursor: "pointer", padding: "8px", display: "flex", borderRadius: "50%" },
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M1 4v6h6" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M23 20v-6h-6" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15" })
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, position: "relative", overflow: "hidden", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }, children: [
      camError ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", color: "#fff", padding: "32px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "56", height: "56", viewBox: "0 0 24 24", fill: "none", stroke: "#EF4444", strokeWidth: "1.5", strokeLinecap: "round", style: { margin: "0 auto 16px", display: "block" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "1", y1: "1", x2: "23", y2: "23" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "15px", fontWeight: "700", marginBottom: "8px" }, children: "Sin acceso a la cámara" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "20px", lineHeight: "1.5" }, children: camError }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: startCamera, style: { background: "#00b4e6", border: "none", borderRadius: "12px", padding: "11px 24px", color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", marginBottom: "10px", display: "block", width: "100%" }, children: "🔄 Reintentar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: pickFromGallery, style: { background: "#00c8a0", border: "none", borderRadius: "12px", padding: "11px 24px", color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", marginBottom: "10px", display: "block", width: "100%" }, children: "🖼️ Elegir de la galería" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              streamRef.current?.getTracks().forEach((t) => t.stop());
              onClose();
            },
            style: { background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "12px", padding: "11px 24px", color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer", width: "100%" },
            children: "Cancelar"
          }
        )
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "video",
          {
            ref: videoRef,
            autoPlay: true,
            playsInline: true,
            muted: true,
            style: { width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom}) ${facingMode === "user" ? "scaleX(-1)" : ""}`, transition: "transform 0.2s" }
          }
        ),
        camReady && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", inset: "12%", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "4px", pointerEvents: "none" }, children: ["tl", "tr", "bl", "br"].map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          position: "absolute",
          width: "22px",
          height: "22px",
          top: c.startsWith("t") ? "-1px" : "auto",
          bottom: c.startsWith("b") ? "-1px" : "auto",
          left: c.endsWith("l") ? "-1px" : "auto",
          right: c.endsWith("r") ? "-1px" : "auto",
          borderTop: c.startsWith("t") ? "3px solid #fff" : "none",
          borderBottom: c.startsWith("b") ? "3px solid #fff" : "none",
          borderLeft: c.endsWith("l") ? "3px solid #fff" : "none",
          borderRight: c.endsWith("r") ? "3px solid #fff" : "none"
        } }, c)) }),
        flash && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", inset: 0, background: "#fff", opacity: 0.8, pointerEvents: "none" } }),
        camReady && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#fff", fontSize: "10px", fontWeight: "700" }, children: [
            zoom.toFixed(1),
            "x"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "range",
              min: "1",
              max: "3",
              step: "0.1",
              value: zoom,
              onChange: (e) => setZoom(parseFloat(e.target.value)),
              style: { writingMode: "vertical-lr", direction: "rtl", height: "80px", cursor: "pointer", accentColor: "#00c8a0" }
            }
          )
        ] }),
        !camReady && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", color: "rgba(255,255,255,0.7)", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "16px", height: "16px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" } }),
          "Iniciando cámara..."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("canvas", { ref: canvasRef, style: { display: "none" } })
    ] }),
    !camError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(0,0,0,0.75)", padding: "20px 32px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: pickFromGallery,
          style: { width: "50px", height: "50px", borderRadius: "12px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" },
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "8.5", cy: "8.5", r: "1.5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "21 15 16 10 5 21" })
          ] })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            setFlash(true);
            setTimeout(() => setFlash(false), 150);
            setTimeout(capture, 80);
          },
          disabled: !camReady,
          style: { width: "76px", height: "76px", borderRadius: "50%", background: "transparent", border: "4px solid rgba(255,255,255,0.6)", cursor: camReady ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.1s" },
          onMouseDown: (e) => {
            e.currentTarget.style.transform = "scale(0.92)";
          },
          onMouseUp: (e) => {
            e.currentTarget.style.transform = "scale(1)";
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "62px", height: "62px", borderRadius: "50%", background: camReady ? "#fff" : "rgba(255,255,255,0.3)" } })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "50px" } })
    ] })
  ] });
};
export {
  CameraModal
};
