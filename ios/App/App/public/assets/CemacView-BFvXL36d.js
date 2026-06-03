import { r as reactExports, j as jsxRuntimeExports } from "./react-core-B1rSPtcn.js";
import { u as useGPS, d as distanceKm } from "./useGPS-DjzmjKYl.js";
const LANGS = [
  { code: "ES", native: "Español" },
  { code: "FR", native: "Français" },
  { code: "EN", native: "English" },
  { code: "AR", native: "العربية" }
];
const COUNTRIES = [
  { code: "GQ", name: { ES: "Guinea Ecuatorial", FR: "Guinée Équatoriale", EN: "Equatorial Guinea", AR: "غينيا الاستوائية" }, capital: "Malabo", g1: "#00b96b", g2: "#00e5a0" },
  { code: "CM", name: { ES: "Camerún", FR: "Cameroun", EN: "Cameroon", AR: "الكاميرون" }, capital: "Yaundé", g1: "#007a3d", g2: "#00c060" },
  { code: "GA", name: { ES: "Gabón", FR: "Gabon", EN: "Gabon", AR: "الغابون" }, capital: "Libreville", g1: "#009e60", g2: "#00d080" },
  { code: "CG", name: { ES: "Congo", FR: "Congo", EN: "Congo", AR: "الكونغو" }, capital: "Brazzaville", g1: "#009a44", g2: "#00cc66" },
  { code: "CF", name: { ES: "R. Centroafricana", FR: "R. Centrafricaine", EN: "C. African Rep.", AR: "أفريقيا الوسطى" }, capital: "Bangui", g1: "#1a56db", g2: "#3b82f6" },
  { code: "TD", name: { ES: "Chad", FR: "Tchad", EN: "Chad", AR: "تشاد" }, capital: "N'Djamena", g1: "#1e40af", g2: "#3b82f6" }
];
const T = {
  ES: { back: "Atrás", services: "Servicios", leisure: "Ocio", atms: "Cajeros", account: "Cuenta", news: "Noticias", exchange: "Cambio", search: "Buscar servicios...", featured: "Destacado", viewMap: "Ver en mapa", sendMoney: "Enviar dinero", balance: "Saldo disponible", bank: "Banco", history: "Historial", amount: "Cantidad (XAF)", recipient: "Destinatario", send: "Enviar", cancel: "Cancelar", convert: "Convertir", rates: "Tasas de cambio", result: "Resultado", noResults: "Sin resultados", deposit: "Depositar", withdraw: "Retirar", reserve: "Reservar", available: "Disponible", unavailable: "No disponible", readMore: "Leer más", source: "Fuente", fee: "Comisión", limit: "Límite diario", economy: "Economía", tech: "Tecnología", politics: "Política", health: "Salud", sport: "Deporte", culture: "Cultura", from: "De", to: "A" },
  FR: { back: "Retour", services: "Services", leisure: "Loisirs", atms: "Guichets", account: "Compte", news: "Actualités", exchange: "Change", search: "Rechercher...", featured: "Vedette", viewMap: "Voir sur carte", sendMoney: "Envoyer argent", balance: "Solde disponible", bank: "Banque", history: "Historique", amount: "Montant (XAF)", recipient: "Destinataire", send: "Envoyer", cancel: "Annuler", convert: "Convertir", rates: "Taux de change", result: "Résultat", noResults: "Aucun résultat", deposit: "Déposer", withdraw: "Retirer", reserve: "Réserver", available: "Disponible", unavailable: "Indisponible", readMore: "Lire plus", source: "Source", fee: "Commission", limit: "Limite journalière", economy: "Économie", tech: "Technologie", politics: "Politique", health: "Santé", sport: "Sport", culture: "Culture", from: "De", to: "À" },
  EN: { back: "Back", services: "Services", leisure: "Leisure", atms: "ATMs", account: "Account", news: "News", exchange: "Exchange", search: "Search services...", featured: "Featured", viewMap: "View on map", sendMoney: "Send money", balance: "Available balance", bank: "Bank", history: "History", amount: "Amount (XAF)", recipient: "Recipient", send: "Send", cancel: "Cancel", convert: "Convert", rates: "Exchange rates", result: "Result", noResults: "No results", deposit: "Deposit", withdraw: "Withdraw", reserve: "Reserve", available: "Available", unavailable: "Unavailable", readMore: "Read more", source: "Source", fee: "Fee", limit: "Daily limit", economy: "Economy", tech: "Technology", politics: "Politics", health: "Health", sport: "Sport", culture: "Culture", from: "From", to: "To" },
  AR: { back: "رجوع", services: "الخدمات", leisure: "الترفيه", atms: "الصرافات", account: "الحساب", news: "الأخبار", exchange: "الصرف", search: "بحث...", featured: "مميز", viewMap: "عرض على الخريطة", sendMoney: "إرسال المال", balance: "الرصيد المتاح", bank: "البنك", history: "السجل", amount: "المبلغ (XAF)", recipient: "المستلم", send: "إرسال", cancel: "إلغاء", convert: "تحويل", rates: "أسعار الصرف", result: "النتيجة", noResults: "لا نتائج", deposit: "إيداع", withdraw: "سحب", reserve: "حجز", available: "متاح", unavailable: "غير متاح", readMore: "اقرأ المزيد", source: "المصدر", fee: "العمولة", limit: "الحد اليومي", economy: "اقتصاد", tech: "تكنولوجيا", politics: "سياسة", health: "صحة", sport: "رياضة", culture: "ثقافة", from: "من", to: "إلى" }
};
const SERVICES = [
  { id: "s1", icon: "🏦", nameES: "Transferencias", nameFR: "Transferts", nameEN: "Transfers", nameAR: "تحويلات", bg: "#EFF6FF", ac: "#3B82F6", desc: "Envía dinero a cualquier banco CEMAC" },
  { id: "s2", icon: "📱", nameES: "Pagos QR", nameFR: "Paiements QR", nameEN: "QR Payments", nameAR: "مدفوعات QR", bg: "#F0FDF4", ac: "#22C55E", desc: "Paga escaneando un código QR" },
  { id: "s3", icon: "💱", nameES: "Cambio de Divisa", nameFR: "Change de Devises", nameEN: "Currency Exchange", nameAR: "صرف العملات", bg: "#FEFCE8", ac: "#EAB308", desc: "Cambia XAF a EUR, USD y más" },
  { id: "s4", icon: "📶", nameES: "Recarga Móvil", nameFR: "Recharge Mobile", nameEN: "Mobile Top-up", nameAR: "شحن الهاتف", bg: "#FDF4FF", ac: "#A855F7", desc: "Recarga tu línea o la de un amigo" },
  { id: "s5", icon: "⚡", nameES: "Electricidad", nameFR: "Électricité", nameEN: "Electricity", nameAR: "الكهرباء", bg: "#FFF7ED", ac: "#F97316", desc: "Paga tu factura de luz" },
  { id: "s6", icon: "💧", nameES: "Agua", nameFR: "Eau", nameEN: "Water", nameAR: "الماء", bg: "#EFF6FF", ac: "#0EA5E9", desc: "Paga tu factura de agua" },
  { id: "s7", icon: "🛡️", nameES: "Seguros", nameFR: "Assurances", nameEN: "Insurance", nameAR: "التأمين", bg: "#F0FDF4", ac: "#16A34A", desc: "Gestiona tus pólizas de seguro" },
  { id: "s8", icon: "📈", nameES: "Inversiones", nameFR: "Investissements", nameEN: "Investments", nameAR: "الاستثمارات", bg: "#FDF2F8", ac: "#EC4899", desc: "Fondos y productos de inversión" },
  { id: "s9", icon: "💰", nameES: "Préstamos", nameFR: "Prêts", nameEN: "Loans", nameAR: "القروض", bg: "#FFF1F2", ac: "#F43F5E", desc: "Solicita un crédito rápido" },
  { id: "s10", icon: "📄", nameES: "Impuestos", nameFR: "Impôts", nameEN: "Taxes", nameAR: "الضرائب", bg: "#F8FAFC", ac: "#64748B", desc: "Declara y paga tus impuestos" },
  { id: "s11", icon: "🌐", nameES: "Internet", nameFR: "Internet", nameEN: "Internet", nameAR: "الإنترنت", bg: "#ECFDF5", ac: "#10B981", desc: "Operadores y planes de datos GQ" },
  { id: "s12", icon: "🏛️", nameES: "Trámites Gov.", nameFR: "Démarches Gov.", nameEN: "Gov. Services", nameAR: "خدمات حكومية", bg: "#F0F9FF", ac: "#0284C7", desc: "Documentos y trámites oficiales" }
];
const LEISURE = [
  { id: "l1", cat: "hotel", nameES: "Hotel Sofitel Malabo", nameFR: "Hôtel Sofitel Malabo", nameEN: "Sofitel Hotel Malabo", nameAR: "فندق سوفيتيل مالابو", rating: 4.8, price: "85,000 XAF/noche", addr: "Av. de la Independencia, Malabo", hours: "24h" },
  { id: "l2", cat: "restaurant", nameES: "Restaurante La Bahía", nameFR: "Restaurant La Bahía", nameEN: "La Bahía Restaurant", nameAR: "مطعم لا باهيا", rating: 4.6, price: "15,000 XAF/persona", addr: "Puerto de Malabo", hours: "12:00-23:00" },
  { id: "l3", cat: "cinema", nameES: "Cine Malabo", nameFR: "Cinéma Malabo", nameEN: "Malabo Cinema", nameAR: "سينما مالابو", rating: 4.2, price: "5,000 XAF", addr: "Centro Comercial, Malabo", hours: "10:00-22:00" },
  { id: "l4", cat: "spa", nameES: "Spa & Wellness Center", nameFR: "Centre Spa & Bien-être", nameEN: "Spa & Wellness Center", nameAR: "مركز السبا والعافية", rating: 4.9, price: "25,000 XAF/sesión", addr: "Barrio Residencial, Malabo", hours: "09:00-20:00" },
  { id: "l5", cat: "sport", nameES: "Club Deportivo Malabo", nameFR: "Club Sportif Malabo", nameEN: "Malabo Sports Club", nameAR: "نادي مالابو الرياضي", rating: 4.3, price: "8,000 XAF/mes", addr: "Zona Deportiva, Malabo", hours: "06:00-22:00" },
  { id: "l6", cat: "culture", nameES: "Museo Nacional", nameFR: "Musée National", nameEN: "National Museum", nameAR: "المتحف الوطني", rating: 4.5, price: "2,000 XAF", addr: "Plaza de la Independencia", hours: "09:00-17:00" }
];
const CAT_ICON = { hotel: "🏨", restaurant: "🍽️", cinema: "🎬", spa: "💆", sport: "⚽", culture: "🏛️" };
const CAT_COLOR = { hotel: "#EFF6FF", restaurant: "#FFF7ED", cinema: "#FDF4FF", spa: "#F0FDF4", sport: "#FEFCE8", culture: "#FDF2F8" };
const ATMS = [
  { id: "a1", bank: "BANGE", addr: "Av. de la Independencia 12, Malabo", net: "VISA / Mastercard", fee: "500 XAF", limit: "500,000 XAF", ok: true, lat: 3.752, lng: 8.774 },
  { id: "a2", bank: "CCEI Bank", addr: "Centro Comercial Malabo, Planta Baja", net: "VISA / Mastercard / UnionPay", fee: "0 XAF", limit: "300,000 XAF", ok: true, lat: 3.7505, lng: 8.7715 },
  { id: "a3", bank: "BGFI Bank", addr: "Calle Rey Malabo 45", net: "VISA / Mastercard", fee: "750 XAF", limit: "400,000 XAF", ok: false, lat: 3.7535, lng: 8.7755 },
  { id: "a4", bank: "Ecobank", addr: "Aeropuerto Internacional de Malabo", net: "VISA / Mastercard / Amex", fee: "1,000 XAF", limit: "600,000 XAF", ok: true, lat: 3.755, lng: 8.777 },
  { id: "a5", bank: "Societe Generale", addr: "Barrio Ela Nguema, Malabo", net: "VISA / Mastercard", fee: "500 XAF", limit: "350,000 XAF", ok: true, lat: 3.749, lng: 8.77 }
];
const NEWS = [
  { id: "n1", title: "BEAC mantiene tipos de interés estables para el segundo trimestre", source: "BEAC", cat: "economy", time: "08:30", date: "24/03/2026", body: "El Banco de los Estados de África Central anuncia la estabilidad de los tipos de referencia para apoyar el crecimiento regional." },
  { id: "n2", title: "Guinea Ecuatorial lidera el crecimiento del PIB en la zona CEMAC", source: "FMI", cat: "economy", time: "10:15", date: "24/03/2026", body: "El Fondo Monetario Internacional proyecta un crecimiento del 4.2% para Guinea Ecuatorial en 2026." },
  { id: "n3", title: "Nueva plataforma de pagos digitales lanzada en Camerún", source: "Noticias CEMAC", cat: "tech", time: "11:45", date: "24/03/2026", body: "MTN y Orange lanzan una plataforma unificada de pagos móviles para toda la región CEMAC." },
  { id: "n4", title: "Cumbre de jefes de Estado CEMAC en Libreville", source: "Presidencia GQ", cat: "politics", time: "14:00", date: "23/03/2026", body: "Los seis presidentes de la zona CEMAC se reúnen para discutir la integración económica regional." },
  { id: "n5", title: "Programa de vacunación masiva en la región", source: "OMS Africa", cat: "health", time: "09:00", date: "23/03/2026", body: "La OMS y los gobiernos CEMAC lanzan una campaña de vacunación que beneficiará a 50 millones de personas." },
  { id: "n6", title: "Festival Panafricano de Música en Brazzaville", source: "UNESCO", cat: "culture", time: "16:30", date: "22/03/2026", body: "El mayor festival de música africana reúne a artistas de 30 países en la capital congoleña." }
];
const RATES = { EUR: 1524e-6, USD: 1648e-6, GBP: 1302e-6, CHF: 1489e-6, CNY: 0.01192, XOF: 1 };
const HISTORY = [
  { id: "h1", type: "in", amount: 15e4, desc: "Salario Marzo 2026", date: "01/03/2026" },
  { id: "h2", type: "out", amount: 25e3, desc: "Transferencia a Maria", date: "05/03/2026" },
  { id: "h3", type: "out", amount: 8500, desc: "Pago electricidad", date: "10/03/2026" },
  { id: "h4", type: "in", amount: 35e3, desc: "Reembolso seguro", date: "15/03/2026" },
  { id: "h5", type: "out", amount: 12e3, desc: "Recarga móvil", date: "18/03/2026" }
];
const NEWS_COLOR = { economy: "#3B82F6", tech: "#8B5CF6", politics: "#EF4444", health: "#22C55E", sport: "#F97316", culture: "#EC4899" };
const INTERNET_PROVIDERS_GQ = [
  {
    id: "ip1",
    name: "GETESA",
    fullName: "Guinea Ecuatorial de Telecomunicaciones S.A.",
    logo: "📡",
    color: "#003082",
    type: "Fibra + ADSL + Móvil",
    plans: [
      { name: "Básico", speed: "10 Mbps", price: "15,000 XAF/mes", desc: "Hogar  -  ADSL" },
      { name: "Estándar", speed: "30 Mbps", price: "25,000 XAF/mes", desc: "Hogar  -  Fibra" },
      { name: "Premium", speed: "100 Mbps", price: "45,000 XAF/mes", desc: "Hogar  -  Fibra" },
      { name: "Empresas", speed: "500 Mbps", price: "120,000 XAF/mes", desc: "Empresas  -  Fibra dedicada" }
    ],
    coverage: "Malabo, Bata, Ebebiyín, Mongomo",
    website: "getesa.gq",
    phone: "+240 333 09 00 00"
  },
  {
    id: "ip2",
    name: "HITS GQ",
    fullName: "HITS Telecom Guinea Ecuatorial",
    logo: "📶",
    color: "#E32118",
    type: "4G LTE  -  Datos móviles",
    plans: [
      { name: "Diario", speed: "4G", price: "500 XAF/día", desc: "1 GB  -  24h" },
      { name: "Semanal", speed: "4G", price: "2,500 XAF/sem", desc: "5 GB  -  7 días" },
      { name: "Mensual S", speed: "4G", price: "8,000 XAF/mes", desc: "10 GB  -  30 días" },
      { name: "Mensual M", speed: "4G", price: "15,000 XAF/mes", desc: "25 GB  -  30 días" },
      { name: "Mensual L", speed: "4G", price: "25,000 XAF/mes", desc: "Ilimitado  -  30 días" }
    ],
    coverage: "Malabo, Bata, Ebebiyín, Mongomo, Evinayong",
    website: "hits.gq",
    phone: "+240 222 00 00 00"
  },
  {
    id: "ip3",
    name: "Orange GQ",
    fullName: "Orange Guinea Ecuatorial",
    logo: "🟠",
    color: "#FF6600",
    type: "4G/5G  -  Fibra  -  ADSL",
    plans: [
      { name: "Fly 1G", speed: "4G", price: "1,000 XAF", desc: "1 GB  -  3 días" },
      { name: "Fly 5G", speed: "4G", price: "4,000 XAF", desc: "5 GB  -  7 días" },
      { name: "Max 20G", speed: "4G/5G", price: "12,000 XAF/mes", desc: "20 GB  -  30 días" },
      { name: "Fibra Hogar", speed: "50 Mbps", price: "30,000 XAF/mes", desc: "Hogar  -  Fibra óptica" },
      { name: "Fibra Pro", speed: "200 Mbps", price: "60,000 XAF/mes", desc: "Empresas  -  Fibra" }
    ],
    coverage: "Malabo, Bata, Luba, Riaba, Moka",
    website: "orange.gq",
    phone: "+240 222 11 11 11"
  },
  {
    id: "ip4",
    name: "Muni Internet",
    fullName: "Muni Internet Services GQ",
    logo: "🌐",
    color: "#0096C7",
    type: "Satélite  -  Zonas rurales",
    plans: [
      { name: "Rural Básico", speed: "5 Mbps", price: "10,000 XAF/mes", desc: "Satélite  -  Zonas rurales" },
      { name: "Rural Plus", speed: "15 Mbps", price: "20,000 XAF/mes", desc: "Satélite  -  Zonas rurales" }
    ],
    coverage: "Todo el territorio nacional (satélite)",
    website: "muni.gq",
    phone: "+240 222 22 22 22"
  },
  {
    id: "ip5",
    name: "GEBroadband",
    fullName: "Guinea Ecuatorial Broadband",
    logo: "🔗",
    color: "#8B5CF6",
    type: "Fibra empresarial  -  VSAT",
    plans: [
      { name: "VSAT Básico", speed: "10 Mbps", price: "80,000 XAF/mes", desc: "Empresas  -  VSAT dedicado" },
      { name: "VSAT Pro", speed: "50 Mbps", price: "200,000 XAF/mes", desc: "Empresas  -  VSAT premium" },
      { name: "Fibra Corp.", speed: "1 Gbps", price: "500,000 XAF/mes", desc: "Corporativo  -  Fibra oscura" }
    ],
    coverage: "Malabo, Bata, Sipopo (empresas)",
    website: "gebroadband.gq",
    phone: "+240 333 33 33 33"
  },
  {
    id: "ip6",
    name: "Starlink GQ",
    fullName: "Starlink — SpaceX (disponible en GQ)",
    logo: "🛰️",
    color: "#1A1A2E",
    type: "Satélite LEO  -  Alta velocidad",
    plans: [
      { name: "Residencial", speed: "100-200 Mbps", price: "45,000 XAF/mes", desc: "+ kit 180,000 XAF (único pago)" },
      { name: "Roaming", speed: "50-100 Mbps", price: "60,000 XAF/mes", desc: "Portátil  -  Sin dirección fija" },
      { name: "Empresas", speed: "200-500 Mbps", price: "150,000 XAF/mes", desc: "Prioridad de red garantizada" }
    ],
    coverage: "Todo el territorio nacional",
    website: "starlink.com",
    phone: "—"
  }
];
const sn = (s, l) => ({ ES: s.nameES, FR: s.nameFR, EN: s.nameEN, AR: s.nameAR })[l || "ES"];
const ln = (item, l) => ({ ES: item.nameES, FR: item.nameFR, EN: item.nameEN, AR: item.nameAR })[l || "ES"];
const cn = (c, l) => c.name[l || "ES"];
const Stars = ({ v }) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { display: "flex", gap: 1 }, children: [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  "path",
  {
    d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    fill: i <= Math.round(v) ? "#F59E0B" : "#E5E7EB",
    stroke: "none"
  }
) }, i)) });
const Chip = ({ label, bg, color }) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: bg, color, borderRadius: 8, padding: "3px 9px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", display: "inline-block" }, children: label });
const Sheet = ({ children, onClose }) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", zIndex: 999 }, onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "22px 22px 0 0", padding: "20px 20px 44px", width: "100%", boxSizing: "border-box" }, onClick: (e) => e.stopPropagation(), children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 36, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 18px" } }),
  children
] }) });
const CemacView = ({ onBack }) => {
  const [lang, setLang] = reactExports.useState(null);
  const [country, setCountry] = reactExports.useState(null);
  const [tab, setTab] = reactExports.useState("servicios");
  const [query, setQuery] = reactExports.useState("");
  const [mapAtm, setMapAtm] = reactExports.useState(null);
  const [openNews, setOpenNews] = reactExports.useState(null);
  const { position: gpsPos } = useGPS({ watch: false, highAccuracy: false });
  const sortedAtms = gpsPos ? [...ATMS].sort(
    (a, b) => distanceKm(gpsPos.lat, gpsPos.lng, a.lat, a.lng) - distanceKm(gpsPos.lat, gpsPos.lng, b.lat, b.lng)
  ) : ATMS;
  const [xaf, setXaf] = reactExports.useState("");
  const [cur, setCur] = reactExports.useState("EUR");
  const [modal, setModal] = reactExports.useState(null);
  const [mAmt, setMAmt] = reactExports.useState("");
  const [mTo, setMTo] = reactExports.useState("");
  const [mOk, setMOk] = reactExports.useState(false);
  const [selectedService, setSelectedService] = reactExports.useState(null);
  const [selectedProvider, setSelectedProvider] = reactExports.useState(null);
  const t = T[lang || "ES"];
  const ctry = COUNTRIES.find((c) => c.code === country);
  const g1 = ctry?.g1 || "#00c8a0";
  const g2 = ctry?.g2 || "#00b4e6";
  const grad = `linear-gradient(135deg,${g1},${g2})`;
  const closeModal = () => {
    setModal(null);
    setMAmt("");
    setMTo("");
    setMOk(false);
  };
  const confirmModal = () => {
    if (mAmt && (modal !== "send" || mTo)) setMOk(true);
  };
  const filtered = SERVICES.filter((s) => sn(s, lang).toLowerCase().includes(query.toLowerCase()));
  const converted = xaf && !isNaN(+xaf) ? (+xaf * (RATES[cur] || 1)).toFixed(4) : "";
  if (!country) return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { width: "100%", height: "100%", background: "linear-gradient(160deg,#003d22 0%,#006b3c 35%,#00a86b 65%,#00c8a0 85%,#00b4e6 100%)", display: "flex", flexDirection: "column", paddingTop: "max(56px, env(safe-area-inset-top))", boxSizing: "border-box", overflowY: "auto" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "14px 20px 10px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "80", height: "80", viewBox: "0 0 100 100", style: { margin: "0 auto 8px", display: "block", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.35))" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "50", cy: "50", r: "48", fill: "#F5C518", stroke: "#fff", strokeWidth: "2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "50", cy: "50", r: "44", fill: "#E8B400", stroke: "rgba(255,255,255,0.4)", strokeWidth: "0.8" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M44 18C40 18 36 20 34 24C32 28 33 32 31 35C29 38 26 39 25 43C24 47 26 51 25 55C24 59 21 62 22 66C23 70 27 72 30 75C33 78 35 82 39 84C43 86 47 85 50 83C53 81 55 78 58 76C61 74 65 74 67 71C69 68 68 64 69 60C70 56 73 53 73 49C73 45 70 42 70 38C70 34 72 30 70 27C68 24 64 23 61 22C58 21 55 19 52 18C49 17 47 18 44 18Z", fill: "#2d6a2d", stroke: "#1a4a1a", strokeWidth: "0.8" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M50 36L52 45L61 43L54 49L61 55L52 53L50 62L48 53L39 55L46 49L39 43L48 45Z", fill: "#fff" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: "50", y: "90", textAnchor: "middle", fontSize: "9", fontWeight: "900", fill: "#003d22", fontFamily: "Arial,sans-serif", letterSpacing: "2", children: "CEMAC" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#fff", fontSize: 20, fontWeight: 900, marginBottom: 2 }, children: "Bienvenido a la CEMAC" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginBottom: 8 }, children: "Comunidad Económica y Monetaria de África Central" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", justifyContent: "center", gap: 20 }, children: [{ v: "6", l: "Países" }, { v: "XAF", l: "Moneda" }, { v: "60M+", l: "Personas" }].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#fff", fontSize: 14, fontWeight: 800 }, children: s.v }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "rgba(255,255,255,0.6)", fontSize: 10 }, children: s.l })
      ] }, s.v)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "0 12px 8px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.1)", borderRadius: 16, padding: "10px 10px 12px", border: "1px solid rgba(255,255,255,0.18)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, textAlign: "center" }, children: "Toca un país para entrar" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }, children: COUNTRIES.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => {
            setLang(lang || "ES");
            setCountry(c.code);
          },
          style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer", background: "none", border: "none", padding: "4px 0" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${c.g1},${c.g2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, border: "2px solid rgba(255,255,255,0.4)", boxShadow: "0 3px 10px rgba(0,0,0,0.25)" }, children: c.code === "GQ" ? "🇬🇶" : c.code === "CM" ? "🇨🇲" : c.code === "GA" ? "🇬🇦" : c.code === "CG" ? "🇨🇬" : c.code === "CF" ? "🇨🇫" : "🇹🇩" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#fff", fontSize: 11, fontWeight: 700, textAlign: "center" }, children: cn(c, lang).split(" ")[0] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "rgba(255,255,255,0.6)", fontSize: 9 }, children: c.capital })
          ]
        },
        c.code
      )) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "0 12px 20px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.1)", borderRadius: 16, padding: "10px 10px 12px", border: "1px solid rgba(255,255,255,0.18)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, textAlign: "center" }, children: "Elige tu idioma" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }, children: LANGS.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setLang(l.code),
          style: { background: lang === l.code ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)", border: lang === l.code ? "2px solid rgba(255,255,255,0.85)" : "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "10px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 11 }, children: l.code }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#fff", fontWeight: lang === l.code ? 800 : 600, fontSize: 11 }, children: l.native })
          ]
        },
        l.code
      )) })
    ] }) })
  ] });
  if (mapAtm) return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { width: "100%", height: "100%", background: "#F0F2F5", display: "flex", flexDirection: "column", paddingTop: "max(56px, env(safe-area-inset-top))", boxSizing: "border-box" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: grad, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setMapAtm(null), style: { background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 18 }, children: "←" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#fff", fontWeight: 700, fontSize: 16 }, children: mapAtm.bank })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, overflowY: "auto", padding: 16 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", marginBottom: 14 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "iframe",
        {
          title: "map",
          width: "100%",
          height: "240",
          style: { border: "none", display: "block" },
          src: `https://api.maptiler.com/maps/streets-v2/?key=bg3FUa7es7Qn1TITIWjO#14/${mapAtm.lat}/${mapAtm.lng}`
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: 18, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, fontSize: 16, color: "#111", marginBottom: 10 }, children: mapAtm.bank }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 13, color: "#555", marginBottom: 12 }, children: [
          "📍 ",
          mapAtm.addr
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: mapAtm.ok ? t.available : t.unavailable, bg: mapAtm.ok ? "#F0FDF4" : "#FFF1F2", color: mapAtm.ok ? "#16A34A" : "#DC2626" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `${t.fee}: ${mapAtm.fee}`, bg: "#F0F9FF", color: "#0284C7" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `${t.limit}: ${mapAtm.limit}`, bg: "#FEFCE8", color: "#854D0E" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: mapAtm.net, bg: "#F8FAFC", color: "#475569" })
        ] })
      ] })
    ] })
  ] });
  const ModalContent = () => {
    const titles = { send: t.sendMoney, deposit: t.deposit, withdraw: t.withdraw };
    const btnGrad = modal === "withdraw" ? "linear-gradient(135deg,#F97316,#EF4444)" : grad;
    const btnLabel = modal === "send" ? t.send : modal === "deposit" ? t.deposit : t.withdraw;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Sheet, { onClose: closeModal, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, fontSize: 18, color: "#111", marginBottom: 18 }, children: titles[modal] }),
      mOk ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "16px 0 8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 52, marginBottom: 12 }, children: "✅" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, fontSize: 16, color: "#16A34A", marginBottom: 6 }, children: modal === "send" ? "Transferencia enviada" : modal === "deposit" ? "Depósito realizado" : "Retiro procesado" }),
        modal === "send" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#888", fontSize: 13 }, children: [
          mAmt,
          " XAF → ",
          mTo
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: closeModal, style: { marginTop: 20, background: grad, border: "none", borderRadius: 14, padding: "12px 36px", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }, children: "OK" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        modal === "send" && /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: mTo, onChange: (e) => setMTo(e.target.value), placeholder: t.recipient, style: { width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "12px 14px", fontSize: 15, marginBottom: 12, boxSizing: "border-box", outline: "none", color: "#111" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: mAmt, onChange: (e) => setMAmt(e.target.value), placeholder: t.amount, type: "number", style: { width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "12px 14px", fontSize: 15, marginBottom: 20, boxSizing: "border-box", outline: "none", color: "#111" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: closeModal, style: { flex: 1, background: "#F3F4F6", border: "none", borderRadius: 12, padding: "12px", color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer" }, children: t.cancel }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: confirmModal, style: { flex: 2, background: btnGrad, border: "none", borderRadius: 12, padding: "12px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }, children: btnLabel })
        ] })
      ] })
    ] });
  };
  const TABS = [
    { id: "servicios", label: t.services },
    { id: "ocio", label: t.leisure },
    { id: "cajeros", label: t.atms },
    { id: "cuenta", label: t.account },
    { id: "noticias", label: t.news },
    { id: "cambio", label: t.exchange }
  ];
  const renderTab = () => {
    if (tab === "servicios") return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "12px 14px 90px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "11", cy: "11", r: "7", stroke: "#aaa", strokeWidth: "2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M16.5 16.5L21 21", stroke: "#aaa", strokeWidth: "2", strokeLinecap: "round" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: t.search, style: { border: "none", outline: "none", flex: 1, fontSize: 14, color: "#333", background: "transparent" } }),
        query && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setQuery(""), style: { background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 16, padding: 0 }, children: "✕" })
      ] }),
      filtered.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", color: "#aaa", padding: "40px 0", fontSize: 14 }, children: t.noResults }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }, children: filtered.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          onClick: () => setSelectedService(s.id),
          style: { background: "#fff", borderRadius: 18, padding: "16px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" },
          onMouseEnter: (e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.07)";
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 46, height: 46, borderRadius: 14, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, fontSize: 22 }, children: s.icon }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, fontSize: 13, color: "#111", lineHeight: 1.3, marginBottom: 4 }, children: sn(s, lang) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 11, color: "#888", lineHeight: 1.4 }, children: s.desc })
          ]
        },
        s.id
      )) }),
      selectedService === "s11" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "flex-end" }, onClick: () => {
        setSelectedService(null);
        setSelectedProvider(null);
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#F0F2F5", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "85vh", display: "flex", flexDirection: "column" }, onClick: (e) => e.stopPropagation(), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "12px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #E5E7EB" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "16px", fontWeight: "800", color: "#111" }, children: "🌐 Internet en Guinea Ecuatorial" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#888", marginTop: "2px" }, children: [
              INTERNET_PROVIDERS_GQ.length,
              " operadores disponibles"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
            setSelectedService(null);
            setSelectedProvider(null);
          }, style: { background: "#E5E7EB", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px" }, children: "✕" })
        ] }),
        selectedProvider ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, overflowY: "auto", padding: "16px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSelectedProvider(null), style: { background: "none", border: "none", color: "#0096C7", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginBottom: "12px", padding: 0 }, children: "← Volver" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "20px", padding: "20px", marginBottom: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "56px", height: "56px", borderRadius: "16px", background: selectedProvider.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", flexShrink: 0 }, children: selectedProvider.logo }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "18px", fontWeight: "800", color: "#111" }, children: selectedProvider.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "#888", marginTop: "2px" }, children: selectedProvider.fullName }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: selectedProvider.color, fontWeight: "600", marginTop: "2px" }, children: selectedProvider.type })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { background: "#EFF6FF", color: "#3B82F6", borderRadius: "20px", padding: "4px 10px", fontSize: "11px", fontWeight: "600" }, children: [
                "📍 ",
                selectedProvider.coverage
              ] }),
              selectedProvider.phone !== "—" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { background: "#F0FDF4", color: "#16A34A", borderRadius: "20px", padding: "4px 10px", fontSize: "11px", fontWeight: "600" }, children: [
                "📞 ",
                selectedProvider.phone
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { background: "#F8FAFC", color: "#475569", borderRadius: "20px", padding: "4px 10px", fontSize: "11px", fontWeight: "600" }, children: [
                "🌍 ",
                selectedProvider.website
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "700", color: "#111", marginBottom: "10px" }, children: "Planes disponibles" }),
          selectedProvider.plans.map((plan, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "16px", padding: "16px", marginBottom: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "14px", fontWeight: "700", color: "#111" }, children: plan.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "#888", marginTop: "2px" }, children: plan.desc }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "12px", color: selectedProvider.color, fontWeight: "700", marginTop: "4px" }, children: [
                "⚡ ",
                plan.speed
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "right" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "14px", fontWeight: "800", color: "#111" }, children: plan.price }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: { marginTop: "6px", background: selectedProvider.color, border: "none", borderRadius: "10px", padding: "6px 14px", color: "#fff", fontSize: "11px", fontWeight: "700", cursor: "pointer" }, children: "Contratar" })
            ] })
          ] }, i))
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, overflowY: "auto", padding: "12px 16px 24px" }, children: INTERNET_PROVIDERS_GQ.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            onClick: () => setSelectedProvider(p),
            style: { background: "#fff", borderRadius: "16px", padding: "14px 16px", marginBottom: "10px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", gap: "14px", transition: "transform 0.15s" },
            onMouseEnter: (e) => {
              e.currentTarget.style.transform = "translateX(4px)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.transform = "translateX(0)";
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "50px", height: "50px", borderRadius: "14px", background: p.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }, children: p.logo }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "15px", fontWeight: "800", color: "#111" }, children: p.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "#888", marginTop: "2px" }, children: p.type }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#0096C7", marginTop: "2px" }, children: [
                  "Desde ",
                  p.plans[0].price
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "11px", fontWeight: "600", color: p.color }, children: [
                  p.plans.length,
                  " planes"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "#CBD5E1", strokeWidth: "2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M9 18l6-6-6-6" }) })
              ] })
            ]
          },
          p.id
        )) })
      ] }) })
    ] });
    if (tab === "ocio") return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "12px 14px 90px", display: "flex", flexDirection: "column", gap: 12 }, children: LEISURE.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: 18, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 50, height: 50, borderRadius: 15, background: CAT_COLOR[l.cat] || "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }, children: CAT_ICON[l.cat] || "?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: 700, fontSize: 14, color: "#111" }, children: ln(l, lang) }),
            l.rating >= 4.5 && /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: t.featured, bg: "#FEF3C7", color: "#92400E" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Stars, { v: l.rating }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 12, color: "#888" }, children: l.rating })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 12, color: "#0284C7", fontWeight: 600 }, children: l.price })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 12, color: "#666", marginBottom: 10 }, children: [
        "📍 ",
        l.addr
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { style: { flex: 1, background: grad, border: "none", borderRadius: 12, padding: "10px", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }, children: t.reserve }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { style: { flex: 1, background: "#F3F4F6", border: "none", borderRadius: 12, padding: "10px", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer" }, children: [
          "🕐 ",
          l.hours
        ] })
      ] })
    ] }, l.id)) });
    if (tab === "cajeros") return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "12px 14px 90px", display: "flex", flexDirection: "column", gap: 12 }, children: [
      gpsPos && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#f0fdf4", borderRadius: "10px", padding: "8px 12px", fontSize: "12px", color: "#16a34a", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 1v4M12 19v4M1 12h4M19 12h4" })
        ] }),
        "Ordenados por proximidad a tu ubicación"
      ] }),
      sortedAtms.map((a) => {
        const dist = gpsPos ? distanceKm(gpsPos.lat, gpsPos.lng, a.lat, a.lng) : null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: 18, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 46, height: 46, borderRadius: 14, background: a.ok ? "#F0FDF4" : "#FFF1F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }, children: "🏧" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 4 }, children: a.bank }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: a.ok ? t.available : t.unavailable, bg: a.ok ? "#F0FDF4" : "#FFF1F2", color: a.ok ? "#16A34A" : "#DC2626" }),
                dist !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "11px", color: "#6b7280", fontWeight: "600" }, children: [
                  "📍 ",
                  dist < 1 ? `${Math.round(dist * 1e3)}m` : `${dist.toFixed(1)}km`
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 12, color: "#666", marginBottom: 10 }, children: [
            "📍 ",
            a.addr
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: a.net, bg: "#F8FAFC", color: "#475569" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `${t.fee}: ${a.fee}`, bg: "#FEFCE8", color: "#854D0E" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `${t.limit}: ${a.limit}`, bg: "#F0F9FF", color: "#0284C7" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setMapAtm(a), style: { width: "100%", background: grad, border: "none", borderRadius: 12, padding: "11px", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }, children: t.viewMap })
        ] }, a.id);
      })
    ] });
    if (tab === "cuenta") return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "12px 14px 90px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: grad, borderRadius: 22, padding: "20px 18px", marginBottom: 16, color: "#fff" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 13, opacity: 0.85, marginBottom: 6 }, children: t.balance }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 34, fontWeight: 800, letterSpacing: -1, marginBottom: 4 }, children: [
          "245,000 ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 16, fontWeight: 500 }, children: "XAF" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 12, opacity: 0.75, marginBottom: 18 }, children: [
          t.bank,
          ": BANGE  -  CCEI Bank"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
            setModal("deposit");
            setMOk(false);
          }, style: { flex: 1, background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.35)", borderRadius: 12, padding: "10px 4px", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }, children: t.deposit }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
            setModal("withdraw");
            setMOk(false);
          }, style: { flex: 1, background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.35)", borderRadius: 12, padding: "10px 4px", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }, children: t.withdraw }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
            setModal("send");
            setMOk(false);
          }, style: { flex: 1, background: "#fff", border: "none", borderRadius: 12, padding: "10px 4px", color: g1, fontWeight: 700, fontSize: 12, cursor: "pointer" }, children: t.sendMoney })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 12 }, children: t.history }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: HISTORY.map((h) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: 14, padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 40, height: 40, borderRadius: 12, background: h.type === "in" ? "#F0FDF4" : "#FFF1F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }, children: h.type === "in" ? "↓" : "↑" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 600, fontSize: 13, color: "#111" }, children: h.desc }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 11, color: "#aaa", marginTop: 2 }, children: h.date })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontWeight: 700, fontSize: 14, color: h.type === "in" ? "#16A34A" : "#DC2626" }, children: [
          h.type === "in" ? "+" : "-",
          h.amount.toLocaleString(),
          " XAF"
        ] })
      ] }, h.id)) })
    ] });
    if (tab === "noticias") return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "12px 14px 90px", display: "flex", flexDirection: "column", gap: 12 }, children: NEWS.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: 18, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", cursor: "pointer" }, onClick: () => setOpenNews(openNews === n.id ? null : n.id), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: t[n.cat] || n.cat, bg: (NEWS_COLOR[n.cat] || "#888") + "18", color: NEWS_COLOR[n.cat] || "#888" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: 11, color: "#aaa", marginLeft: "auto" }, children: [
          n.time,
          "  -  ",
          n.date
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, fontSize: 14, color: "#111", lineHeight: 1.45, marginBottom: 6 }, children: n.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 12, color: "#888" }, children: [
        t.source,
        ": ",
        n.source
      ] }),
      openNews === n.id && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: 10, fontSize: 13, color: "#444", lineHeight: 1.65, borderTop: "1px solid #F3F4F6", paddingTop: 10 }, children: n.body }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: 8, fontSize: 12, color: NEWS_COLOR[n.cat] || "#888", fontWeight: 600 }, children: openNews === n.id ? "▲ Cerrar" : "▼ " + t.readMore })
    ] }, n.id)) });
    if (tab === "cambio") return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "12px 14px 90px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: 20, padding: "18px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 14 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, fontSize: 16, color: "#111", marginBottom: 16 }, children: t.convert }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: 12 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 12, color: "#888", marginBottom: 6 }, children: [
            t.from,
            ": XAF"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: xaf, onChange: (e) => setXaf(e.target.value), placeholder: "0", type: "number", style: { width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "12px 14px", fontSize: 20, fontWeight: 700, boxSizing: "border-box", outline: "none", color: "#111" } })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: 16 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 12, color: "#888", marginBottom: 6 }, children: t.to }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: cur, onChange: (e) => setCur(e.target.value), style: { width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "12px 14px", fontSize: 15, boxSizing: "border-box", outline: "none", background: "#fff", color: "#111" }, children: Object.keys(RATES).map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c, children: c }, c)) })
        ] }),
        converted && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#F0FDF4", borderRadius: 14, padding: "16px", textAlign: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 12, color: "#888", marginBottom: 4 }, children: t.result }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 30, fontWeight: 800, color: "#16A34A" }, children: [
            converted,
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 16 }, children: cur })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 12, color: "#aaa", marginTop: 4 }, children: [
            "1 XAF = ",
            RATES[cur],
            " ",
            cur
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: 20, padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 12 }, children: t.rates }),
        Object.entries(RATES).map(([c, r]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 36, height: 36, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#3B82F6" }, children: c }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 12, color: "#888" }, children: "1 XAF" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, fontSize: 14, color: "#3B82F6" }, children: r.toFixed(6) })
        ] }, c))
      ] })
    ] });
    return null;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { width: "100%", height: "100%", background: "#F0F2F5", display: "flex", flexDirection: "column", overflow: "hidden", paddingTop: "max(56px, env(safe-area-inset-top))", boxSizing: "border-box" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: grad, flexShrink: 0, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px 8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setCountry(null), style: { background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 18 }, children: "←" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#fff", fontWeight: 800, fontSize: 16 }, children: "CEMAC" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 1 }, children: [
            cn(ctry, lang),
            "  -  ",
            ctry.capital
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "rgba(255,255,255,0.22)", borderRadius: 8, padding: "4px 10px", color: "#fff", fontSize: 11, fontWeight: 700 }, children: lang || "ES" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", overflowX: "auto", scrollbarWidth: "none", padding: "0 10px", gap: 2 }, children: TABS.map((tb) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setTab(tb.id),
          style: { flexShrink: 0, background: tab === tb.id ? "#fff" : "transparent", border: "none", borderRadius: "10px 10px 0 0", padding: "8px 13px", color: tab === tb.id ? g1 : "rgba(255,255,255,0.85)", fontWeight: tab === tb.id ? 700 : 400, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s", outline: "none" },
          children: tb.label
        },
        tb.id
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, overflowY: "auto", scrollbarWidth: "none" }, children: renderTab() }),
    modal && /* @__PURE__ */ jsxRuntimeExports.jsx(ModalContent, {})
  ] });
};
export {
  CemacView
};
