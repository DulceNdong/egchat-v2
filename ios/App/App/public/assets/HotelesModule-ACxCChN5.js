import { r as reactExports, j as jsxRuntimeExports } from "./react-core-B1rSPtcn.js";
import { D as DocUploader } from "./DocUploader-DqUv4Md2.js";
const CIUDADES_H = ["Malabo", "Bata", "Ebebiyin", "Mongomo"];
const HOTELES = [
  {
    id: "h01",
    nombre: "Hotel Bahía",
    ciudad: "Malabo",
    barrio: "Puerto",
    estrellas: 4,
    color: "#0A4A8A",
    color2: "#00b4e6",
    descripcion: "Hotel de lujo frente al mar con vistas a la bahía de Malabo. Restaurante, piscina y spa.",
    tel: "+240 222 27 01 01",
    web: "hotelbahia.gq",
    lat: 3.7612,
    lng: 8.7698,
    servicios: ["Piscina", "Spa", "Restaurante", "Bar", "WiFi", "Parking", "Gimnasio", "Sala de reuniones"],
    habitaciones: [
      { tipo: "Individual", precio: 45e3, desc: "Cama individual, baño privado, AC, TV, WiFi", disponible: true, img: "🛏️" },
      { tipo: "Doble Estándar", precio: 65e3, desc: "Cama doble, baño privado, AC, TV, WiFi, minibar", disponible: true, img: "🛏️" },
      { tipo: "Suite Junior", precio: 95e3, desc: "Sala de estar, cama king, jacuzzi, vistas al mar", disponible: true, img: "🏨" },
      { tipo: "Suite Presidencial", precio: 18e4, desc: "2 habitaciones, sala, cocina, terraza privada con vistas", disponible: false, img: "👑" }
    ]
  },
  {
    id: "h02",
    nombre: "Hotel Impala",
    ciudad: "Malabo",
    barrio: "Centro",
    estrellas: 3,
    color: "#1B3A6B",
    color2: "#2A5298",
    descripcion: "Hotel céntrico con excelente relación calidad-precio. Ideal para viajes de negocios.",
    tel: "+240 222 27 01 02",
    web: "hotelimpala.gq",
    lat: 3.7523,
    lng: 8.7741,
    servicios: ["Restaurante", "Bar", "WiFi", "Parking", "Sala de reuniones", "Lavandería"],
    habitaciones: [
      { tipo: "Individual", precio: 28e3, desc: "Cama individual, baño privado, AC, TV, WiFi", disponible: true, img: "🛏️" },
      { tipo: "Doble", precio: 38e3, desc: "Cama doble, baño privado, AC, TV, WiFi", disponible: true, img: "🛏️" },
      { tipo: "Triple", precio: 52e3, desc: "3 camas individuales, baño privado, AC, TV", disponible: true, img: "🛏️" },
      { tipo: "Suite", precio: 75e3, desc: "Sala de estar, cama king, baño con bañera", disponible: true, img: "🏨" }
    ]
  },
  {
    id: "h03",
    nombre: "Sofitel Malabo Sipopo",
    ciudad: "Malabo",
    barrio: "Sipopo",
    estrellas: 5,
    color: "#8B0000",
    color2: "#C0392B",
    descripcion: "El hotel más lujoso de Guinea Ecuatorial. Complejo de lujo con playa privada y campo de golf.",
    tel: "+240 222 27 01 03",
    web: "sofitel-malabo.com",
    lat: 3.7834,
    lng: 8.8012,
    servicios: ["Playa privada", "Golf", "Piscina", "Spa", "2 Restaurantes", "Bar", "WiFi", "Parking", "Helipuerto", "Sala de conferencias"],
    habitaciones: [
      { tipo: "Habitación Deluxe", precio: 12e4, desc: "Cama king, terraza, vistas al mar, minibar, jacuzzi", disponible: true, img: "🏨" },
      { tipo: "Suite Junior", precio: 18e4, desc: "Sala de estar, cama king, terraza privada, butler service", disponible: true, img: "👑" },
      { tipo: "Suite Presidencial", precio: 35e4, desc: "3 habitaciones, sala, cocina, piscina privada, butler 24h", disponible: true, img: "👑" }
    ]
  },
  {
    id: "h04",
    nombre: "Aparthotel GQ Malabo",
    ciudad: "Malabo",
    barrio: "Malabo II",
    estrellas: 3,
    color: "#6B5BD6",
    color2: "#7C3AED",
    descripcion: "Apartamentos totalmente equipados para estancias largas. Cocina completa en cada unidad.",
    tel: "+240 222 27 01 04",
    web: "aparthotelgq.gq",
    lat: 3.7389,
    lng: 8.7867,
    servicios: ["Cocina equipada", "WiFi", "Parking", "Lavandería", "Seguridad 24h"],
    habitaciones: [
      { tipo: "Estudio", precio: 35e3, desc: "Cama doble, cocina americana, baño, AC, TV", disponible: true, img: "🏠" },
      { tipo: "Apartamento 1 hab.", precio: 55e3, desc: "Dormitorio, sala, cocina completa, baño, AC", disponible: true, img: "🏠" },
      { tipo: "Apartamento 2 hab.", precio: 8e4, desc: "2 dormitorios, sala, cocina completa, 2 baños", disponible: true, img: "🏠" }
    ]
  },
  {
    id: "h05",
    nombre: "Hotel Ureca",
    ciudad: "Malabo",
    barrio: "Aeropuerto",
    estrellas: 3,
    color: "#065F46",
    color2: "#00c8a0",
    descripcion: "Hotel junto al aeropuerto de Malabo. Ideal para tránsitos y viajeros de negocios.",
    tel: "+240 222 27 01 05",
    web: "hotelureca.gq",
    lat: 3.7267,
    lng: 8.7089,
    servicios: ["Shuttle aeropuerto", "Restaurante", "Bar", "WiFi", "Parking", "Sala de reuniones"],
    habitaciones: [
      { tipo: "Individual", precio: 32e3, desc: "Cama individual, baño privado, AC, TV, WiFi", disponible: true, img: "🛏️" },
      { tipo: "Doble", precio: 45e3, desc: "Cama doble, baño privado, AC, TV, WiFi, minibar", disponible: true, img: "🛏️" }
    ]
  },
  {
    id: "h06",
    nombre: "Hotel Bata Plaza",
    ciudad: "Bata",
    barrio: "Centro",
    estrellas: 4,
    color: "#0A4A8A",
    color2: "#00b4e6",
    descripcion: "Principal hotel de Bata. Vistas al Atlántico, restaurante de mariscos y piscina.",
    tel: "+240 222 27 02 01",
    web: "hotelbataplaza.gq",
    lat: 1.8639,
    lng: 9.7742,
    servicios: ["Piscina", "Restaurante", "Bar", "WiFi", "Parking", "Sala de reuniones", "Spa"],
    habitaciones: [
      { tipo: "Individual", precio: 38e3, desc: "Cama individual, baño privado, AC, TV, WiFi", disponible: true, img: "🛏️" },
      { tipo: "Doble", precio: 55e3, desc: "Cama doble, baño privado, AC, TV, WiFi, minibar", disponible: true, img: "🛏️" },
      { tipo: "Suite", precio: 9e4, desc: "Sala de estar, cama king, jacuzzi, vistas al mar", disponible: true, img: "🏨" }
    ]
  },
  {
    id: "h07",
    nombre: "Hotel Litoral Bata",
    ciudad: "Bata",
    barrio: "Litoral",
    estrellas: 3,
    color: "#C47D2A",
    color2: "#F59E0B",
    descripcion: "Hotel frente al mar en Bata. Ambiente familiar y precios accesibles.",
    tel: "+240 222 27 02 02",
    web: "hotellitoralbata.gq",
    lat: 1.8712,
    lng: 9.7698,
    servicios: ["Restaurante", "Bar", "WiFi", "Parking", "Playa cercana"],
    habitaciones: [
      { tipo: "Individual", precio: 22e3, desc: "Cama individual, baño privado, AC, TV", disponible: true, img: "🛏️" },
      { tipo: "Doble", precio: 32e3, desc: "Cama doble, baño privado, AC, TV, WiFi", disponible: true, img: "🛏️" },
      { tipo: "Familiar", precio: 48e3, desc: "2 camas dobles, baño privado, AC, TV, WiFi", disponible: true, img: "🛏️" }
    ]
  },
  {
    id: "h08",
    nombre: "Hotel Ebebiyin",
    ciudad: "Ebebiyin",
    barrio: "Centro",
    estrellas: 2,
    color: "#374151",
    color2: "#6B7280",
    descripcion: "Hotel sencillo y cómodo en el centro de Ebebiyin. Buena relación calidad-precio.",
    tel: "+240 222 27 03 01",
    web: "",
    lat: 1.1512,
    lng: 11.3345,
    servicios: ["Restaurante", "WiFi", "Parking"],
    habitaciones: [
      { tipo: "Individual", precio: 15e3, desc: "Cama individual, baño compartido, AC, TV", disponible: true, img: "🛏️" },
      { tipo: "Doble", precio: 22e3, desc: "Cama doble, baño privado, AC, TV", disponible: true, img: "🛏️" }
    ]
  },
  {
    id: "h09",
    nombre: "Hotel Mongomo",
    ciudad: "Mongomo",
    barrio: "Centro",
    estrellas: 2,
    color: "#374151",
    color2: "#6B7280",
    descripcion: "Alojamiento confortable en Mongomo. Ideal para viajeros de paso.",
    tel: "+240 222 27 04 01",
    web: "",
    lat: 1.6278,
    lng: 13.6123,
    servicios: ["Restaurante", "WiFi", "Parking"],
    habitaciones: [
      { tipo: "Individual", precio: 14e3, desc: "Cama individual, baño privado, AC, TV", disponible: true, img: "🛏️" },
      { tipo: "Doble", precio: 2e4, desc: "Cama doble, baño privado, AC, TV", disponible: true, img: "🛏️" }
    ]
  }
];
const HotelesModule = ({ onClose }) => {
  const [screen, setScreen] = reactExports.useState("home");
  const [ciudad, setCiudad] = reactExports.useState("Malabo");
  const [hotel, setHotel] = reactExports.useState(null);
  const [hab, setHab] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState({ nombre: "", dni: "", telefono: "", email: "", checkin: "", checkout: "", huespedes: "1", notas: "", pago: "" });
  const [docFiles, setDocFiles] = reactExports.useState({});
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const HOTEL_DOCS = ["DNI / Pasaporte (foto)"];
  const allDocsDone = HOTEL_DOCS.every((d) => docFiles[d]?.uploaded);
  const hotelesFiltrados = HOTELES.filter((h) => h.ciudad === ciudad);
  const noches = (() => {
    if (!form.checkin || !form.checkout) return 1;
    const [d1, m1, y1] = form.checkin.split("/").map(Number);
    const [d2, m2, y2] = form.checkout.split("/").map(Number);
    const diff = (new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 864e5;
    return diff > 0 ? diff : 1;
  })();
  const total = hab ? hab.precio * noches : 0;
  const estrellas = (n) => "⭐".repeat(n);
  if (screen === "ok") return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "40px 20px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "56px", marginBottom: "12px" }, children: "✅" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "20px", fontWeight: "900", color: "#1A2B4A", marginBottom: "8px" }, children: "¡Reserva confirmada!" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "13px", color: "#8A9BB5", marginBottom: "4px" }, children: [
      hotel?.nombre,
      " · ",
      hab?.tipo
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "13px", color: "#8A9BB5", marginBottom: "4px" }, children: [
      form.checkin,
      " → ",
      form.checkout,
      " · ",
      noches,
      " noche",
      noches > 1 ? "s" : ""
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "22px", fontWeight: "900", color: "#0A4A8A", marginBottom: "20px" }, children: [
      total.toLocaleString(),
      " XAF"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#EFF6FF", borderRadius: "14px", padding: "16px", marginBottom: "20px", textAlign: "left" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "700", color: "#1D4ED8", marginBottom: "8px" }, children: "¿Qué pasa ahora?" }),
      ["Recibirás un email de confirmación", "El hotel te contactará para confirmar", "Presenta tu DNI al hacer el check-in", "Cancelación gratuita hasta 48h antes"].map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px", marginBottom: "6px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#3B82F6", fontWeight: "700", flexShrink: 0 }, children: [
          i + 1,
          "."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "12px", color: "#1E40AF" }, children: s })
      ] }, i))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => {
          setScreen("home");
          setHotel(null);
          setHab(null);
          setForm({ nombre: "", dni: "", telefono: "", email: "", checkin: "", checkout: "", huespedes: "1", notas: "", pago: "" });
        },
        style: { background: "linear-gradient(135deg,#0A4A8A,#00b4e6)", border: "none", borderRadius: "12px", padding: "13px 32px", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer" },
        children: "Ver más hoteles"
      }
    )
  ] });
  if (screen === "reserva" && hotel && hab) return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "14px 16px 24px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: `linear-gradient(135deg,${hotel.color},${hotel.color2})`, borderRadius: "14px", padding: "14px", marginBottom: "16px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "14px", fontWeight: "800", color: "#fff", marginBottom: "2px" }, children: hotel.nombre }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "12px", color: "rgba(255,255,255,0.85)", marginBottom: "4px" }, children: [
        hab.tipo,
        " · ",
        hab.precio.toLocaleString(),
        " XAF/noche"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.7)" }, children: hab.desc })
    ] }),
    [
      { k: "nombre", l: "Nombre completo del titular", t: "text" },
      { k: "dni", l: "DNI / Pasaporte", t: "text" },
      { k: "telefono", l: "Teléfono de contacto", t: "tel" },
      { k: "email", l: "Correo electrónico", t: "email" },
      { k: "checkin", l: "Fecha entrada (DD/MM/AAAA)", t: "text" },
      { k: "checkout", l: "Fecha salida (DD/MM/AAAA)", t: "text" },
      { k: "huespedes", l: "Número de huéspedes", t: "number" },
      { k: "notas", l: "Peticiones especiales (opcional)", t: "text" }
    ].map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "#fff", borderRadius: "10px", padding: "0 14px", marginBottom: "8px", display: "flex", alignItems: "center", height: "50px", border: "1px solid #F0F2F5" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type: f.t,
        placeholder: f.l,
        value: form[f.k],
        onChange: (e) => setF(f.k, e.target.value),
        style: { flex: 1, background: "none", border: "none", outline: "none", fontSize: "13px", color: "#111827", fontFamily: "inherit" }
      }
    ) }, f.k)),
    total > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#EFF5FD", borderRadius: "10px", padding: "12px 14px", marginBottom: "12px", border: "1px solid #BFDBFE" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "#1B3A6B", marginBottom: "4px", fontWeight: "600" }, children: "Total estimado" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "22px", fontWeight: "900", color: "#0A4A8A" }, children: [
        total.toLocaleString(),
        " XAF"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "10px", color: "#6B7280" }, children: [
        noches,
        " noche",
        noches > 1 ? "s" : "",
        " × ",
        hab.precio.toLocaleString(),
        " XAF"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DocUploader,
      {
        docs: HOTEL_DOCS,
        onChange: setDocFiles,
        accentColor: "#0A4A8A",
        doneColor: "#065F46"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "600", color: "#9CA3AF", margin: "12px 0 8px" }, children: "Método de pago" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "8px", marginBottom: "14px" }, children: [{ id: "wallet", l: "EGCHAT" }, { id: "bank", l: "Banco" }, { id: "card", l: "Tarjeta" }, { id: "cash", l: "Efectivo" }].map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setF("pago", m.id),
        style: { flex: 1, background: form.pago === m.id ? "#EFF5FD" : "#F9FAFB", border: `1.5px solid ${form.pago === m.id ? "#0A4A8A" : "#E5E7EB"}`, borderRadius: "10px", padding: "8px 4px", fontSize: "10px", fontWeight: "700", color: form.pago === m.id ? "#0A4A8A" : "#6B7280", cursor: "pointer" },
        children: m.l
      },
      m.id
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => {
          if (form.nombre && form.dni && form.telefono && form.checkin && form.checkout && form.pago && allDocsDone) setScreen("ok");
        },
        style: { width: "100%", background: form.nombre && form.dni && form.telefono && form.checkin && form.checkout && form.pago && allDocsDone ? `linear-gradient(135deg,${hotel.color},${hotel.color2})` : "#E5E7EB", border: "none", borderRadius: "12px", padding: "14px", color: form.nombre && form.dni && form.telefono && form.checkin && form.checkout && form.pago && allDocsDone ? "#fff" : "#9CA3AF", fontSize: "14px", fontWeight: "700", cursor: "pointer" },
        children: !allDocsDone ? "Sube tu documento de identidad" : `Confirmar reserva${total > 0 ? ` · ${total.toLocaleString()} XAF` : ""}`
      }
    )
  ] });
  if (screen === "hotel" && hotel) return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { paddingBottom: "24px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: `linear-gradient(135deg,${hotel.color},${hotel.color2})`, padding: "16px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setScreen("home"), style: { background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "6px 12px", color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer", marginBottom: "10px" }, children: "← Volver" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "flex-start", gap: "12px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "36px" }, children: "🏨" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "18px", fontWeight: "900", color: "#fff" }, children: hotel.nombre }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "13px", color: "rgba(255,255,255,0.85)" }, children: [
            estrellas(hotel.estrellas),
            " · ",
            hotel.barrio,
            ", ",
            hotel.ciudad
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.75)", marginTop: "2px" }, children: [
            "📞 ",
            hotel.tel
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "14px 16px 0" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "a",
        {
          href: `https://maps.google.com/?q=${hotel.lat},${hotel.lng}`,
          target: "_blank",
          rel: "noopener noreferrer",
          style: { display: "flex", alignItems: "center", gap: "8px", background: "#EFF5FD", border: "1px solid #BFDBFE", borderRadius: "10px", padding: "10px 14px", marginBottom: "12px", textDecoration: "none", color: "#1B3A6B", fontSize: "12px", fontWeight: "700" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "10", r: "3" })
            ] }),
            "Ver en Google Maps · ",
            hotel.barrio,
            ", ",
            hotel.ciudad
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "12px", padding: "14px", marginBottom: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", color: "#374151", lineHeight: "1.5", marginBottom: "10px" }, children: hotel.descripcion }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" }, children: hotel.servicios.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { background: "#F3F4F6", color: "#374151", borderRadius: "6px", padding: "3px 8px", fontSize: "10px", fontWeight: "600" }, children: [
          "✓ ",
          s
        ] }, s)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "14px", fontWeight: "800", color: "#1A2B4A", marginBottom: "10px" }, children: "🛏️ Habitaciones disponibles" }),
      hotel.habitaciones.map((h, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "14px", padding: "14px", marginBottom: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", opacity: h.disponible ? 1 : 0.5 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "28px", flexShrink: 0 }, children: h.img }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "14px", fontWeight: "800", color: "#1A2B4A" }, children: h.tipo }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "right" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "15px", fontWeight: "900", color: hotel.color }, children: h.precio.toLocaleString() }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "9px", color: "#8A9BB5" }, children: "XAF/noche" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "#6B7280", marginTop: "3px", lineHeight: "1.4" }, children: h.desc })
          ] })
        ] }),
        h.disponible ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              setHab(h);
              setScreen("reserva");
            },
            style: { width: "100%", background: `linear-gradient(135deg,${hotel.color},${hotel.color2})`, border: "none", borderRadius: "10px", padding: "10px", color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer" },
            children: "Reservar esta habitación"
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", fontSize: "12px", color: "#9CA3AF", fontWeight: "600", padding: "8px" }, children: "No disponible" })
      ] }, i))
    ] })
  ] });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { paddingBottom: "24px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg,#0A4A8A,#00b4e6)", padding: "16px 16px 14px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "32px" }, children: "🏨" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "18px", fontWeight: "900", color: "#fff" }, children: "Hoteles" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.8)" }, children: [
            HOTELES.length,
            " hoteles · Guinea Ecuatorial"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }, children: CIUDADES_H.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setCiudad(c),
          style: { flexShrink: 0, background: ciudad === c ? "#fff" : "rgba(255,255,255,0.2)", border: "none", borderRadius: "20px", padding: "5px 14px", fontSize: "11px", fontWeight: "700", color: ciudad === c ? "#0A4A8A" : "#fff", cursor: "pointer" },
          children: c
        },
        c
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "14px 16px 0" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }, children: hotelesFiltrados.map((h) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          onClick: () => {
            setHotel(h);
            setScreen("hotel");
          },
          style: { background: "#fff", borderRadius: "16px", padding: "14px", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: "1px solid #F0F2F5", transition: "transform 0.15s" },
          onMouseEnter: (e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.transform = "translateY(0)";
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: `linear-gradient(135deg,${h.color},${h.color2})`, borderRadius: "10px", padding: "6px 10px", fontSize: "20px" }, children: "🏨" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: "#FEF3C7", color: "#92400E", borderRadius: "6px", padding: "2px 6px", fontSize: "10px", fontWeight: "700" }, children: estrellas(h.estrellas) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "800", color: "#1A2B4A", marginBottom: "2px", lineHeight: "1.3" }, children: h.nombre }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "10px", color: "#8A9BB5", marginBottom: "8px" }, children: [
              "📍 ",
              h.barrio
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { borderTop: "1px solid #F3F4F6", paddingTop: "8px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "9px", color: "#8A9BB5" }, children: "Desde" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "13px", fontWeight: "900", color: h.color }, children: [
                Math.min(...h.habitaciones.map((r) => r.precio)).toLocaleString(),
                " XAF"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "9px", color: "#8A9BB5" }, children: "por noche" })
            ] })
          ]
        },
        h.id
      )) }),
      hotelesFiltrados.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "30px", color: "#9CA3AF", fontSize: "13px" }, children: [
        "No hay hoteles en ",
        ciudad
      ] })
    ] })
  ] });
};
export {
  HotelesModule
};
