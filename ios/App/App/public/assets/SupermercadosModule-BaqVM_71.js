import { R as React, j as jsxRuntimeExports } from "./react-core-B1rSPtcn.js";
const CITIES = [
  { id: "c1", name: "Malabo", provincia: "Bioko Norte", estado: true },
  { id: "c2", name: "Bata", provincia: "Litoral", estado: true },
  { id: "c3", name: "Mongomo", provincia: "Wele-Nzas", estado: true },
  { id: "c4", name: "Añisoc", provincia: "Wele-Nzas", estado: true },
  { id: "c5", name: "Evinayong", provincia: "Centro Sur", estado: true }
];
const SUPERMARKETS = [
  {
    id: "sm1",
    nombre: "Martínez Hermanos",
    ciudad_id: "c1",
    logo: "MH",
    color: "#C0392B",
    color2: "#E74C3C",
    descripcion: "Supermercado familiar con amplia variedad de productos nacionales e importados.",
    direccion: "Av. de la Independencia, Malabo",
    telefono: "+240 222 20 01 01",
    horario: "L-S 8:00-21:00 / D 9:00-15:00",
    cobertura: "Malabo Centro",
    delivery: true,
    recogida: true,
    minOrder: 5e3,
    deliveryFee: 500,
    estado: true
  },
  {
    id: "sm2",
    nombre: "EGTC Malabo",
    ciudad_id: "c1",
    logo: "EG",
    color: "#1B3A6B",
    color2: "#2A5298",
    descripcion: "Cadena nacional con productos de calidad y precios competitivos.",
    direccion: "Barrio Caracolas, Malabo",
    telefono: "+240 222 20 01 02",
    horario: "L-D 7:30-22:00",
    cobertura: "Malabo",
    delivery: true,
    recogida: true,
    minOrder: 8e3,
    deliveryFee: 0,
    estado: true
  },
  {
    id: "sm3",
    nombre: "Guinaco",
    ciudad_id: "c1",
    logo: "GN",
    color: "#065F46",
    color2: "#00c8a0",
    descripcion: "Productos locales y de importación. Especialidad en frescos.",
    direccion: "Ela Nguema, Malabo",
    telefono: "+240 222 20 01 03",
    horario: "L-S 8:00-20:00",
    cobertura: "Ela Nguema  -  Malabo II",
    delivery: true,
    recogida: true,
    minOrder: 4e3,
    deliveryFee: 500,
    estado: true
  },
  {
    id: "sm4",
    nombre: "Pegasos Express",
    ciudad_id: "c1",
    logo: "PE",
    color: "#92400E",
    color2: "#F59E0B",
    descripcion: "Tienda express con los productos esenciales del día a día.",
    direccion: "Malabo II, Malabo",
    telefono: "+240 222 20 01 04",
    horario: "L-D 7:00-23:00",
    cobertura: "Malabo II  -  Aeropuerto",
    delivery: false,
    recogida: true,
    minOrder: 0,
    deliveryFee: 0,
    estado: true
  },
  {
    id: "sm5",
    nombre: "Caba Market",
    ciudad_id: "c1",
    logo: "CM",
    color: "#4C1D95",
    color2: "#6B5BD6",
    descripcion: "Supermercado moderno con sección de electrónica y hogar.",
    direccion: "Puerto, Malabo",
    telefono: "+240 222 20 01 05",
    horario: "L-S 9:00-21:00",
    cobertura: "Puerto  -  Centro",
    delivery: true,
    recogida: true,
    minOrder: 6e3,
    deliveryFee: 300,
    estado: true
  },
  {
    id: "sm6",
    nombre: "Getco",
    ciudad_id: "c2",
    logo: "GT",
    color: "#0A4A8A",
    color2: "#00b4e6",
    descripcion: "Principal supermercado de Bata con amplio surtido.",
    direccion: "Centro de Bata",
    telefono: "+240 222 20 02 01",
    horario: "L-D 7:30-22:00",
    cobertura: "Bata Centro",
    delivery: true,
    recogida: true,
    minOrder: 6e3,
    deliveryFee: 500,
    estado: true
  },
  {
    id: "sm7",
    nombre: "Comercial Santy",
    ciudad_id: "c2",
    logo: "CS",
    color: "#831843",
    color2: "#EC4899",
    descripcion: "Tienda familiar con productos frescos y de importación.",
    direccion: "Paseo Marítimo, Bata",
    telefono: "+240 222 20 02 02",
    horario: "L-S 8:00-21:00",
    cobertura: "Litoral  -  Bata",
    delivery: true,
    recogida: true,
    minOrder: 5e3,
    deliveryFee: 300,
    estado: true
  },
  {
    id: "sm8",
    nombre: "EGTC Bata",
    ciudad_id: "c2",
    logo: "EG",
    color: "#1B3A6B",
    color2: "#2A5298",
    descripcion: "Sucursal EGTC en Bata con todos los productos de la cadena.",
    direccion: "Nkolombong, Bata",
    telefono: "+240 222 20 02 03",
    horario: "L-D 8:00-21:00",
    cobertura: "Bata",
    delivery: true,
    recogida: true,
    minOrder: 7e3,
    deliveryFee: 500,
    estado: true
  },
  {
    id: "sm9",
    nombre: "EGTC Mongomo",
    ciudad_id: "c3",
    logo: "EG",
    color: "#1B3A6B",
    color2: "#2A5298",
    descripcion: "Sucursal EGTC en Mongomo.",
    direccion: "Centro Mongomo",
    telefono: "+240 222 20 03 01",
    horario: "L-S 8:00-20:00",
    cobertura: "Mongomo",
    delivery: false,
    recogida: true,
    minOrder: 0,
    deliveryFee: 0,
    estado: true
  },
  {
    id: "sm10",
    nombre: "EGTC Añisoc",
    ciudad_id: "c4",
    logo: "EG",
    color: "#1B3A6B",
    color2: "#2A5298",
    descripcion: "Sucursal EGTC en Añisoc.",
    direccion: "Centro Añisoc",
    telefono: "+240 222 20 04 01",
    horario: "L-S 8:00-20:00",
    cobertura: "Añisoc",
    delivery: false,
    recogida: true,
    minOrder: 0,
    deliveryFee: 0,
    estado: true
  },
  {
    id: "sm11",
    nombre: "Supermercado Evinayong Plaza",
    ciudad_id: "c5",
    logo: "EP",
    color: "#065F46",
    color2: "#00c8a0",
    descripcion: "Supermercado principal de Evinayong con productos variados.",
    direccion: "Plaza Central, Evinayong",
    telefono: "+240 222 20 05 01",
    horario: "L-S 8:00-20:00",
    cobertura: "Evinayong",
    delivery: false,
    recogida: true,
    minOrder: 0,
    deliveryFee: 0,
    estado: true
  }
];
const CATEGORIES = [
  { id: "cat01", nombre: "Agua", icono: "💧", color: "#00b4e6" },
  { id: "cat02", nombre: "Refrescos", icono: "🥤", color: "#E74C3C" },
  { id: "cat03", nombre: "Zumos", icono: "🍊", color: "#F59E0B" },
  { id: "cat04", nombre: "Leche y Lácteos", icono: "🥛", color: "#6B5BD6" },
  { id: "cat05", nombre: "Arroz y Pasta", icono: "🌾", color: "#92400E" },
  { id: "cat06", nombre: "Conservas", icono: "🥫", color: "#C0392B" },
  { id: "cat07", nombre: "Aceites y Condimentos", icono: "🫙", color: "#D97706" },
  { id: "cat08", nombre: "Snacks", icono: "🍿", color: "#EC4899" },
  { id: "cat09", nombre: "Galletas", icono: "🍪", color: "#92400E" },
  { id: "cat10", nombre: "Chocolates", icono: "🍫", color: "#78350F" },
  { id: "cat11", nombre: "Limpieza", icono: "🧹", color: "#0A4A8A" },
  { id: "cat12", nombre: "Higiene Personal", icono: "🧴", color: "#065F46" },
  { id: "cat13", nombre: "Congelados", icono: "🧊", color: "#00b4e6" },
  { id: "cat14", nombre: "Frutas y Verduras", icono: "🥦", color: "#16A34A" },
  { id: "cat15", nombre: "Carnes", icono: "🥩", color: "#DC2626" },
  { id: "cat16", nombre: "Panadería", icono: "🍞", color: "#D97706" },
  { id: "cat17", nombre: "Bebidas Energéticas", icono: "⚡", color: "#F59E0B" },
  { id: "cat18", nombre: "Cervezas", icono: "🍺", color: "#92400E" },
  { id: "cat19", nombre: "Licores", icono: "🥃", color: "#4C1D95" }
];
const PRODUCTS = [
  // Agua
  { id: "p001", sm_ids: ["sm1", "sm2", "sm3", "sm4", "sm5", "sm6", "sm7", "sm8"], cat_id: "cat01", nombre: "Agua Mineral 1.5L", marca: "Aquarel", desc: "Agua mineral natural sin gas", precio: 500, unidad: "botella", img: "💧", stock: 200, destacado: true },
  { id: "p002", sm_ids: ["sm1", "sm2", "sm6"], cat_id: "cat01", nombre: "Agua con Gas 1L", marca: "Perrier", desc: "Agua mineral con gas natural", precio: 900, unidad: "botella", img: "💧", stock: 80, destacado: false },
  { id: "p003", sm_ids: ["sm1", "sm2", "sm3", "sm6", "sm7"], cat_id: "cat01", nombre: "Agua 5L Garrafa", marca: "Aquarel", desc: "Garrafa de agua mineral 5 litros", precio: 1800, unidad: "garrafa", img: "🪣", stock: 60, destacado: false },
  // Refrescos
  { id: "p004", sm_ids: ["sm1", "sm2", "sm3", "sm4", "sm5", "sm6", "sm7", "sm8"], cat_id: "cat02", nombre: "Coca-Cola 1.5L", marca: "Coca-Cola", desc: "Refresco de cola clásico", precio: 1200, unidad: "botella", img: "🥤", stock: 150, destacado: true },
  { id: "p005", sm_ids: ["sm1", "sm2", "sm6", "sm7"], cat_id: "cat02", nombre: "Fanta Naranja 1.5L", marca: "Fanta", desc: "Refresco de naranja", precio: 1100, unidad: "botella", img: "🍊", stock: 120, destacado: false },
  { id: "p006", sm_ids: ["sm1", "sm2", "sm3", "sm6"], cat_id: "cat02", nombre: "Sprite 1.5L", marca: "Sprite", desc: "Refresco de lima-limón", precio: 1100, unidad: "botella", img: "🥤", stock: 100, destacado: false },
  { id: "p007", sm_ids: ["sm1", "sm2", "sm5", "sm6", "sm7"], cat_id: "cat02", nombre: "Malabo Beer 33cl", marca: "Malabo Beer", desc: "Cerveza local de Guinea Ecuatorial", precio: 800, unidad: "lata", img: "🍺", stock: 200, destacado: true },
  // Zumos
  { id: "p008", sm_ids: ["sm1", "sm2", "sm3", "sm6", "sm7"], cat_id: "cat03", nombre: "Zumo Naranja 1L", marca: "Don Simón", desc: "Zumo de naranja sin pulpa", precio: 1500, unidad: "brick", img: "🍊", stock: 90, destacado: false },
  { id: "p009", sm_ids: ["sm1", "sm2", "sm6"], cat_id: "cat03", nombre: "Zumo Tropical 1L", marca: "Tropicana", desc: "Mezcla de frutas tropicales", precio: 1800, unidad: "brick", img: "🥭", stock: 60, destacado: false },
  // Lácteos
  { id: "p010", sm_ids: ["sm1", "sm2", "sm3", "sm4", "sm5", "sm6", "sm7", "sm8"], cat_id: "cat04", nombre: "Leche Entera 1L", marca: "Puleva", desc: "Leche entera UHT", precio: 1100, unidad: "brick", img: "🥛", stock: 180, destacado: true },
  { id: "p011", sm_ids: ["sm1", "sm2", "sm6", "sm7"], cat_id: "cat04", nombre: "Yogur Natural x4", marca: "Danone", desc: "Yogur natural sin azúcar, pack 4", precio: 2200, unidad: "pack", img: "🥛", stock: 70, destacado: false },
  { id: "p012", sm_ids: ["sm1", "sm2", "sm5", "sm6"], cat_id: "cat04", nombre: "Queso Gouda 200g", marca: "Edam", desc: "Queso Gouda en lonchas", precio: 3500, unidad: "pieza", img: "🧀", stock: 40, destacado: false },
  { id: "p013", sm_ids: ["sm1", "sm2", "sm3", "sm6", "sm7"], cat_id: "cat04", nombre: "Mantequilla 250g", marca: "Président", desc: "Mantequilla sin sal", precio: 2200, unidad: "paquete", img: "🧈", stock: 55, destacado: false },
  // Arroz y Pasta
  { id: "p014", sm_ids: ["sm1", "sm2", "sm3", "sm4", "sm5", "sm6", "sm7", "sm8", "sm9", "sm10", "sm11"], cat_id: "cat05", nombre: "Arroz Largo 5kg", marca: "Brillante", desc: "Arroz largo de grano fino", precio: 4500, unidad: "saco", img: "🌾", stock: 300, destacado: true },
  { id: "p015", sm_ids: ["sm1", "sm2", "sm3", "sm6", "sm7"], cat_id: "cat05", nombre: "Espagueti 500g", marca: "Barilla", desc: "Pasta espagueti de sémola", precio: 800, unidad: "paquete", img: "🍝", stock: 150, destacado: false },
  { id: "p016", sm_ids: ["sm1", "sm2", "sm6"], cat_id: "cat05", nombre: "Macarrones 500g", marca: "Gallo", desc: "Macarrones de sémola de trigo", precio: 750, unidad: "paquete", img: "🍝", stock: 120, destacado: false },
  // Conservas
  { id: "p017", sm_ids: ["sm1", "sm2", "sm3", "sm4", "sm6", "sm7"], cat_id: "cat06", nombre: "Atún en Aceite 160g", marca: "Calvo", desc: "Atún claro en aceite de oliva", precio: 1500, unidad: "lata", img: "🐟", stock: 200, destacado: true },
  { id: "p018", sm_ids: ["sm1", "sm2", "sm6", "sm7"], cat_id: "cat06", nombre: "Sardinas en Tomate", marca: "Cabo de Peñas", desc: "Sardinas en salsa de tomate", precio: 900, unidad: "lata", img: "🐟", stock: 180, destacado: false },
  { id: "p019", sm_ids: ["sm1", "sm2", "sm3", "sm6"], cat_id: "cat06", nombre: "Tomate Frito 400g", marca: "Orlando", desc: "Tomate frito natural", precio: 1200, unidad: "lata", img: "🍅", stock: 160, destacado: false },
  // Aceites y Condimentos
  { id: "p020", sm_ids: ["sm1", "sm2", "sm3", "sm4", "sm5", "sm6", "sm7", "sm8", "sm9", "sm10", "sm11"], cat_id: "cat07", nombre: "Aceite de Palma 1L", marca: "Local GQ", desc: "Aceite de palma rojo natural", precio: 1800, unidad: "botella", img: "🫙", stock: 250, destacado: true },
  { id: "p021", sm_ids: ["sm1", "sm2", "sm6", "sm7"], cat_id: "cat07", nombre: "Aceite Girasol 1L", marca: "Koipesol", desc: "Aceite de girasol refinado", precio: 2200, unidad: "botella", img: "🫙", stock: 100, destacado: false },
  { id: "p022", sm_ids: ["sm1", "sm2", "sm3", "sm6"], cat_id: "cat07", nombre: "Sal Yodada 500g", marca: "Salinera GQ", desc: "Sal yodada para consumo humano", precio: 300, unidad: "bolsa", img: "🧂", stock: 300, destacado: false },
  { id: "p023", sm_ids: ["sm1", "sm2", "sm6", "sm7"], cat_id: "cat07", nombre: "Azúcar Blanco 1kg", marca: "Azucarera", desc: "Azúcar blanco refinado", precio: 700, unidad: "bolsa", img: "🍬", stock: 280, destacado: false },
  // Snacks
  { id: "p024", sm_ids: ["sm1", "sm2", "sm3", "sm4", "sm5", "sm6", "sm7"], cat_id: "cat08", nombre: "Patatas Fritas 150g", marca: "Lay's", desc: "Patatas fritas sabor original", precio: 1200, unidad: "bolsa", img: "🍿", stock: 120, destacado: false },
  { id: "p025", sm_ids: ["sm1", "sm2", "sm6"], cat_id: "cat08", nombre: "Palomitas Microondas", marca: "Act II", desc: "Palomitas para microondas, sabor mantequilla", precio: 1500, unidad: "pack", img: "🍿", stock: 80, destacado: false },
  // Galletas
  { id: "p026", sm_ids: ["sm1", "sm2", "sm3", "sm4", "sm6", "sm7"], cat_id: "cat09", nombre: "Galletas María 200g", marca: "Fontaneda", desc: "Galletas María clásicas", precio: 800, unidad: "paquete", img: "🍪", stock: 200, destacado: false },
  { id: "p027", sm_ids: ["sm1", "sm2", "sm6"], cat_id: "cat09", nombre: "Oreo 154g", marca: "Oreo", desc: "Galletas de chocolate con crema", precio: 1400, unidad: "paquete", img: "🍪", stock: 90, destacado: false },
  // Chocolates
  { id: "p028", sm_ids: ["sm1", "sm2", "sm5", "sm6", "sm7"], cat_id: "cat10", nombre: "Chocolate con Leche", marca: "Milka", desc: "Tableta de chocolate con leche 100g", precio: 2200, unidad: "tableta", img: "🍫", stock: 70, destacado: false },
  // Limpieza
  { id: "p029", sm_ids: ["sm1", "sm2", "sm3", "sm4", "sm5", "sm6", "sm7", "sm8"], cat_id: "cat11", nombre: "Detergente Polvo 1kg", marca: "Ariel", desc: "Detergente en polvo para ropa", precio: 2200, unidad: "caja", img: "🧺", stock: 150, destacado: true },
  { id: "p030", sm_ids: ["sm1", "sm2", "sm3", "sm6", "sm7"], cat_id: "cat11", nombre: "Lejía 1L", marca: "Estrella", desc: "Lejía desinfectante multiusos", precio: 800, unidad: "botella", img: "🧴", stock: 180, destacado: false },
  { id: "p031", sm_ids: ["sm1", "sm2", "sm6", "sm7"], cat_id: "cat11", nombre: "Lavavajillas 500ml", marca: "Fairy", desc: "Lavavajillas concentrado", precio: 1200, unidad: "botella", img: "🍽️", stock: 130, destacado: false },
  { id: "p032", sm_ids: ["sm1", "sm2", "sm3", "sm4", "sm5", "sm6", "sm7", "sm8"], cat_id: "cat11", nombre: "Papel Higiénico x4", marca: "Scottex", desc: "Papel higiénico suave, 4 rollos", precio: 1800, unidad: "pack", img: "🧻", stock: 200, destacado: false },
  // Higiene
  { id: "p033", sm_ids: ["sm1", "sm2", "sm3", "sm4", "sm6", "sm7"], cat_id: "cat12", nombre: "Jabón de Baño x3", marca: "Palmolive", desc: "Jabón hidratante, pack 3 unidades", precio: 1500, unidad: "pack", img: "🧼", stock: 160, destacado: false },
  { id: "p034", sm_ids: ["sm1", "sm2", "sm6", "sm7"], cat_id: "cat12", nombre: "Champú 400ml", marca: "H&S", desc: "Champú anticaspa", precio: 2800, unidad: "botella", img: "🧴", stock: 90, destacado: false },
  { id: "p035", sm_ids: ["sm1", "sm2", "sm3", "sm6"], cat_id: "cat12", nombre: "Pasta Dental 75ml", marca: "Colgate", desc: "Pasta dental con flúor", precio: 1200, unidad: "tubo", img: "🦷", stock: 140, destacado: false },
  { id: "p036", sm_ids: ["sm1", "sm2", "sm5", "sm6", "sm7"], cat_id: "cat12", nombre: "Pañales Talla 3 x30", marca: "Dodot", desc: "Pañales bebé talla 3 (4-9kg)", precio: 8500, unidad: "paquete", img: "👶", stock: 50, destacado: false },
  // Congelados
  { id: "p037", sm_ids: ["sm1", "sm2", "sm5", "sm6", "sm7"], cat_id: "cat13", nombre: "Pollo Congelado 1kg", marca: "Granja Local", desc: "Pollo troceado congelado", precio: 4500, unidad: "kg", img: "🍗", stock: 80, destacado: true },
  { id: "p038", sm_ids: ["sm1", "sm2", "sm6"], cat_id: "cat13", nombre: "Gambas Congeladas 500g", marca: "Pesca GQ", desc: "Gambas peladas congeladas", precio: 6500, unidad: "bolsa", img: "🦐", stock: 40, destacado: false },
  // Frutas y Verduras
  { id: "p039", sm_ids: ["sm1", "sm2", "sm3", "sm4", "sm5", "sm6", "sm7", "sm8", "sm9", "sm10", "sm11"], cat_id: "cat14", nombre: "Plátano Macho x5", marca: "Local GQ", desc: "Plátano macho para freír", precio: 1500, unidad: "racimo", img: "🍌", stock: 200, destacado: true },
  { id: "p040", sm_ids: ["sm1", "sm2", "sm3", "sm6", "sm7"], cat_id: "cat14", nombre: "Tomate 1kg", marca: "Local GQ", desc: "Tomates frescos locales", precio: 1200, unidad: "kg", img: "🍅", stock: 180, destacado: false },
  { id: "p041", sm_ids: ["sm1", "sm2", "sm3", "sm6", "sm7"], cat_id: "cat14", nombre: "Aguacate x3", marca: "Local GQ", desc: "Aguacates maduros locales", precio: 1800, unidad: "bolsa", img: "🥑", stock: 120, destacado: false },
  { id: "p042", sm_ids: ["sm1", "sm2", "sm6"], cat_id: "cat14", nombre: "Mango x4", marca: "Local GQ", desc: "Mangos dulces de temporada", precio: 2e3, unidad: "bolsa", img: "🥭", stock: 100, destacado: false },
  // Carnes
  { id: "p043", sm_ids: ["sm1", "sm2", "sm3", "sm6", "sm7"], cat_id: "cat15", nombre: "Carne de Res 1kg", marca: "Local GQ", desc: "Carne de res fresca, corte variado", precio: 8e3, unidad: "kg", img: "🥩", stock: 60, destacado: true },
  { id: "p044", sm_ids: ["sm1", "sm2", "sm3", "sm4", "sm6", "sm7"], cat_id: "cat15", nombre: "Pollo Entero ~1.5kg", marca: "Granja Local", desc: "Pollo fresco de granja local", precio: 5500, unidad: "pieza", img: "🍗", stock: 80, destacado: false },
  { id: "p045", sm_ids: ["sm1", "sm2", "sm6", "sm7"], cat_id: "cat15", nombre: "Salchichas x6", marca: "Campofrío", desc: "Salchichas de cerdo", precio: 2800, unidad: "paquete", img: "🌭", stock: 90, destacado: false },
  // Panadería
  { id: "p046", sm_ids: ["sm1", "sm2", "sm3", "sm4", "sm5", "sm6", "sm7", "sm8"], cat_id: "cat16", nombre: "Pan de Molde", marca: "Bimbo", desc: "Pan de molde blanco 500g", precio: 1500, unidad: "bolsa", img: "🍞", stock: 120, destacado: false },
  { id: "p047", sm_ids: ["sm1", "sm2", "sm6"], cat_id: "cat16", nombre: "Croissant x4", marca: "Panrico", desc: "Croissants de mantequilla", precio: 2e3, unidad: "pack", img: "🥐", stock: 60, destacado: false },
  // Bebidas Energéticas
  { id: "p048", sm_ids: ["sm1", "sm2", "sm4", "sm5", "sm6", "sm7"], cat_id: "cat17", nombre: "Red Bull 250ml", marca: "Red Bull", desc: "Bebida energética clásica", precio: 2500, unidad: "lata", img: "⚡", stock: 100, destacado: false },
  // Cervezas
  { id: "p049", sm_ids: ["sm1", "sm2", "sm3", "sm4", "sm5", "sm6", "sm7", "sm8"], cat_id: "cat18", nombre: "Malabo Beer 33cl", marca: "Malabo Beer", desc: "Cerveza local de Guinea Ecuatorial", precio: 800, unidad: "lata", img: "🍺", stock: 300, destacado: true },
  { id: "p050", sm_ids: ["sm1", "sm2", "sm5", "sm6", "sm7"], cat_id: "cat18", nombre: "Heineken 33cl", marca: "Heineken", desc: "Cerveza rubia importada", precio: 1200, unidad: "lata", img: "🍺", stock: 150, destacado: false },
  // Licores
  { id: "p051", sm_ids: ["sm1", "sm2", "sm5", "sm6"], cat_id: "cat19", nombre: "Whisky J&B 70cl", marca: "J&B", desc: "Whisky escocés blended", precio: 18e3, unidad: "botella", img: "🥃", stock: 30, destacado: false },
  { id: "p052", sm_ids: ["sm1", "sm2", "sm6"], cat_id: "cat19", nombre: "Ron Barceló 70cl", marca: "Barceló", desc: "Ron añejo dominicano", precio: 15e3, unidad: "botella", img: "🥃", stock: 25, destacado: false }
];
const SmLogo = ({ sm, size = 44 }) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: size, height: size, borderRadius: size * 0.25, background: `linear-gradient(135deg,${sm.color},${sm.color2})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.32, fontWeight: "900", flexShrink: 0, letterSpacing: "-0.5px" }, children: sm.logo });
const SupermercadosModal = ({ onClose, userBalance, onDebit }) => {
  const [screen, setScreen] = React.useState("home");
  const [cityId, setCityId] = React.useState(null);
  const [smId, setSmId] = React.useState(null);
  const [catId, setCatId] = React.useState(null);
  const [prodId, setProdId] = React.useState(null);
  const [cart, setCart] = React.useState([]);
  const [orders, setOrders] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [globalSearch, setGlobalSearch] = React.useState("");
  const [metodoEntrega, setMetodoEntrega] = React.useState("delivery");
  const [metodoPago, setMetodoPago] = React.useState("");
  const [direccion, setDireccion] = React.useState({ nombre: "", telefono: "", direccion: "", barrio: "", notas: "" });
  const [supportMsg, setSupportMsg] = React.useState("");
  const [supportType, setSupportType] = React.useState("");
  const [supportOk, setSupportOk] = React.useState(false);
  const sm = SUPERMARKETS.find((s) => s.id === smId) || null;
  const cat = CATEGORIES.find((c) => c.id === catId) || null;
  const prod = PRODUCTS.find((p) => p.id === prodId) || null;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.precio * i.qty, 0);
  const deliveryFee = metodoEntrega === "delivery" ? sm?.deliveryFee || 0 : 0;
  const grandTotal = cartTotal + deliveryFee;
  const smProds = smId ? PRODUCTS.filter((p) => p.sm_ids.includes(smId)) : [];
  const catProds = smId && catId ? smProds.filter((p) => p.cat_id === catId) : [];
  const smCats = smId ? CATEGORIES.filter((c) => smProds.some((p) => p.cat_id === c.id)) : [];
  const addToCart = (p) => setCart((prev) => {
    const ex = prev.find((i) => i.id === p.id);
    return ex ? prev.map((i) => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { id: p.id, nombre: p.nombre, img: p.img, precio: p.precio, qty: 1, marca: p.marca }];
  });
  const removeFromCart = (id) => setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter((i) => i.qty > 0));
  const setDir = (k, v) => setDireccion((p) => ({ ...p, [k]: v }));
  const confirmOrder = () => {
    if (!metodoPago) return;
    const ref = "EGC-" + Date.now().toString().slice(-8);
    const newOrder = {
      id: Date.now().toString(),
      sm_id: smId || "",
      sm_nombre: sm?.nombre || "",
      items: [...cart],
      total: grandTotal,
      metodo_entrega: metodoEntrega,
      direccion: metodoEntrega === "delivery" ? `${direccion.direccion}, ${direccion.barrio}` : "Recogida en tienda",
      metodo_pago: metodoPago,
      estado: "confirmado",
      fecha: (/* @__PURE__ */ new Date()).toLocaleDateString("es-ES"),
      ref
    };
    onDebit(grandTotal);
    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    setScreen("orders");
  };
  const goBack = () => {
    if (screen === "cities") setScreen("home");
    else if (screen === "stores") setScreen("cities");
    else if (screen === "categories") setScreen("stores");
    else if (screen === "products") setScreen("categories");
    else if (screen === "detail") setScreen("products");
    else if (screen === "cart") setScreen(catId ? "products" : "categories");
    else if (screen === "checkout") setScreen("cart");
    else if (screen === "orders" || screen === "history" || screen === "support") setScreen("home");
    else onClose();
  };
  const headerTitle = {
    home: "Supermercados",
    cities: "Ciudades",
    stores: cityId ? CITIES.find((c) => c.id === cityId)?.name || "Tiendas" : "Tiendas",
    categories: sm?.nombre || "Categorías",
    products: cat?.nombre || "Productos",
    detail: prod?.nombre || "Producto",
    cart: "Mi Carrito",
    checkout: "Finalizar Pedido",
    orders: "Mis Pedidos",
    history: "Historial",
    support: "Soporte"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 3e3, display: "flex", alignItems: "flex-end", justifyContent: "center" }, onClick: (e) => {
    if (e.target === e.currentTarget) onClose();
  }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(247,248,250,0.55)", backdropFilter: "blur(28px) saturate(180%)", WebkitBackdropFilter: "blur(28px) saturate(180%)", borderRadius: "20px 20px 0 0", border: "1.5px solid rgba(255,255,255,0.6)", borderBottom: "none", width: "100%", maxWidth: "420px", maxHeight: "94vh", display: "flex", flexDirection: "column", overflow: "hidden" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", justifyContent: "center", paddingTop: "10px", paddingBottom: "4px", flexShrink: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "36px", height: "4px", borderRadius: "2px", background: "#D1D5DB" } }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "4px 16px 10px", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, background: "#fff", borderBottom: "1px solid #F0F2F5" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: goBack, style: { background: "#EAECEF", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B7280", fontSize: "16px" }, children: "←" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "16px", fontWeight: "700", color: "#111827" }, children: headerTitle[screen] }),
        screen === "home" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#9CA3AF" }, children: [
          SUPERMARKETS.length,
          " tiendas  -  ",
          CITIES.length,
          " ciudades  -  GQ"
        ] }),
        screen === "stores" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#9CA3AF" }, children: [
          SUPERMARKETS.filter((s) => s.ciudad_id === cityId).length,
          " supermercados"
        ] }),
        screen === "categories" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#9CA3AF" }, children: [
          smCats.length,
          " categorías  -  ",
          smProds.length,
          " productos"
        ] }),
        screen === "products" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#9CA3AF" }, children: [
          catProds.length,
          " productos"
        ] })
      ] }),
      cartCount > 0 && screen !== "cart" && screen !== "checkout" && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setScreen("cart"), style: { background: "#00c8a0", border: "none", borderRadius: "20px", padding: "6px 12px", color: "#fff", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }, children: [
        "🛒 ",
        cartCount
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, style: { background: "#EAECEF", border: "none", borderRadius: "50%", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B7280", fontSize: "14px" }, children: "✕" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, overflowY: "auto", padding: "12px 16px 24px" }, children: [
      screen === "home" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg,#065F46,#00c8a0)", borderRadius: "16px", padding: "18px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "14px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "40px" }, children: "🛒" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "16px", fontWeight: "800", color: "#fff" }, children: "Compra Online" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.8)" }, children: "Supermercados nacionales  -  Entrega a domicilio" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "12px", padding: "0 14px", height: "46px", display: "flex", alignItems: "center", gap: "10px", border: "1px solid #F0F2F5", marginBottom: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "#9CA3AF", strokeWidth: "2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "11", cy: "11", r: "8" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 21l-4.35-4.35" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: globalSearch, onChange: (e) => setGlobalSearch(e.target.value), placeholder: "Buscar producto en todos los supermercados...", style: { flex: 1, background: "none", border: "none", outline: "none", fontSize: "13px", color: "#111827", fontFamily: "inherit" } }),
          globalSearch && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setGlobalSearch(""), style: { background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: "14px" }, children: "✕" })
        ] }),
        globalSearch.length >= 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "16px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", fontWeight: "700", color: "#6B7280", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }, children: [
            "Resultados  -  ",
            PRODUCTS.filter((p) => p.nombre.toLowerCase().includes(globalSearch.toLowerCase()) || p.marca.toLowerCase().includes(globalSearch.toLowerCase())).length,
            " productos"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "7px" }, children: PRODUCTS.filter((p) => p.nombre.toLowerCase().includes(globalSearch.toLowerCase()) || p.marca.toLowerCase().includes(globalSearch.toLowerCase())).slice(0, 12).map((p) => {
            const inCart = cart.find((i) => i.id === p.id);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "11px", padding: "10px 8px", border: `1.5px solid ${inCart ? "#00c8a0" : "#F0F2F5"}`, textAlign: "center" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "24px", marginBottom: "4px" }, children: p.img }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "10px", fontWeight: "700", color: "#111827", marginBottom: "2px", lineHeight: "1.2" }, children: p.nombre }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "8px", color: "#9CA3AF", marginBottom: "4px" }, children: p.marca }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", fontWeight: "800", color: "#00c8a0", marginBottom: "6px" }, children: [
                p.precio.toLocaleString(),
                " XAF"
              ] }),
              !inCart ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => addToCart(p), style: { width: "100%", background: "linear-gradient(135deg,#00c8a0,#00b4e6)", border: "none", borderRadius: "7px", padding: "5px 0", color: "#fff", fontSize: "10px", fontWeight: "700", cursor: "pointer" }, children: "+ Añadir" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F0FDF9", borderRadius: "7px", padding: "3px 6px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => removeFromCart(p.id), style: { background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "700", color: "#00c8a0", padding: "0 2px" }, children: "−" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "12px", fontWeight: "800", color: "#065F46" }, children: inCart.qty }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => addToCart(p), style: { background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "700", color: "#00c8a0", padding: "0 2px" }, children: "+" })
              ] })
            ] }, p.id);
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }, children: [
          { icon: "🏙️", label: "Ver Ciudades", sub: `${CITIES.length} ciudades`, action: () => setScreen("cities"), color: "#00c8a0" },
          { icon: "🛒", label: "Supermercados", sub: `${SUPERMARKETS.length} tiendas`, action: () => {
            setCityId(null);
            setScreen("stores");
          }, color: "#00b4e6" },
          { icon: "🛍️", label: "Mi Carrito", sub: cartCount > 0 ? `${cartCount} productos` : "Vacío", action: () => setScreen("cart"), color: "#065F46" },
          { icon: "📦", label: "Mis Pedidos", sub: `${orders.length} pedidos`, action: () => setScreen("orders"), color: "#6B5BD6" },
          { icon: "📋", label: "Historial", sub: "Compras anteriores", action: () => setScreen("history"), color: "#F59E0B" },
          { icon: "🎧", label: "Soporte", sub: "Ayuda y reportes", action: () => setScreen("support"), color: "#C0392B" }
        ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: item.action, style: { background: "#fff", border: "1px solid #F0F2F5", borderRadius: "14px", padding: "14px 12px", cursor: "pointer", outline: "none", textAlign: "left", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "40px", height: "40px", borderRadius: "10px", background: item.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", marginBottom: "8px" }, children: item.icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "700", color: "#111827", marginBottom: "2px" }, children: item.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "10px", color: "#9CA3AF" }, children: item.sub })
        ] }, item.label)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "10px" }, children: "⭐ Productos destacados" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "7px" }, children: PRODUCTS.filter((p) => p.destacado).slice(0, 9).map((p) => {
          const inCart = cart.find((i) => i.id === p.id);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "11px", padding: "10px 8px", border: `1.5px solid ${inCart ? "#00c8a0" : "#F0F2F5"}`, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "24px", marginBottom: "4px" }, children: p.img }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "10px", fontWeight: "700", color: "#111827", marginBottom: "2px", lineHeight: "1.2" }, children: p.nombre }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "8px", color: "#9CA3AF", marginBottom: "4px" }, children: p.marca }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", fontWeight: "800", color: "#00c8a0", marginBottom: "6px" }, children: [
              p.precio.toLocaleString(),
              " XAF"
            ] }),
            !inCart ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => addToCart(p), style: { width: "100%", background: "linear-gradient(135deg,#00c8a0,#00b4e6)", border: "none", borderRadius: "7px", padding: "5px 0", color: "#fff", fontSize: "10px", fontWeight: "700", cursor: "pointer" }, children: "+ Añadir" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F0FDF9", borderRadius: "7px", padding: "3px 6px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => removeFromCart(p.id), style: { background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "700", color: "#00c8a0", padding: "0 2px" }, children: "−" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "12px", fontWeight: "800", color: "#065F46" }, children: inCart.qty }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => addToCart(p), style: { background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "700", color: "#00c8a0", padding: "0 2px" }, children: "+" })
            ] })
          ] }, p.id);
        }) })
      ] }),
      screen === "cities" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }, children: CITIES.map((c) => {
        const count = SUPERMARKETS.filter((s) => s.ciudad_id === c.id).length;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
          setCityId(c.id);
          setScreen("stores");
        }, style: { background: "#fff", border: "1px solid #F0F2F5", borderRadius: "14px", padding: "16px 12px", cursor: "pointer", outline: "none", textAlign: "left", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "32px", marginBottom: "8px" }, children: "🏙️" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "14px", fontWeight: "700", color: "#111827", marginBottom: "3px" }, children: c.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "10px", color: "#9CA3AF", marginBottom: "6px" }, children: c.provincia }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { background: "#F0FDF9", color: "#065F46", borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: "700" }, children: [
            count,
            " tienda",
            count !== 1 ? "s" : ""
          ] })
        ] }, c.id);
      }) }),
      screen === "stores" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "6px", marginBottom: "12px", overflowX: "auto", scrollbarWidth: "none" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setCityId(null), style: { background: cityId === null ? "#00c8a0" : "#fff", border: `1px solid ${cityId === null ? "#00c8a0" : "#E5E7EB"}`, borderRadius: "20px", padding: "5px 14px", fontSize: "11px", fontWeight: "700", color: cityId === null ? "#fff" : "#6B7280", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }, children: "Todas" }),
          CITIES.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setCityId(c.id), style: { background: cityId === c.id ? "#00c8a0" : "#fff", border: `1px solid ${cityId === c.id ? "#00c8a0" : "#E5E7EB"}`, borderRadius: "20px", padding: "5px 14px", fontSize: "11px", fontWeight: "700", color: cityId === c.id ? "#fff" : "#6B7280", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }, children: c.name }, c.id))
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }, children: SUPERMARKETS.filter((s) => !cityId || s.ciudad_id === cityId).map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
          setSmId(s.id);
          setCatId(null);
          setScreen("categories");
        }, style: { background: "#fff", border: "1px solid #F0F2F5", borderRadius: "14px", padding: "13px 11px", cursor: "pointer", outline: "none", textAlign: "left", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SmLogo, { sm: s, size: 44 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "700", color: "#111827", marginTop: "8px", marginBottom: "3px", lineHeight: "1.3" }, children: s.nombre }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "10px", color: "#9CA3AF", marginBottom: "6px" }, children: CITIES.find((c) => c.id === s.ciudad_id)?.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "3px" }, children: [
            s.delivery && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { background: "#EFF5FD", color: "#1B3A6B", borderRadius: "5px", padding: "2px 6px", fontSize: "9px", fontWeight: "600", display: "inline-block" }, children: [
              "🚚 ",
              s.deliveryFee === 0 ? "Delivery gratis" : `+${s.deliveryFee} XAF`
            ] }),
            !s.delivery && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: "#F3F4F6", color: "#6B7280", borderRadius: "5px", padding: "2px 6px", fontSize: "9px", fontWeight: "600", display: "inline-block" }, children: "Solo recogida" })
          ] })
        ] }, s.id)) })
      ] }),
      screen === "categories" && sm && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: `linear-gradient(135deg,${sm.color},${sm.color2})`, borderRadius: "14px", padding: "14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "12px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SmLogo, { sm, size: 48 }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "15px", fontWeight: "800", color: "#fff" }, children: sm.nombre }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.8)" }, children: sm.direccion }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "10px", color: "rgba(255,255,255,0.7)", marginTop: "2px" }, children: [
              "🕐 ",
              sm.horario.split("/")[0].trim()
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }, children: smCats.map((c) => {
          const cnt = smProds.filter((p) => p.cat_id === c.id).length;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
            setCatId(c.id);
            setScreen("products");
            setSearch("");
          }, style: { background: "#fff", border: "1px solid #F0F2F5", borderRadius: "12px", padding: "12px 8px", cursor: "pointer", outline: "none", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "26px", marginBottom: "5px" }, children: c.icono }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "10px", fontWeight: "700", color: "#111827", lineHeight: "1.25", marginBottom: "3px" }, children: c.nombre }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: c.color + "18", color: c.color, borderRadius: "5px", padding: "1px 6px", fontSize: "9px", fontWeight: "700" }, children: cnt })
          ] }, c.id);
        }) })
      ] }),
      screen === "products" && sm && cat && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "10px", padding: "0 12px", height: "42px", display: "flex", alignItems: "center", gap: "8px", border: "1px solid #F0F2F5", marginBottom: "10px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "#9CA3AF", strokeWidth: "2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "11", cy: "11", r: "8" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 21l-4.35-4.35" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: `Buscar en ${cat.nombre}...`, style: { flex: 1, background: "none", border: "none", outline: "none", fontSize: "13px", color: "#111827", fontFamily: "inherit" } }),
          search && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSearch(""), style: { background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: "14px" }, children: "✕" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "7px" }, children: catProds.filter((p) => !search || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.marca.toLowerCase().includes(search.toLowerCase())).map((p) => {
          const inCart = cart.find((i) => i.id === p.id);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "11px", padding: "10px 8px", border: `1.5px solid ${inCart ? "#00c8a0" : "#F0F2F5"}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
              setProdId(p.id);
              setScreen("detail");
            }, style: { background: "none", border: "none", cursor: "pointer", padding: 0, width: "100%" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "26px", marginBottom: "4px" }, children: p.img }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "10px", fontWeight: "700", color: "#111827", marginBottom: "2px", lineHeight: "1.2" }, children: p.nombre }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "8px", color: "#9CA3AF", marginBottom: "4px" }, children: [
                p.marca,
                "  -  ",
                p.unidad
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", fontWeight: "800", color: "#00c8a0", marginBottom: "6px" }, children: [
                p.precio.toLocaleString(),
                " XAF"
              ] })
            ] }),
            !inCart ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => addToCart(p), style: { width: "100%", background: "linear-gradient(135deg,#00c8a0,#00b4e6)", border: "none", borderRadius: "7px", padding: "6px 0", color: "#fff", fontSize: "10px", fontWeight: "700", cursor: "pointer" }, children: "+ Añadir" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F0FDF9", borderRadius: "7px", padding: "3px 6px", width: "100%" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => removeFromCart(p.id), style: { background: "none", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: "700", color: "#00c8a0", padding: "0 2px", lineHeight: 1 }, children: "−" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "12px", fontWeight: "800", color: "#065F46" }, children: inCart.qty }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => addToCart(p), style: { background: "none", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: "700", color: "#00c8a0", padding: "0 2px", lineHeight: 1 }, children: "+" })
            ] })
          ] }, p.id);
        }) })
      ] }),
      screen === "detail" && prod && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "16px", padding: "24px", marginBottom: "14px", textAlign: "center", border: "1px solid #F0F2F5", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "72px", marginBottom: "12px" }, children: prod.img }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "18px", fontWeight: "800", color: "#111827", marginBottom: "4px" }, children: prod.nombre }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "12px", color: "#9CA3AF", marginBottom: "8px" }, children: [
            prod.marca,
            "  -  ",
            prod.unidad
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "24px", fontWeight: "900", color: "#00c8a0", marginBottom: "12px" }, children: [
            prod.precio.toLocaleString(),
            " XAF"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "12px" }, children: [
            cat && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { background: cat.color + "18", color: cat.color, borderRadius: "8px", padding: "3px 10px", fontSize: "11px", fontWeight: "700" }, children: [
              cat.icono,
              " ",
              cat.nombre
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: prod.stock > 0 ? "#F0FDF9" : "#FEF2F2", color: prod.stock > 0 ? "#065F46" : "#C0392B", borderRadius: "8px", padding: "3px 10px", fontSize: "11px", fontWeight: "700" }, children: prod.stock > 0 ? `✓ En stock (${prod.stock})` : "Sin stock" }),
            prod.destacado && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: "#FFFBEB", color: "#92400E", borderRadius: "8px", padding: "3px 10px", fontSize: "11px", fontWeight: "700" }, children: "⭐ Destacado" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", color: "#6B7280", lineHeight: "1.5", textAlign: "left", background: "#F9FAFB", borderRadius: "10px", padding: "12px" }, children: prod.desc })
        ] }),
        sm && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "12px", padding: "12px 14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px", border: "1px solid #F0F2F5" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SmLogo, { sm, size: 36 }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "700", color: "#111827" }, children: sm.nombre }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "10px", color: "#9CA3AF" }, children: sm.direccion })
          ] })
        ] }),
        (() => {
          const inCart = cart.find((i) => i.id === prod.id);
          return !inCart ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => addToCart(prod), style: { width: "100%", background: "linear-gradient(135deg,#00c8a0,#00b4e6)", border: "none", borderRadius: "12px", padding: "14px", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer" }, children: "+ Añadir al carrito" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", background: "#F0FDF9", borderRadius: "12px", padding: "12px 16px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => removeFromCart(prod.id), style: { width: "36px", height: "36px", borderRadius: "50%", background: "#fff", border: "1px solid #A7F3D0", cursor: "pointer", fontSize: "18px", fontWeight: "700", color: "#00c8a0" }, children: "−" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { flex: 1, textAlign: "center", fontSize: "18px", fontWeight: "800", color: "#065F46" }, children: [
              inCart.qty,
              " en carrito"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => addToCart(prod), style: { width: "36px", height: "36px", borderRadius: "50%", background: "#00c8a0", border: "none", cursor: "pointer", fontSize: "18px", fontWeight: "700", color: "#fff" }, children: "+" })
          ] });
        })(),
        cartCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setScreen("cart"), style: { width: "100%", background: "#065F46", border: "none", borderRadius: "12px", padding: "13px", color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", marginTop: "8px" }, children: [
          "Ver carrito  -  ",
          cartCount,
          " productos  -  ",
          cartTotal.toLocaleString(),
          " XAF"
        ] })
      ] }),
      screen === "cart" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: cart.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "50px 0" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "56px", marginBottom: "12px" }, children: "🛒" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "16px", fontWeight: "700", color: "#374151", marginBottom: "6px" }, children: "Carrito vacío" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", color: "#9CA3AF", marginBottom: "20px" }, children: "Añade productos para continuar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setScreen("home"), style: { background: "linear-gradient(135deg,#00c8a0,#00b4e6)", border: "none", borderRadius: "12px", padding: "12px 28px", color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }, children: "Explorar productos" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        cart.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "12px", padding: "12px 14px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #F0F2F5" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "28px", flexShrink: 0 }, children: item.img }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "700", color: "#111827" }, children: item.nombre }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "10px", color: "#9CA3AF" }, children: [
              item.marca,
              "  -  ",
              item.precio.toLocaleString(),
              " XAF/ud"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => removeFromCart(item.id), style: { width: "26px", height: "26px", borderRadius: "50%", background: "#F3F4F6", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "700", color: "#374151" }, children: "−" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "13px", fontWeight: "700", color: "#111827", minWidth: "16px", textAlign: "center" }, children: item.qty }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setCart((p) => p.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)), style: { width: "26px", height: "26px", borderRadius: "50%", background: "#00c8a0", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "700", color: "#fff" }, children: "+" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "12px", fontWeight: "800", color: "#00c8a0", minWidth: "64px", textAlign: "right" }, children: [
            (item.precio * item.qty).toLocaleString(),
            " XAF"
          ] })
        ] }, item.id)),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "12px", padding: "14px", marginTop: "8px", border: "1px solid #F0F2F5" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #F3F4F6" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "12px", color: "#6B7280" }, children: [
              "Subtotal (",
              cartCount,
              " productos)"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "12px", fontWeight: "700", color: "#111827" }, children: [
              cartTotal.toLocaleString(),
              " XAF"
            ] })
          ] }),
          sm?.delivery && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #F3F4F6" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "12px", color: "#6B7280" }, children: "Envío estimado" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "12px", fontWeight: "700", color: sm.deliveryFee === 0 ? "#00c8a0" : "#111827" }, children: sm.deliveryFee === 0 ? "Gratis" : `${sm.deliveryFee.toLocaleString()} XAF` })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", paddingTop: "8px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "14px", fontWeight: "700", color: "#374151" }, children: "Total estimado" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "20px", fontWeight: "900", color: "#00c8a0" }, children: [
              cartTotal.toLocaleString(),
              " XAF"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setScreen("checkout"), style: { width: "100%", background: "linear-gradient(135deg,#00c8a0,#00b4e6)", border: "none", borderRadius: "12px", padding: "14px", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer", marginTop: "12px" }, children: "Continuar → Finalizar pedido" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setCart([]), style: { width: "100%", background: "none", border: "none", padding: "10px", color: "#9CA3AF", fontSize: "12px", cursor: "pointer", marginTop: "4px" }, children: "Vaciar carrito" })
      ] }) }),
      screen === "checkout" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "8px" }, children: "Método de entrega" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "8px", marginBottom: "14px" }, children: [["delivery", "🚚", "Delivery a domicilio"], ["recogida", "🏪", "Recoger en tienda"]].map(([id, icon, label]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setMetodoEntrega(id), style: { flex: 1, background: metodoEntrega === id ? "#F0FDF9" : "#F9FAFB", border: `1.5px solid ${metodoEntrega === id ? "#00c8a0" : "#E5E7EB"}`, borderRadius: "12px", padding: "12px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "22px" }, children: icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "10px", fontWeight: "700", color: metodoEntrega === id ? "#065F46" : "#6B7280" }, children: label })
        ] }, id)) }),
        metodoEntrega === "delivery" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "8px" }, children: "Datos de entrega" }),
          [{ k: "nombre", l: "Nombre completo", t: "text", i: "👤" }, { k: "telefono", l: "Teléfono", t: "tel", i: "📞" }, { k: "direccion", l: "Dirección", t: "text", i: "📍" }, { k: "barrio", l: "Barrio / Zona", t: "text", i: "🏘️" }, { k: "notas", l: "Instrucciones (opcional)", t: "text", i: "📝" }].map((f) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "10px", padding: "0 14px", marginBottom: "8px", height: "50px", display: "flex", alignItems: "center", border: "1px solid #F0F2F5", gap: "10px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "16px" }, children: f.i }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: f.t, placeholder: f.l, value: direccion[f.k], onChange: (e) => setDir(f.k, e.target.value), style: { flex: 1, background: "none", border: "none", outline: "none", fontSize: "13px", color: "#111827", fontFamily: "inherit" } })
          ] }, f.k))
        ] }),
        metodoEntrega === "recogida" && sm && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#F0FDF9", borderRadius: "12px", padding: "14px", marginBottom: "14px", border: "1px solid #A7F3D0" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "700", color: "#065F46", marginBottom: "6px" }, children: "📍 Punto de recogida" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", color: "#374151", marginBottom: "3px" }, children: sm.nombre }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "#6B7280", marginBottom: "3px" }, children: sm.direccion }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#6B7280" }, children: [
            "🕐 ",
            sm.horario
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "12px", padding: "14px", marginBottom: "12px", border: "1px solid #F0F2F5" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", fontWeight: "700", color: "#9CA3AF", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }, children: "Resumen del pedido" }),
          cart.map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #F3F4F6" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "11px", color: "#374151" }, children: [
              i.img,
              " ",
              i.nombre,
              " x",
              i.qty
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "11px", fontWeight: "700", color: "#111827" }, children: [
              (i.precio * i.qty).toLocaleString(),
              " XAF"
            ] })
          ] }, i.id)),
          metodoEntrega === "delivery" && deliveryFee > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #F3F4F6" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "11px", color: "#374151" }, children: "🚚 Envío" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "11px", fontWeight: "700", color: "#111827" }, children: [
              deliveryFee.toLocaleString(),
              " XAF"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", paddingTop: "8px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "13px", fontWeight: "700", color: "#374151" }, children: "Total" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "18px", fontWeight: "900", color: "#00c8a0" }, children: [
              grandTotal.toLocaleString(),
              " XAF"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "8px" }, children: "Método de pago" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "14px" }, children: [{ id: "wallet", label: "EGCHAT Wallet", icon: "💳" }, { id: "bank", label: "Banco", icon: "🏦" }, { id: "cash", label: "Efectivo", icon: "💵" }].map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setMetodoPago(m.id), style: { background: metodoPago === m.id ? "#F0FDF9" : "#F9FAFB", border: `1.5px solid ${metodoPago === m.id ? "#00c8a0" : "#E5E7EB"}`, borderRadius: "10px", padding: "10px 4px", fontSize: "10px", fontWeight: "700", color: metodoPago === m.id ? "#065F46" : "#6B7280", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "20px" }, children: m.icon }),
          m.label
        ] }, m.id)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: confirmOrder,
            disabled: !metodoPago || metodoEntrega === "delivery" && (!direccion.nombre || !direccion.telefono || !direccion.direccion),
            style: { width: "100%", background: metodoPago && (metodoEntrega === "recogida" || direccion.nombre && direccion.telefono && direccion.direccion) ? "linear-gradient(135deg,#00c8a0,#00b4e6)" : "#E5E7EB", border: "none", borderRadius: "12px", padding: "14px", color: metodoPago && (metodoEntrega === "recogida" || direccion.nombre && direccion.telefono && direccion.direccion) ? "#fff" : "#9CA3AF", fontSize: "14px", fontWeight: "700", cursor: "pointer" },
            children: [
              "Confirmar pedido  -  ",
              grandTotal.toLocaleString(),
              " XAF"
            ]
          }
        )
      ] }),
      screen === "orders" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: orders.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "50px 0" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "56px", marginBottom: "12px" }, children: "📦" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "16px", fontWeight: "700", color: "#374151", marginBottom: "6px" }, children: "Sin pedidos aún" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", color: "#9CA3AF", marginBottom: "20px" }, children: "Tus pedidos aparecerán aquí" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setScreen("home"), style: { background: "linear-gradient(135deg,#00c8a0,#00b4e6)", border: "none", borderRadius: "12px", padding: "12px 28px", color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }, children: "Hacer mi primer pedido" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: orders.map((o) => {
        const statusColor = { confirmado: "#00c8a0", pendiente: "#F59E0B", en_preparacion: "#00b4e6", listo: "#6B5BD6", en_camino: "#F59E0B", entregado: "#065F46", cancelado: "#C0392B" };
        const statusLabel = { confirmado: "Confirmado", pendiente: "Pendiente", en_preparacion: "En preparación", listo: "Listo", en_camino: "En camino", entregado: "Entregado", cancelado: "Cancelado" };
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "14px", padding: "14px", marginBottom: "10px", border: "1px solid #F0F2F5", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "700", color: "#111827" }, children: o.sm_nombre }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "10px", color: "#9CA3AF", marginTop: "2px" }, children: [
                "📅 ",
                o.fecha,
                "  -  Ref: ",
                o.ref
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: statusColor[o.estado] + "18", color: statusColor[o.estado], borderRadius: "8px", padding: "3px 10px", fontSize: "10px", fontWeight: "700" }, children: statusLabel[o.estado] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "10px" }, children: [
            o.items.slice(0, 4).map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "18px" }, children: i.img }, i.id)),
            o.items.length > 4 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "11px", color: "#9CA3AF", alignSelf: "center" }, children: [
              "+",
              o.items.length - 4,
              " más"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid #F3F4F6" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "10px", color: "#9CA3AF" }, children: [
                o.metodo_entrega === "delivery" ? "🚚 Delivery" : "🏪 Recogida",
                "  -  ",
                o.metodo_pago === "wallet" ? "💳 EGCHAT" : o.metodo_pago === "bank" ? "🏦 Banco" : "💵 Efectivo"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "10px", color: "#6B7280", marginTop: "2px" }, children: [
                "📍 ",
                o.direccion
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "16px", fontWeight: "900", color: "#00c8a0" }, children: [
              o.total.toLocaleString(),
              " XAF"
            ] })
          ] })
        ] }, o.id);
      }) }) }),
      screen === "history" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg,#F59E0B,#D97706)", borderRadius: "14px", padding: "16px", marginBottom: "14px", color: "#fff" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "15px", fontWeight: "800", marginBottom: "4px" }, children: "📋 Historial de compras" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", opacity: 0.85 }, children: [
            orders.length,
            " pedido",
            orders.length !== 1 ? "s" : "",
            " realizados"
          ] })
        ] }),
        orders.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "40px 0", color: "#9CA3AF" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "40px", marginBottom: "8px" }, children: "📋" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px" }, children: "Sin historial todavía" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "14px" }, children: [
            { label: "Pedidos", value: orders.length, icon: "📦", color: "#00c8a0" },
            { label: "Total gastado", value: `${orders.reduce((s, o) => s + o.total, 0).toLocaleString()} XAF`, icon: "💰", color: "#F59E0B" },
            { label: "Tiendas", value: new Set(orders.map((o) => o.sm_id)).size, icon: "🛒", color: "#6B5BD6" }
          ].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "12px", padding: "12px 8px", textAlign: "center", border: "1px solid #F0F2F5" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "20px", marginBottom: "4px" }, children: s.icon }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "800", color: s.color, marginBottom: "2px" }, children: s.value }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "9px", color: "#9CA3AF" }, children: s.label })
          ] }, s.label)) }),
          orders.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#fff", borderRadius: "12px", padding: "12px 14px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px", border: "1px solid #F0F2F5" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "28px" }, children: o.items[0]?.img || "🛒" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "700", color: "#111827" }, children: o.sm_nombre }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "10px", color: "#9CA3AF" }, children: [
                o.fecha,
                "  -  ",
                o.items.length,
                " producto",
                o.items.length !== 1 ? "s" : ""
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "10px", color: "#9CA3AF" }, children: [
                "Ref: ",
                o.ref
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "14px", fontWeight: "800", color: "#00c8a0" }, children: [
              o.total.toLocaleString(),
              " XAF"
            ] })
          ] }, o.id))
        ] })
      ] }),
      screen === "support" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: !supportOk ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg,#C0392B,#E74C3C)", borderRadius: "14px", padding: "16px", marginBottom: "14px", color: "#fff" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "15px", fontWeight: "800", marginBottom: "4px" }, children: "🎧 Soporte" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", opacity: 0.85 }, children: "Reporta un problema o contacta con nosotros" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "8px" }, children: "Tipo de incidencia" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }, children: [
          { id: "faltante", label: "Producto faltante", icon: "📦" },
          { id: "incompleto", label: "Pedido incompleto", icon: "⚠️" },
          { id: "entrega", label: "Entrega fallida", icon: "🚚" },
          { id: "pago", label: "Problema de pago", icon: "💳" },
          { id: "calidad", label: "Calidad del producto", icon: "🔍" },
          { id: "otro", label: "Otro", icon: "💬" }
        ].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setSupportType(t.id), style: { background: supportType === t.id ? "#FEF2F2" : "#fff", border: `1.5px solid ${supportType === t.id ? "#C0392B" : "#F0F2F5"}`, borderRadius: "12px", padding: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", textAlign: "left" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "20px" }, children: t.icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "11px", fontWeight: "700", color: supportType === t.id ? "#C0392B" : "#374151" }, children: t.label })
        ] }, t.id)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "8px" }, children: "Descripción del problema" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: supportMsg, onChange: (e) => setSupportMsg(e.target.value), placeholder: "Describe el problema con detalle...", rows: 4, style: { width: "100%", background: "#fff", border: "1px solid #F0F2F5", borderRadius: "12px", padding: "12px 14px", fontSize: "13px", color: "#111827", fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box", marginBottom: "14px" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
          if (supportType && supportMsg.trim()) setSupportOk(true);
        }, style: { width: "100%", background: supportType && supportMsg.trim() ? "linear-gradient(135deg,#C0392B,#E74C3C)" : "#E5E7EB", border: "none", borderRadius: "12px", padding: "14px", color: supportType && supportMsg.trim() ? "#fff" : "#9CA3AF", fontSize: "14px", fontWeight: "700", cursor: supportType && supportMsg.trim() ? "pointer" : "default" }, children: "Enviar reporte" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "40px 0" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg,#00c8a0,#00b4e6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "40px" }, children: "✅" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "18px", fontWeight: "800", color: "#111827", marginBottom: "8px" }, children: "Reporte enviado" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", color: "#9CA3AF", marginBottom: "20px" }, children: "Nuestro equipo revisará tu caso en menos de 24h" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#F0FDF9", borderRadius: "12px", padding: "14px", marginBottom: "20px", textAlign: "left", border: "1px solid #A7F3D0" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#065F46", fontWeight: "700", marginBottom: "6px" }, children: [
            "Ticket: EGC-SUP-",
            Date.now().toString().slice(-6)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", color: "#374151" }, children: supportMsg })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
          setSupportOk(false);
          setSupportMsg("");
          setSupportType("");
          setScreen("home");
        }, style: { background: "linear-gradient(135deg,#00c8a0,#00b4e6)", border: "none", borderRadius: "12px", padding: "12px 28px", color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }, children: "Volver al inicio" })
      ] }) })
    ] })
  ] }) });
};
export {
  SupermercadosModal
};
