// Datos servicios diarios — paridad SupermercadosModule.tsx / ServiciosDiarios.tsx web

export interface City {
  id: string; name: string; provincia: string;
}

export interface Supermarket {
  id: string; nombre: string; ciudad_id: string; logo: string;
  color: string; color2: string; direccion: string; telefono: string;
  horario: string; delivery: boolean; minOrder: number; deliveryFee: number;
}

export interface Product {
  id: string; sm_ids: string[]; nombre: string; marca: string;
  precio: number; img: string; destacado: boolean;
}

export interface Restaurant {
  id: string; nombre: string; ciudad: string; barrio: string;
  tipo: string; especialidad: string; precio: '$' | '$$' | '$$$';
  horario: string; tel: string;
  menu: Array<{ plato: string; precio: number }>;
}

export interface Hotel {
  id: string; nombre: string; ciudad: string; barrio: string;
  estrellas: number; precio: number; telefono: string;
  amenities: string[];
}

export interface Airline {
  id: string; nombre: string; iata: string; pais: string; color: string; nacional: boolean;
  rutas: Array<{ origen: string; destino: string; duracion: string; precio: number; frecuencia: string }>;
}

export interface GasCompany {
  id: string; nombre: string; abbr: string; color: string;
  estaciones: Array<{ nombre: string; ciudad: string; barrio: string; horario: string; tel: string; g95: number; diesel: number; glp: number }>;
}

export interface OnlineStore {
  id: string; nombre: string; ciudad: string; barrio: string;
  categoria: string; catColor: string; icon: string; iconBg: string;
  horario: string; marcas: string[];
}

export const DAILY_CITIES: City[] = [
  { id: 'c1', name: 'Malabo', provincia: 'Bioko Norte' },
  { id: 'c2', name: 'Bata', provincia: 'Litoral' },
  { id: 'c3', name: 'Mongomo', provincia: 'Wele-Nzas' },
  { id: 'c4', name: 'Añisoc', provincia: 'Wele-Nzas' },
  { id: 'c5', name: 'Evinayong', provincia: 'Centro Sur' },
];

export const SUPERMARKETS: Supermarket[] = [
  { id: 'sm1', nombre: 'Martínez Hermanos', ciudad_id: 'c1', logo: 'MH', color: '#C0392B', color2: '#E74C3C', direccion: 'Av. de la Independencia, Malabo', telefono: '+240 222 20 01 01', horario: 'L-S 8:00-21:00', delivery: true, minOrder: 5000, deliveryFee: 500 },
  { id: 'sm2', nombre: 'EGTC Malabo', ciudad_id: 'c1', logo: 'EG', color: '#1B3A6B', color2: '#2A5298', direccion: 'Barrio Caracolas, Malabo', telefono: '+240 222 20 01 02', horario: 'L-D 7:30-22:00', delivery: true, minOrder: 8000, deliveryFee: 0 },
  { id: 'sm3', nombre: 'Guinaco', ciudad_id: 'c1', logo: 'GN', color: '#065F46', color2: '#00c8a0', direccion: 'Ela Nguema, Malabo', telefono: '+240 222 20 01 03', horario: 'L-S 8:00-20:00', delivery: true, minOrder: 4000, deliveryFee: 500 },
  { id: 'sm4', nombre: 'Pegasos Express', ciudad_id: 'c1', logo: 'PE', color: '#92400E', color2: '#F59E0B', direccion: 'Malabo II, Malabo', telefono: '+240 222 20 01 04', horario: 'L-D 7:00-23:00', delivery: false, minOrder: 0, deliveryFee: 0 },
  { id: 'sm5', nombre: 'Caba Market', ciudad_id: 'c1', logo: 'CM', color: '#4C1D95', color2: '#6B5BD6', direccion: 'Puerto, Malabo', telefono: '+240 222 20 01 05', horario: 'L-S 9:00-21:00', delivery: true, minOrder: 6000, deliveryFee: 300 },
  { id: 'sm6', nombre: 'Getco', ciudad_id: 'c2', logo: 'GT', color: '#0A4A8A', color2: '#00b4e6', direccion: 'Centro de Bata', telefono: '+240 222 20 02 01', horario: 'L-D 7:30-22:00', delivery: true, minOrder: 6000, deliveryFee: 500 },
  { id: 'sm7', nombre: 'Comercial Santy', ciudad_id: 'c2', logo: 'CS', color: '#831843', color2: '#EC4899', direccion: 'Paseo Marítimo, Bata', telefono: '+240 222 20 02 02', horario: 'L-S 8:00-21:00', delivery: true, minOrder: 5000, deliveryFee: 300 },
  { id: 'sm8', nombre: 'EGTC Bata', ciudad_id: 'c2', logo: 'EG', color: '#1B3A6B', color2: '#2A5298', direccion: 'Nkolombong, Bata', telefono: '+240 222 20 02 03', horario: 'L-D 8:00-21:00', delivery: true, minOrder: 7000, deliveryFee: 500 },
  { id: 'sm9', nombre: 'EGTC Mongomo', ciudad_id: 'c3', logo: 'EG', color: '#1B3A6B', color2: '#2A5298', direccion: 'Centro Mongomo', telefono: '+240 222 20 03 01', horario: 'L-S 8:00-20:00', delivery: false, minOrder: 0, deliveryFee: 0 },
  { id: 'sm10', nombre: 'EGTC Añisoc', ciudad_id: 'c4', logo: 'EG', color: '#1B3A6B', color2: '#2A5298', direccion: 'Centro Añisoc', telefono: '+240 222 20 04 01', horario: 'L-S 8:00-20:00', delivery: false, minOrder: 0, deliveryFee: 0 },
  { id: 'sm11', nombre: 'Supermercado Evinayong Plaza', ciudad_id: 'c5', logo: 'EP', color: '#065F46', color2: '#00c8a0', direccion: 'Plaza Central, Evinayong', telefono: '+240 222 20 05 01', horario: 'L-S 8:00-20:00', delivery: false, minOrder: 0, deliveryFee: 0 },
];

export const FEATURED_PRODUCTS: Product[] = [
  { id: 'p001', sm_ids: ['sm1', 'sm2', 'sm3', 'sm6'], nombre: 'Agua Mineral 1.5L', marca: 'Aquarel', precio: 500, img: '💧', destacado: true },
  { id: 'p004', sm_ids: ['sm1', 'sm2', 'sm3', 'sm6'], nombre: 'Coca-Cola 1.5L', marca: 'Coca-Cola', precio: 1200, img: '🥤', destacado: true },
  { id: 'p007', sm_ids: ['sm1', 'sm2', 'sm5', 'sm6'], nombre: 'Malabo Beer 33cl', marca: 'Malabo Beer', precio: 800, img: '🍺', destacado: true },
  { id: 'p010', sm_ids: ['sm1', 'sm2', 'sm3', 'sm6'], nombre: 'Leche Entera 1L', marca: 'Puleva', precio: 1100, img: '🥛', destacado: true },
  { id: 'p015', sm_ids: ['sm1', 'sm2', 'sm6'], nombre: 'Arroz 1kg', marca: 'SOS', precio: 900, img: '🌾', destacado: true },
  { id: 'p020', sm_ids: ['sm1', 'sm2', 'sm3'], nombre: 'Aceite Girasol 1L', marca: 'Koipe', precio: 1800, img: '🫙', destacado: true },
];

export const RESTAURANTS: Restaurant[] = [
  { id: 'r1', nombre: 'Restaurante La Estancia', ciudad: 'Malabo', barrio: 'Centro', tipo: 'Internacional', especialidad: 'Carnes y parrilla', precio: '$$', horario: '12:00-23:00', tel: '+240 222 25 00 01', menu: [{ plato: 'Chuletón de ternera', precio: 18000 }, { plato: 'Pollo a la brasa', precio: 9000 }, { plato: 'Ensalada mixta', precio: 4500 }, { plato: 'Paella valenciana', precio: 14000 }] },
  { id: 'r2', nombre: 'Restaurante El Patio', ciudad: 'Malabo', barrio: 'Caracolas', tipo: 'Africana/Española', especialidad: 'Cocina fusión', precio: '$$', horario: '11:00-22:00', tel: '+240 222 25 00 02', menu: [{ plato: 'Sopa de pescado', precio: 6000 }, { plato: 'Ndolé con plantain', precio: 8000 }, { plato: 'Arroz con pollo', precio: 7500 }] },
  { id: 'r3', nombre: 'Restaurante Bahía', ciudad: 'Malabo', barrio: 'Puerto', tipo: 'Mariscos', especialidad: 'Pescados y mariscos frescos', precio: '$$$', horario: '12:00-23:30', tel: '+240 222 25 00 03', menu: [{ plato: 'Langosta a la plancha', precio: 35000 }, { plato: 'Gambas al ajillo', precio: 15000 }, { plato: 'Ceviche de corvina', precio: 12000 }] },
  { id: 'r4', nombre: 'Cocina Típica Malabo', ciudad: 'Malabo', barrio: 'Ela Nguema', tipo: 'Ecuatoguineana', especialidad: 'Platos tradicionales GQ', precio: '$', horario: '08:00-21:00', tel: '+240 222 25 00 04', menu: [{ plato: 'Sopa de mboa', precio: 3500 }, { plato: 'Ekwang', precio: 4000 }, { plato: 'Pescado ahumado con yuca', precio: 5000 }] },
  { id: 'r5', nombre: 'Restaurante Sipopo', ciudad: 'Malabo', barrio: 'Sipopo', tipo: 'Internacional', especialidad: 'Alta cocina', precio: '$$$', horario: '13:00-23:00', tel: '+240 222 25 00 05', menu: [{ plato: 'Filete de res', precio: 25000 }, { plato: 'Salmón al horno', precio: 20000 }, { plato: 'Tiramisú', precio: 6000 }] },
  { id: 'r6', nombre: 'Restaurante Bata Centro', ciudad: 'Bata', barrio: 'Centro', tipo: 'Africana/Internacional', especialidad: 'Cocina variada', precio: '$$', horario: '10:00-22:00', tel: '+240 222 25 00 06', menu: [{ plato: 'Pollo yassa', precio: 8000 }, { plato: 'Thieboudienne', precio: 9000 }] },
  { id: 'r7', nombre: 'La Terraza Bata', ciudad: 'Bata', barrio: 'Litoral', tipo: 'Mariscos/Española', especialidad: 'Vistas al mar', precio: '$$', horario: '12:00-23:00', tel: '+240 222 25 00 07', menu: [{ plato: 'Pulpo a la gallega', precio: 14000 }, { plato: 'Merluza al vapor', precio: 11000 }] },
  { id: 'r8', nombre: 'Restaurante Nkolombong', ciudad: 'Bata', barrio: 'Nkolombong', tipo: 'Ecuatoguineana', especialidad: 'Comida tradicional', precio: '$', horario: '07:00-20:00', tel: '+240 222 25 00 08', menu: [{ plato: 'Pollo con salsa de cacahuete', precio: 6000 }, { plato: 'Plantain frito con frijoles', precio: 2500 }] },
  { id: 'r9', nombre: 'Restaurante Ebebiyín', ciudad: 'Ebebiyín', barrio: 'Centro', tipo: 'Africana', especialidad: 'Cocina continental', precio: '$', horario: '08:00-21:00', tel: '+240 222 25 00 09', menu: [{ plato: 'Pollo asado', precio: 5500 }, { plato: 'Arroz con frijoles', precio: 3000 }] },
  { id: 'r10', nombre: 'Restaurante Mongomo', ciudad: 'Mongomo', barrio: 'Centro', tipo: 'Africana', especialidad: 'Platos locales', precio: '$', horario: '08:00-20:00', tel: '+240 222 25 00 10', menu: [{ plato: 'Caldo de pescado', precio: 3000 }, { plato: 'Yuca con pollo', precio: 4500 }] },
];

export const FOOD_DELIVERY = [
  { id: 'd1', icon: '🍗', nombre: 'Pollo Asado Malabo', desc: 'Pollo, brochetas, ensaladas', tel: '+240 222 30 40 01', time: '25-35 min' },
  { id: 'd2', icon: '🍕', nombre: 'Pizzería Caracolas', desc: 'Pizzas, pastas, ensaladas', tel: '+240 222 30 40 02', time: '30-45 min' },
  { id: 'd3', icon: '🥗', nombre: 'Ensaladas & Wraps', desc: 'Comida saludable y ligera', tel: '+240 222 30 40 03', time: '20-30 min' },
  { id: 'd4', icon: '🍔', nombre: 'Burger House GQ', desc: 'Hamburguesas y sándwiches', tel: '+240 222 30 40 04', time: '25-40 min' },
  { id: 'd5', icon: '🐟', nombre: 'Mariscos del Puerto', desc: 'Pescado fresco, mariscos', tel: '+240 222 30 40 05', time: '35-50 min' },
  { id: 'd6', icon: '🍱', nombre: 'Cocina Local Nguema', desc: 'Platos típicos guineanos', tel: '+240 222 30 40 06', time: '20-35 min' },
];

export const HOTELS: Hotel[] = [
  { id: 'h1', nombre: 'Hotel Bahía', ciudad: 'Malabo', barrio: 'Puerto', estrellas: 4, precio: 45000, telefono: '+240 222 30 20 01', amenities: ['WiFi', 'Piscina', 'Restaurante', 'AC'] },
  { id: 'h2', nombre: 'Hotel Impala', ciudad: 'Malabo', barrio: 'Centro', estrellas: 3, precio: 28000, telefono: '+240 222 30 20 02', amenities: ['WiFi', 'Restaurante', 'AC'] },
  { id: 'h3', nombre: 'Sofitel Malabo Sipopo', ciudad: 'Malabo', barrio: 'Sipopo', estrellas: 5, precio: 120000, telefono: '+240 222 30 20 03', amenities: ['WiFi', 'Piscina', 'Spa', 'Gimnasio', 'Restaurante'] },
  { id: 'h4', nombre: 'Aparthotel GQ Malabo', ciudad: 'Malabo', barrio: 'Malabo II', estrellas: 3, precio: 35000, telefono: '+240 222 30 20 04', amenities: ['WiFi', 'Cocina', 'AC'] },
  { id: 'h5', nombre: 'Hotel Ureca', ciudad: 'Malabo', barrio: 'Aeropuerto', estrellas: 3, precio: 32000, telefono: '+240 222 30 20 05', amenities: ['WiFi', 'AC', 'Desayuno incluido'] },
  { id: 'h6', nombre: 'Hotel Litoral Bata', ciudad: 'Bata', barrio: 'Litoral', estrellas: 4, precio: 38000, telefono: '+240 222 30 20 06', amenities: ['WiFi', 'Piscina', 'Restaurante'] },
  { id: 'h7', nombre: 'Hotel Centro Bata', ciudad: 'Bata', barrio: 'Centro', estrellas: 3, precio: 25000, telefono: '+240 222 30 20 07', amenities: ['WiFi', 'AC', 'Desayuno'] },
  { id: 'h8', nombre: 'Hotel Ebebiyín', ciudad: 'Ebebiyín', barrio: 'Centro', estrellas: 2, precio: 18000, telefono: '+240 222 30 20 08', amenities: ['WiFi', 'AC'] },
  { id: 'h9', nombre: 'Hotel Mongomo', ciudad: 'Mongomo', barrio: 'Centro', estrellas: 2, precio: 15000, telefono: '+240 222 30 20 09', amenities: ['WiFi', 'Restaurante'] },
];

export const AIRLINES: Airline[] = [
  { id: 'ceiba', nombre: 'Ceiba Intercontinental', iata: 'C2', pais: 'Guinea Ecuatorial', color: '#1B3A6B', nacional: true,
    rutas: [
      { origen: 'Malabo (SSG)', destino: 'Bata (BSG)', duracion: '45 min', precio: 45000, frecuencia: 'Diario' },
      { origen: 'Malabo (SSG)', destino: 'Madrid (MAD)', duracion: '7h 30min', precio: 380000, frecuencia: '3x semana' },
      { origen: 'Malabo (SSG)', destino: 'Libreville (LBV)', duracion: '1h 10min', precio: 85000, frecuencia: 'Diario' },
      { origen: 'Malabo (SSG)', destino: 'Douala (DLA)', duracion: '1h 20min', precio: 90000, frecuencia: 'Diario' },
      { origen: 'Bata (BSG)', destino: 'Malabo (SSG)', duracion: '45 min', precio: 45000, frecuencia: 'Diario' },
      { origen: 'Malabo (SSG)', destino: 'Paris (CDG)', duracion: '8h', precio: 420000, frecuencia: '2x semana' },
      { origen: 'Malabo (SSG)', destino: 'Addis Abeba (ADD)', duracion: '6h 30min', precio: 280000, frecuencia: '3x semana' },
      { origen: 'Malabo (SSG)', destino: 'Kigali (KGL)', duracion: '5h 30min', precio: 260000, frecuencia: '2x semana' },
    ] },
  { id: 'cronos', nombre: 'Cronos Airlines', iata: 'QC', pais: 'Guinea Ecuatorial', color: '#C0392B', nacional: true,
    rutas: [
      { origen: 'Malabo (SSG)', destino: 'Bata (BSG)', duracion: '45 min', precio: 42000, frecuencia: 'Diario' },
      { origen: 'Malabo (SSG)', destino: 'Douala (DLA)', duracion: '1h 15min', precio: 88000, frecuencia: 'Diario' },
      { origen: 'Bata (BSG)', destino: 'Malabo (SSG)', duracion: '45 min', precio: 42000, frecuencia: 'Diario' },
    ] },
  { id: 'iberia', nombre: 'Iberia', iata: 'IB', pais: 'España', color: '#C0392B', nacional: false,
    rutas: [
      { origen: 'Madrid (MAD)', destino: 'Malabo (SSG)', duracion: '7h 30min', precio: 350000, frecuencia: '3x semana' },
      { origen: 'Malabo (SSG)', destino: 'Madrid (MAD)', duracion: '7h 30min', precio: 350000, frecuencia: '3x semana' },
    ] },
  { id: 'airfrance', nombre: 'Air France', iata: 'AF', pais: 'Francia', color: '#003087', nacional: false,
    rutas: [
      { origen: 'Paris (CDG)', destino: 'Malabo (SSG)', duracion: '8h', precio: 390000, frecuencia: '2x semana' },
      { origen: 'Malabo (SSG)', destino: 'Paris (CDG)', duracion: '8h', precio: 390000, frecuencia: '2x semana' },
    ] },
  { id: 'ethiopian', nombre: 'Ethiopian Airlines', iata: 'ET', pais: 'Etiopía', color: '#078930', nacional: false,
    rutas: [
      { origen: 'Addis Abeba (ADD)', destino: 'Malabo (SSG)', duracion: '6h 30min', precio: 280000, frecuencia: '3x semana' },
      { origen: 'Malabo (SSG)', destino: 'Nairobi (NBO)', duracion: '7h', precio: 310000, frecuencia: '2x semana' },
    ] },
];

export const GAS_REF_PRICES = { g95: 650, diesel: 580, glp: 450 };

export const GAS_COMPANIES: GasCompany[] = [
  { id: 'gepetrol', nombre: 'GEPetrol', abbr: 'GEP', color: '#C0392B', estaciones: [
    { nombre: 'GEPetrol Malabo Centro', ciudad: 'Malabo', barrio: 'Centro', horario: '24h', tel: '+240 333 09 50 01', g95: 650, diesel: 580, glp: 450 },
    { nombre: 'GEPetrol Caracolas', ciudad: 'Malabo', barrio: 'Caracolas', horario: '06:00-22:00', tel: '+240 333 09 50 02', g95: 650, diesel: 580, glp: 450 },
    { nombre: 'GEPetrol Bata Centro', ciudad: 'Bata', barrio: 'Centro', horario: '24h', tel: '+240 333 09 50 04', g95: 650, diesel: 580, glp: 450 },
    { nombre: 'GEPetrol Ebebiyín', ciudad: 'Ebebiyín', barrio: 'Centro', horario: '07:00-21:00', tel: '+240 333 09 50 06', g95: 650, diesel: 580, glp: 450 },
    { nombre: 'GEPetrol Mongomo', ciudad: 'Mongomo', barrio: 'Centro', horario: '07:00-21:00', tel: '+240 333 09 50 07', g95: 650, diesel: 580, glp: 450 },
    { nombre: 'GEPetrol Ela Nguema', ciudad: 'Malabo', barrio: 'Ela Nguema', horario: '06:00-22:00', tel: '+240 333 09 50 03', g95: 650, diesel: 580, glp: 450 },
    { nombre: 'GEPetrol Bata Norte', ciudad: 'Bata', barrio: 'Nkolombong', horario: '06:00-22:00', tel: '+240 333 09 50 05', g95: 650, diesel: 580, glp: 450 },
  ] },
  { id: 'total', nombre: 'TotalEnergies', abbr: 'TOT', color: '#E31837', estaciones: [
    { nombre: 'Total Malabo Puerto', ciudad: 'Malabo', barrio: 'Puerto', horario: '24h', tel: '+240 333 09 51 01', g95: 660, diesel: 590, glp: 460 },
    { nombre: 'Total Malabo II', ciudad: 'Malabo', barrio: 'Malabo II', horario: '06:00-23:00', tel: '+240 333 09 51 02', g95: 660, diesel: 590, glp: 460 },
    { nombre: 'Total Bata Litoral', ciudad: 'Bata', barrio: 'Litoral', horario: '24h', tel: '+240 333 09 51 04', g95: 660, diesel: 590, glp: 460 },
    { nombre: 'Total Sipopo', ciudad: 'Malabo', barrio: 'Sipopo', horario: '06:00-22:00', tel: '+240 333 09 51 03', g95: 660, diesel: 590, glp: 460 },
  ] },
  { id: 'oryx', nombre: 'Oryx', abbr: 'ORY', color: '#FF6B00', estaciones: [
    { nombre: 'Oryx Malabo Aeropuerto', ciudad: 'Malabo', barrio: 'Aeropuerto', horario: '05:00-23:00', tel: '+240 333 09 52 01', g95: 655, diesel: 585, glp: 455 },
    { nombre: 'Oryx Malabo Centro', ciudad: 'Malabo', barrio: 'Centro', horario: '06:00-22:00', tel: '+240 333 09 52 02', g95: 655, diesel: 585, glp: 455 },
    { nombre: 'Oryx Bata', ciudad: 'Bata', barrio: 'Centro', horario: '06:00-22:00', tel: '+240 333 09 52 03', g95: 655, diesel: 585, glp: 455 },
  ] },
];

export const ONLINE_STORES: OnlineStore[] = [
  { id: 't1', nombre: 'Boutique Elegance', ciudad: 'Malabo', barrio: 'Centro', categoria: 'Moda', catColor: '#C0392B', icon: '👗', iconBg: '#FEF2F2', horario: '09:00-20:00', marcas: ['Zara', 'H&M', 'Mango', '+2'] },
  { id: 't2', nombre: 'TechStore Malabo', ciudad: 'Malabo', barrio: 'Caracolas', categoria: 'Electrónica', catColor: '#1B3A6B', icon: '📱', iconBg: '#EFF5FD', horario: '10:00-21:00', marcas: ['Samsung', 'Apple', 'Huawei', '+4'] },
  { id: 't3', nombre: 'Hogar & Deco Malabo', ciudad: 'Malabo', barrio: 'Ela Nguema', categoria: 'Hogar', catColor: '#065F46', icon: '🏠', iconBg: '#F0FAF5', horario: '09:00-20:00', marcas: ['IKEA', 'Conforama', 'Leroy Merlin'] },
  { id: 't4', nombre: 'Farmacia Central Malabo', ciudad: 'Malabo', barrio: 'Centro', categoria: 'Farmacia', catColor: '#2E9E6B', icon: '💊', iconBg: '#F0FAF5', horario: '08:00-22:00', marcas: ['Bayer', 'Pfizer', 'Roche', '+1'] },
  { id: 't5', nombre: 'Librería Nacional', ciudad: 'Malabo', barrio: 'Centro', categoria: 'Librería', catColor: '#6B5BD6', icon: '📚', iconBg: '#F5F3FF', horario: '08:00-19:00', marcas: ['Santillana', 'Anaya', 'SM', '+1'] },
  { id: 't6', nombre: 'Moda Bata', ciudad: 'Bata', barrio: 'Centro', categoria: 'Moda', catColor: '#C0392B', icon: '👗', iconBg: '#FEF2F2', horario: '09:00-19:00', marcas: ['Pull&Bear', 'Bershka'] },
  { id: 't7', nombre: 'Electro Bata', ciudad: 'Bata', barrio: 'Litoral', categoria: 'Electrónica', catColor: '#1B3A6B', icon: '📱', iconBg: '#EFF5FD', horario: '10:00-20:00', marcas: ['Samsung', 'LG', 'Sony'] },
  { id: 't8', nombre: 'Tienda Mongomo', ciudad: 'Mongomo', barrio: 'Centro', categoria: 'Hogar', catColor: '#065F46', icon: '🏠', iconBg: '#F0FAF5', horario: '08:00-18:00', marcas: ['Varios'] },
];

export const LAUNDRY = [
  { id: 'l1', nombre: 'Lavandería Express Malabo', area: 'Centro Malabo', tel: '+240 222 30 50 01', price: 'Desde 3,000 XAF/kg', hours: 'L-S 8:00-20:00' },
  { id: 'l2', nombre: 'Clean & Go', area: 'Caracolas', tel: '+240 222 30 50 02', price: 'Desde 2,500 XAF/kg', hours: 'L-D 7:00-21:00' },
  { id: 'l3', nombre: 'Lavandería Bata', area: 'Centro Bata', tel: '+240 222 30 50 03', price: 'Desde 2,000 XAF/kg', hours: 'L-S 8:00-19:00' },
];

export const BEAUTY = [
  { id: 'b1', icon: '💇', nombre: 'Salón Glamour Malabo', desc: 'Peluquería y estética femenina', tel: '+240 222 30 60 01' },
  { id: 'b2', icon: '💈', nombre: 'Barbería El Estilo', desc: 'Cortes y arreglos masculinos', tel: '+240 222 30 60 02' },
  { id: 'b3', icon: '💅', nombre: 'Nail Studio GQ', desc: 'Manicura, pedicura y nail art', tel: '+240 222 30 60 03' },
  { id: 'b4', icon: '🧖', nombre: 'Spa Relax Center', desc: 'Masajes y tratamientos corporales', tel: '+240 222 30 60 04' },
  { id: 'b5', icon: '🌿', nombre: 'Centro de Estética', desc: 'Tratamientos faciales y corporales', tel: '+240 222 30 60 05' },
];

export const STORE_CATEGORIES = ['Todos', 'Moda', 'Electrónica', 'Hogar', 'Farmacia', 'Librería'] as const;

export const cityName = (id: string) => DAILY_CITIES.find(c => c.id === id)?.name || id;
export const cityStoreCount = (cityId: string) => SUPERMARKETS.filter(s => s.ciudad_id === cityId).length;

export const precioLabel = (p: string) => p === '$' ? 'Económico' : p === '$$' ? 'Moderado' : 'Premium';
export const precioColor = (p: string) => p === '$' ? '#16A34A' : p === '$$' ? '#C47D2A' : '#C0392B';
