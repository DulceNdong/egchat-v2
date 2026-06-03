import { r as reactExports, j as jsxRuntimeExports } from "./react-core-B1rSPtcn.js";
const RESTAURANTES = [
  // ── MALABO ──
  { id: "r1", nombre: "Restaurante La Estancia", ciudad: "Malabo", barrio: "Centro", tipo: "Internacional", especialidad: "Carnes y parrilla", precio: "$$", horario: "12:00-23:00", tel: "+240 222 25 00 01", lat: 3.7523, lng: 8.7741, menu: [{ plato: "Chuletón de ternera", precio: 18e3 }, { plato: "Pollo a la brasa", precio: 9e3 }, { plato: "Ensalada mixta", precio: 4500 }, { plato: "Paella valenciana", precio: 14e3 }, { plato: "Solomillo al vino", precio: 22e3 }] },
  { id: "r2", nombre: "Restaurante El Patio", ciudad: "Malabo", barrio: "Caracolas", tipo: "Africana/Española", especialidad: "Cocina fusión", precio: "$$", horario: "11:00-22:00", tel: "+240 222 25 00 02", lat: 3.7498, lng: 8.7812, menu: [{ plato: "Sopa de pescado", precio: 6e3 }, { plato: "Ndole con plantain", precio: 8e3 }, { plato: "Arroz con pollo", precio: 7500 }, { plato: "Pescado a la plancha", precio: 11e3 }, { plato: "Ensalada de aguacate", precio: 4500 }] },
  { id: "r3", nombre: "Restaurante Bahía", ciudad: "Malabo", barrio: "Puerto", tipo: "Mariscos", especialidad: "Pescados y mariscos frescos", precio: "$$$", horario: "12:00-23:30", tel: "+240 222 25 00 03", lat: 3.7612, lng: 8.7698, menu: [{ plato: "Langosta a la plancha", precio: 35e3 }, { plato: "Gambas al ajillo", precio: 15e3 }, { plato: "Ceviche de corvina", precio: 12e3 }, { plato: "Paella de mariscos", precio: 22e3 }, { plato: "Pulpo a la gallega", precio: 16e3 }] },
  { id: "r4", nombre: "Cocina Típica Malabo", ciudad: "Malabo", barrio: "Ela Nguema", tipo: "Ecuatoguineana", especialidad: "Platos tradicionales GQ", precio: "$", horario: "08:00-21:00", tel: "+240 222 25 00 04", lat: 3.7445, lng: 8.7923, menu: [{ plato: "Sopa de mboa", precio: 3500 }, { plato: "Ekwang", precio: 4e3 }, { plato: "Eru con fufu", precio: 4500 }, { plato: "Pescado ahumado con yuca", precio: 5e3 }, { plato: "Sopa de cabra", precio: 4200 }] },
  { id: "r5", nombre: "Restaurante Sipopo Le Golf", ciudad: "Malabo", barrio: "Sipopo", tipo: "Internacional", especialidad: "Alta cocina", precio: "$$$", horario: "13:00-23:00", tel: "+240 222 25 00 05", lat: 3.7834, lng: 8.8012, menu: [{ plato: "Filete de res", precio: 25e3 }, { plato: "Salmón al horno", precio: 2e4 }, { plato: "Risotto de setas", precio: 16e3 }, { plato: "Tiramisú", precio: 6e3 }, { plato: "Lubina al vapor", precio: 22e3 }] },
  { id: "r6", nombre: "Restaurante Sofitel Malabo", ciudad: "Malabo", barrio: "Centro", tipo: "Internacional/Francesa", especialidad: "Gastronomía francesa", precio: "$$$", horario: "12:00-22:30", tel: "+240 222 25 00 06", lat: 3.7534, lng: 8.7756, menu: [{ plato: "Foie gras", precio: 28e3 }, { plato: "Entrecôte bordelaise", precio: 3e4 }, { plato: "Crème brûlée", precio: 7e3 }, { plato: "Bouillabaisse", precio: 24e3 }] },
  { id: "r7", nombre: "Pizzería Roma", ciudad: "Malabo", barrio: "Malabo II", tipo: "Italiana", especialidad: "Pizzas y pastas", precio: "$$", horario: "11:00-23:00", tel: "+240 222 25 00 07", lat: 3.7389, lng: 8.7867, menu: [{ plato: "Pizza Margherita", precio: 8e3 }, { plato: "Pizza 4 Quesos", precio: 1e4 }, { plato: "Pasta Carbonara", precio: 9e3 }, { plato: "Lasaña", precio: 11e3 }, { plato: "Tiramisú", precio: 5e3 }] },
  { id: "r8", nombre: "Restaurante Chino Malabo", ciudad: "Malabo", barrio: "Centro", tipo: "China", especialidad: "Cocina cantonesa", precio: "$$", horario: "12:00-22:00", tel: "+240 222 25 00 08", lat: 3.7512, lng: 8.7723, menu: [{ plato: "Arroz frito con gambas", precio: 8500 }, { plato: "Pato laqueado", precio: 18e3 }, { plato: "Dim sum variado", precio: 7e3 }, { plato: "Sopa wonton", precio: 5e3 }] },
  { id: "r9", nombre: "Café Malabo", ciudad: "Malabo", barrio: "Centro", tipo: "Cafetería", especialidad: "Desayunos y meriendas", precio: "$", horario: "07:00-20:00", tel: "+240 222 25 00 09", lat: 3.7521, lng: 8.7748, menu: [{ plato: "Desayuno completo", precio: 4500 }, { plato: "Bocadillo de jamón", precio: 3500 }, { plato: "Café con leche", precio: 1500 }, { plato: "Tarta del día", precio: 3e3 }] },
  { id: "r10", nombre: "Restaurante El Árbol", ciudad: "Malabo", barrio: "Aeropuerto", tipo: "Internacional", especialidad: "Cocina variada", precio: "$$", horario: "10:00-22:00", tel: "+240 222 25 00 10", lat: 3.7267, lng: 8.7089, menu: [{ plato: "Hamburguesa gourmet", precio: 9e3 }, { plato: "Ensalada César", precio: 6e3 }, { plato: "Pollo al curry", precio: 1e4 }, { plato: "Zumo natural", precio: 2500 }] },
  // ── BATA ──
  { id: "r11", nombre: "Restaurante Bata Centro", ciudad: "Bata", barrio: "Centro", tipo: "Africana/Internacional", especialidad: "Cocina variada", precio: "$$", horario: "10:00-22:00", tel: "+240 222 25 00 11", lat: 1.8639, lng: 9.7742, menu: [{ plato: "Pollo yassa", precio: 8e3 }, { plato: "Thiéboudienne", precio: 9e3 }, { plato: "Brochetas mixtas", precio: 1e4 }, { plato: "Ensalada de aguacate", precio: 4e3 }] },
  { id: "r12", nombre: "La Terraza Bata", ciudad: "Bata", barrio: "Litoral", tipo: "Mariscos/Española", especialidad: "Vistas al mar", precio: "$$", horario: "12:00-23:00", tel: "+240 222 25 00 12", lat: 1.8712, lng: 9.7698, menu: [{ plato: "Pulpo a la gallega", precio: 14e3 }, { plato: "Merluza al vapor", precio: 11e3 }, { plato: "Calamares fritos", precio: 8e3 }, { plato: "Arroz negro", precio: 13e3 }] },
  { id: "r13", nombre: "Restaurante Nkolombong", ciudad: "Bata", barrio: "Nkolombong", tipo: "Ecuatoguineana", especialidad: "Comida tradicional", precio: "$", horario: "07:00-20:00", tel: "+240 222 25 00 13", lat: 1.8534, lng: 9.7823, menu: [{ plato: "Sopa de cabra", precio: 4e3 }, { plato: "Plantain frito con frijoles", precio: 2500 }, { plato: "Pollo con salsa de cacahuete", precio: 6e3 }, { plato: "Agua de coco natural", precio: 1e3 }] },
  { id: "r14", nombre: "Restaurante El Litoral", ciudad: "Bata", barrio: "Litoral", tipo: "Internacional", especialidad: "Cocina mediterránea", precio: "$$", horario: "11:00-22:30", tel: "+240 222 25 00 14", lat: 1.8698, lng: 9.7712, menu: [{ plato: "Paella mixta", precio: 14e3 }, { plato: "Gazpacho", precio: 4500 }, { plato: "Tortilla española", precio: 5e3 }, { plato: "Flan casero", precio: 3e3 }] },
  { id: "r15", nombre: "Cocina Típica Bata", ciudad: "Bata", barrio: "Centro", tipo: "Ecuatoguineana", especialidad: "Platos locales", precio: "$", horario: "08:00-21:00", tel: "+240 222 25 00 15", lat: 1.8645, lng: 9.7756, menu: [{ plato: "Eru con fufu", precio: 4e3 }, { plato: "Sopa de mboa", precio: 3500 }, { plato: "Pescado ahumado", precio: 5e3 }, { plato: "Yuca con pollo", precio: 4500 }] },
  // ── EBEBIYIN ──
  { id: "r16", nombre: "Restaurante Ebebiyin", ciudad: "Ebebiyin", barrio: "Centro", tipo: "Africana", especialidad: "Cocina continental", precio: "$", horario: "08:00-21:00", tel: "+240 222 25 00 16", lat: 1.1512, lng: 11.3345, menu: [{ plato: "Sopa de verduras", precio: 2500 }, { plato: "Pollo asado", precio: 5500 }, { plato: "Arroz con frijoles", precio: 3e3 }, { plato: "Plátano maduro frito", precio: 1500 }] },
  { id: "r17", nombre: "Bar Restaurante Frontera", ciudad: "Ebebiyin", barrio: "Frontera", tipo: "Africana/Internacional", especialidad: "Cocina variada", precio: "$", horario: "07:00-22:00", tel: "+240 222 25 00 17", lat: 1.1489, lng: 11.3378, menu: [{ plato: "Pollo con arroz", precio: 4500 }, { plato: "Sopa de pescado", precio: 3500 }, { plato: "Brochetas de carne", precio: 5e3 }, { plato: "Zumo de frutas", precio: 1500 }] },
  // ── MONGOMO ──
  { id: "r18", nombre: "Restaurante Mongomo", ciudad: "Mongomo", barrio: "Centro", tipo: "Africana", especialidad: "Platos locales", precio: "$", horario: "08:00-20:00", tel: "+240 222 25 00 18", lat: 1.6278, lng: 13.6123, menu: [{ plato: "Caldo de pescado", precio: 3e3 }, { plato: "Yuca con pollo", precio: 4500 }, { plato: "Arroz jollof", precio: 3500 }, { plato: "Zumo de frutas tropicales", precio: 1200 }] },
  { id: "r19", nombre: "Cocina de Mongomo", ciudad: "Mongomo", barrio: "Centro", tipo: "Ecuatoguineana", especialidad: "Cocina tradicional", precio: "$", horario: "07:30-20:00", tel: "+240 222 25 00 19", lat: 1.6245, lng: 13.6145, menu: [{ plato: "Sopa de mboa", precio: 3e3 }, { plato: "Eru con fufu", precio: 3500 }, { plato: "Pollo ahumado", precio: 5e3 }, { plato: "Agua de coco", precio: 1e3 }] }
];
const AEROLINEAS_NACIONALES = [
  {
    id: "ceiba",
    nombre: "Ceiba Intercontinental",
    iata: "C2",
    pais: "Guinea Ecuatorial",
    hub: "Malabo (SSG)",
    color: "#1B3A6B",
    color2: "#2A5298",
    bandera: "🇬🇶",
    rutas: [
      { origen: "Malabo (SSG)", destino: "Bata (BSG)", duracion: "45 min", precio: 45e3, frecuencia: "Diario" },
      { origen: "Bata (BSG)", destino: "Malabo (SSG)", duracion: "45 min", precio: 45e3, frecuencia: "Diario" },
      { origen: "Malabo (SSG)", destino: "Madrid (MAD)", duracion: "7h 30min", precio: 38e4, frecuencia: "3x semana" },
      { origen: "Malabo (SSG)", destino: "Paris (CDG)", duracion: "8h", precio: 42e4, frecuencia: "2x semana" },
      { origen: "Malabo (SSG)", destino: "Libreville (LBV)", duracion: "1h 10min", precio: 85e3, frecuencia: "Diario" },
      { origen: "Malabo (SSG)", destino: "Douala (DLA)", duracion: "1h 20min", precio: 9e4, frecuencia: "Diario" },
      { origen: "Malabo (SSG)", destino: "Yaoundé (NSI)", duracion: "1h 30min", precio: 95e3, frecuencia: "4x semana" },
      { origen: "Malabo (SSG)", destino: "Abidjan (ABJ)", duracion: "2h 30min", precio: 15e4, frecuencia: "2x semana" }
    ]
  },
  {
    id: "cronos",
    nombre: "Cronos Airlines",
    iata: "QC",
    pais: "Guinea Ecuatorial",
    hub: "Malabo (SSG)",
    color: "#C0392B",
    color2: "#E74C3C",
    bandera: "🇬🇶",
    rutas: [
      { origen: "Malabo (SSG)", destino: "Bata (BSG)", duracion: "45 min", precio: 4e4, frecuencia: "Diario" },
      { origen: "Bata (BSG)", destino: "Malabo (SSG)", duracion: "45 min", precio: 4e4, frecuencia: "Diario" },
      { origen: "Malabo (SSG)", destino: "Annobon (ANO)", duracion: "1h 20min", precio: 55e3, frecuencia: "2x semana" }
    ]
  }
];
const AEROLINEAS_INTERNACIONALES = [
  {
    id: "iberia",
    nombre: "Iberia",
    iata: "IB",
    pais: "España",
    hub: "Madrid (MAD)",
    color: "#C0392B",
    color2: "#E74C3C",
    bandera: "🇪🇸",
    rutas: [
      { origen: "Madrid (MAD)", destino: "Malabo (SSG)", duracion: "7h 30min", precio: 35e4, frecuencia: "3x semana" },
      { origen: "Malabo (SSG)", destino: "Madrid (MAD)", duracion: "7h 30min", precio: 35e4, frecuencia: "3x semana" }
    ]
  },
  {
    id: "airfrance",
    nombre: "Air France",
    iata: "AF",
    pais: "Francia",
    hub: "París (CDG)",
    color: "#003087",
    color2: "#0057A8",
    bandera: "🇫🇷",
    rutas: [
      { origen: "París (CDG)", destino: "Malabo (SSG)", duracion: "8h", precio: 39e4, frecuencia: "2x semana" },
      { origen: "Malabo (SSG)", destino: "París (CDG)", duracion: "8h", precio: 39e4, frecuencia: "2x semana" }
    ]
  },
  {
    id: "ethiopian",
    nombre: "Ethiopian Airlines",
    iata: "ET",
    pais: "Etiopía",
    hub: "Addis Abeba (ADD)",
    color: "#078930",
    color2: "#0A9E3F",
    bandera: "🇪🇹",
    rutas: [
      { origen: "Addis Abeba (ADD)", destino: "Malabo (SSG)", duracion: "6h 30min", precio: 28e4, frecuencia: "3x semana" },
      { origen: "Malabo (SSG)", destino: "Nairobi (NBO)", duracion: "7h", precio: 31e4, frecuencia: "2x semana" },
      { origen: "Malabo (SSG)", destino: "Addis Abeba (ADD)", duracion: "6h 30min", precio: 28e4, frecuencia: "3x semana" }
    ]
  },
  {
    id: "rwandair",
    nombre: "RwandAir",
    iata: "WB",
    pais: "Ruanda",
    hub: "Kigali (KGL)",
    color: "#20603D",
    color2: "#2E8B57",
    bandera: "🇷🇼",
    rutas: [
      { origen: "Kigali (KGL)", destino: "Malabo (SSG)", duracion: "5h 30min", precio: 26e4, frecuencia: "2x semana" },
      { origen: "Malabo (SSG)", destino: "Kigali (KGL)", duracion: "5h 30min", precio: 26e4, frecuencia: "2x semana" }
    ]
  },
  {
    id: "turkish",
    nombre: "Turkish Airlines",
    iata: "TK",
    pais: "Turquía",
    hub: "Estambul (IST)",
    color: "#C0392B",
    color2: "#E74C3C",
    bandera: "🇹🇷",
    rutas: [
      { origen: "Estambul (IST)", destino: "Malabo (SSG)", duracion: "9h 30min", precio: 45e4, frecuencia: "2x semana" },
      { origen: "Malabo (SSG)", destino: "Estambul (IST)", duracion: "9h 30min", precio: 45e4, frecuencia: "2x semana" }
    ]
  },
  {
    id: "kenya",
    nombre: "Kenya Airways",
    iata: "KQ",
    pais: "Kenia",
    hub: "Nairobi (NBO)",
    color: "#006600",
    color2: "#008000",
    bandera: "🇰🇪",
    rutas: [
      { origen: "Nairobi (NBO)", destino: "Malabo (SSG)", duracion: "6h 45min", precio: 295e3, frecuencia: "2x semana" },
      { origen: "Malabo (SSG)", destino: "Nairobi (NBO)", duracion: "6h 45min", precio: 295e3, frecuencia: "2x semana" }
    ]
  },
  {
    id: "asky",
    nombre: "ASKY Airlines",
    iata: "KP",
    pais: "Togo",
    hub: "Lomé (LFW)",
    color: "#FF6600",
    color2: "#FF8C00",
    bandera: "🇹🇬",
    rutas: [
      { origen: "Lomé (LFW)", destino: "Malabo (SSG)", duracion: "3h 30min", precio: 18e4, frecuencia: "3x semana" },
      { origen: "Malabo (SSG)", destino: "Lomé (LFW)", duracion: "3h 30min", precio: 18e4, frecuencia: "3x semana" },
      { origen: "Malabo (SSG)", destino: "Abidjan (ABJ)", duracion: "2h 45min", precio: 16e4, frecuencia: "2x semana" }
    ]
  },
  {
    id: "camair",
    nombre: "Camair-Co",
    iata: "QC",
    pais: "Camerún",
    hub: "Douala (DLA)",
    color: "#007A5E",
    color2: "#009B77",
    bandera: "🇨🇲",
    rutas: [
      { origen: "Douala (DLA)", destino: "Malabo (SSG)", duracion: "1h 20min", precio: 85e3, frecuencia: "Diario" },
      { origen: "Malabo (SSG)", destino: "Douala (DLA)", duracion: "1h 20min", precio: 85e3, frecuencia: "Diario" },
      { origen: "Yaoundé (NSI)", destino: "Malabo (SSG)", duracion: "1h 30min", precio: 9e4, frecuencia: "4x semana" }
    ]
  }
];
const COMPANIAS_GAS = [
  {
    id: "gepetrol",
    nombre: "GEPetrol",
    color: "#C0392B",
    estaciones: [
      { nombre: "GEPetrol Malabo Centro", ciudad: "Malabo", barrio: "Centro", horario: "24h", tel: "+240 333 09 50 01", g95: 650, diesel: 580, glp: 450 },
      { nombre: "GEPetrol Caracolas", ciudad: "Malabo", barrio: "Caracolas", horario: "06:00-22:00", tel: "+240 333 09 50 02", g95: 650, diesel: 580, glp: 450 },
      { nombre: "GEPetrol Ela Nguema", ciudad: "Malabo", barrio: "Ela Nguema", horario: "06:00-22:00", tel: "+240 333 09 50 03", g95: 650, diesel: 580, glp: 450 },
      { nombre: "GEPetrol Bata Centro", ciudad: "Bata", barrio: "Centro", horario: "24h", tel: "+240 333 09 50 04", g95: 650, diesel: 580, glp: 450 },
      { nombre: "GEPetrol Bata Norte", ciudad: "Bata", barrio: "Nkolombong", horario: "06:00-22:00", tel: "+240 333 09 50 05", g95: 650, diesel: 580, glp: 450 },
      { nombre: "GEPetrol Ebebiyin", ciudad: "Ebebiyin", barrio: "Centro", horario: "07:00-21:00", tel: "+240 333 09 50 06", g95: 650, diesel: 580, glp: 450 },
      { nombre: "GEPetrol Mongomo", ciudad: "Mongomo", barrio: "Centro", horario: "07:00-21:00", tel: "+240 333 09 50 07", g95: 650, diesel: 580, glp: 450 }
    ]
  },
  {
    id: "total",
    nombre: "TotalEnergies",
    color: "#E31837",
    estaciones: [
      { nombre: "Total Malabo Puerto", ciudad: "Malabo", barrio: "Puerto", horario: "24h", tel: "+240 333 09 51 01", g95: 660, diesel: 590, glp: 460 },
      { nombre: "Total Malabo II", ciudad: "Malabo", barrio: "Malabo II", horario: "06:00-23:00", tel: "+240 333 09 51 02", g95: 660, diesel: 590, glp: 460 },
      { nombre: "Total Sipopo", ciudad: "Malabo", barrio: "Sipopo", horario: "06:00-22:00", tel: "+240 333 09 51 03", g95: 660, diesel: 590, glp: 460 },
      { nombre: "Total Bata Litoral", ciudad: "Bata", barrio: "Litoral", horario: "24h", tel: "+240 333 09 51 04", g95: 660, diesel: 590, glp: 460 }
    ]
  },
  {
    id: "oryx",
    nombre: "Oryx",
    color: "#FF6B00",
    estaciones: [
      { nombre: "Oryx Malabo Aeropuerto", ciudad: "Malabo", barrio: "Aeropuerto", horario: "05:00-23:00", tel: "+240 333 09 52 01", g95: 655, diesel: 585, glp: 455 },
      { nombre: "Oryx Malabo Centro", ciudad: "Malabo", barrio: "Centro", horario: "06:00-22:00", tel: "+240 333 09 52 02", g95: 655, diesel: 585, glp: 455 },
      { nombre: "Oryx Bata", ciudad: "Bata", barrio: "Centro", horario: "06:00-22:00", tel: "+240 333 09 52 03", g95: 655, diesel: 585, glp: 455 }
    ]
  }
];
const RestaurantesModule = () => {
  const [city, setCity] = reactExports.useState("Malabo");
  const [search, setSearch] = reactExports.useState("");
  const [selected, setSelected] = reactExports.useState(null);
  const [view, setView] = reactExports.useState("list");
  const [form, setForm] = reactExports.useState({ name: "", phone: "", date: "", hora: "", personas: "2", notas: "" });
  const CIUDADES_REST = ["Malabo", "Bata", "Ebebiyin", "Mongomo", "Todos"];
  const filtered = RESTAURANTES.filter(
    (r) => (city === "Todos" || r.ciudad === city) && (!search || r.nombre.toLowerCase().includes(search.toLowerCase()) || r.tipo.toLowerCase().includes(search.toLowerCase()))
  );
  const precioColor = (p) => p === "$" ? "#16A34A" : p === "$$" ? "#C47D2A" : "#C0392B";
  const precioLabel = (p) => p === "$" ? "Económico" : p === "$$" ? "Moderado" : "Premium";
  const tipoEmoji = (t) => t.includes("Mariscos") ? "🦞" : t.includes("Ecuato") ? "🍲" : t.includes("Italiana") ? "🍕" : t.includes("China") ? "🥢" : t.includes("Café") ? "☕" : "🍽️";
  if (view === "ok") return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "40px 20px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "56px", marginBottom: "12px" }, children: "✅" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "18px", fontWeight: "800", color: "#111827", marginBottom: "6px" }, children: "¡Reserva confirmada!" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", color: "#9CA3AF", marginBottom: "4px" }, children: selected?.nombre }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "13px", color: "#9CA3AF", marginBottom: "20px" }, children: [
      form.date,
      " · ",
      form.hora,
      " · ",
      form.personas,
      " personas"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => {
          setView("list");
          setSelected(null);
          setForm({ name: "", phone: "", date: "", hora: "", personas: "2", notas: "" });
        },
        style: { background: "linear-gradient(135deg,#92400E,#F59E0B)", border: "none", borderRadius: "12px", padding: "13px 32px", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer" },
        children: "Ver más restaurantes"
      }
    )
  ] });
  if (view === "reserva" && selected) return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "14px 16px 24px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg,#92400E,#F59E0B)", borderRadius: "12px", padding: "14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "12px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "28px" }, children: tipoEmoji(selected.tipo) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "15px", fontWeight: "800", color: "#fff" }, children: selected.nombre }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.8)" }, children: [
          selected.barrio,
          " · ",
          selected.ciudad
        ] })
      ] })
    ] }),
    [{ k: "name", l: "Tu nombre completo", t: "text" }, { k: "phone", l: "Teléfono de contacto", t: "tel" }, { k: "date", l: "Fecha (DD/MM/AAAA)", t: "text" }, { k: "hora", l: "Hora de llegada", t: "text" }, { k: "personas", l: "Número de personas", t: "number" }, { k: "notas", l: "Notas especiales (opcional)", t: "text" }].map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "#fff", borderRadius: "10px", padding: "0 14px", marginBottom: "8px", display: "flex", alignItems: "center", height: "50px", border: "1px solid #F0F2F5" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: f.t, placeholder: f.l, value: form[f.k], onChange: (e) => setForm((p) => ({ ...p, [f.k]: e.target.value })), style: { flex: 1, background: "none", border: "none", outline: "none", fontSize: "13px", color: "#111827", fontFamily: "inherit" } }) }, f.k)),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => {
          if (form.name && form.phone && form.date && form.hora) setView("ok");
        },
        style: { width: "100%", background: form.name && form.phone && form.date && form.hora ? "linear-gradient(135deg,#92400E,#F59E0B)" : "#E5E7EB", border: "none", borderRadius: "12px", padding: "14px", color: form.name && form.phone && form.date && form.hora ? "#fff" : "#9CA3AF", fontSize: "14px", fontWeight: "700", cursor: "pointer" },
        children: "Confirmar reserva"
      }
    )
  ] });
  if (view === "menu" && selected) return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "0 0 24px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg,#92400E,#F59E0B)", padding: "16px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setView("list"), style: { background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "6px 12px", color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer", marginBottom: "10px" }, children: "← Volver" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "28px" }, children: tipoEmoji(selected.tipo) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "17px", fontWeight: "800", color: "#fff" }, children: selected.nombre }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.8)" }, children: [
            selected.tipo,
            " · ",
            selected.barrio,
            ", ",
            selected.ciudad
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.8)", marginTop: "2px" }, children: [
            "🕐 ",
            selected.horario,
            " · 📞 ",
            selected.tel
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "14px 16px 0" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "a",
        {
          href: `https://maps.google.com/?q=${selected.lat},${selected.lng}`,
          target: "_blank",
          rel: "noopener noreferrer",
          style: { display: "flex", alignItems: "center", gap: "8px", background: "#EFF5FD", border: "1px solid #BFDBFE", borderRadius: "10px", padding: "10px 14px", marginBottom: "12px", textDecoration: "none", color: "#1B3A6B", fontSize: "12px", fontWeight: "700" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "10", r: "3" })
            ] }),
            "Ver en Google Maps · ",
            selected.barrio,
            ", ",
            selected.ciudad
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "700", color: "#9CA3AF", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }, children: "Menú" }),
      selected.menu.map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "12px", padding: "13px 14px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "14px", fontWeight: "600", color: "#111827" }, children: item.plato }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "14px", fontWeight: "800", color: "#C47D2A" }, children: [
          item.precio.toLocaleString(),
          " XAF"
        ] })
      ] }, i)),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setView("reserva"), style: { width: "100%", background: "linear-gradient(135deg,#92400E,#F59E0B)", border: "none", borderRadius: "12px", padding: "14px", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer", marginTop: "8px" }, children: "Reservar mesa" })
    ] })
  ] });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "0 0 24px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg,#92400E,#F59E0B)", padding: "16px 16px 12px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "18px", fontWeight: "800", color: "#fff", marginBottom: "4px" }, children: "Restaurantes" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.8)", marginBottom: "10px" }, children: [
        "Guinea Ecuatorial · ",
        filtered.length,
        " restaurantes"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.2)", borderRadius: "10px", padding: "0 12px", height: "38px", display: "flex", alignItems: "center", gap: "8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "rgba(255,255,255,0.8)", strokeWidth: "2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "11", cy: "11", r: "8" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 21l-4.35-4.35" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Buscar restaurante o tipo...", style: { flex: 1, background: "none", border: "none", outline: "none", fontSize: "13px", color: "#fff", fontFamily: "inherit" } })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", padding: "10px 16px 6px", overflowX: "auto" }, children: CIUDADES_REST.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setCity(c), style: { flexShrink: 0, background: city === c ? "#C47D2A" : "#fff", border: `1px solid ${city === c ? "#C47D2A" : "#E5E7EB"}`, borderRadius: "20px", padding: "5px 14px", fontSize: "11px", fontWeight: "700", color: city === c ? "#fff" : "#6B7280", cursor: "pointer" }, children: c }, c)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "0 16px" }, children: [
      filtered.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "30px 0", color: "#9CA3AF", fontSize: "13px" }, children: [
        "Sin resultados en ",
        city
      ] }),
      filtered.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "14px", padding: "14px", marginBottom: "10px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #F0F2F5" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "48px", height: "48px", borderRadius: "12px", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }, children: tipoEmoji(r.tipo) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "14px", fontWeight: "800", color: "#111827", flex: 1, marginRight: "8px" }, children: r.nombre }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: precioColor(r.precio) + "15", color: precioColor(r.precio), fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "8px", flexShrink: 0 }, children: precioLabel(r.precio) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#6B7280", marginTop: "2px" }, children: [
              r.tipo,
              " · ",
              r.especialidad
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }, children: [
              "📍 ",
              r.barrio,
              ", ",
              r.ciudad,
              " · 🕐 ",
              r.horario
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "a",
            {
              href: `https://maps.google.com/?q=${r.lat},${r.lng}`,
              target: "_blank",
              rel: "noopener noreferrer",
              style: { flex: 1, background: "#EFF5FD", border: "1px solid #BFDBFE", borderRadius: "10px", padding: "9px", fontSize: "12px", fontWeight: "700", color: "#1B3A6B", textDecoration: "none", textAlign: "center" },
              children: "📍 GPS"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
            setSelected(r);
            setView("menu");
          }, style: { flex: 2, background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "10px", padding: "9px", fontSize: "12px", fontWeight: "700", color: "#92400E", cursor: "pointer" }, children: "Ver menú" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
            setSelected(r);
            setView("reserva");
          }, style: { flex: 2, background: "linear-gradient(135deg,#92400E,#F59E0B)", border: "none", borderRadius: "10px", padding: "9px", fontSize: "12px", fontWeight: "700", color: "#fff", cursor: "pointer" }, children: "Reservar" })
        ] })
      ] }, r.id))
    ] })
  ] });
};
const VuelosModule = () => {
  const [view, setView] = reactExports.useState("home");
  const [airline, setAirline] = reactExports.useState(null);
  const [route, setRoute] = reactExports.useState(null);
  const [tab, setTab] = reactExports.useState("nacional");
  const [trip, setTrip] = reactExports.useState("Ida");
  const [clase, setClase] = reactExports.useState("Turista");
  const [form, setForm] = reactExports.useState({ name: "", dni: "", phone: "", date: "", pax: "1", payMethod: "" });
  const allAirlines = tab === "nacional" ? AEROLINEAS_NACIONALES : AEROLINEAS_INTERNACIONALES;
  const total = route ? Math.round(route.precio * (clase === "Business" ? 1.8 : 1) * (trip === "Ida y vuelta" ? 2 : 1) * parseInt(form.pax || "1")) : 0;
  if (view === "ok") return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "40px 20px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "56px", marginBottom: "12px" }, children: "✅" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "18px", fontWeight: "800", color: "#111827", marginBottom: "6px" }, children: "¡Reserva confirmada!" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "13px", color: "#6B7280", marginBottom: "4px" }, children: [
      airline?.nombre,
      " · ",
      route?.origen,
      " → ",
      route?.destino
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "22px", fontWeight: "900", color: "#1B3A6B", marginBottom: "20px" }, children: [
      total.toLocaleString(),
      " XAF"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => {
          setView("home");
          setAirline(null);
          setRoute(null);
          setForm({ name: "", dni: "", phone: "", date: "", pax: "1", payMethod: "" });
        },
        style: { background: "linear-gradient(135deg,#1B3A6B,#00b4e6)", border: "none", borderRadius: "12px", padding: "13px 32px", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer" },
        children: "Ver más vuelos"
      }
    )
  ] });
  if (view === "book" && route) return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "14px 16px 24px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: `linear-gradient(135deg,${airline?.color},#00b4e6)`, borderRadius: "12px", padding: "14px", marginBottom: "14px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "rgba(255,255,255,0.25)", borderRadius: "8px", padding: "4px 10px", fontSize: "14px", fontWeight: "900", color: "#fff" }, children: airline?.iata }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "700", color: "#fff" }, children: airline?.nombre }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "16px", marginLeft: "auto" }, children: airline?.bandera })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "16px", fontWeight: "800", color: "#fff" }, children: [
        route.origen,
        " → ",
        route.destino
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.8)", marginTop: "2px" }, children: [
        "✈️ ",
        route.duracion,
        " · 📅 ",
        route.frecuencia
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "8px", marginBottom: "10px" }, children: ["Ida", "Ida y vuelta"].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTrip(t), style: { flex: 1, background: trip === t ? "#1B3A6B" : "#fff", border: `1.5px solid ${trip === t ? "#1B3A6B" : "#E5E7EB"}`, borderRadius: "10px", padding: "9px", fontSize: "12px", fontWeight: "700", color: trip === t ? "#fff" : "#6B7280", cursor: "pointer" }, children: t }, t)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "8px", marginBottom: "10px" }, children: ["Turista", "Business"].map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setClase(c), style: { flex: 1, background: clase === c ? "#00b4e6" : "#fff", border: `1.5px solid ${clase === c ? "#00b4e6" : "#E5E7EB"}`, borderRadius: "10px", padding: "9px", fontSize: "12px", fontWeight: "700", color: clase === c ? "#fff" : "#6B7280", cursor: "pointer" }, children: [
      c,
      c === "Business" ? " (x1.8)" : ""
    ] }, c)) }),
    [{ k: "name", l: "Nombre completo", t: "text" }, { k: "dni", l: "Pasaporte / DNI", t: "text" }, { k: "phone", l: "Teléfono", t: "tel" }, { k: "date", l: "Fecha salida (DD/MM/AAAA)", t: "text" }, { k: "pax", l: "Núm. pasajeros", t: "number" }].map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "#fff", borderRadius: "10px", padding: "0 14px", marginBottom: "8px", display: "flex", alignItems: "center", height: "50px", border: "1px solid #F0F2F5" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: f.t, placeholder: f.l, value: form[f.k], onChange: (e) => setForm((p) => ({ ...p, [f.k]: e.target.value })), style: { flex: 1, background: "none", border: "none", outline: "none", fontSize: "13px", color: "#111827", fontFamily: "inherit" } }) }, f.k)),
    parseInt(form.pax || "0") > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#EFF5FD", borderRadius: "10px", padding: "12px 14px", marginBottom: "12px", border: "1px solid #BFDBFE" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "#1B3A6B", marginBottom: "4px", fontWeight: "600" }, children: "Total estimado" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "22px", fontWeight: "900", color: "#1B3A6B" }, children: [
        total.toLocaleString(),
        " XAF"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "10px", color: "#6B7280" }, children: [
        form.pax,
        " pax · ",
        clase,
        " · ",
        trip
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "8px", marginBottom: "14px" }, children: [{ id: "wallet", label: "EGCHAT" }, { id: "bank", label: "Banco" }, { id: "card", label: "Tarjeta" }].map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setForm((p) => ({ ...p, payMethod: m.id })), style: { flex: 1, background: form.payMethod === m.id ? "#EFF5FD" : "#F9FAFB", border: `1.5px solid ${form.payMethod === m.id ? "#1B3A6B" : "#E5E7EB"}`, borderRadius: "10px", padding: "10px 4px", fontSize: "10px", fontWeight: "700", color: form.payMethod === m.id ? "#1B3A6B" : "#6B7280", cursor: "pointer" }, children: m.label }, m.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => {
          if (form.name && form.dni && form.date && form.payMethod) setView("ok");
        },
        style: { width: "100%", background: form.name && form.dni && form.date && form.payMethod ? `linear-gradient(135deg,${airline?.color},#00b4e6)` : "#E5E7EB", border: "none", borderRadius: "12px", padding: "14px", color: form.name && form.dni && form.date && form.payMethod ? "#fff" : "#9CA3AF", fontSize: "14px", fontWeight: "700", cursor: "pointer" },
        children: [
          "Confirmar reserva",
          total > 0 ? ` · ${total.toLocaleString()} XAF` : ""
        ]
      }
    )
  ] });
  if (view === "routes" && airline) return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "0 0 24px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: `linear-gradient(135deg,${airline.color},#00b4e6)`, padding: "16px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setView("home"), style: { background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "6px 12px", color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer", marginBottom: "10px" }, children: "← Volver" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "rgba(255,255,255,0.25)", borderRadius: "10px", padding: "6px 12px", fontSize: "18px", fontWeight: "900", color: "#fff", letterSpacing: "1px" }, children: airline.iata }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "17px", fontWeight: "800", color: "#fff" }, children: airline.nombre }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.8)" }, children: [
            airline.bandera,
            " ",
            airline.pais,
            " · Hub: ",
            airline.hub,
            " · ",
            airline.rutas.length,
            " rutas"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "14px 16px 0" }, children: airline.rutas.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "14px", padding: "14px", marginBottom: "10px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #F0F2F5" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "14px", fontWeight: "800", color: "#111827" }, children: [
            r.origen,
            " → ",
            r.destino
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }, children: [
            "✈️ ",
            r.duracion,
            " · 📅 ",
            r.frecuencia
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "right" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "16px", fontWeight: "900", color: airline.color }, children: r.precio.toLocaleString() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "9px", color: "#9CA3AF" }, children: "XAF/pax" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            setRoute(r);
            setView("book");
          },
          style: { width: "100%", background: `linear-gradient(135deg,${airline.color},#00b4e6)`, border: "none", borderRadius: "10px", padding: "10px", fontSize: "13px", fontWeight: "700", color: "#fff", cursor: "pointer" },
          children: "Reservar este vuelo"
        }
      )
    ] }, i)) })
  ] });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "0 0 24px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg,#1B3A6B,#00b4e6)", padding: "16px 16px 12px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "18px", fontWeight: "800", color: "#fff", marginBottom: "4px" }, children: "✈️ Vuelos" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.8)", marginBottom: "12px" }, children: "Aerolíneas que operan en Guinea Ecuatorial" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", background: "rgba(255,255,255,0.15)", borderRadius: "12px", padding: "3px", gap: "3px" }, children: ["nacional", "internacional"].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setTab(t),
          style: { flex: 1, background: tab === t ? "#fff" : "transparent", border: "none", borderRadius: "10px", padding: "8px", fontSize: "12px", fontWeight: "700", color: tab === t ? "#1B3A6B" : "rgba(255,255,255,0.85)", cursor: "pointer", transition: "all 0.2s" },
          children: t === "nacional" ? "🇬🇶 Nacionales" : "🌍 Internacionales"
        },
        t
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "14px 16px 0" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }, children: allAirlines.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        onClick: () => {
          setAirline(a);
          setView("routes");
        },
        style: { background: "#fff", borderRadius: "16px", padding: "16px", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: "1px solid #F0F2F5", transition: "transform 0.15s" },
        onMouseEnter: (e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.transform = "translateY(0)";
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: `linear-gradient(135deg,${a.color},${a.color2})`, borderRadius: "10px", padding: "6px 10px", fontSize: "16px", fontWeight: "900", color: "#fff", letterSpacing: "1px" }, children: a.iata }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "20px" }, children: a.bandera })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "800", color: "#1A2B4A", marginBottom: "2px", lineHeight: "1.3" }, children: a.nombre }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "10px", color: "#8A9BB5", marginBottom: "8px" }, children: a.pais }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { background: `${a.color}15`, color: a.color, borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: "700" }, children: [
              a.rutas.length,
              " rutas"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "#CBD5E1", strokeWidth: "2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M9 18l6-6-6-6" }) })
          ] })
        ]
      },
      a.id
    )) }) })
  ] });
};
const GasolinerasModule = ({ onDebit }) => {
  const [view, setView] = reactExports.useState("companies");
  const [company, setCompany] = reactExports.useState(null);
  const [station, setStation] = reactExports.useState(null);
  const [fuelType, setFuelType] = reactExports.useState("g95");
  const [city, setCity] = reactExports.useState("Malabo");
  const [liters, setLiters] = reactExports.useState("");
  const [plate, setPlate] = reactExports.useState("");
  const [payMethod, setPayMethod] = reactExports.useState("");
  const FUELS = [{ id: "g95", label: "Gasolina 95", color: "#FA9D3B", icon: "gas" }, { id: "diesel", label: "Diesel", color: "#576B95", icon: "truck" }, { id: "glp", label: "Gas Licuado (GLP)", color: "#07C160", icon: "fire" }];
  const pricePerL = station ? station[fuelType] : 650;
  const total = pricePerL * parseInt(liters || "0");
  if (view === "ok") return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "40px 20px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "48px", marginBottom: "12px" }, children: "ok" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "18px", fontWeight: "800", color: "#111827", marginBottom: "6px" }, children: "Pago confirmado!" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", color: "#6B7280", marginBottom: "4px" }, children: station?.nombre }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "13px", color: "#6B7280", marginBottom: "4px" }, children: [
      FUELS.find((f) => f.id === fuelType)?.label,
      " - ",
      liters,
      "L - Matricula: ",
      plate
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "22px", fontWeight: "900", color: "#C47D2A", marginBottom: "20px" }, children: [
      total.toLocaleString(),
      " XAF"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
      setView("companies");
      setCompany(null);
      setStation(null);
      setLiters("");
      setPlate("");
      setPayMethod("");
    }, style: { background: "linear-gradient(135deg,#92400E,#F59E0B)", border: "none", borderRadius: "12px", padding: "13px 32px", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer" }, children: "Nueva recarga" })
  ] });
  if (view === "pay" && station) return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "14px 16px 24px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg,#92400E,#F59E0B)", borderRadius: "12px", padding: "14px", marginBottom: "14px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.7)", marginBottom: "2px" }, children: [
        station.nombre,
        " - ",
        station.ciudad
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "15px", fontWeight: "800", color: "#fff" }, children: FUELS.find((f) => f.id === fuelType)?.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "13px", color: "rgba(255,255,255,0.9)", marginTop: "2px" }, children: [
        pricePerL,
        " XAF/L"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "8px", marginBottom: "12px" }, children: FUELS.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setFuelType(f.id), style: { flex: 1, background: fuelType === f.id ? f.color + "20" : "#fff", border: `1.5px solid ${fuelType === f.id ? f.color : "#E5E7EB"}`, borderRadius: "10px", padding: "8px 4px", fontSize: "10px", fontWeight: "700", color: fuelType === f.id ? f.color : "#6B7280", cursor: "pointer" }, children: [
      f.label.split(" ")[0],
      /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
      station[f.id],
      " XAF/L"
    ] }, f.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "#fff", borderRadius: "10px", padding: "0 14px", marginBottom: "8px", display: "flex", alignItems: "center", height: "50px", border: "1px solid #F0F2F5" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", placeholder: "Matricula del vehiculo", value: plate, onChange: (e) => setPlate(e.target.value), style: { flex: 1, background: "none", border: "none", outline: "none", fontSize: "13px", color: "#111827", fontFamily: "inherit" } }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "#fff", borderRadius: "10px", padding: "0 14px", marginBottom: "8px", display: "flex", alignItems: "center", height: "50px", border: "1px solid #F0F2F5" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", placeholder: "Litros a cargar", value: liters, onChange: (e) => setLiters(e.target.value), style: { flex: 1, background: "none", border: "none", outline: "none", fontSize: "13px", color: "#111827", fontFamily: "inherit" } }) }),
    parseInt(liters || "0") > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#FEF3C7", borderRadius: "10px", padding: "12px 14px", marginBottom: "12px", border: "1px solid #FDE68A" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "#92400E", marginBottom: "4px", fontWeight: "600" }, children: "Total a pagar" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "24px", fontWeight: "900", color: "#C47D2A" }, children: [
        total.toLocaleString(),
        " XAF"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#92400E" }, children: [
        liters,
        "L x ",
        pricePerL,
        " XAF/L"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "8px", marginBottom: "14px" }, children: [{ id: "wallet", label: "EGCHAT" }, { id: "bank", label: "Banco" }, { id: "cash", label: "Efectivo" }].map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setPayMethod(m.id), style: { flex: 1, background: payMethod === m.id ? "#FEF3C7" : "#F9FAFB", border: `1.5px solid ${payMethod === m.id ? "#F59E0B" : "#E5E7EB"}`, borderRadius: "10px", padding: "10px 4px", fontSize: "10px", fontWeight: "700", color: payMethod === m.id ? "#92400E" : "#6B7280", cursor: "pointer" }, children: m.label }, m.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
      if (plate && parseInt(liters || "0") > 0 && payMethod) {
        onDebit(total);
        setView("ok");
      }
    }, style: { width: "100%", background: plate && parseInt(liters || "0") > 0 && payMethod ? "linear-gradient(135deg,#92400E,#F59E0B)" : "#E5E7EB", border: "none", borderRadius: "12px", padding: "14px", color: plate && parseInt(liters || "0") > 0 && payMethod ? "#fff" : "#9CA3AF", fontSize: "14px", fontWeight: "700", cursor: "pointer" }, children: [
      "Pagar ",
      total > 0 ? `${total.toLocaleString()} XAF` : ""
    ] })
  ] });
  if (view === "stations" && company) return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "0 0 24px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: `linear-gradient(135deg,${company.color},#C47D2A)`, padding: "16px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setView("companies"), style: { background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "6px 12px", color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer", marginBottom: "10px" }, children: "Volver" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "17px", fontWeight: "800", color: "#fff" }, children: company.nombre }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.8)" }, children: [
        company.estaciones.length,
        " estaciones en Guinea Ecuatorial"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", padding: "10px 16px 6px", overflowX: "auto" }, children: ["Malabo", "Bata", "Ebebiyin", "Mongomo", "Todas"].map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setCity(c), style: { flexShrink: 0, background: city === c ? company.color : "#fff", border: `1px solid ${city === c ? company.color : "#E5E7EB"}`, borderRadius: "20px", padding: "5px 14px", fontSize: "11px", fontWeight: "700", color: city === c ? "#fff" : "#6B7280", cursor: "pointer" }, children: c }, c)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "0 16px" }, children: company.estaciones.filter((s) => city === "Todas" || s.ciudad === city).map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "14px", padding: "14px", marginBottom: "10px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #F0F2F5" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "14px", fontWeight: "700", color: "#111827", marginBottom: "4px" }, children: s.nombre }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#9CA3AF", marginBottom: "8px" }, children: [
        s.barrio,
        ", ",
        s.ciudad,
        " - ",
        s.horario
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", marginBottom: "10px" }, children: FUELS.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, background: f.color + "12", borderRadius: "8px", padding: "6px", textAlign: "center" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "9px", color: f.color, fontWeight: "700" }, children: f.label.split(" ")[0] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "800", color: f.color }, children: s[f.id] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "8px", color: "#9CA3AF" }, children: "XAF/L" })
      ] }, f.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `https://maps.google.com/?q=${encodeURIComponent(s.nombre + " " + s.ciudad + " Guinea Ecuatorial")}`, target: "_blank", rel: "noopener noreferrer", style: { flex: 1, background: "#EFF5FD", border: "1px solid #BFDBFE", borderRadius: "10px", padding: "9px", fontSize: "12px", fontWeight: "700", color: "#1B3A6B", cursor: "pointer", textDecoration: "none", textAlign: "center" }, children: "GPS" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
          setStation(s);
          setView("pay");
        }, style: { flex: 2, background: `linear-gradient(135deg,${company.color},#C47D2A)`, border: "none", borderRadius: "10px", padding: "9px", fontSize: "12px", fontWeight: "700", color: "#fff", cursor: "pointer" }, children: "Pagar combustible" })
      ] })
    ] }, i)) })
  ] });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "0 0 24px" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg,#92400E,#F59E0B)", padding: "16px 16px 12px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "18px", fontWeight: "800", color: "#fff", marginBottom: "4px" }, children: "Gasolineras" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.8)" }, children: "Companias en Guinea Ecuatorial - Precios actualizados" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "14px 16px 0" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#FEF3C7", borderRadius: "12px", padding: "12px 14px", marginBottom: "14px", border: "1px solid #FDE68A" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", fontWeight: "700", color: "#92400E", marginBottom: "6px" }, children: "Precios de referencia (XAF/L)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "8px" }, children: FUELS.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, textAlign: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "9px", color: f.color, fontWeight: "700" }, children: f.label.split(" ")[0] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "16px", fontWeight: "900", color: f.color }, children: f.id === "g95" ? 650 : f.id === "diesel" ? 580 : 450 })
        ] }, f.id)) })
      ] }),
      COMPANIAS_GAS.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          onClick: () => {
            setCompany(c);
            setCity("Malabo");
            setView("stations");
          },
          style: { background: "#fff", borderRadius: "14px", padding: "14px", marginBottom: "10px", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #F0F2F5", display: "flex", alignItems: "center", gap: "14px" },
          onMouseEnter: (e) => {
            e.currentTarget.style.background = "#F9FAFB";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.background = "#fff";
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "48px", height: "48px", borderRadius: "12px", background: c.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "800", color: c.color, flexShrink: 0 }, children: c.nombre.slice(0, 3).toUpperCase() }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "15px", fontWeight: "700", color: "#111827" }, children: c.nombre }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#9CA3AF" }, children: [
                c.estaciones.length,
                " estaciones - Malabo, Bata y mas"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "#9CA3AF", strokeWidth: "2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "9 18 15 12 9 6" }) })
          ]
        },
        c.id
      ))
    ] })
  ] });
};
export {
  GasolinerasModule,
  RestaurantesModule,
  VuelosModule
};
