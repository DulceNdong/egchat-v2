import { r as reactExports, j as jsxRuntimeExports } from "./react-core-B1rSPtcn.js";
import { j as jsQR } from "./qr-D7_rpNIe.js";
const QRScanner = ({ onScan, onClose }) => {
  const videoRef = reactExports.useRef(null);
  const canvasRef = reactExports.useRef(null);
  const streamRef = reactExports.useRef(null);
  const animRef = reactExports.useRef(0);
  const scanningRef = reactExports.useRef(true);
  const fileInputRef = reactExports.useRef(null);
  const [error, setError] = reactExports.useState("");
  const [status, setStatus] = reactExports.useState("loading");
  const [mode, setMode] = reactExports.useState("camera");
  const [uploadError, setUploadError] = reactExports.useState("");
  const [uploadProcessing, setUploadProcessing] = reactExports.useState(false);
  const stopCamera = reactExports.useCallback(() => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);
  const scanFrame = reactExports.useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !scanningRef.current) return;
    if (video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth"
        });
        if (code?.data) {
          scanningRef.current = false;
          stopCamera();
          if ("vibrate" in navigator) navigator.vibrate(100);
          onScan(code.data);
          return;
        }
        if ("BarcodeDetector" in window) {
          const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          detector.detect(video).then((barcodes) => {
            if (barcodes.length > 0 && scanningRef.current) {
              scanningRef.current = false;
              stopCamera();
              onScan(barcodes[0].rawValue);
            }
          }).catch(() => {
          });
        }
      }
    }
    animRef.current = requestAnimationFrame(scanFrame);
  }, [onScan, stopCamera]);
  const startCamera = reactExports.useCallback(async () => {
    setStatus("loading");
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no permite acceso a la cámara.\nUsa la opción "Subir imagen" para escanear el QR.');
      setStatus("error");
      return;
    }
    const constraints = [
      { video: { facingMode: { exact: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: "environment" } },
      { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: true }
    ];
    let stream = null;
    let lastErr = null;
    for (const constraint of constraints) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraint);
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!stream) {
      const errName = lastErr?.name || "";
      let msg = "No se pudo acceder a la cámara.";
      if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
        msg = 'Permiso de cámara denegado.\nVe a Ajustes del navegador → Permisos → Cámara → Permitir.\nO usa "Subir imagen" para escanear el QR.';
      } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
        msg = 'No se encontró ninguna cámara en este dispositivo.\nUsa "Subir imagen" para escanear el QR.';
      } else if (errName === "NotReadableError" || errName === "TrackStartError") {
        msg = 'La cámara está siendo usada por otra app.\nCiérrala e inténtalo de nuevo, o usa "Subir imagen".';
      } else if (errName === "OverconstrainedError") {
        msg = 'La cámara no soporta la configuración requerida.\nUsa "Subir imagen" para escanear el QR.';
      } else {
        msg = 'No se pudo acceder a la cámara.\nUsa "Subir imagen" para escanear el QR.';
      }
      setError(msg);
      setStatus("error");
      return;
    }
    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    video.muted = true;
    const startScan = () => {
      setStatus("ready");
      scanningRef.current = true;
      animRef.current = requestAnimationFrame(scanFrame);
    };
    video.onloadedmetadata = () => video.play().then(startScan).catch(startScan);
    video.oncanplay = () => {
      if (status !== "ready") startScan();
    };
    setTimeout(() => {
      if (status === "loading") {
        video.play().catch(() => {
        });
        startScan();
      }
    }, 2500);
    try {
      await video.play();
      startScan();
    } catch (_) {
    }
  }, [scanFrame, status]);
  const processUploadedImage = reactExports.useCallback((file) => {
    setUploadError("");
    setUploadProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          setUploadError("Error procesando imagen.");
          setUploadProcessing(false);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
        if (!code && (img.width > 1200 || img.height > 1200)) {
          const scale = 1200 / Math.max(img.width, img.height);
          const c2 = document.createElement("canvas");
          c2.width = Math.round(img.width * scale);
          c2.height = Math.round(img.height * scale);
          const ctx2 = c2.getContext("2d", { willReadFrequently: true });
          ctx2.drawImage(img, 0, 0, c2.width, c2.height);
          const id2 = ctx2.getImageData(0, 0, c2.width, c2.height);
          code = jsQR(id2.data, id2.width, id2.height, { inversionAttempts: "attemptBoth" });
        }
        setUploadProcessing(false);
        if (code?.data) {
          if ("vibrate" in navigator) navigator.vibrate(100);
          onScan(code.data);
        } else {
          if ("BarcodeDetector" in window) {
            const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
            detector.detect(img).then((barcodes) => {
              if (barcodes.length > 0) {
                onScan(barcodes[0].rawValue);
              } else {
                setUploadError("No se encontró ningún código QR en la imagen. Asegúrate de que el QR sea visible y esté bien enfocado.");
              }
            }).catch(() => {
              setUploadError("No se encontró ningún código QR en la imagen. Asegúrate de que el QR sea visible y esté bien enfocado.");
            });
          } else {
            setUploadError("No se encontró ningún código QR en la imagen. Asegúrate de que el QR sea visible y esté bien enfocado.");
          }
        }
      };
      img.onerror = () => {
        setUploadError("No se pudo cargar la imagen.");
        setUploadProcessing(false);
      };
      img.src = e.target?.result;
    };
    reader.onerror = () => {
      setUploadError("Error leyendo el archivo.");
      setUploadProcessing(false);
    };
    reader.readAsDataURL(file);
  }, [onScan]);
  reactExports.useEffect(() => {
    if (mode === "camera") {
      scanningRef.current = true;
      startCamera();
    } else {
      stopCamera();
      setStatus("ready");
    }
    return () => stopCamera();
  }, [mode]);
  const switchToUpload = () => {
    stopCamera();
    setMode("upload");
    setError("");
    setUploadError("");
  };
  const switchToCamera = () => {
    setMode("camera");
    setUploadError("");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "fixed", inset: 0, background: "#000", zIndex: 6e3, display: "flex", flexDirection: "column" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "16px", display: "flex", alignItems: "center", gap: "12px", background: "rgba(0,0,0,0.8)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, style: { background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "4px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19 12H5M12 5l-7 7 7 7" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#fff", fontSize: "16px", fontWeight: "600", flex: 1 }, children: "Escanear QR" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", background: "rgba(255,255,255,0.1)", borderRadius: "20px", padding: "3px", gap: "2px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: switchToCamera,
            style: { background: mode === "camera" ? "#00c8a0" : "transparent", border: "none", borderRadius: "16px", padding: "5px 12px", color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "background 0.2s" },
            children: "📷 Cámara"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: switchToUpload,
            style: { background: mode === "upload" ? "#00c8a0" : "transparent", border: "none", borderRadius: "16px", padding: "5px 12px", color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "background 0.2s" },
            children: "🖼️ Imagen"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }, children: [
      mode === "camera" && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: error ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "32px 24px", color: "#fff", maxWidth: "320px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "48px", marginBottom: "16px" }, children: "📷" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", color: "#fca5a5", marginBottom: "24px", lineHeight: "1.6", whiteSpace: "pre-line" }, children: error }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
            setError("");
            setStatus("loading");
            startCamera();
          }, style: { background: "#00c8a0", border: "none", borderRadius: "12px", padding: "13px 20px", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer" }, children: "🔄 Reintentar cámara" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: switchToUpload, style: { background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "12px", padding: "13px 20px", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer" }, children: "🖼️ Subir imagen del QR" })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        status === "loading" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", zIndex: 10, color: "#fff", fontSize: "14px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "32px", height: "32px", border: "3px solid rgba(255,255,255,0.3)", borderTop: "3px solid #00c8a0", borderRadius: "50%", animation: "spin 0.8s linear infinite" } }),
          "Iniciando cámara..."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "video",
          {
            ref: videoRef,
            style: { width: "100%", height: "100%", objectFit: "cover" },
            playsInline: true,
            muted: true,
            autoPlay: true
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("canvas", { ref: canvasRef, style: { display: "none" } }),
        status === "ready" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", width: "240px", height: "240px", border: "3px solid #00c8a0", borderRadius: "16px", boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }, children: [
          [["0", "0", "right", "bottom"], ["0", "auto", "right", "auto"], ["auto", "0", "auto", "bottom"], ["auto", "auto", "auto", "auto"]].map(([t, r, b, l], i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", width: "24px", height: "24px", top: t === "auto" ? "auto" : -3, right: r === "auto" ? "auto" : -3, bottom: b === "auto" ? "auto" : -3, left: l === "auto" ? "auto" : -3, borderTop: i < 2 ? "4px solid #00c8a0" : "none", borderBottom: i >= 2 ? "4px solid #00c8a0" : "none", borderLeft: i === 0 || i === 2 ? "4px solid #00c8a0" : "none", borderRight: i === 1 || i === 3 ? "4px solid #00c8a0" : "none" } }, i)),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, #00c8a0, transparent)", animation: "scanLine 2s linear infinite", top: "50%" } })
        ] })
      ] }) }),
      mode === "upload" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "32px 24px", color: "#fff", maxWidth: "320px", width: "100%" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "56px", marginBottom: "16px" }, children: "🖼️" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "16px", fontWeight: "700", marginBottom: "8px" }, children: "Subir imagen del QR" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", color: "rgba(255,255,255,0.6)", marginBottom: "28px", lineHeight: "1.6" }, children: "Toma una foto del código QR con tu cámara nativa y súbela aquí, o selecciona una imagen de tu galería." }),
        uploadProcessing ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: "#00c8a0" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "36px", height: "36px", border: "3px solid rgba(0,200,160,0.3)", borderTop: "3px solid #00c8a0", borderRadius: "50%", animation: "spin 0.8s linear infinite" } }),
          "Procesando imagen..."
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: fileInputRef,
              type: "file",
              accept: "image/*",
              capture: "environment",
              style: { display: "none" },
              onChange: (e) => {
                const file = e.target.files?.[0];
                if (file) processUploadedImage(file);
                e.target.value = "";
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              id: "qr-gallery-input",
              type: "file",
              accept: "image/*",
              style: { display: "none" },
              onChange: (e) => {
                const file = e.target.files?.[0];
                if (file) processUploadedImage(file);
                e.target.value = "";
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "12px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => fileInputRef.current?.click(),
                style: { background: "#00c8a0", border: "none", borderRadius: "14px", padding: "15px 20px", color: "#fff", fontSize: "15px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" },
                children: "📸 Tomar foto del QR"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => document.getElementById("qr-gallery-input")?.click(),
                style: { background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: "14px", padding: "15px 20px", color: "#fff", fontSize: "15px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" },
                children: "🗂️ Elegir de galería"
              }
            )
          ] }),
          uploadError && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: "20px", padding: "12px 16px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", color: "#fca5a5", fontSize: "13px", lineHeight: "1.5" }, children: uploadError }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: switchToCamera, style: { marginTop: "20px", background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }, children: "Volver a intentar con cámara" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "16px 20px", textAlign: "center", background: "rgba(0,0,0,0.8)", color: "rgba(255,255,255,0.5)", fontSize: "12px" }, children: mode === "camera" ? "Apunta la cámara al código QR del contacto" : "Sube una foto clara del código QR" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        @keyframes scanLine { 0%{top:10%} 50%{top:90%} 100%{top:10%} }
        @keyframes spin { to { transform: rotate(360deg); } }
      ` })
  ] });
};
export {
  QRScanner
};
