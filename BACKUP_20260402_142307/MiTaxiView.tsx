import React, { useState, useEffect, useRef } from 'react';

// ─── TIPOS ────────────────────────────────────────────────────────────────────
type Screen = 'home' | 'booking' | 'vehicle-select' | 'searching' | 'matched' | 'onway' | 'arrived' | 'qr-pay' | 'rating' | 'completed'
  | 'driver-home' | 'driver-register' | 'driver-requests' | 'driver-trip' | 'driver-qr' | 'driver-earnings';
interface Driver {
  id: string; name: string; initials: string; plate: string; car: string;
  carColor: string; rating: number; trips: number; eta: string; distance: string;
  price: number; badge: string; location: { lat: number; lng: number };
  phone: string; yearsExperience: number; language: string;
}
interface RideType {
  id: string; label: string; sub: string; icon: string; multiplier: number;
  waitTime: string; capacity: number; luggage: number; premium: boolean;
}
interface Location { lat: number; lng: number; address: string; }
interface Props { onBack: () => void; userBalance: number; onDebit: (amount: number) => void; userName?: string; userPhone?: string; }

// ─── DATOS ────────────────────────────────────────────────────────────────────
const ZONES = [
  { name: 'Centro Malabo',    lat: 3.7523, lng: 8.7737 },
  { name: 'Aeropuerto SSG',   lat: 3.7553, lng: 8.7085 },
  { name: 'Puerto de Malabo', lat: 3.7442, lng: 8.7705 },
  { name: 'Ela Nguema',       lat: 3.7412, lng: 8.7765 },
  { name: 'Caracolas',        lat: 3.7598, lng: 8.7779 },
  { name: 'Sipopo',           lat: 3.7765, lng: 8.7899 },
  { name: 'Luba',             lat: 3.4578, lng: 8.5547 },
  { name: 'Bata Centro',      lat: 1.8575, lng: 9.7686 },
  { name: 'Mongomo',          lat: 1.6279, lng: 11.3165 },
];

const DRIVERS: Driver[] = [
  { id:'1', name:'Marcos Nguema', initials:'MN', plate:'GQ-1234', car:'Toyota Corolla 2023',  carColor:'#ffffff', rating:4.9, trips:1240, eta:'2 min', distance:'0.3 km', price:1500, badge:'Top Driver', location:{lat:3.7523,lng:8.7737}, phone:'+240 555 123456', yearsExperience:5, language:'Español, Francés' },
  { id:'2', name:'Jose Obiang',   initials:'JO', plate:'GQ-5678', car:'Hyundai Elantra 2024', carColor:'#1e3a5f', rating:4.7, trips:876,  eta:'4 min', distance:'0.6 km', price:1200, badge:'',           location:{lat:3.7510,lng:8.7715}, phone:'+240 555 789012', yearsExperience:3, language:'Español' },
  { id:'3', name:'Luis Mba',      initials:'LM', plate:'GQ-9012', car:'Kia K5 2024',          carColor:'#c0392b', rating:4.8, trips:2100, eta:'6 min', distance:'1.1 km', price:1000, badge:'Pro',         location:{lat:3.7480,lng:8.7750}, phone:'+240 555 345678', yearsExperience:7, language:'Español, Inglés' },
  { id:'4', name:'Ana Mangue',    initials:'AM', plate:'GQ-3456', car:'Nissan Versa 2023',    carColor:'#2c3e50', rating:4.9, trips:1560, eta:'5 min', distance:'0.9 km', price:1300, badge:'MujerGQ',     location:{lat:3.7450,lng:8.7690}, phone:'+240 555 901234', yearsExperience:4, language:'Español' },
];

const RIDE_TYPES: RideType[] = [
  { id:'moto',    label:'MiMoto',   sub:'Rápido y económico',    icon:'moto',    multiplier:0.5,  waitTime:'2-3 min',  capacity:1, luggage:0, premium:false },
  { id:'basic',   label:'MiTaxi',   sub:'Sedán estándar',        icon:'sedan',   multiplier:1.0,  waitTime:'4-6 min',  capacity:4, luggage:2, premium:false },
  { id:'comfort', label:'Comfort',  sub:'Sedán premium A/C',     icon:'sedan',   multiplier:1.4,  waitTime:'5-7 min',  capacity:4, luggage:3, premium:true  },
  { id:'suv',     label:'SUV',      sub:'4x4 todo terreno',      icon:'suv',     multiplier:1.6,  waitTime:'6-8 min',  capacity:5, luggage:4, premium:true  },
  { id:'xl',      label:'Van XL',   sub:'Furgoneta 7 plazas',    icon:'van',     multiplier:1.8,  waitTime:'7-10 min', capacity:7, luggage:5, premium:true  },
  { id:'minivan', label:'Minivan',  sub:'Familiar 6 plazas',     icon:'minivan', multiplier:1.6,  waitTime:'6-9 min',  capacity:6, luggage:4, premium:false },
  { id:'mujer',   label:'MujerGQ',  sub:'Conductora mujer',      icon:'mujer',   multiplier:1.1,  waitTime:'5-8 min',  capacity:4, luggage:2, premium:false },
  { id:'cargo',   label:'Cargo',    sub:'Envío de paquetes',     icon:'cargo',   multiplier:1.3,  waitTime:'8-12 min', capacity:1, luggage:8, premium:false },
];

const BASE_PRICE = 1200;

// ─── CATEGORÍAS DE VEHÍCULOS (estilo Uber/DiDi) ───────────────────────────────
interface VehicleOption {
  id: string; name: string; description: string; price: number; time: string;
  rating: number; color: string; features: string[]; badge?: string; exclusive?: boolean;
  iconId: string; capacity: number; luggage: number;
}
interface VehicleCategory { id: string; title: string; vehicles: VehicleOption[]; }

const VEHICLE_CATEGORIES: VehicleCategory[] = [
  { id:'economical', title:'Económico', vehicles:[
    { id:'taxi_standard', name:'Taxi', description:'Económico • 4 pasajeros • 2 maletas', price:2500, time:'5 min', rating:4.8, color:'#00B4D8', iconId:'basic', capacity:4, luggage:2, features:['Aire acondicionado','Radio'] },
    { id:'taxi_plus', name:'Taxi Plus', description:'Confort básico • 4 pasajeros • 3 maletas', price:3500, time:'7 min', rating:4.7, color:'#FFC700', iconId:'basic', capacity:4, luggage:3, features:['Aire acondicionado','WiFi','Cargador USB'] },
  ]},
  { id:'comfort', title:'Confort', vehicles:[
    { id:'confort', name:'Confort', description:'Premium • 4 pasajeros • 3 maletas', price:5000, time:'8 min', rating:4.9, color:'#4A90E2', iconId:'comfort', capacity:4, luggage:3, features:['Asientos de cuero','Aire acondicionado','WiFi','Agua'], badge:'Popular' },
    { id:'comfort_plus', name:'Confort+', description:'Lujo • 4 pasajeros • 4 maletas', price:7000, time:'10 min', rating:4.95, color:'#0096C7', iconId:'comfort', capacity:4, luggage:4, features:['Asientos de cuero','Climatizador','WiFi','Bebidas','Periódico'] },
  ]},
  { id:'xl', title:'XL & Grupos', vehicles:[
    { id:'xl', name:'XL', description:'Espacioso • 6 pasajeros • 5 maletas', price:8000, time:'10 min', rating:4.7, color:'#10B981', iconId:'xl', capacity:6, luggage:5, features:['3 filas','Aire acondicionado','Espacio extra'] },
    { id:'suv', name:'SUV', description:'Todo terreno • 5 pasajeros • 4 maletas', price:9000, time:'12 min', rating:4.8, color:'#8B5CF6', iconId:'suv', capacity:5, luggage:4, features:['4x4','Aire acondicionado','Seguro premium'] },
    { id:'minivan', name:'Mini Van', description:'Familiar • 7 pasajeros • 6 maletas', price:10000, time:'15 min', rating:4.75, color:'#06B6D4', iconId:'minivan', capacity:7, luggage:6, features:['3 filas','Entretenimiento','Portavasos'] },
  ]},
  { id:'exclusive', title:'Exclusivo', vehicles:[
    { id:'mujer_gq', name:'Mujer GQ', description:'Conductoras mujeres • 4 pasajeros', price:6000, time:'9 min', rating:4.95, color:'#EC4899', iconId:'mujer', capacity:4, luggage:2, features:['100% mujeres','Seguridad extra','Premium'], badge:'Nuevo', exclusive:true },
  ]},
  { id:'cargo', title:'Carga', vehicles:[
    { id:'cargo_small', name:'Cargo Pequeño', description:'Furgón • Hasta 500kg', price:12000, time:'20 min', rating:4.6, color:'#f59e0b', iconId:'cargo', capacity:1, luggage:8, features:['Ayuda de carga','Seguro de mercancía'] },
    { id:'cargo_large', name:'Cargo Grande', description:'Camión • Hasta 1500kg', price:20000, time:'30 min', rating:4.5, color:'#D97706', iconId:'cargo', capacity:1, luggage:15, features:['Ayuda de carga','Seguro de mercancía','Rampa'] },
  ]},
];

// ─── MAPA REAL CON OPENSTREETMAP + LEAFLET ───────────────────────────────────
const RealMap: React.FC<{
  origin?: Location | null; destination?: Location | null;
  driver?: Driver | null; status: string;
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: string; vehicleFilter?: string;
}> = ({ origin, destination, driver, status, onLocationSelect, height='100%', vehicleFilter }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [driverPos, setDriverPos] = useState(driver?.location ?? null);

  useEffect(() => {
    if (!driver) return;
    setDriverPos(driver.location);
    if (status !== 'onway' && status !== 'matched') return;
    if (!origin) return;
    // Animar conductor hacia el origen en 20 pasos
    const steps = 40;
    let step = 0;
    const startLat = driver.location.lat;
    const startLng = driver.location.lng;
    const endLat = origin.lat;
    const endLng = origin.lng;
    const iv = setInterval(() => {
      step++;
      const t = step / steps;
      setDriverPos({ lat: startLat + (endLat - startLat) * t, lng: startLng + (endLng - startLng) * t });
      if (step >= steps) clearInterval(iv);
    }, 300);
    return () => clearInterval(iv);
  }, [driver, status, origin]);

  const originLat  = origin?.lat  ?? 3.7523;
  const originLng  = origin?.lng  ?? 8.7371;
  const destLat    = destination?.lat;
  const destLng    = destination?.lng;
  const dLat       = driverPos?.lat;
  const dLng       = driverPos?.lng;

  const html = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
#map{width:100%;height:100vh;background:#1a2035}
</style>
</head><body>
<div id="map"></div>
<script>
const map = L.map('map',{zoomControl:false}).setView([${originLat},${originLng}],14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  attribution:'© OpenStreetMap',maxZoom:19
}).addTo(map);

const mkIcon=(color,emoji,pulse)=>L.divIcon({
  className:'',
  html:\`<div style="background:\${color};border:3px solid #fff;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 10px rgba(0,0,0,0.4);\${pulse?'animation:pulse 1.5s infinite':''}">\${emoji}</div>\`,
  iconSize:[38,38],iconAnchor:[19,19]
});

// Origen
const originM = L.marker([${originLat},${originLng}],{icon:mkIcon('#00c8a0','📍',true)}).addTo(map);
originM.bindPopup('<b>Tu ubicación</b>');

${!destLat && !dLat ? `
// Todos los vehículos disponibles
const allVehicles = [
  {lat:${originLat}+0.003, lng:${originLng}+0.004, name:'Marcos N.', car:'Toyota Corolla', rating:'4.9', type:'taxi', eta:'2 min'},
  {lat:${originLat}-0.004, lng:${originLng}+0.002, name:'Jose O.', car:'Hyundai Elantra', rating:'4.7', type:'comfort', eta:'4 min'},
  {lat:${originLat}+0.002, lng:${originLng}-0.005, name:'Luis M.', car:'Kia K5 SUV', rating:'4.8', type:'suv', eta:'6 min'},
  {lat:${originLat}-0.002, lng:${originLng}-0.003, name:'Ana M.', car:'Nissan Versa', rating:'4.9', type:'mujer', eta:'5 min'},
  {lat:${originLat}+0.005, lng:${originLng}+0.001, name:'Pedro E.', car:'Honda CB500', rating:'4.6', type:'moto', eta:'3 min'},
  {lat:${originLat}-0.001, lng:${originLng}+0.006, name:'Carlos B.', car:'Toyota Hiace', rating:'4.7', type:'xl', eta:'7 min'},
  {lat:${originLat}+0.004, lng:${originLng}-0.002, name:'David K.', car:'Toyota Corolla', rating:'4.8', type:'taxi', eta:'4 min'},
  {lat:${originLat}-0.003, lng:${originLng}+0.005, name:'Maria L.', car:'Honda CB300', rating:'4.9', type:'moto', eta:'2 min'},
  {lat:${originLat}+0.001, lng:${originLng}+0.003, name:'Pablo R.', car:'BMW Serie 5', rating:'5.0', type:'comfort', eta:'5 min'},
  {lat:${originLat}-0.005, lng:${originLng}-0.001, name:'Sofia T.', car:'Ford Transit', rating:'4.6', type:'minivan', eta:'8 min'},
];

// Filtrar por tipo seleccionado
const activeFilter = '${vehicleFilter || 'all'}';
const nearbyVehicles = activeFilter === 'all'
  ? allVehicles
  : allVehicles.filter(v => v.type === activeFilter);

const vehicleSVGs = {
  taxi: \`<svg width="32" height="32" viewBox="0 0 64 64" fill="none"><rect x="26" y="10" width="12" height="6" rx="1.5" fill="#FFD700"/><text x="32" y="15" font-size="4.5" text-anchor="middle" fill="#1E293B" font-weight="bold">TAXI</text><path d="M10 30 L16 20 L48 20 L54 30Z" fill="#FFD700" stroke="#1E293B" stroke-width="1.5"/><rect x="6" y="30" width="52" height="13" rx="3" fill="#FFD700" stroke="#1E293B" stroke-width="1.5"/><rect x="17" y="22" width="12" height="8" rx="1" fill="rgba(255,255,255,0.6)" stroke="#1E293B" stroke-width="1"/><rect x="35" y="22" width="12" height="8" rx="1" fill="rgba(255,255,255,0.6)" stroke="#1E293B" stroke-width="1"/><circle cx="17" cy="43" r="6" fill="#1E293B" stroke="#FFD700" stroke-width="1.5"/><circle cx="47" cy="43" r="6" fill="#1E293B" stroke="#FFD700" stroke-width="1.5"/></svg>\`,
  comfort: \`<svg width="32" height="32" viewBox="0 0 64 64" fill="none"><path d="M32 8L34 13H39L35 16L37 21L32 18L27 21L29 16L25 13H30Z" fill="#FFD700"/><path d="M8 32 L14 20 L50 20 L56 32Z" fill="#22C55E" stroke="#1E293B" stroke-width="1.5"/><rect x="4" y="32" width="56" height="11" rx="4" fill="#22C55E" stroke="#1E293B" stroke-width="1.5"/><rect x="15" y="22" width="13" height="10" rx="1" fill="rgba(255,255,255,0.5)" stroke="#1E293B" stroke-width="1"/><rect x="31" y="22" width="11" height="10" rx="1" fill="rgba(255,255,255,0.5)" stroke="#1E293B" stroke-width="1"/><circle cx="15" cy="43" r="6" fill="#1E293B" stroke="#22C55E" stroke-width="1.5"/><circle cx="49" cy="43" r="6" fill="#1E293B" stroke="#22C55E" stroke-width="1.5"/></svg>\`,
  suv: \`<svg width="32" height="32" viewBox="0 0 64 64" fill="none"><line x1="16" y1="13" x2="48" y2="13" stroke="#8B5CF6" stroke-width="2.5"/><line x1="20" y1="13" x2="20" y2="18" stroke="#8B5CF6" stroke-width="2"/><line x1="44" y1="13" x2="44" y2="18" stroke="#8B5CF6" stroke-width="2"/><rect x="10" y="18" width="44" height="14" rx="2" fill="#8B5CF6" stroke="#1E293B" stroke-width="1.5"/><rect x="8" y="30" width="48" height="13" rx="3" fill="#8B5CF6" stroke="#1E293B" stroke-width="1.5"/><rect x="12" y="20" width="16" height="10" rx="1" fill="rgba(255,255,255,0.5)" stroke="#1E293B" stroke-width="1"/><rect x="36" y="20" width="16" height="10" rx="1" fill="rgba(255,255,255,0.5)" stroke="#1E293B" stroke-width="1"/><circle cx="18" cy="43" r="7" fill="#1E293B" stroke="#8B5CF6" stroke-width="2"/><circle cx="46" cy="43" r="7" fill="#1E293B" stroke="#8B5CF6" stroke-width="2"/></svg>\`,
  mujer: \`<svg width="32" height="32" viewBox="0 0 64 64" fill="none"><circle cx="54" cy="11" r="5.5" stroke="#EC4899" stroke-width="2"/><line x1="54" y1="16.5" x2="54" y2="23" stroke="#EC4899" stroke-width="2"/><line x1="51" y1="20" x2="57" y2="20" stroke="#EC4899" stroke-width="2"/><path d="M12 30 L18 20 L46 20 L52 30Z" fill="#EC4899" stroke="#1E293B" stroke-width="1.5"/><rect x="8" y="30" width="44" height="13" rx="4" fill="#EC4899" stroke="#1E293B" stroke-width="1.5"/><rect x="19" y="22" width="11" height="8" rx="1.5" fill="rgba(255,255,255,0.5)" stroke="#1E293B" stroke-width="1"/><rect x="33" y="22" width="11" height="8" rx="1.5" fill="rgba(255,255,255,0.5)" stroke="#1E293B" stroke-width="1"/><circle cx="16" cy="43" r="6" fill="#1E293B" stroke="#EC4899" stroke-width="2"/><circle cx="44" cy="43" r="6" fill="#1E293B" stroke="#EC4899" stroke-width="2"/></svg>\`,
  moto: \`<svg width="32" height="32" viewBox="0 0 64 64" fill="none"><circle cx="14" cy="46" r="9" stroke="#F97316" stroke-width="2.5"/><circle cx="50" cy="46" r="9" stroke="#F97316" stroke-width="2.5"/><circle cx="14" cy="46" r="3.5" fill="#F97316" opacity="0.4"/><circle cx="50" cy="46" r="3.5" fill="#F97316" opacity="0.4"/><path d="M23 46h14" stroke="#F97316" stroke-width="2"/><path d="M30 46L26 30h10l8 10h6" stroke="#F97316" stroke-width="2.5" stroke-linecap="round"/><path d="M26 30l-4-10h-8" stroke="#F97316" stroke-width="2" stroke-linecap="round"/></svg>\`,
  xl: \`<svg width="32" height="32" viewBox="0 0 64 64" fill="none"><rect x="4" y="16" width="56" height="28" rx="3" fill="#3B82F6" stroke="#1E293B" stroke-width="1.5"/><path d="M4 22 L4 16 L18 16 L18 22Z" fill="#2563EB" stroke="#1E293B" stroke-width="1.5"/><rect x="6" y="18" width="10" height="8" rx="1" fill="rgba(255,255,255,0.5)" stroke="#1E293B" stroke-width="1"/><rect x="20" y="18" width="12" height="8" rx="1" fill="rgba(255,255,255,0.5)" stroke="#1E293B" stroke-width="1"/><rect x="36" y="18" width="12" height="8" rx="1" fill="rgba(255,255,255,0.5)" stroke="#1E293B" stroke-width="1"/><circle cx="14" cy="44" r="7" fill="#1E293B" stroke="#3B82F6" stroke-width="2"/><circle cx="50" cy="44" r="7" fill="#1E293B" stroke="#3B82F6" stroke-width="2"/></svg>\`,
  minivan: \`<svg width="32" height="32" viewBox="0 0 64 64" fill="none"><rect x="4" y="20" width="52" height="22" rx="3" fill="#06B6D4" stroke="#1E293B" stroke-width="1.5"/><path d="M4 26 L4 20 L30 20 L30 26Z" fill="#0891B2" stroke="#1E293B" stroke-width="1.5"/><rect x="6" y="21" width="10" height="8" rx="1" fill="rgba(255,255,255,0.5)" stroke="#1E293B" stroke-width="1"/><rect x="20" y="21" width="10" height="8" rx="1" fill="rgba(255,255,255,0.5)" stroke="#1E293B" stroke-width="1"/><rect x="34" y="21" width="10" height="8" rx="1" fill="rgba(255,255,255,0.5)" stroke="#1E293B" stroke-width="1"/><circle cx="14" cy="42" r="6" fill="#1E293B" stroke="#06B6D4" stroke-width="2"/><circle cx="46" cy="42" r="6" fill="#1E293B" stroke="#06B6D4" stroke-width="2"/></svg>\`,
};

nearbyVehicles.forEach(v => {
  const svg = vehicleSVGs[v.type] || vehicleSVGs.taxi;
  const icon = L.divIcon({
    className:'',
    html:\`<div style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.5));cursor:pointer">\${svg}</div>\`,
    iconSize:[32,32],iconAnchor:[16,16]
  });
  const m = L.marker([v.lat, v.lng], {icon}).addTo(map);
  m.bindPopup(\`<div style="font-family:sans-serif;min-width:120px"><b style="font-size:13px">\${v.name}</b><br><span style="color:#666;font-size:11px">\${v.car}</span><br><span style="color:#f59e0b;font-size:11px">⭐ \${v.rating}</span> · <span style="color:#10B981;font-size:11px">⏱ \${v.eta}</span></div>\`);
});
` : ''}

${destLat && destLng ? `
const destM = L.marker([${destLat},${destLng}],{icon:mkIcon('#FFD700','🏁',false)}).addTo(map);
destM.bindPopup('<b>Destino</b>');
fetch('https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson')
  .then(r=>r.json()).then(d=>{
    if(d.routes&&d.routes[0]){
      L.geoJSON(d.routes[0].geometry,{style:{color:'#00B4D8',weight:4,opacity:0.85,dashArray:'8,4'}}).addTo(map);
      map.fitBounds([[${originLat},${originLng}],[${destLat},${destLng}]],{padding:[50,50]});
    }
  }).catch(()=>{
    L.polyline([[${originLat},${originLng}],[${destLat},${destLng}]],{color:'#00B4D8',weight:4,dashArray:'8,4'}).addTo(map);
    map.fitBounds([[${originLat},${originLng}],[${destLat},${destLng}]],{padding:[50,50]});
  });
` : ''}

${dLat && dLng ? `
// Conductor animado
let driverMarker = L.marker([${dLat},${dLng}],{icon:mkIcon('#facc15','🚕',false)}).addTo(map);
driverMarker.bindPopup('<b>Tu conductor</b>');

// Escuchar actualizaciones de posición del conductor
window.addEventListener('message', function(e){
  try {
    const d = JSON.parse(e.data);
    if(d.type==='driverMove'){
      driverMarker.setLatLng([d.lat,d.lng]);
      // Dibujar ruta del conductor al origen
    }
  } catch(err){}
});

// Ajustar vista para mostrar conductor y origen
map.fitBounds([[${originLat},${originLng}],[${dLat},${dLng}]],{padding:[60,60]});
` : ''}

// Clic en mapa
map.on('click',function(e){
  window.parent.postMessage(JSON.stringify({type:'locationSelected',lat:e.latlng.lat,lng:e.latlng.lng}),'*');
});

// Estilo CSS para pulse
const style = document.createElement('style');
style.textContent = '@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(0,200,160,0.7)}70%{box-shadow:0 0 0 10px rgba(0,200,160,0)}100%{box-shadow:0 0 0 0 rgba(0,200,160,0)}}';
document.head.appendChild(style);
</script>
</body></html>`;

  // Enviar posición actualizada del conductor al iframe
  useEffect(() => {
    if (!driverPos || !iframeRef.current) return;
    try {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ type:'driverMove', lat:driverPos.lat, lng:driverPos.lng }), '*'
      );
    } catch {}
  }, [driverPos]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'locationSelected' && onLocationSelect) onLocationSelect(d.lat, d.lng);
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onLocationSelect]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      style={{ width:'100%', height, border:'none', borderRadius:'16px', display:'block' }}
      sandbox="allow-scripts allow-same-origin allow-popups"
      title="map"
    />
  );
};


// Input simple para direcciones
const AddressInput: React.FC<{
  onSelect: (loc: Location) => void; placeholder: string; value?: string;
}> = ({ onSelect, placeholder, value }) => {
  const [inputValue, setInputValue] = useState(value || '');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      // Simular geocodificación simple
      const zone = ZONES.find(z => z.name.toLowerCase().includes(inputValue.toLowerCase()));
      if (zone) {
        onSelect({ lat: zone.lat, lng: zone.lng, address: zone.name });
      } else {
        // Ubicación por defecto si no se encuentra
        onSelect({ lat: 3.7523, lng: 8.7737, address: inputValue });
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit} style={{ width:'100%' }}>
      <input 
        type="text" 
        placeholder={placeholder} 
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleSubmit}
        style={{ 
          width:'100%', 
          padding:'12px 14px', 
          background:'rgba(255,255,255,0.05)', 
          border:'1px solid #E8EEF5', 
          borderRadius:'10px', 
          color:'#fff', 
          fontSize:'14px', 
          outline:'none', 
          fontFamily:'inherit', 
          boxSizing:'border-box' 
        }}
      />
    </form>
  );
};

// Geolocalización real del navegador con fallback a Malabo
const useMockGeolocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, address: 'Tu ubicación actual' }),
        () => setLocation({ lat: 3.7523, lng: 8.7371, address: 'Centro Malabo' })
      );
    } else {
      setLocation({ lat: 3.7523, lng: 8.7371, address: 'Centro Malabo' });
    }
  }, []);
  return location;
};

// ─── ICONOS ───────────────────────────────────────────────────────────────────
const TaxiIcon = ({ size=24, color='#FFD700', filled=false }: { size?:number; color?:string; filled?:boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 11L6 7C6.5 5 8 4 10 4H14C16 4 17.5 5 18 7L19 11V17C19 17.55 18.55 18 18 18H17C16.45 18 16 17.55 16 17V16H8V17C8 17.55 7.55 18 7 18H6C5.45 18 5 17.55 5 17V11Z" fill={filled?color:'none'} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="7.5" cy="18.5" r="1.5" fill={color}/>
    <circle cx="16.5" cy="18.5" r="1.5" fill={color}/>
    <path d="M7 11H17V7.5C17 6.67 16.33 6 15.5 6H8.5C7.67 6 7 6.67 7 7.5V11Z" fill={filled?'rgba(255,255,255,0.3)':'none'} stroke={color} strokeWidth="1.5"/>
    <rect x="10" y="3" width="4" height="2" rx="0.5" fill={color}/>
  </svg>
);
const UserIcon = ({ size=24, color='#4A90E2', filled=false }: { size?:number; color?:string; filled?:boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" fill={filled?color:'none'} stroke={color} strokeWidth="2"/>
    <path d="M4 20C4 16.69 7.58 14 12 14C16.42 14 20 16.69 20 20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LocationIcon = ({ size=24, color='#FF4444', filled=false }: { size?:number; color?:string; filled?:boolean }) => (  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill={filled?color:'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="9" r="2.5" fill={filled?'white':'none'} stroke={color} strokeWidth="2"/>
  </svg>
);
// ─── ICONOS DE VEHÍCULOS SVG ÚNICOS ──────────────────────────────────────────
const TaxiStandardIcon = ({ size=40, color='#FFD700', filled=false }: { size?:number; color?:string; filled?:boolean }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {/* Letrero TAXI en el techo */}
    <rect x="26" y="10" width="12" height="6" rx="1.5" fill={color}/>
    <text x="32" y="15" fontSize="4.5" textAnchor="middle" fill="#1E293B" fontWeight="bold">TAXI</text>
    {/* Techo inclinado sedán */}
    <path d="M10 30 L16 20 L48 20 L54 30Z" fill={filled?color:'none'} stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    {/* Cuerpo */}
    <rect x="6" y="30" width="52" height="13" rx="3" fill={filled?color:'none'} stroke={color} strokeWidth="2"/>
    {/* 2 ventanas */}
    <rect x="17" y="22" width="12" height="8" rx="1" fill={filled?'rgba(255,255,255,0.45)':'none'} stroke={color} strokeWidth="1.5"/>
    <rect x="35" y="22" width="12" height="8" rx="1" fill={filled?'rgba(255,255,255,0.45)':'none'} stroke={color} strokeWidth="1.5"/>
    {/* Ruedas con llanta */}
    <circle cx="17" cy="43" r="6" fill="#1E293B" stroke={color} strokeWidth="2"/>
    <circle cx="47" cy="43" r="6" fill="#1E293B" stroke={color} strokeWidth="2"/>
    <circle cx="17" cy="43" r="2.5" fill={color} opacity="0.5"/>
    <circle cx="47" cy="43" r="2.5" fill={color} opacity="0.5"/>
    {/* Faros */}
    <rect x="55" y="32" width="4" height="5" rx="1" fill="#FFFDE7"/>
    <rect x="5" y="32" width="4" height="5" rx="1" fill="#FFFDE7"/>
  </svg>
);
const ComfortIcon = ({ size=40, color='#4A90E2', filled=false }: { size?:number; color?:string; filled?:boolean }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {/* Estrella premium */}
    <path d="M32 8L34 13H39L35 16L37 21L32 18L27 21L29 16L25 13H30Z" fill="#FFD700"/>
    {/* Techo fastback muy inclinado — berlina larga */}
    <path d="M8 32 L14 20 L50 20 L56 32Z" fill={filled?color:'none'} stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    {/* Cuerpo largo y bajo */}
    <rect x="4" y="32" width="56" height="11" rx="4" fill={filled?color:'none'} stroke={color} strokeWidth="2"/>
    {/* 3 ventanas largas */}
    <rect x="15" y="22" width="13" height="10" rx="1" fill={filled?'rgba(255,255,255,0.45)':'none'} stroke={color} strokeWidth="1.5"/>
    <rect x="30" y="22" width="11" height="10" rx="1" fill={filled?'rgba(255,255,255,0.45)':'none'} stroke={color} strokeWidth="1.5"/>
    <rect x="43" y="24" width="9" height="8" rx="1" fill={filled?'rgba(255,255,255,0.45)':'none'} stroke={color} strokeWidth="1.5"/>
    {/* Ruedas grandes */}
    <circle cx="15" cy="43" r="6" fill="#1E293B" stroke={color} strokeWidth="2"/>
    <circle cx="49" cy="43" r="6" fill="#1E293B" stroke={color} strokeWidth="2"/>
    <circle cx="15" cy="43" r="2.5" fill={color} opacity="0.5"/>
    <circle cx="49" cy="43" r="2.5" fill={color} opacity="0.5"/>
    {/* Franja lateral elegante */}
    <line x1="6" y1="37" x2="58" y2="37" stroke={color} strokeWidth="1" opacity="0.4"/>
  </svg>
);
const XLIcon = ({ size=40, color='#10B981', filled=false }: { size?:number; color?:string; filled?:boolean }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {/* Furgoneta alta con cabina diferenciada */}
    <rect x="4" y="16" width="56" height="28" rx="3" fill={filled?color:'none'} stroke={color} strokeWidth="2"/>
    {/* Cabina delantera */}
    <path d="M4 22 L4 16 L18 16 L18 22Z" fill={filled?color:'none'} stroke={color} strokeWidth="1.5"/>
    {/* 3 ventanas laterales */}
    <rect x="6" y="18" width="10" height="8" rx="1" fill={filled?'rgba(255,255,255,0.45)':'none'} stroke={color} strokeWidth="1.5"/>
    <rect x="20" y="18" width="12" height="8" rx="1" fill={filled?'rgba(255,255,255,0.45)':'none'} stroke={color} strokeWidth="1.5"/>
    <rect x="36" y="18" width="12" height="8" rx="1" fill={filled?'rgba(255,255,255,0.45)':'none'} stroke={color} strokeWidth="1.5"/>
    {/* Puerta corredera */}
    <line x1="32" y1="16" x2="32" y2="44" stroke={color} strokeWidth="1.5" strokeDasharray="3,2"/>
    {/* Badge XL */}
    <rect x="50" y="20" width="8" height="6" rx="1" fill={color}/>
    <text x="54" y="25" fontSize="5" textAnchor="middle" fill="#fff" fontWeight="bold">XL</text>
    {/* Ruedas */}
    <circle cx="14" cy="44" r="7" fill="#1E293B" stroke={color} strokeWidth="2"/>
    <circle cx="50" cy="44" r="7" fill="#1E293B" stroke={color} strokeWidth="2"/>
    <circle cx="14" cy="44" r="3" fill={color} opacity="0.5"/>
    <circle cx="50" cy="44" r="3" fill={color} opacity="0.5"/>
  </svg>
);
const MujerGQIcon = ({ size=40, color='#EC4899', filled=false }: { size?:number; color?:string; filled?:boolean }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {/* Símbolo femenino arriba a la derecha */}
    <circle cx="54" cy="11" r="5.5" stroke={color} strokeWidth="2"/>
    <line x1="54" y1="16.5" x2="54" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="51" y1="20" x2="57" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    {/* Techo redondeado elegante */}
    <path d="M12 30 L18 20 L46 20 L52 30Z" fill={filled?color:'none'} stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    {/* Cuerpo */}
    <rect x="8" y="30" width="44" height="13" rx="4" fill={filled?color:'none'} stroke={color} strokeWidth="2"/>
    {/* Ventanas */}
    <rect x="19" y="22" width="11" height="8" rx="1.5" fill={filled?'rgba(255,255,255,0.45)':'none'} stroke={color} strokeWidth="1.5"/>
    <rect x="33" y="22" width="11" height="8" rx="1.5" fill={filled?'rgba(255,255,255,0.45)':'none'} stroke={color} strokeWidth="1.5"/>
    {/* Corazón en la puerta */}
    <path d="M28 36 C28 34.5 26.5 33.5 25.5 35 C24.5 36.5 26.5 38.5 28 40 C29.5 38.5 31.5 36.5 30.5 35 C29.5 33.5 28 34.5 28 36Z" fill={color} opacity="0.8"/>
    {/* Ruedas */}
    <circle cx="16" cy="43" r="6" fill="#1E293B" stroke={color} strokeWidth="2"/>
    <circle cx="44" cy="43" r="6" fill="#1E293B" stroke={color} strokeWidth="2"/>
    <circle cx="16" cy="43" r="2.5" fill={color} opacity="0.5"/>
    <circle cx="44" cy="43" r="2.5" fill={color} opacity="0.5"/>
    {/* Destellos */}
    <circle cx="8" cy="20" r="1.5" fill="#FFD700"/>
    <circle cx="12" cy="16" r="1" fill="#FFD700"/>
  </svg>
);
const CargoVehicleIcon = ({ size=40, color='#F59E0B', filled=false }: { size?:number; color?:string; filled?:boolean }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {/* Cabina del camión */}
    <rect x="4" y="28" width="22" height="22" rx="2" fill={filled?color:'none'} stroke={color} strokeWidth="2"/>
    {/* Caja de carga separada y más alta */}
    <rect x="28" y="20" width="32" height="30" rx="2" fill={filled?color:'none'} stroke={color} strokeWidth="2"/>
    {/* Ventana cabina */}
    <rect x="6" y="30" width="14" height="10" rx="1" fill={filled?'rgba(255,255,255,0.45)':'none'} stroke={color} strokeWidth="1.5"/>
    {/* Líneas de carga horizontales */}
    <line x1="32" y1="28" x2="56" y2="28" stroke={color} strokeWidth="1.5"/>
    <line x1="32" y1="35" x2="56" y2="35" stroke={color} strokeWidth="1.5"/>
    <line x1="32" y1="42" x2="56" y2="42" stroke={color} strokeWidth="1.5"/>
    {/* División vertical caja */}
    <line x1="44" y1="20" x2="44" y2="50" stroke={color} strokeWidth="1.5"/>
    {/* Ruedas */}
    <circle cx="13" cy="50" r="6" fill="#1E293B" stroke={color} strokeWidth="2"/>
    <circle cx="51" cy="50" r="6" fill="#1E293B" stroke={color} strokeWidth="2"/>
    <circle cx="13" cy="50" r="2.5" fill={color} opacity="0.5"/>
    <circle cx="51" cy="50" r="2.5" fill={color} opacity="0.5"/>
    {/* Parachoques delantero */}
    <rect x="2" y="44" width="6" height="4" rx="1" fill={color} opacity="0.7"/>
  </svg>
);
const SUVVehicleIcon = ({ size=40, color='#8B5CF6', filled=false }: { size?:number; color?:string; filled?:boolean }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {/* Barras de techo — distintivo del SUV */}
    <line x1="16" y1="13" x2="48" y2="13" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="20" y1="13" x2="20" y2="18" stroke={color} strokeWidth="2"/>
    <line x1="44" y1="13" x2="44" y2="18" stroke={color} strokeWidth="2"/>
    {/* Techo alto y cuadrado */}
    <rect x="10" y="18" width="44" height="14" rx="2" fill={filled?color:'none'} stroke={color} strokeWidth="2"/>
    {/* Cuerpo alto */}
    <rect x="8" y="30" width="48" height="13" rx="3" fill={filled?color:'none'} stroke={color} strokeWidth="2"/>
    {/* Ventanas cuadradas grandes */}
    <rect x="12" y="20" width="16" height="10" rx="1" fill={filled?'rgba(255,255,255,0.45)':'none'} stroke={color} strokeWidth="1.5"/>
    <rect x="36" y="20" width="16" height="10" rx="1" fill={filled?'rgba(255,255,255,0.45)':'none'} stroke={color} strokeWidth="1.5"/>
    {/* Ruedas grandes con llanta doble */}
    <circle cx="18" cy="43" r="7" fill="#1E293B" stroke={color} strokeWidth="2.5"/>
    <circle cx="46" cy="43" r="7" fill="#1E293B" stroke={color} strokeWidth="2.5"/>
    <circle cx="18" cy="43" r="3" fill={color} opacity="0.5"/>
    <circle cx="46" cy="43" r="3" fill={color} opacity="0.5"/>
    {/* Parachoques prominente */}
    <rect x="2" y="36" width="7" height="5" rx="1.5" fill={color} opacity="0.7"/>
    <rect x="55" y="36" width="7" height="5" rx="1.5" fill={color} opacity="0.7"/>
  </svg>
);
const MiniVanVehicleIcon = ({ size=40, color='#06B6D4', filled=false }: { size?:number; color?:string; filled?:boolean }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {/* Techo redondeado tipo monovolumen — muy diferente al SUV cuadrado */}
    <path d="M8 32 Q8 16 32 16 Q56 16 56 32Z" fill={filled?color:'none'} stroke={color} strokeWidth="2"/>
    {/* Cuerpo */}
    <rect x="6" y="32" width="52" height="12" rx="3" fill={filled?color:'none'} stroke={color} strokeWidth="2"/>
    {/* Parabrisas inclinado */}
    <path d="M10 32 Q10 22 20 22 L20 32Z" fill={filled?'rgba(255,255,255,0.45)':'none'} stroke={color} strokeWidth="1.5"/>
    {/* Ventana central grande */}
    <rect x="22" y="20" width="14" height="12" rx="1" fill={filled?'rgba(255,255,255,0.45)':'none'} stroke={color} strokeWidth="1.5"/>
    {/* Ventana trasera */}
    <rect x="38" y="22" width="14" height="10" rx="1" fill={filled?'rgba(255,255,255,0.45)':'none'} stroke={color} strokeWidth="1.5"/>
    {/* Ruedas */}
    <circle cx="17" cy="44" r="6" fill="#1E293B" stroke={color} strokeWidth="2"/>
    <circle cx="47" cy="44" r="6" fill="#1E293B" stroke={color} strokeWidth="2"/>
    <circle cx="17" cy="44" r="2.5" fill={color} opacity="0.5"/>
    <circle cx="47" cy="44" r="2.5" fill={color} opacity="0.5"/>
    {/* Badge MINI */}
    <rect x="26" y="36" width="12" height="6" rx="1.5" fill={color}/>
    <text x="32" y="41" fontSize="4.5" textAnchor="middle" fill="#fff" fontWeight="bold">MINI</text>
  </svg>
);
const MotoIcon = ({ size=40, color='#FFD700' }: { size?:number; color?:string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <circle cx="16" cy="44" r="9" stroke={color} strokeWidth="2.5"/>
    <circle cx="48" cy="44" r="9" stroke={color} strokeWidth="2.5"/>
    <path d="M25 44h14M32 44V28l8-6h10l3 12H16l6-6h8l2 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M40 22l3-6h6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="16" cy="44" r="4" fill="#1E293B"/>
    <circle cx="48" cy="44" r="4" fill="#1E293B"/>
  </svg>
);

// Helper para obtener el icono por tipo de vehículo
const getVehicleIcon = (id: string, size=36, color='#FFD700', filled=false) => {
  switch(id) {
    case 'moto':    return <MotoIcon size={size} color={color}/>;
    case 'basic':   return <TaxiStandardIcon size={size} color={color} filled={filled}/>;
    case 'comfort': return <ComfortIcon size={size} color={color} filled={filled}/>;
    case 'suv':     return <SUVVehicleIcon size={size} color={color} filled={filled}/>;
    case 'xl':      return <XLIcon size={size} color={color} filled={filled}/>;
    case 'minivan': return <MiniVanVehicleIcon size={size} color={color} filled={filled}/>;
    case 'mujer':   return <MujerGQIcon size={size} color={color} filled={filled}/>;
    case 'cargo':   return <CargoVehicleIcon size={size} color={color} filled={filled}/>;
    default:        return <TaxiStandardIcon size={size} color={color} filled={filled}/>;
  }
};
const StarIcon = ({ size=20, filled=false, color='#FFB800' }: { size?:number; filled?:boolean; color?:string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled?color:'none'} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ShieldIcon = ({ size=16, color='#00c8a0' }: { size?:number; color?:string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
    <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z"/>
  </svg>
);
const SafetyIcon = ({ size=20 }: { size?:number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
);
const NavigationIcon = ({ size=24, color='#4A90E2', rotation=0 }: { size?:number; color?:string; rotation?:number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform:`rotate(${rotation}deg)` }}>
    <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" fill={color} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── SERVICE CARD ─────────────────────────────────────────────────────────────
const ServiceCard: React.FC<{
  title: string; subtitle: string; price: string; time: string;
  rating: number; onSelect: () => void; selected?: boolean; iconColor?: string;
  capacity?: number; luggage?: number; premium?: boolean;
}> = ({ title, subtitle, price, time, rating, onSelect, selected=false, iconColor='#FFD700', capacity, luggage, premium }) => (
  <button onClick={onSelect} style={{
    width:'100%', background: selected ? '#FFFBF0' : '#fff',
    border: `2px solid ${selected ? '#FFD700' : 'transparent'}`,
    borderRadius:'16px', padding:'14px 16px', marginBottom:'10px',
    cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center',
    justifyContent:'space-between', fontFamily:'inherit',
    boxShadow:'0 2px 8px rgba(0,0,0,0.08)', transition:'all 0.15s',
  }}>
    <div style={{ display:'flex', alignItems:'center', flex:1, gap:'12px' }}>
      <div style={{ width:'56px', height:'56px', borderRadius:'14px', background:`${iconColor}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, position:'relative', cursor:'help' }}
        title={title}
        onMouseEnter={e => {
          const tip = document.createElement('div');
          tip.id = 'vehicle-tip';
          tip.textContent = title;
          tip.style.cssText = 'position:fixed;background:#1E293B;color:#fff;padding:5px 10px;border-radius:8px;font-size:12px;font-weight:700;pointer-events:none;z-index:9999;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)';
          document.body.appendChild(tip);
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          tip.style.left = (r.left + r.width/2 - tip.offsetWidth/2) + 'px';
          tip.style.top = (r.top - 36) + 'px';
        }}
        onMouseLeave={() => { const t = document.getElementById('vehicle-tip'); if(t) t.remove(); }}
      >
        {getVehicleIcon(
          title==='MiMoto'?'moto':title==='Comfort'?'comfort':title==='SUV'?'suv':title==='Van XL'?'xl':title==='Minivan'?'minivan':title==='MujerGQ'?'mujer':title==='Cargo'?'cargo':'basic',
          36, iconColor, selected
        )}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px' }}>
          <span style={{ fontSize:'15px', fontWeight:'700', color:'#1A2B4A' }}>{title}</span>
          {premium && <span style={{ background:'#FFD70020', color:'#B8860B', fontSize:'9px', fontWeight:'700', padding:'1px 6px', borderRadius:'4px' }}>PREMIUM</span>}
        </div>
        <div style={{ fontSize:'12px', color:'#8A9BB5', marginBottom:'4px' }}>{subtitle}</div>
        <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
          <StarIcon size={12} filled color="#FFB800"/>
          <span style={{ fontSize:'12px', fontWeight:'600', color:'#1A2B4A' }}>{rating}</span>
          <span style={{ fontSize:'12px', color:'#8A9BB5' }}>• {time}</span>
          {capacity && <span style={{ fontSize:'12px', color:'#8A9BB5' }}>• 👤{capacity}</span>}
        </div>
      </div>
    </div>
    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px', flexShrink:0 }}>
      <span style={{ fontSize:'17px', fontWeight:'700', color:'#1A2B4A' }}>{price}</span>
      {selected && <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'linear-gradient(135deg,#48CAE4,#0096C7)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <CheckIcon size={12}/>
      </div>}
    </div>
  </button>
);

// ─── BOTÓN PROFESIONAL ────────────────────────────────────────────────────────
type BtnType = 'primary' | 'secondary' | 'outline';
const PBtn: React.FC<{
  title: string; onPress: () => void; type?: BtnType;
  icon?: React.ReactNode; disabled?: boolean; fullWidth?: boolean;
}> = ({ title, onPress, type='primary', icon, disabled=false, fullWidth=true }) => {
  const styles: Record<BtnType, React.CSSProperties> = {
    primary: {
      background: disabled ? 'rgba(0,200,160,0.3)' : 'linear-gradient(135deg,#00c8a0,#00b4e6)',
      color: '#fff',
      boxShadow: disabled ? 'none' : '0 4px 16px rgba(255,215,0,0.35)',
    },
    secondary: {
      background: disabled ? 'rgba(30,41,59,0.5)' : '#1E293B',
      color: '#fff',
      boxShadow: disabled ? 'none' : '0 4px 12px rgba(0,0,0,0.25)',
    },
    outline: {
      background: 'transparent',
      color: disabled ? 'rgba(255,215,0,0.4)' : '#FFD700',
      border: `2px solid ${disabled ? 'rgba(255,215,0,0.3)' : '#FFD700'}`,
    },
  };
  return (
    <button
      onClick={disabled ? undefined : onPress}
      disabled={disabled}
      style={{
        width: fullWidth ? '100%' : 'auto',
        padding: '15px 28px',
        borderRadius: '12px',
        border: type === 'outline' ? `2px solid ${disabled ? 'rgba(255,215,0,0.3)' : '#FFD700'}` : 'none',
        fontSize: '15px',
        fontWeight: '700',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontFamily: 'inherit',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.15s',
        ...styles[type],
      }}
    >
      {icon && <span style={{ display:'flex', alignItems:'center' }}>{icon}</span>}
      {title}
    </button>
  );
};

const WalletIcon = ({ size=24, color='#10B981', filled=false }: { size?:number; color?:string; filled?:boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="6" width="18" height="12" rx="2" fill={filled?color:'none'} stroke={color} strokeWidth="2"/>
    <path d="M3 10H21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="17" cy="14" r="1.5" fill={color}/>
  </svg>
);
const CheckIcon = ({ size=20 }: { size?:number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

// ─── CENTRO DE SEGURIDAD ─────────────────────────────────────────────────────
const SafetyCenter: React.FC<{ onClose: () => void; driver?: Driver | null }> = ({ onClose, driver }) => {
  const [shareLocation, setShareLocation] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [contactSaved, setContactSaved] = useState(false);

  const callEmergency = () => {
    if (window.confirm('¿Llamar al 112 - Emergencias?')) {
      try { const {shell} = (window as any).require('electron'); shell.openExternal('tel:112'); }
      catch { alert('Llamando al 112 - Emergencias...'); }
    }
  };

  const saveContact = () => {
    if (emergencyContact.trim()) { setContactSaved(true); setTimeout(() => setContactSaved(false), 2000); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ background:'#EEF2F7', borderRadius:'24px', maxWidth:'400px', width:'100%', maxHeight:'80vh', overflow:'auto', padding:'24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <div style={{ fontSize:'20px', fontWeight:'800', color:'#fff', display:'flex', alignItems:'center', gap:'8px' }}>
            <ShieldIcon size={24} color="#facc15"/> Centro de Seguridad
          </div>
          <button onClick={onClose} style={{ background:'#EFF6FF', border:'none', borderRadius:'50%', width:'32px', height:'32px', cursor:'pointer', color:'#fff', fontSize:'16px' }}>✕</button>
        </div>
        <button onClick={callEmergency} style={{ width:'100%', padding:'20px', background:'linear-gradient(135deg,#dc2626,#ef4444)', border:'none', borderRadius:'16px', marginBottom:'20px', cursor:'pointer' }}>
          <div style={{ fontSize:'22px', fontWeight:'800', color:'#fff', marginBottom:'4px' }}>🚨 EMERGENCIA 🚨</div>
          <div style={{ fontSize:'12px', color:'#5A7090' }}>Contactar a las autoridades — 112</div>
        </button>
        {driver && (
          <div style={{ background:'#FFFFFF', borderRadius:'16px', padding:'16px', marginBottom:'16px' }}>
            <div style={{ fontSize:'13px', fontWeight:'700', color:'#8A9BB5', marginBottom:'10px' }}>Información del conductor</div>
            {[['Nombre',driver.name],['Vehículo',driver.car],['Matrícula',driver.plate],['Teléfono',driver.phone]].map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                <span style={{ fontSize:'13px', color:'#8A9BB5' }}>{l}</span>
                <span style={{ fontSize:'13px', fontWeight:'600', color:'#1A2B4A' }}>{v}</span>
              </div>
            ))}
            <button onClick={() => { try { const {shell}=(window as any).require('electron'); shell.openExternal(`tel:${driver.phone}`); } catch { alert(`Llamando a ${driver.name}...`); }}}
              style={{ width:'100%', marginTop:'8px', padding:'10px', background:'rgba(0,200,160,0.15)', border:'1px solid rgba(0,200,160,0.3)', borderRadius:'10px', color:'#00B4D8', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>
              📞 Llamar al conductor
            </button>
          </div>
        )}
        <div style={{ background:'#FFFFFF', borderRadius:'16px', padding:'16px', marginBottom:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
            <span style={{ fontSize:'14px', fontWeight:'600', color:'#1A2B4A' }}>Compartir ubicación</span>
            <button onClick={() => setShareLocation(p => !p)} style={{ width:'44px', height:'24px', borderRadius:'12px', background: shareLocation ? '#00c8a0' : 'rgba(255,255,255,0.15)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
              <div style={{ position:'absolute', top:'2px', left: shareLocation ? '22px' : '2px', width:'20px', height:'20px', borderRadius:'50%', background:'#FFFFFF', transition:'left 0.2s' }}/>
            </button>
          </div>
          <div style={{ fontSize:'12px', color:'#8A9BB5' }}>{shareLocation ? '✅ Compartiendo en tiempo real' : 'Activa para compartir tu ubicación'}</div>
        </div>
        <div style={{ background:'#FFFFFF', borderRadius:'16px', padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:'14px', fontWeight:'600', color:'#fff', marginBottom:'10px' }}>Contacto de emergencia</div>
          <input type="tel" placeholder="+240 XXX XXX XXX" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)}
            style={{ width:'100%', padding:'11px 12px', background:'rgba(255,255,255,0.05)', border:'1px solid #E8EEF5', borderRadius:'10px', color:'#fff', fontSize:'14px', marginBottom:'10px', boxSizing:'border-box', outline:'none', fontFamily:'inherit' }}/>
          <button onClick={saveContact} style={{ width:'100%', padding:'11px', background: contactSaved ? 'rgba(0,200,160,0.2)' : 'rgba(250,204,21,0.15)', border:`1px solid ${contactSaved ? 'rgba(0,200,160,0.4)' : 'rgba(250,204,21,0.4)'}`, borderRadius:'10px', color: contactSaved ? '#00c8a0' : '#facc15', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>
            {contactSaved ? '✅ Contacto guardado' : 'Guardar contacto'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export const MiTaxiView: React.FC<Props> = ({ onBack, userBalance, onDebit, userName='Usuario', userPhone='' }) => {
  const [screen, setScreen]             = useState<Screen>('home');
  const [origin, setOrigin]             = useState<Location | null>(null);
  const [destination, setDestination]   = useState<Location | null>(null);
  const [rideType, setRideType]         = useState<RideType>(RIDE_TYPES[1]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);
  const [driver, setDriver]             = useState<Driver | null>(null);
  const [rating, setRating]             = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [searchTimer, setSearchTimer]   = useState(0);
  const [driverOnline, setDriverOnline] = useState(false);
  const [driverEarnings, setDriverEarnings]     = useState(45800);
  const [driverTripsToday, setDriverTripsToday] = useState(7);
  const [showSafety, setShowSafety]     = useState(false);
  const [showChat, setShowChat]         = useState(false);
  const [chatMessages, setChatMessages] = useState<{from:'me'|'driver';text:string;time:string}[]>([]);
  const [chatInput, setChatInput]       = useState('');
  const [qrScanning, setQrScanning]     = useState(false);
  const [qrPaid, setQrPaid]             = useState(false);
  const [driverForm, setDriverForm]     = useState({ name:'', plate:'', car:'', phone:'', dni:'' });
  const [driverRegistered, setDriverRegistered] = useState(false);
  const [activeRequest, setActiveRequest]       = useState<any>(null);
  const [driverArrivalCountdown, setDriverArrivalCountdown] = useState<number|null>(null);
  const [showArrivalNotif, setShowArrivalNotif] = useState(false);
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);
  const [requests, setRequests] = useState([
    { id:'1', from:'Centro Malabo', to:'Aeropuerto SSG', passenger:'Ana G.',   price:2500, dist:'4.2 km', time:'12 min', rating:4.8 },
    { id:'2', from:'Puerto',        to:'Ela Nguema',     passenger:'Pedro M.', price:1800, dist:'2.8 km', time:'8 min',  rating:4.9 },
    { id:'3', from:'Caracolas',     to:'Sipopo',         passenger:'Maria E.', price:3200, dist:'6.1 km', time:'18 min', rating:4.7 },
  ]);

  const userLocation = useMockGeolocation();
  const finalPrice = Math.round(BASE_PRICE * rideType.multiplier * (promoApplied ? 0.85 : 1));

  useEffect(() => { if (userLocation && !origin) setOrigin(userLocation); }, [userLocation]);

  useEffect(() => {
    if (screen !== 'searching') return;
    setSearchTimer(0);
    const iv = setInterval(() => setSearchTimer(p => p+1), 1000);
    const to = setTimeout(() => { clearInterval(iv); setDriver(DRIVERS[Math.floor(Math.random()*DRIVERS.length)]); setScreen('matched'); }, 2500);
    return () => { clearInterval(iv); clearTimeout(to); };
  }, [screen]);

  const reset = () => { setScreen('home'); setOrigin(userLocation||null); setDestination(null); setDriver(null); setRating(0); setPromoApplied(false); setShowSafety(false); setShowArrivalNotif(false); setDriverArrivalCountdown(null); };

  // Auto-llegada del conductor en pantalla onway
  useEffect(() => {
    if (screen !== 'onway' || !driver) return;
    const etaSeconds = 15; // simular llegada en 15 segundos
    setDriverArrivalCountdown(etaSeconds);
    setShowArrivalNotif(false);
    const iv = setInterval(() => {
      setDriverArrivalCountdown(p => {
        if (p === null || p <= 1) {
          clearInterval(iv);
          // Conductor llegó: notificación + mensaje automático en chat
          setShowArrivalNotif(true);
          const t = new Date().toLocaleTimeString('es', { hour:'2-digit', minute:'2-digit' });
          setChatMessages(prev => [...prev, { from:'driver', text:`¡He llegado! Estoy esperándote. Matrícula: ${driver.plate} 🚗`, time:t }]);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [screen, driver]);

  const rideIconEmoji = (icon: string) => ({ moto:'🛵', taxi:'🚕', comfort:'🚙', xl:'🚐', mujer:'👩', cargo:'📦' }[icon] || '🚕');

  const Header = ({ title, sub, back, showSafety: sb=false }: { title:string; sub?:string; back?:()=>void; showSafety?:boolean }) => (
    <div style={{ padding:'44px 16px 12px', background:'linear-gradient(135deg,#48CAE4,#0096C7)', display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
      <button onClick={back||onBack} style={{ background:'rgba(0,200,160,0.15)', border:'none', borderRadius:'50%', width:'34px', height:'34px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff', flexShrink:0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </button>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:'16px', fontWeight:'700', color:'#1A2B4A' }}>{title}</div>
        {sub && <div style={{ fontSize:'11px', color:'#5A7090', marginTop:'1px' }}>{sub}</div>}
      </div>
      {sb && <button onClick={() => setShowSafety(true)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:'34px', height:'34px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z"/></svg>
      </button>}
      <div style={{ background:'rgba(0,200,160,0.15)', borderRadius:'10px', padding:'4px 10px', textAlign:'right' }}>
        <div style={{ fontSize:'9px', color:'#5A7090', fontWeight:'600' }}>Saldo</div>
        <div style={{ fontSize:'12px', fontWeight:'700', color:'#1A2B4A' }}>{userBalance.toLocaleString()} XAF</div>
      </div>
    </div>
  );

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (screen === 'home') return (
    <div style={{ height:'100vh', background:'#EEF2F7', display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflow:'hidden' }}>
      {/* Header rediseñado — más visual, con regreso */}
      <div style={{ background:'linear-gradient(160deg,#0096C7 0%,#48CAE4 60%,#90E0EF 100%)', padding:'44px 16px 20px', flexShrink:0, position:'relative', overflow:'hidden' }}>
        {/* Círculos decorativos de fondo */}
        <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'140px', height:'140px', borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'-20px', left:'-20px', width:'100px', height:'100px', borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }}/>

        {/* Fila superior: regreso + acciones */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'20px', padding:'6px 12px 6px 8px', cursor:'pointer', color:'#fff' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            <span style={{ fontSize:'12px', fontWeight:'600' }}>Inicio</span>
          </button>
          <div style={{ display:'flex', gap:'8px' }}>
            <button onClick={() => setShowSafety(true)} style={{ width:'34px', height:'34px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z"/></svg>
            </button>
            <button style={{ width:'34px', height:'34px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <UserIcon size={16} color="#fff" filled/>
            </button>
          </div>
        </div>

        {/* Saludo */}
        <div style={{ marginBottom:'16px' }}>
          <div style={{ fontSize:'22px', fontWeight:'800', color:'#fff', letterSpacing:'-0.3px', marginBottom:'4px' }}>
            ¡Hola, {userName}! 👋
          </div>
          <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.85)' }}>¿A dónde quieres ir hoy?</div>
        </div>

        {/* Saldo — tarjeta flotante */}
        <div style={{ background:'rgba(255,255,255,0.18)', backdropFilter:'blur(10px)', padding:'12px 16px', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'space-between', border:'1px solid rgba(255,255,255,0.25)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <WalletIcon size={18} color="#fff" filled/>
            </div>
            <div>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.75)', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px' }}>Saldo EGCHAT</div>
              <div style={{ fontSize:'18px', fontWeight:'800', color:'#fff' }}>{userBalance.toLocaleString()} <span style={{ fontSize:'12px', fontWeight:'600' }}>XAF</span></div>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.75)', marginBottom:'2px' }}>MiTaxi GQ</div>
            <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
              <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#90E0EF' }}/>
              <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.9)', fontWeight:'600' }}>Activo</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'12px 14px 80px' }}>
        {/* Ubicación */}
        <div style={{ background:'#FFFFFF', padding:'12px 14px', borderRadius:'14px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', marginBottom:'10px', display:'flex', alignItems:'center', gap:'10px' }}>
          <LocationIcon size={18} color="#00c8a0" filled/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'10px', color:'#8A9BB5', fontWeight:'600' }}>UBICACIÓN ACTUAL</div>
            <div style={{ fontSize:'13px', fontWeight:'600', color:'#1A2B4A' }}>{userLocation?.address || 'Obteniendo ubicación...'}</div>
          </div>
          <button onClick={() => userLocation && setOrigin(userLocation)} style={{ width:'34px', height:'34px', borderRadius:'10px', background:'rgba(0,180,230,0.1)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <NavigationIcon size={16} color="#00b4e6"/>
          </button>
        </div>

        {/* Botones acción */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px' }}>
          <button onClick={() => setScreen('booking')} className="taxi-action-btn"
            style={{ background:'linear-gradient(135deg,#0096C7,#48CAE4)', border:'none', borderRadius:'14px', padding:'14px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', justifyContent:'center', transition:'all 0.2s ease', boxShadow:'0 4px 12px rgba(0,150,199,0.3)', fontFamily:'inherit' }}>
            <TaxiStandardIcon size={20} color="#fff" filled/>
            <span style={{ fontSize:'13px', fontWeight:'700', color:'#fff' }}>Pedir viaje</span>
          </button>
          <button onClick={() => setScreen(driverRegistered ? 'driver-home' : 'driver-register')} className="taxi-action-btn"
            style={{ background:'#FFFFFF', border:'1.5px solid #E8EEF5', borderRadius:'14px', padding:'14px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', justifyContent:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.05)', transition:'all 0.2s ease', fontFamily:'inherit' }}>
            <UserIcon size={20} color="#0096C7" filled/>
            <span style={{ fontSize:'13px', fontWeight:'700', color:'#0096C7' }}>Conducir</span>
          </button>
        </div>

        {/* Stats compactos */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px', marginBottom:'12px' }}>
          {[
            { v:'248', l:'Conductores', c:'#0096C7', icon:<TaxiStandardIcon size={16} color="#0096C7"/> },
            { v:'1.2K', l:'Viajes hoy', c:'#48CAE4', icon:<NavigationIcon size={16} color="#48CAE4"/> },
            { v:'4.9', l:'Rating', c:'#f59e0b', icon:<StarIcon size={14} filled color="#f59e0b"/> },
          ].map(s => (
            <div key={s.l} className="taxi-stat-card" style={{ background:'#FFFFFF', borderRadius:'12px', padding:'10px 8px', textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', transition:'all 0.2s ease', cursor:'default' }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:'4px' }}>{s.icon}</div>
              <div style={{ fontSize:'16px', fontWeight:'700', color:s.c }}>{s.v}</div>
              <div style={{ fontSize:'10px', color:'#8A9BB5' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Servicios — horizontal scroll */}
        <div style={{ fontSize:'13px', fontWeight:'700', color:'#1A2B4A', marginBottom:'8px' }}>Servicios disponibles</div>
        <div className="taxi-services-scroll" style={{ display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'6px', marginBottom:'12px', marginLeft:'-14px', marginRight:'-14px', paddingLeft:'14px', paddingRight:'14px', scrollSnapType:'x mandatory' }}>
          {RIDE_TYPES.map(rt => {
            // Colores únicos por tipo — solo para el icono
            const iconColor = rt.id==='moto' ? '#F97316'      // naranja moto
              : rt.id==='basic'   ? '#FFD700'                  // amarillo taxi Guinea
              : rt.id==='comfort' ? '#22C55E'                  // verde comfort
              : rt.id==='suv'     ? '#8B5CF6'                  // morado SUV
              : rt.id==='xl'      ? '#3B82F6'                  // azul van XL
              : rt.id==='minivan' ? '#06B6D4'                  // cyan minivan
              : rt.id==='mujer'   ? '#EC4899'                  // rosa MujerGQ
              : rt.id==='cargo'   ? '#EF4444'                  // rojo cargo
              : '#8A9BB5';
            const sel = rideType.id===rt.id;
            return (
              <button key={rt.id} onClick={() => { setRideType(rt); setScreen('booking'); }}
                className="taxi-service-btn"
                style={{
                  flexShrink:0, scrollSnapAlign:'start',
                  background: sel ? '#FFFFFF' : '#FFFFFF',
                  border: sel ? `2px solid ${iconColor}` : '1.5px solid #E8EEF5',
                  borderRadius:'14px', padding:'10px 12px', cursor:'pointer',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:'4px',
                  minWidth:'72px',
                  boxShadow: sel ? `0 4px 14px ${iconColor}40` : '0 2px 6px rgba(0,0,0,0.05)',
                  transition:'all 0.2s ease', fontFamily:'inherit'
                }}>
                {/* Icono con su color propio */}
                <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:`${iconColor}15`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {getVehicleIcon(rt.id, 28, iconColor, false)}
                </div>
                <span style={{ fontSize:'10px', fontWeight:'700', color:'#1A2B4A', marginTop:'2px' }}>{rt.label}</span>
                <span style={{ fontSize:'9px', color:'#8A9BB5' }}>{rt.waitTime}</span>
              </button>
            );
          })}
        </div>
        <style>{`
          .taxi-services-scroll { -webkit-overflow-scrolling: touch; }
          .taxi-services-scroll::-webkit-scrollbar { display: none; }
          .taxi-service-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.12) !important; border-color: #CBD5E1 !important; }
          .taxi-action-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,150,199,0.25) !important; opacity: 0.92; }
          .taxi-recent-btn:hover { background: #F0F8FF !important; border-color: #0096C7 !important; transform: translateX(2px); }
          .taxi-stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,150,199,0.15) !important; }
        `}</style>

        {/* Mapa conductores cercanos */}
        <div style={{ fontSize:'13px', fontWeight:'700', color:'#1A2B4A', marginBottom:'8px' }}>
          {rideType.id === 'all' ? 'Conductores cerca de ti' : `${rideType.label} cerca de ti`}
        </div>
        <div style={{ borderRadius:'14px', overflow:'hidden', marginBottom:'12px', height:'180px', position:'relative', boxShadow:'0 1px 4px rgba(0,0,0,0.1)' }}>
          <RealMap origin={userLocation} status="idle" height="180px" vehicleFilter={rideType.id}/>
          <div style={{ position:'absolute', top:'8px', left:'8px', background:'rgba(0,150,199,0.9)', borderRadius:'20px', padding:'4px 10px', display:'flex', alignItems:'center', gap:'5px', zIndex:10 }}>
            <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#90E0EF', animation:'pulse 1.5s infinite' }}/>
            <span style={{ fontSize:'10px', color:'#fff', fontWeight:'600' }}>
              {rideType.id === 'all' ? '10 disponibles' :
               rideType.id === 'taxi' ? '3 disponibles' :
               rideType.id === 'moto' ? '2 disponibles' :
               rideType.id === 'comfort' ? '2 disponibles' :
               rideType.id === 'suv' ? '1 disponible' :
               rideType.id === 'xl' ? '1 disponible' :
               rideType.id === 'mujer' ? '1 disponible' : '1 disponible'}
            </span>
          </div>
        </div>

        {/* Viajes recientes */}
        <div style={{ fontSize:'13px', fontWeight:'700', color:'#1A2B4A', marginBottom:'8px' }}>Recientes</div>
        {[{from:'Centro Malabo',to:'Aeropuerto SSG',date:'Hoy, 09:14',price:2500},{from:'Puerto',to:'Ela Nguema',date:'Ayer, 18:32',price:1800}].map((h,i) => (
          <button key={i} className="taxi-recent-btn" onClick={() => {
            const oz=ZONES.find(z=>z.name===h.from), dz=ZONES.find(z=>z.name===h.to);
            if(oz&&dz){setOrigin({lat:oz.lat,lng:oz.lng,address:h.from});setDestination({lat:dz.lat,lng:dz.lng,address:h.to});setScreen('booking');}
          }} style={{ width:'100%', background:'#FFFFFF', border:'1px solid #E8EEF5', borderRadius:'12px', padding:'11px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px', textAlign:'left', boxShadow:'0 2px 6px rgba(0,0,0,0.04)', transition:'all 0.2s ease', fontFamily:'inherit' }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:'rgba(0,150,199,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <LocationIcon size={16} color="#0096C7" filled/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'12px', fontWeight:'600', color:'#1A2B4A', marginBottom:'2px' }}>{h.from} → {h.to}</div>
              <div style={{ fontSize:'10px', color:'#8A9BB5' }}>{h.date}</div>
            </div>
            <div style={{ fontSize:'13px', fontWeight:'700', color:'#0096C7' }}>{h.price.toLocaleString()} XAF</div>
          </button>
        ))}
      </div>
      {showSafety && <SafetyCenter onClose={() => setShowSafety(false)} driver={driver}/>}
    </div>
  );

  // ── BOOKING ───────────────────────────────────────────────────────────────
  if (screen === 'booking') return (
    <div style={{ height:'100vh', background:'#EEF2F7', display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>
      {/* Mapa a pantalla completa */}
      <div style={{ position:'absolute', inset:0 }}>
        <RealMap origin={origin} destination={destination} status="idle" height="100%" onLocationSelect={(lat,lng) => {
          setDestination({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
        }}/>
      </div>

      {/* Header flotante */}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:20, padding:'52px 16px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
          <button onClick={() => setScreen('home')} style={{ width:'40px', height:'40px', borderRadius:'50%', background:'#FFFFFF', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.25)', flexShrink:0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div style={{ flex:1, background:'#FFFFFF', borderRadius:'12px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'10px', boxShadow:'0 2px 8px rgba(0,0,0,0.2)' }}>
            <LocationIcon size={20} color="#FF4444"/>
            <span style={{ fontSize:'15px', color: destination ? '#1E293B' : '#94A3B8', fontWeight: destination ? '600' : '400' }}>
              {destination?.address || '¿A dónde quieres ir?'}
            </span>
          </div>
        </div>
        {/* Origen */}
        <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:'12px', padding:'10px 14px', display:'flex', alignItems:'center', gap:'10px', boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
          <LocationIcon size={18} color="#00c8a0" filled/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'10px', color:'#8A9BB5', fontWeight:'600' }}>ORIGEN</div>
            <div style={{ fontSize:'13px', color:'#1A2B4A', fontWeight:'600' }}>{origin?.address || 'Obteniendo ubicación...'}</div>
          </div>
        </div>
      </div>

      {/* Botón centrar ubicación */}
      <button onClick={() => userLocation && setOrigin(userLocation)}
        style={{ position:'absolute', right:'16px', bottom: (destination || bookingSheetOpen) ? '320px' : '48px', zIndex:20, width:'48px', height:'48px', borderRadius:'50%', background:'#FFFFFF', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.25)', transition:'bottom 0.35s' }}>
        <NavigationIcon size={22} color="#1E293B"/>
      </button>

      {/* Panel inferior deslizable */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, zIndex:20,
        background:'#FFFFFF', borderTopLeftRadius:'24px', borderTopRightRadius:'24px',
        boxShadow:'0 -4px 20px rgba(0,0,0,0.15)',
        transform: (destination || bookingSheetOpen) ? 'translateY(0)' : 'translateY(calc(100% - 28px))',
        transition:'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        maxHeight:'70vh', overflowY: (destination || bookingSheetOpen) ? 'auto' : 'hidden',
      }}>
        {/* Handle — toca para abrir/cerrar */}
        <div
          onClick={() => setBookingSheetOpen(o => !o)}
          style={{ padding:'10px 0 6px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}
        >
          <div style={{ width:'40px', height:'4px', background:'#CBD5E1', borderRadius:'2px' }}/>
        </div>

        <div style={{ padding:'0 20px 32px' }}>
        {destination ? (
          <>
            {/* Destino seleccionado */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', background:'#FFFBF0', padding:'14px', borderRadius:'12px', border:'1px solid #FFD700', marginBottom:'16px' }}>
              <LocationIcon size={24} color="#FFD700" filled/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'12px', color:'#8A9BB5', fontWeight:'600', marginBottom:'2px' }}>DESTINO SELECCIONADO</div>
                <div style={{ fontSize:'14px', fontWeight:'700', color:'#1A2B4A' }}>{destination.address}</div>
              </div>
              <button onClick={() => setDestination(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#8A9BB5', fontSize:'18px' }}>✕</button>
            </div>

            {/* Tipos de viaje */}
            <div style={{ fontSize:'14px', fontWeight:'700', color:'#1A2B4A', marginBottom:'10px' }}>Elige tu servicio</div>
            {RIDE_TYPES.map(rt => (
              <ServiceCard
                key={rt.id}
                title={rt.label}
                subtitle={rt.sub}
                price={`${Math.round(BASE_PRICE * rt.multiplier * (promoApplied ? 0.85 : 1)).toLocaleString()} XAF`}
                time={rt.waitTime}
                rating={rt.id==='basic'?4.8:rt.id==='comfort'?4.9:rt.id==='mujer'?4.9:rt.id==='moto'?4.7:rt.id==='xl'?4.8:4.6}
                onSelect={() => setRideType(rt)}
                selected={rideType.id===rt.id}
                iconColor={rt.premium?'#00c8a0':rt.id==='mujer'?'#ec4899':rt.id==='moto'?'#f59e0b':rt.id==='suv'?'#00c8a0':rt.id==='xl'||rt.id==='minivan'?'#4A90E2':rt.id==='cargo'?'#f59e0b':'#FFD700'}
                capacity={rt.capacity}
                premium={rt.premium}
              />
            ))}

            {/* Precio y botón */}
            {origin && destination && (
              <div style={{ marginTop:'8px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                  <span style={{ fontSize:'13px', color:'#8A9BB5' }}>Total estimado</span>
                  <span style={{ fontSize:'20px', fontWeight:'800', color:'#1A2B4A' }}>{finalPrice.toLocaleString()} XAF</span>
                </div>
                <PBtn title="Ver vehículos disponibles" onPress={() => setScreen('vehicle-select')} type="primary" icon={<TaxiStandardIcon size={20} color="#1E293B" filled/>}/>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign:'center', padding:'8px 0 20px' }}>
            <div style={{ fontSize:'32px', marginBottom:'12px' }}>🗺️</div>
            <div style={{ fontSize:'17px', fontWeight:'700', color:'#1A2B4A', marginBottom:'6px' }}>Toca el mapa para seleccionar tu destino</div>
            <div style={{ fontSize:'13px', color:'#8A9BB5' }}>O elige una zona popular</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center', marginTop:'16px' }}>
              {ZONES.slice(0,6).map(z => (
                <button key={z.name} onClick={() => { setDestination({lat:z.lat,lng:z.lng,address:z.name}); setBookingSheetOpen(true); }}
                  style={{ background:'#EEF2F7', border:'none', borderRadius:'20px', padding:'8px 14px', fontSize:'12px', fontWeight:'600', color:'#1A2B4A', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' }}>
                  <LocationIcon size={12} color="#00c8a0" filled/>{z.name}
                </button>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );

  // ── VEHICLE SELECT ────────────────────────────────────────────────────────
  if (screen === 'vehicle-select') return (
    <div style={{ height:'100vh', background:'#EEF2F7', display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ background:'#FFFFFF', padding:'52px 20px 12px', borderBottom:'1px solid #E2E8F0', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
          <button onClick={() => setScreen('booking')} style={{ width:'40px', height:'40px', borderRadius:'50%', background:'#EEF2F7', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div style={{ fontSize:'17px', fontWeight:'700', color:'#1A2B4A' }}>Selecciona tu vehículo</div>
          <div style={{ width:'40px' }}/>
        </div>
        {/* Ruta */}
        <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:'#10B981', flexShrink:0 }}/>
            <div>
              <div style={{ fontSize:'11px', color:'#8A9BB5' }}>Origen</div>
              <div style={{ fontSize:'13px', fontWeight:'600', color:'#1A2B4A' }}>{origin?.address || 'Centro Malabo'}</div>
            </div>
          </div>
          <div style={{ width:'2px', height:'16px', background:'#E2E8F0', marginLeft:'5px' }}/>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:'#FF4444', flexShrink:0 }}/>
            <div>
              <div style={{ fontSize:'11px', color:'#8A9BB5' }}>Destino</div>
              <div style={{ fontSize:'13px', fontWeight:'600', color:'#1A2B4A' }}>{destination?.address || 'Destino'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de vehículos */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 120px' }}>
        {VEHICLE_CATEGORIES.map(cat => (
          <div key={cat.id} style={{ marginBottom:'20px' }}>
            <div style={{ fontSize:'15px', fontWeight:'700', color:'#1A2B4A', marginBottom:'10px', marginTop:'4px' }}>{cat.title}</div>
            {cat.vehicles.map(v => {
              const isSel = selectedVehicle?.id === v.id;
              return (
                <button key={v.id} onClick={() => setSelectedVehicle(v)}
                  style={{ width:'100%', background: isSel ? '#FFFBF0' : '#fff', border:`2px solid ${isSel ? v.color : 'transparent'}`, borderRadius:'16px', padding:'14px', marginBottom:'10px', cursor:'pointer', textAlign:'left', boxShadow:'0 2px 8px rgba(0,0,0,0.07)', position:'relative', fontFamily:'inherit' }}>
                  {/* Badge */}
                  {v.badge && (
                    <div style={{ position:'absolute', top:'-10px', right:'14px', background: v.badge==='Popular'?'#10B981':'#EC4899', color:'#fff', fontSize:'10px', fontWeight:'700', padding:'3px 10px', borderRadius:'10px' }}>{v.badge}</div>
                  )}
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    {/* Icono */}
                    <div style={{ width:'68px', height:'68px', borderRadius:'14px', background:`${v.color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'help' }}
                      title={v.name}
                      onMouseEnter={e => {
                        const tip = document.createElement('div');
                        tip.id = 'vehicle-tip';
                        tip.textContent = v.name;
                        tip.style.cssText = 'position:fixed;background:#1E293B;color:#fff;padding:5px 10px;border-radius:8px;font-size:12px;font-weight:700;pointer-events:none;z-index:9999;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)';
                        document.body.appendChild(tip);
                        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        tip.style.left = (r.left + r.width/2 - tip.offsetWidth/2) + 'px';
                        tip.style.top = (r.top - 36) + 'px';
                      }}
                      onMouseLeave={() => { const t = document.getElementById('vehicle-tip'); if(t) t.remove(); }}
                    >
                      {getVehicleIcon(v.iconId, 44, v.color, isSel)}
                    </div>
                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'3px' }}>
                        <span style={{ fontSize:'15px', fontWeight:'700', color:'#1A2B4A' }}>{v.name}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:'3px' }}>
                          <StarIcon size={13} filled color="#FFB800"/>
                          <span style={{ fontSize:'12px', fontWeight:'600', color:'#1A2B4A' }}>{v.rating}</span>
                        </div>
                      </div>
                      <div style={{ fontSize:'12px', color:'#8A9BB5', marginBottom:'4px' }}>{v.description}</div>
                      <div style={{ fontSize:'11px', color:'#10B981', fontWeight:'600', marginBottom:'6px' }}>⏱ {v.time}</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                        {v.features.slice(0,3).map(f => (
                          <span key={f} style={{ background:'#EEF2F7', color:'#8A9BB5', fontSize:'10px', padding:'2px 8px', borderRadius:'6px' }}>{f}</span>
                        ))}
                      </div>
                    </div>
                    {/* Precio */}
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px', flexShrink:0 }}>
                      <span style={{ fontSize:'17px', fontWeight:'700', color:'#1A2B4A' }}>{v.price.toLocaleString()}</span>
                      <span style={{ fontSize:'10px', color:'#8A9BB5' }}>XAF</span>
                      {isSel && <div style={{ width:'24px', height:'24px', borderRadius:'50%', background:v.color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'14px', fontWeight:'800' }}>✓</div>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Panel inferior */}
      {selectedVehicle && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#FFFFFF', borderTopLeftRadius:'24px', borderTopRightRadius:'24px', padding:'16px 20px 32px', boxShadow:'0 -4px 20px rgba(0,0,0,0.12)', zIndex:50 }}>
          <div style={{ width:'40px', height:'4px', background:'#CBD5E1', borderRadius:'2px', margin:'0 auto 14px' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
            <div style={{ fontSize:'15px', fontWeight:'700', color:'#1A2B4A' }}>Vehículo seleccionado</div>
            <button onClick={() => setSelectedVehicle(null)} style={{ background:'none', border:'none', color:'#8A9BB5', fontSize:'20px', cursor:'pointer' }}>✕</button>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#EEF2F7', padding:'14px 16px', borderRadius:'12px', marginBottom:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'10px', background:`${selectedVehicle.color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {getVehicleIcon(selectedVehicle.iconId, 30, selectedVehicle.color, true)}
              </div>
              <div>
                <div style={{ fontSize:'15px', fontWeight:'600', color:'#1A2B4A' }}>{selectedVehicle.name}</div>
                <div style={{ fontSize:'12px', color:'#8A9BB5' }}>{selectedVehicle.time} de espera</div>
              </div>
            </div>
            <div style={{ fontSize:'20px', fontWeight:'700', color:'#10B981' }}>{selectedVehicle.price.toLocaleString()} XAF</div>
          </div>
          <PBtn title="Confirmar y buscar conductor" onPress={() => setScreen('searching')} type="primary" icon={getVehicleIcon(selectedVehicle.iconId, 20, '#1E293B', true)}/>
        </div>
      )}
    </div>
  );

  // ── SEARCHING ─────────────────────────────────────────────────────────────
  if (screen === 'searching') return (
    <div style={{ height:'100vh', background:'#EEF2F7', display:'flex', flexDirection:'column' }}>
      <Header title="Buscando conductor" back={() => setScreen('booking')}/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px' }}>
        <div style={{ position:'relative', width:'120px', height:'120px', marginBottom:'32px' }}>
          <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'3px solid #00c8a0', animation:'ping 1.5s ease-out infinite' }}/>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <TaxiIcon size={56} color="#facc15" filled/>
          </div>
        </div>
        <div style={{ fontSize:'20px', fontWeight:'800', color:'#fff', marginBottom:'8px' }}>Buscando el mejor conductor</div>
        <div style={{ fontSize:'14px', color:'#8A9BB5', marginBottom:'24px', textAlign:'center' }}>{origin?.address} → {destination?.address}</div>
        <div style={{ background:'#FFFFFF', borderRadius:'14px', padding:'14px 20px', width:'100%', maxWidth:'300px' }}>
          {[['Tiempo de búsqueda',`${searchTimer}s`,'#facc15'],['Tipo de viaje',rideType.label,'#fff'],['Precio estimado',`${finalPrice.toLocaleString()} XAF`,'#facc15']].map(([l,v,c]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
              <span style={{ fontSize:'12px', color:'#8A9BB5' }}>{l}</span>
              <span style={{ fontSize:'12px', fontWeight:'700', color:c }}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setScreen('booking')} style={{ marginTop:'20px', background:'transparent', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'10px', padding:'10px 24px', color:'#8A9BB5', cursor:'pointer' }}>
          Cancelar búsqueda
        </button>
      </div>
      <style>{`@keyframes ping { 0%{transform:scale(0.8);opacity:1} 100%{transform:scale(1.5);opacity:0} }`}</style>
    </div>
  );

  // ── MATCHED ───────────────────────────────────────────────────────────────
  if (screen === 'matched' && driver) return (
    <div style={{ height:'100vh', background:'#EEF2F7', display:'flex', flexDirection:'column' }}>
      <Header title="Conductor encontrado" back={() => setScreen('booking')} showSafety/>
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 90px' }}>
        <div style={{ height:'220px', marginBottom:'16px', borderRadius:'16px', overflow:'hidden' }}>
          <RealMap origin={origin} destination={destination} driver={driver} status="matched"/>
        </div>
        <div style={{ background:'#FFFFFF', borderRadius:'20px', padding:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'16px' }}>
            <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'linear-gradient(135deg,#48CAE4,#0096C7)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <UserIcon size={32} color="#fff" filled/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'18px', fontWeight:'800', color:'#1A2B4A' }}>{driver.name}</div>
              <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'4px' }}>
                <StarIcon size={14} filled color="#FFB800"/>
                <span style={{ fontSize:'13px', fontWeight:'700', color:'#FFB800' }}>{driver.rating}</span>
                <span style={{ fontSize:'12px', color:'#8A9BB5' }}>{driver.trips} viajes</span>
              </div>
              {driver.badge && <div style={{ display:'inline-block', background:'rgba(250,204,21,0.15)', borderRadius:'6px', padding:'2px 8px', fontSize:'10px', fontWeight:'700', color:'#facc15', marginTop:'4px' }}><StarIcon size={10} filled color="#facc15"/> {driver.badge}</div>}
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'11px', color:'#8A9BB5' }}>Llega en</div>
              <div style={{ fontSize:'24px', fontWeight:'800', color:'#00B4D8' }}>{driver.eta}</div>
            </div>
          </div>
          <div style={{ background:'#EEF2F7', borderRadius:'12px', padding:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', marginBottom:'16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
              <span style={{ fontSize:'12px', color:'#8A9BB5' }}>Vehículo</span>
              <span style={{ fontSize:'12px', fontWeight:'600', color:'#1A2B4A' }}>{driver.car}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:'12px', color:'#8A9BB5' }}>Matrícula</span>
              <span style={{ fontSize:'12px', fontWeight:'600', color:'#facc15' }}>{driver.plate}</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:'10px', marginBottom:'16px' }}>
            <button onClick={() => { try { const {shell}=(window as any).require('electron'); shell.openExternal(`tel:${driver.phone}`); } catch { alert(`Llamando a ${driver.name} (${driver.phone})...`); }}} style={{ flex:1, background:'rgba(0,200,160,0.12)', border:'1px solid rgba(0,200,160,0.3)', borderRadius:'12px', padding:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', cursor:'pointer', color:'#00B4D8', fontWeight:'700', fontSize:'13px' }}>📞 Llamar</button>
            <button onClick={() => setShowChat(true)} style={{ flex:1, background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:'12px', padding:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', cursor:'pointer', color:'#60a5fa', fontWeight:'700', fontSize:'13px' }}>💬 Chat</button>
            <button onClick={() => setShowSafety(true)} style={{ flex:1, background:'rgba(220,38,38,0.15)', border:'none', borderRadius:'12px', padding:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', cursor:'pointer', color:'#ef4444' }}>🛡️ Seguridad</button>
          </div>
          <PBtn title="Confirmar viaje" onPress={() => setScreen('onway')} type="primary" icon={<TaxiIcon size={18} color="#1E293B" filled/>}/>
        </div>
      </div>
      {showSafety && <SafetyCenter onClose={() => setShowSafety(false)} driver={driver}/>}
      {/* Modal Chat con conductor */}
      {showChat && driver && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:500, display:'flex', alignItems:'flex-end' }}>
          <div style={{ background:'#EEF2F7', borderRadius:'24px 24px 0 0', width:'100%', height:'70vh', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'linear-gradient(135deg,#48CAE4,#0096C7)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <UserIcon size={20} color="#fff" filled/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'15px', fontWeight:'700', color:'#1A2B4A' }}>{driver.name}</div>
                <div style={{ fontSize:'11px', color:'#00B4D8' }}>● En línea</div>
              </div>
              <button onClick={() => setShowChat(false)} style={{ background:'#EFF6FF', border:'none', borderRadius:'50%', width:'32px', height:'32px', color:'#fff', cursor:'pointer', fontSize:'16px' }}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'8px' }}>
              <div style={{ background:'#EEF2F7', borderRadius:'12px 12px 12px 2px', padding:'10px 14px', maxWidth:'80%', alignSelf:'flex-start' }}>
                <div style={{ fontSize:'13px', color:'#1A2B4A' }}>Hola, estoy en camino. Llegaré en {driver.eta} 🚗</div>
                <div style={{ fontSize:'10px', color:'#8A9BB5', marginTop:'4px' }}>Ahora</div>
              </div>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ background: msg.from==='me' ? '#facc15' : 'rgba(255,255,255,0.06)', borderRadius: msg.from==='me' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', padding:'10px 14px', maxWidth:'80%', alignSelf: msg.from==='me' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ fontSize:'13px', color: msg.from==='me' ? '#111' : '#fff' }}>{msg.text}</div>
                  <div style={{ fontSize:'10px', color: msg.from==='me' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)', marginTop:'4px' }}>{msg.time}</div>
                </div>
              ))}
            </div>
            <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', gap:'8px' }}>
              {['Estoy listo 👍','¿Dónde estás?','Ok, te espero'].map(q => (
                <button key={q} onClick={() => { const t=new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'}); setChatMessages(p=>[...p,{from:'me',text:q,time:t}]); setTimeout(()=>setChatMessages(p=>[...p,{from:'driver',text:'Entendido 👌',time:t}]),1000); }}
                  style={{ background:'#EEF2F7', border:'1px solid #E8EEF5', borderRadius:'20px', padding:'6px 12px', color:'#5A7090', fontSize:'11px', cursor:'pointer', whiteSpace:'nowrap' }}>{q}</button>
              ))}
            </div>
            <div style={{ padding:'0 16px 20px', display:'flex', gap:'8px' }}>
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&chatInput.trim()){ const t=new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'}); setChatMessages(p=>[...p,{from:'me',text:chatInput,time:t}]); setChatInput(''); setTimeout(()=>setChatMessages(p=>[...p,{from:'driver',text:'Ok 👍',time:t}]),1000); }}} placeholder="Escribe un mensaje..." style={{ flex:1, padding:'11px 14px', background:'#EEF2F7', border:'1px solid #E8EEF5', borderRadius:'24px', color:'#fff', fontSize:'13px', outline:'none', fontFamily:'inherit' }}/>
              <button onClick={()=>{ if(chatInput.trim()){ const t=new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'}); setChatMessages(p=>[...p,{from:'me',text:chatInput,time:t}]); setChatInput(''); setTimeout(()=>setChatMessages(p=>[...p,{from:'driver',text:'Ok 👍',time:t}]),1000); }}} style={{ width:'44px', height:'44px', borderRadius:'50%', background:'#facc15', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── ONWAY ─────────────────────────────────────────────────────────────────
  if (screen === 'onway' && driver) return (
    <div style={{ height:'100vh', background:'#EEF2F7', display:'flex', flexDirection:'column' }}>
      <Header title="Viaje en curso" sub={`Tu conductor ${driver.name} está en camino`} back={() => setScreen('matched')} showSafety/>
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 90px' }}>
        <div style={{ height:'260px', marginBottom:'16px', borderRadius:'16px', overflow:'hidden' }}>
          <RealMap origin={origin} destination={destination} driver={driver} status="onway"/>
        </div>
        {/* Countdown llegada */}
        <div style={{ background: driverArrivalCountdown === 0 ? 'linear-gradient(135deg,rgba(0,200,160,0.25),rgba(0,180,230,0.25))' : 'linear-gradient(135deg,rgba(0,200,160,0.15),rgba(0,180,230,0.15))', borderRadius:'16px', padding:'16px', marginBottom:'16px', border: driverArrivalCountdown === 0 ? '1px solid rgba(0,200,160,0.5)' : 'none' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:'11px', color:'#8A9BB5', marginBottom:'4px' }}>
                {driverArrivalCountdown === 0 ? '✅ Conductor llegado' : 'Llegada estimada'}
              </div>
              <div style={{ fontSize:'28px', fontWeight:'900', color: driverArrivalCountdown === 0 ? '#00c8a0' : '#00B4D8' }}>
                {driverArrivalCountdown === 0 ? '¡Llegó!' : driverArrivalCountdown !== null ? `${driverArrivalCountdown}s` : driver.eta}
              </div>
              <div style={{ fontSize:'11px', color:'#8A9BB5', marginTop:'4px' }}>Distancia: {driver.distance}</div>
            </div>
            <NavigationIcon size={48} color={driverArrivalCountdown === 0 ? '#00c8a0' : '#facc15'} rotation={0}/>
          </div>
        </div>
        <div style={{ background:'#FFFFFF', borderRadius:'16px', padding:'16px', marginBottom:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'linear-gradient(135deg,#48CAE4,#0096C7)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <UserIcon size={24} color="#fff" filled/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'16px', fontWeight:'700', color:'#1A2B4A' }}>{driver.name}</div>
              <div style={{ fontSize:'12px', color:'#8A9BB5' }}>{driver.car} · {driver.plate}</div>
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={() => { try { const {shell}=(window as any).require('electron'); shell.openExternal(`tel:${driver.phone}`); } catch { alert(`Llamando a ${driver.name}...`); }}} style={{ width:'38px', height:'38px', borderRadius:'50%', background:'rgba(0,200,160,0.15)', border:'1px solid rgba(0,200,160,0.3)', cursor:'pointer', fontSize:'16px' }}>📞</button>
              <button onClick={() => setShowChat(true)} style={{ width:'38px', height:'38px', borderRadius:'50%', background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.3)', cursor:'pointer', fontSize:'16px' }}>💬</button>
            </div>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <div style={{ flex:1, background:'#EEF2F7', borderRadius:'10px', padding:'10px', textAlign:'center' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', marginBottom:'2px' }}>
                <LocationIcon size={10} color="#00c8a0" filled/>
                <div style={{ fontSize:'10px', color:'#8A9BB5' }}>Origen</div>
              </div>
              <div style={{ fontSize:'12px', fontWeight:'700', color:'#00B4D8' }}>{origin?.address||'...'}</div>
            </div>
            <div style={{ width:'20px', display:'flex', alignItems:'center', justifyContent:'center', color:'#8A9BB5' }}>→</div>
            <div style={{ flex:1, background:'#EEF2F7', borderRadius:'10px', padding:'10px', textAlign:'center' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', marginBottom:'2px' }}>
                <LocationIcon size={10} color="#facc15" filled/>
                <div style={{ fontSize:'10px', color:'#8A9BB5' }}>Destino</div>
              </div>
              <div style={{ fontSize:'12px', fontWeight:'700', color:'#facc15' }}>{destination?.address||'...'}</div>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={() => { if(window.confirm('¿Cancelar el viaje? Se puede aplicar una penalización.')) { reset(); }}} style={{ flex:1, padding:'14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'14px', color:'#ef4444', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
            ✕ Cancelar viaje
          </button>
        </div>
      </div>

      {/* Notificación de llegada */}
      {showArrivalNotif && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
          <div style={{ background:'#FFFFFF', borderRadius:'24px', padding:'28px 24px', width:'100%', maxWidth:'340px', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>
            {/* Animación llegada */}
            <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'linear-gradient(135deg,#00c8a0,#00b4e6)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 0 0 12px rgba(0,200,160,0.15)' }}>
              <TaxiIcon size={40} color="#fff" filled/>
            </div>
            <div style={{ fontSize:'22px', fontWeight:'900', color:'#1A2B4A', marginBottom:'6px' }}>¡Tu taxi ha llegado!</div>
            <div style={{ fontSize:'14px', color:'#8A9BB5', marginBottom:'4px' }}>{driver.name} te está esperando</div>
            <div style={{ background:'rgba(250,204,21,0.15)', borderRadius:'10px', padding:'8px 16px', display:'inline-block', marginBottom:'20px' }}>
              <span style={{ fontSize:'18px', fontWeight:'800', color:'#facc15' }}>{driver.plate}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <button onClick={() => { setShowArrivalNotif(false); setShowChat(true); }}
                style={{ padding:'14px', background:'linear-gradient(135deg,#00c8a0,#00b4e6)', border:'none', borderRadius:'14px', color:'#fff', fontSize:'15px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                💬 Abrir chat con el conductor
              </button>
              <button onClick={() => { try { const {shell}=(window as any).require('electron'); shell.openExternal(`tel:${driver.phone}`); } catch { alert(`Llamando a ${driver.name}...`); } setShowArrivalNotif(false); }}
                style={{ padding:'14px', background:'rgba(0,200,160,0.1)', border:'1px solid rgba(0,200,160,0.3)', borderRadius:'14px', color:'#00c8a0', fontSize:'15px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                📞 Llamar al conductor
              </button>
              <button onClick={() => { setShowArrivalNotif(false); setScreen('arrived'); }}
                style={{ padding:'12px', background:'transparent', border:'none', color:'#8A9BB5', fontSize:'13px', cursor:'pointer' }}>
                Continuar al pago →
              </button>
            </div>
          </div>
        </div>
      )}

      {showSafety && <SafetyCenter onClose={() => setShowSafety(false)} driver={driver}/>}
      {showChat && driver && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:500, display:'flex', alignItems:'flex-end' }}>
          <div style={{ background:'#EEF2F7', borderRadius:'24px 24px 0 0', width:'100%', height:'65vh', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'linear-gradient(135deg,#48CAE4,#0096C7)', display:'flex', alignItems:'center', justifyContent:'center' }}><UserIcon size={20} color="#fff" filled/></div>
              <div style={{ flex:1 }}><div style={{ fontSize:'15px', fontWeight:'700', color:'#1A2B4A' }}>{driver.name}</div><div style={{ fontSize:'11px', color: driverArrivalCountdown === 0 ? '#00c8a0' : '#00B4D8' }}>● {driverArrivalCountdown === 0 ? 'Ha llegado' : 'En camino'}</div></div>
              <button onClick={() => setShowChat(false)} style={{ background:'#EFF6FF', border:'none', borderRadius:'50%', width:'32px', height:'32px', color:'#1A2B4A', cursor:'pointer', fontSize:'16px' }}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'8px' }}>
              <div style={{ background:'#fff', borderRadius:'12px 12px 12px 2px', padding:'10px 14px', maxWidth:'80%' }}>
                <div style={{ fontSize:'13px', color:'#1A2B4A' }}>Estoy en camino, llegaré en {driver.eta} 🚗</div>
                <div style={{ fontSize:'10px', color:'#8A9BB5', marginTop:'4px' }}>Ahora</div>
              </div>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ background: msg.from==='me'?'#facc15':'#fff', borderRadius: msg.from==='me'?'12px 12px 2px 12px':'12px 12px 12px 2px', padding:'10px 14px', maxWidth:'80%', alignSelf: msg.from==='me'?'flex-end':'flex-start' }}>
                  <div style={{ fontSize:'13px', color: msg.from==='me'?'#111':'#1A2B4A' }}>{msg.text}</div>
                  <div style={{ fontSize:'10px', color: msg.from==='me'?'rgba(0,0,0,0.4)':'#8A9BB5', marginTop:'4px' }}>{msg.time}</div>
                </div>
              ))}
            </div>
            <div style={{ padding:'8px 16px', display:'flex', gap:'6px', flexWrap:'wrap' }}>
              {['Estoy listo 👍','¿Dónde estás?','Ok, te espero','Gracias'].map(q => (
                <button key={q} onClick={() => { const t=new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'}); setChatMessages(p=>[...p,{from:'me',text:q,time:t}]); setTimeout(()=>setChatMessages(p=>[...p,{from:'driver',text:'Entendido 👌',time:t}]),1000); }}
                  style={{ background:'#EEF2F7', border:'1px solid #E8EEF5', borderRadius:'20px', padding:'5px 10px', color:'#5A7090', fontSize:'11px', cursor:'pointer' }}>{q}</button>
              ))}
            </div>
            <div style={{ padding:'0 16px 20px', display:'flex', gap:'8px' }}>
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&chatInput.trim()){ const t=new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'}); setChatMessages(p=>[...p,{from:'me',text:chatInput,time:t}]); setChatInput(''); setTimeout(()=>setChatMessages(p=>[...p,{from:'driver',text:'Ok 👍',time:t}]),1000); }}} placeholder="Escribe un mensaje..." style={{ flex:1, padding:'11px 14px', background:'#fff', border:'1px solid #E8EEF5', borderRadius:'24px', color:'#1A2B4A', fontSize:'13px', outline:'none', fontFamily:'inherit' }}/>
              <button onClick={()=>{ if(chatInput.trim()){ const t=new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'}); setChatMessages(p=>[...p,{from:'me',text:chatInput,time:t}]); setChatInput(''); setTimeout(()=>setChatMessages(p=>[...p,{from:'driver',text:'Ok 👍',time:t}]),1000); }}} style={{ width:'44px', height:'44px', borderRadius:'50%', background:'#facc15', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── ARRIVED ───────────────────────────────────────────────────────────────
  if (screen === 'arrived' && driver) return (
    <div style={{ height:'100vh', background:'#EEF2F7', display:'flex', flexDirection:'column' }}>
      <Header title="Tu taxi ha llegado"/>
      <div style={{ flex:1, overflowY:'auto', padding:'24px 24px 90px', display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ width:'80px', height:'80px', borderRadius:'24px', background:'linear-gradient(135deg,rgba(0,200,160,0.2),rgba(0,180,230,0.2))', border:'1px solid rgba(0,200,160,0.3)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'20px' }}>
          <TaxiIcon size={44} color="#facc15" filled/>
        </div>
        <div style={{ fontSize:'22px', fontWeight:'800', color:'#fff', marginBottom:'8px', textAlign:'center' }}>Tu conductor ha llegado</div>
        <div style={{ fontSize:'14px', color:'#8A9BB5', marginBottom:'8px', textAlign:'center' }}>{driver.name} te espera</div>
        <div style={{ background:'rgba(250,204,21,0.12)', borderRadius:'12px', padding:'8px 20px', marginBottom:'24px' }}>
          <span style={{ fontSize:'16px', fontWeight:'800', color:'#facc15' }}>{driver.plate}</span>
        </div>
        <div style={{ background:'#FFFFFF', borderRadius:'20px', padding:'20px', width:'100%', marginBottom:'20px' }}>
          {[['Ruta',`${origin?.address} → ${destination?.address}`],['Tipo', selectedVehicle?.name || rideType.label]].map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
              <span style={{ fontSize:'13px', color:'#8A9BB5' }}>{l}</span>
              <span style={{ fontSize:'13px', fontWeight:'600', color:'#1A2B4A' }}>{v}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid #EEF2F7', paddingTop:'10px' }}>
            <span style={{ fontSize:'14px', fontWeight:'700', color:'#5A7090' }}>Total a pagar</span>
            <span style={{ fontSize:'20px', fontWeight:'800', color:'#facc15' }}>{(selectedVehicle?.price || finalPrice).toLocaleString()} XAF</span>
          </div>
        </div>

        {/* Opciones de pago */}
        <div style={{ width:'100%', marginBottom:'12px' }}>
          <div style={{ fontSize:'12px', fontWeight:'700', color:'#8A9BB5', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px', textAlign:'center' }}>Elige cómo pagar</div>

          {/* Pago EGCHAT Wallet */}
          <PBtn title={`💳 Pagar con EGCHAT Wallet · ${(selectedVehicle?.price || finalPrice).toLocaleString()} XAF`}
            onPress={() => { onDebit(selectedVehicle?.price || finalPrice); setScreen('rating'); }}
            type="primary" icon={<WalletIcon size={20} color="#1E293B" filled/>}/>

          <div style={{ height:'10px' }}/>

          {/* Pago por QR */}
          <button onClick={() => setScreen('qr-pay')}
            style={{ width:'100%', padding:'15px', background:'#EEF2F7', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontFamily:'inherit' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 17h3M14 20h3"/></svg>
            Pagar escaneando QR
          </button>

          <div style={{ height:'10px' }}/>

          {/* Pago en efectivo */}
          <button onClick={() => { if(window.confirm('¿Pagar en efectivo al conductor?')) { setScreen('rating'); }}}
            style={{ width:'100%', padding:'15px', background:'#EEF2F7', border:'1px solid #E8EEF5', borderRadius:'12px', color:'#8A9BB5', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>
            💵 Pagar en efectivo
          </button>
        </div>

        <div style={{ fontSize:'12px', color:'#8A9BB5', marginTop:'4px' }}>Saldo EGCHAT: {userBalance.toLocaleString()} XAF</div>
      </div>
    </div>
  );

  // ── DRIVER QR — conductor muestra su QR para cobrar ──────────────────────
  if (screen === 'driver-qr' && activeRequest) return (
    <div style={{ height:'100vh', background:'#EEF2F7', display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <Header title="QR de Cobro" back={() => setScreen('driver-trip')}/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px' }}>
        <div style={{ fontSize:'14px', color:'#8A9BB5', marginBottom:'8px' }}>Muestra este QR al pasajero</div>
        <div style={{ fontSize:'28px', fontWeight:'900', color:'#facc15', marginBottom:'24px' }}>{activeRequest.price.toLocaleString()} XAF</div>
        {/* QR visual */}
        <div style={{ background:'#FFFFFF', borderRadius:'20px', padding:'20px', marginBottom:'24px', boxShadow:'0 8px 32px rgba(250,204,21,0.3)' }}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            <rect x="10" y="10" width="60" height="60" rx="4" fill="none" stroke="#111" strokeWidth="6"/>
            <rect x="20" y="20" width="40" height="40" rx="2" fill="#111"/>
            <rect x="130" y="10" width="60" height="60" rx="4" fill="none" stroke="#111" strokeWidth="6"/>
            <rect x="140" y="20" width="40" height="40" rx="2" fill="#111"/>
            <rect x="10" y="130" width="60" height="60" rx="4" fill="none" stroke="#111" strokeWidth="6"/>
            <rect x="20" y="140" width="40" height="40" rx="2" fill="#111"/>
            {[0,1,2,3,4,5,6,7,8].flatMap(i => [0,1,2,3,4,5,6,7,8].map(j => {
              const px = 80 + j*5; const py = 80 + i*5;
              return (i+j+i*j) % 3 !== 0 ? <rect key={`c${i}-${j}`} x={px} y={py} width="4" height="4" fill="#111"/> : null;
            }))}
            <rect x="85" y="85" width="30" height="30" rx="6" fill="#facc15"/>
            <text x="100" y="105" textAnchor="middle" fontSize="10" fontWeight="900" fill="#111">EG</text>
          </svg>
        </div>
        <div style={{ background:'#FFFFFF', borderRadius:'16px', padding:'16px', width:'100%', marginBottom:'16px', textAlign:'center' }}>
          <div style={{ fontSize:'12px', color:'#8A9BB5', marginBottom:'4px' }}>Pasajero</div>
          <div style={{ fontSize:'16px', fontWeight:'700', color:'#fff', marginBottom:'8px' }}>{activeRequest.passenger}</div>
          <div style={{ fontSize:'12px', color:'#8A9BB5', marginBottom:'4px' }}>Ruta</div>
          <div style={{ fontSize:'13px', color:'#5A7090' }}>{activeRequest.from} → {activeRequest.to}</div>
        </div>
        <div style={{ fontSize:'12px', color:'#8A9BB5', textAlign:'center', marginBottom:'16px' }}>
          El pasajero escanea este QR con EGCHAT para pagar
        </div>
        <PBtn title="✅ Simular pago recibido" onPress={() => {
          onDebit(-activeRequest.price);
          setDriverEarnings(p => p + activeRequest.price);
          setDriverTripsToday(p => p + 1);
          const passenger = activeRequest.passenger;
          const price = activeRequest.price;
          setActiveRequest(null);
          alert(`✅ Pago de ${price.toLocaleString()} XAF recibido de ${passenger}`);
          setScreen('driver-home');
        }} type="primary"/>
      </div>
    </div>
  );

  // ── QR PAY — pasajero escanea QR del conductor ────────────────────────────
  if (screen === 'qr-pay') return (
    <div style={{ height:'100vh', background:'#EEF2F7', display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <Header title="Pagar con QR" back={() => { setScreen('arrived'); setQrScanning(false); setQrPaid(false); }}/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px' }}>
        {!qrPaid ? (
          <>
            <div style={{ fontSize:'14px', color:'#8A9BB5', marginBottom:'8px', textAlign:'center' }}>
              Apunta la cámara al QR del conductor
            </div>
            <div style={{ fontSize:'24px', fontWeight:'900', color:'#facc15', marginBottom:'24px' }}>
              {(selectedVehicle?.price || finalPrice).toLocaleString()} XAF
            </div>
            <div style={{ width:'240px', height:'240px', borderRadius:'20px', background:'#111', border:'2px solid rgba(250,204,21,0.4)', position:'relative', overflow:'hidden', marginBottom:'24px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ position:'absolute', top:'16px', left:'16px', width:'40px', height:'40px', borderTop:'3px solid #facc15', borderLeft:'3px solid #facc15', borderRadius:'4px 0 0 0' }}/>
              <div style={{ position:'absolute', top:'16px', right:'16px', width:'40px', height:'40px', borderTop:'3px solid #facc15', borderRight:'3px solid #facc15', borderRadius:'0 4px 0 0' }}/>
              <div style={{ position:'absolute', bottom:'16px', left:'16px', width:'40px', height:'40px', borderBottom:'3px solid #facc15', borderLeft:'3px solid #facc15', borderRadius:'0 0 0 4px' }}/>
              <div style={{ position:'absolute', bottom:'16px', right:'16px', width:'40px', height:'40px', borderBottom:'3px solid #facc15', borderRight:'3px solid #facc15', borderRadius:'0 0 4px 0' }}/>
              {qrScanning
                ? <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:'32px', marginBottom:'8px' }}>📷</div>
                    <div style={{ fontSize:'12px', color:'#8A9BB5' }}>Escaneando...</div>
                    <div style={{ width:'180px', height:'2px', background:'#facc15', marginTop:'12px', animation:'scan 1s ease-in-out infinite' }}/>
                  </div>
                : <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:'32px', marginBottom:'8px' }}>📷</div>
                    <div style={{ fontSize:'12px', color:'#8A9BB5' }}>Cámara lista</div>
                  </div>
              }
            </div>
            <style>{`@keyframes scan{0%{transform:translateY(-40px)}50%{transform:translateY(40px)}100%{transform:translateY(-40px)}}`}</style>
            <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:'10px' }}>
              <PBtn title={qrScanning ? '⏳ Escaneando QR...' : '📷 Escanear QR del conductor'}
                onPress={() => {
                  setQrScanning(true);
                  setTimeout(() => { setQrScanning(false); setQrPaid(true); onDebit(selectedVehicle?.price || finalPrice); }, 2500);
                }}
                type="primary" disabled={qrScanning}/>
              <PBtn title="Introducir código manualmente" onPress={() => {
                const code = window.prompt('Introduce el código del conductor:');
                if (code) { onDebit(selectedVehicle?.price || finalPrice); setQrPaid(true); }
              }} type="outline"/>
            </div>
          </>
        ) : (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'72px', marginBottom:'16px' }}>✅</div>
            <div style={{ fontSize:'24px', fontWeight:'900', color:'#00B4D8', marginBottom:'8px' }}>¡Pago completado!</div>
            <div style={{ fontSize:'28px', fontWeight:'800', color:'#facc15', marginBottom:'8px' }}>{(selectedVehicle?.price || finalPrice).toLocaleString()} XAF</div>
            <div style={{ fontSize:'14px', color:'#8A9BB5', marginBottom:'32px' }}>Pagado a {driver?.name}</div>
            <PBtn title="Calificar el viaje" onPress={() => { setQrPaid(false); setScreen('rating'); }} type="primary" icon={<StarIcon size={18} filled color="#1E293B"/>}/>
          </div>
        )}
      </div>
    </div>
  );

  // ── RATING ────────────────────────────────────────────────────────────────
  if (screen === 'rating' && driver) return (
    <div style={{ height:'100vh', background:'#EEF2F7', display:'flex', flexDirection:'column' }}>
      <Header title="Califica tu viaje"/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px' }}>
        <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'linear-gradient(135deg,#48CAE4,#0096C7)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'16px' }}>
          <UserIcon size={36} color="#fff" filled/>
        </div>
        <div style={{ fontSize:'18px', fontWeight:'800', color:'#fff', marginBottom:'4px' }}>{driver.name}</div>
        <div style={{ fontSize:'13px', color:'#8A9BB5', marginBottom:'28px' }}>{driver.car} · {driver.plate}</div>
        <div style={{ fontSize:'14px', color:'#5A7090', marginBottom:'16px' }}>¿Cómo fue tu viaje?</div>
        <div style={{ display:'flex', gap:'8px', marginBottom:'28px' }}>
          {[1,2,3,4,5].map(s => (
            <button key={s} onClick={() => setRating(s)} style={{ background:'none', border:'none', cursor:'pointer', transform: s<=rating ? 'scale(1.15)' : 'scale(1)', transition:'all 0.15s' }}>
              <StarIcon size={36} filled={s<=rating} color="#FFB800"/>
            </button>
          ))}
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center', marginBottom:'20px' }}>
          {['Puntual','Amable','Coche limpio','Buen manejo','Música agradable'].map(tag => (
            <button key={tag} style={{ background:'#EEF2F7', border:'1px solid #E8EEF5', borderRadius:'20px', padding:'6px 14px', color:'#5A7090', fontSize:'12px', cursor:'pointer' }}>{tag}</button>
          ))}
        </div>
        <PBtn title={rating>0?'Enviar calificación':'Selecciona una calificación'} onPress={() => setScreen('completed')} type="primary" disabled={rating===0}/>
        <button onClick={() => setScreen('completed')} style={{ marginTop:'12px', background:'none', border:'none', color:'#8A9BB5', fontSize:'13px', cursor:'pointer' }}>Omitir</button>
      </div>
    </div>
  );

  // ── COMPLETED ─────────────────────────────────────────────────────────────
  if (screen === 'completed') return (
    <div style={{ height:'100vh', background:'#EEF2F7', display:'flex', flexDirection:'column' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px' }}>
        <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'linear-gradient(135deg,#48CAE4,#0096C7)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'20px', boxShadow:'0 8px 32px rgba(0,200,160,0.3)' }}>
          <CheckIcon size={36}/>
        </div>
        <div style={{ fontSize:'22px', fontWeight:'800', color:'#fff', marginBottom:'8px' }}>Viaje completado</div>
        <div style={{ fontSize:'14px', color:'#8A9BB5', marginBottom:'28px', textAlign:'center' }}>Gracias por usar MiTaxi GQ</div>
        <div style={{ background:'#FFFFFF', borderRadius:'20px', padding:'20px', width:'100%', marginBottom:'20px' }}>
          {[['Ruta',`${origin?.address} → ${destination?.address}`],['Conductor',driver?.name||''],['Tipo',rideType.label]].map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
              <span style={{ fontSize:'13px', color:'#8A9BB5' }}>{l}</span>
              <span style={{ fontSize:'13px', fontWeight:'600', color:'#1A2B4A' }}>{v}</span>
            </div>
          ))}
          {rating>0 && (
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
              <span style={{ fontSize:'13px', color:'#8A9BB5' }}>Tu calificación</span>
              <span style={{ fontSize:'13px', fontWeight:'600', color:'#FFB800', display:'flex', gap:'2px' }}>{Array.from({length:rating}).map((_,i)=><StarIcon key={i} size={14} filled color="#FFB800"/>)}</span>
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid #EEF2F7', paddingTop:'12px' }}>
            <span style={{ fontSize:'14px', fontWeight:'700', color:'#5A7090' }}>Pagado</span>
            <span style={{ fontSize:'20px', fontWeight:'800', color:'#00B4D8' }}>{finalPrice.toLocaleString()} XAF</span>
          </div>
        </div>
        <div style={{ background:'rgba(250,204,21,0.08)', borderRadius:'12px', padding:'12px 16px', width:'100%', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:'13px', color:'#8A9BB5' }}>Saldo restante</span>
          <span style={{ fontSize:'16px', fontWeight:'800', color:'#facc15' }}>{userBalance.toLocaleString()} XAF</span>
        </div>
        <PBtn title="Nuevo viaje" onPress={reset} type="primary" icon={<TaxiIcon size={18} color="#1E293B" filled/>}/>
        <button onClick={onBack} style={{ marginTop:'12px', background:'none', border:'none', color:'#8A9BB5', fontSize:'13px', cursor:'pointer' }}>Volver al inicio</button>
      </div>
    </div>
  );

  // ── DRIVER REGISTER ───────────────────────────────────────────────────────
  if (screen === 'driver-register') return (
    <div style={{ height:'100vh', background:'#EEF2F7', display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <div style={{ background:'linear-gradient(160deg,#0096C7 0%,#48CAE4 60%,#90E0EF 100%)', padding:'44px 16px 20px', flexShrink:0, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'100px', height:'100px', borderRadius:'50%', background:'rgba(255,255,255,0.08)' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
          <button onClick={() => setScreen('home')} style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'20px', padding:'6px 12px 6px 8px', cursor:'pointer', color:'#fff' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            <span style={{ fontSize:'12px', fontWeight:'600' }}>Volver</span>
          </button>
        </div>
        <div style={{ fontSize:'22px', fontWeight:'800', color:'#fff', marginBottom:'4px' }}>Registro de Conductor</div>
        <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.85)' }}>Completa tus datos para empezar a ganar</div>
        <div style={{ marginTop:'14px', background:'rgba(255,255,255,0.15)', borderRadius:'14px', padding:'12px 16px', display:'flex', alignItems:'center', gap:'12px', border:'1px solid rgba(255,255,255,0.25)' }}>
          <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div>
            <div style={{ fontSize:'15px', fontWeight:'800', color:'#fff' }}>Hasta 150,000 XAF/mes</div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.8)' }}>Trabaja cuando quieras · Sin jefe</div>
          </div>
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 90px' }}>
        <div style={{ background:'#FFF8E1', border:'1px solid #FFD54F', borderRadius:'12px', padding:'12px 14px', marginBottom:'16px', display:'flex', gap:'10px', alignItems:'flex-start' }}>
          <span style={{ fontSize:'18px', flexShrink:0 }}>⚠️</span>
          <div>
            <div style={{ fontSize:'12px', fontWeight:'700', color:'#E65100', marginBottom:'2px' }}>Revisa bien tus datos</div>
            <div style={{ fontSize:'11px', color:'#BF360C', lineHeight:'1.5' }}>Una vez registrado, tus datos quedarán <strong>certificados y bloqueados</strong>. Para modificarlos deberás solicitar habilitación a la gestión de MiTaxi GQ.</div>
          </div>
        </div>
        <div style={{ fontSize:'12px', fontWeight:'700', color:'#0096C7', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'6px' }}>
          <UserIcon size={14} color="#0096C7"/> Datos del conductor
        </div>
        {[{key:'name',label:'Nombre completo',placeholder:'Tu nombre y apellidos',type:'text',icon:'👤'},{key:'phone',label:'Teléfono',placeholder:'+240 XXX XXX XXX',type:'tel',icon:'📱'},{key:'dni',label:'Número de DNI',placeholder:'GQ-XXXXXXXX',type:'text',icon:'🪪'}].map(f => (
          <div key={f.key} style={{ marginBottom:'10px' }}>
            <div style={{ fontSize:'11px', fontWeight:'600', color:'#8A9BB5', marginBottom:'5px' }}>{f.label}</div>
            <div style={{ display:'flex', alignItems:'center', background:'#FFFFFF', border:'1px solid #E8EEF5', borderRadius:'12px', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <span style={{ padding:'0 12px', fontSize:'16px' }}>{f.icon}</span>
              <input type={f.type} value={(driverForm as any)[f.key]} onChange={e => setDriverForm(p => ({...p,[f.key]:e.target.value}))} placeholder={f.placeholder}
                style={{ flex:1, padding:'12px 12px 12px 0', background:'none', border:'none', color:'#1A2B4A', fontSize:'14px', outline:'none', fontFamily:'inherit' }}/>
            </div>
          </div>
        ))}
        <div style={{ fontSize:'12px', fontWeight:'700', color:'#0096C7', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px', marginTop:'16px', display:'flex', alignItems:'center', gap:'6px' }}>
          <TaxiStandardIcon size={14} color="#0096C7"/> Datos del vehículo
        </div>
        {[{key:'car',label:'Marca y modelo',placeholder:'Ej: Toyota Corolla 2019',type:'text',icon:'🚗'},{key:'plate',label:'Matrícula',placeholder:'GQ-XXXX',type:'text',icon:'🔢'}].map(f => (
          <div key={f.key} style={{ marginBottom:'10px' }}>
            <div style={{ fontSize:'11px', fontWeight:'600', color:'#8A9BB5', marginBottom:'5px' }}>{f.label}</div>
            <div style={{ display:'flex', alignItems:'center', background:'#FFFFFF', border:'1px solid #E8EEF5', borderRadius:'12px', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <span style={{ padding:'0 12px', fontSize:'16px' }}>{f.icon}</span>
              <input type={f.type} value={(driverForm as any)[f.key]} onChange={e => setDriverForm(p => ({...p,[f.key]:e.target.value}))} placeholder={f.placeholder}
                style={{ flex:1, padding:'12px 12px 12px 0', background:'none', border:'none', color:'#1A2B4A', fontSize:'14px', outline:'none', fontFamily:'inherit' }}/>
            </div>
          </div>
        ))}
        <div style={{ fontSize:'12px', fontWeight:'700', color:'#0096C7', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px', marginTop:'16px' }}>📎 Documentos</div>
        {[
          {doc:'Foto del DNI (frente)', required:true},
          {doc:'Foto del DNI (reverso)', required:true},
          {doc:'Permiso de conducir', required:true},
          {doc:'Foto del vehículo', required:true},
          {doc:'ITV (Inspección Técnica)', required:true},
          {doc:'Seguro del vehículo', required:false},
        ].map(({doc, required}) => (
          <button key={doc} onClick={() => { const input = document.createElement('input'); input.type='file'; input.accept='image/*,application/pdf'; input.onchange=()=>alert(`✅ ${doc} subido correctamente`); input.click(); }}
            style={{ width:'100%', background:'#FFFFFF', borderRadius:'12px', padding:'12px 14px', marginBottom:'8px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', border:`1px dashed ${required ? '#C8D8E8' : '#D4EDDA'}`, fontFamily:'inherit', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'8px', background: required ? 'rgba(0,150,199,0.08)' : 'rgba(46,125,50,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>
                {doc.includes('ITV') ? '🔧' : doc.includes('Seguro') ? '🛡️' : doc.includes('DNI') ? '🪪' : doc.includes('Permiso') ? '📋' : '📸'}
              </div>
              <div>
                <span style={{ fontSize:'13px', color:'#5A7090' }}>{doc}</span>
                {!required && <span style={{ marginLeft:'6px', fontSize:'10px', color:'#2E7D32', background:'#E8F5E9', borderRadius:'6px', padding:'1px 6px', fontWeight:'600' }}>Opcional</span>}
              </div>
            </div>
            <span style={{ fontSize:'12px', color: required ? '#0096C7' : '#2E7D32', fontWeight:'600' }}>Subir →</span>
          </button>
        ))}
        <div style={{ background:'#E8F5E9', border:'1px solid #A5D6A7', borderRadius:'12px', padding:'12px 14px', marginTop:'8px', marginBottom:'16px', display:'flex', gap:'10px' }}>
          <span style={{ fontSize:'18px', flexShrink:0 }}>🔒</span>
          <div style={{ fontSize:'11px', color:'#388E3C', lineHeight:'1.5' }}>El vehículo registrado queda vinculado a tu cuenta. No puede ser traspasado sin autorización de MiTaxi GQ.</div>
        </div>
        <PBtn title="Certificar y enviar solicitud" onPress={() => {
          if (!driverForm.name || !driverForm.phone || !driverForm.plate) return;
          if (window.confirm('¿Confirmas que todos tus datos son correctos?\n\nUna vez registrado, no podrás editarlos sin solicitar habilitación a la gestión de MiTaxi GQ.')) {
            setDriverRegistered(true); setScreen('driver-home');
          }
        }} type="primary" disabled={!driverForm.name||!driverForm.phone||!driverForm.plate}/>
      </div>
    </div>
  );

  // ── DRIVER HOME ───────────────────────────────────────────────────────────
  if (screen === 'driver-home') return (
    <div style={{ height:'100vh', background:'#EEF2F7', display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <div style={{ background:'linear-gradient(160deg,#0096C7 0%,#48CAE4 60%,#90E0EF 100%)', padding:'44px 16px 20px', flexShrink:0, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'100px', height:'100px', borderRadius:'50%', background:'rgba(255,255,255,0.08)' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
          <button onClick={() => setScreen('home')} style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'20px', padding:'6px 12px 6px 8px', cursor:'pointer', color:'#fff' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            <span style={{ fontSize:'12px', fontWeight:'600' }}>Modo pasajero</span>
          </button>
          <div style={{ flex:1 }}/>
          <button onClick={() => setDriverOnline(p => !p)} style={{ display:'flex', alignItems:'center', gap:'6px', background: driverOnline ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'20px', padding:'6px 12px', cursor:'pointer', color:'#fff', transition:'all 0.2s' }}>
            <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: driverOnline ? '#90EE90' : 'rgba(255,255,255,0.5)' }}/>
            <span style={{ fontSize:'12px', fontWeight:'700' }}>{driverOnline ? 'En línea' : 'Desconectado'}</span>
          </button>
        </div>
        <div style={{ fontSize:'20px', fontWeight:'800', color:'#fff', marginBottom:'4px' }}>Panel Conductor</div>
        <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.85)' }}>MiTaxi GQ · {driverForm.name || 'Conductor'}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginTop:'14px' }}>
          {[{v:`${driverEarnings.toLocaleString()}`,l:'XAF hoy',icon:'💵'},{v:`${driverTripsToday}`,l:'Viajes',icon:'🚗'},{v:'4.8',l:'Rating',icon:'⭐'}].map(s => (
            <div key={s.l} style={{ background:'rgba(255,255,255,0.15)', borderRadius:'12px', padding:'10px 8px', textAlign:'center', border:'1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize:'16px', marginBottom:'2px' }}>{s.icon}</div>
              <div style={{ fontSize:'14px', fontWeight:'800', color:'#fff' }}>{s.v}</div>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.8)' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'14px 16px 90px' }}>
        {/* Datos conductor certificados */}
        <div style={{ background:'#FFFFFF', borderRadius:'16px', padding:'16px', marginBottom:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
            <div style={{ fontSize:'13px', fontWeight:'700', color:'#1A2B4A', display:'flex', alignItems:'center', gap:'6px' }}>
              <UserIcon size={14} color="#0096C7"/> Datos del conductor
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'4px', background:'#E8F5E9', borderRadius:'20px', padding:'3px 10px' }}>
              <span style={{ fontSize:'10px' }}>🔒</span>
              <span style={{ fontSize:'10px', fontWeight:'700', color:'#2E7D32' }}>Certificado</span>
            </div>
          </div>
          {[['Nombre',driverForm.name||'—'],['Teléfono',driverForm.phone||'—'],['DNI',driverForm.dni||'—']].map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', paddingBottom:'8px', marginBottom:'8px', borderBottom:'1px solid #F1F5F9' }}>
              <span style={{ fontSize:'12px', color:'#8A9BB5' }}>{l}</span>
              <span style={{ fontSize:'12px', fontWeight:'600', color:'#1A2B4A' }}>{v}</span>
            </div>
          ))}
          <button onClick={() => alert('Para editar tus datos, envía una solicitud a:\ngestión@mitaxigq.gq\n\nTu solicitud será revisada en 24-48h.')}
            style={{ width:'100%', padding:'8px', background:'#FFF8E1', border:'1px solid #FFD54F', borderRadius:'8px', color:'#E65100', fontSize:'11px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>
            ✏️ Solicitar edición a gestión
          </button>
        </div>
        {/* Datos vehículo certificados */}
        <div style={{ background:'#FFFFFF', borderRadius:'16px', padding:'16px', marginBottom:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
            <div style={{ fontSize:'13px', fontWeight:'700', color:'#1A2B4A', display:'flex', alignItems:'center', gap:'6px' }}>
              <TaxiStandardIcon size={14} color="#0096C7"/> Datos del vehículo
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'4px', background:'#E8F5E9', borderRadius:'20px', padding:'3px 10px' }}>
              <span style={{ fontSize:'10px' }}>🔒</span>
              <span style={{ fontSize:'10px', fontWeight:'700', color:'#2E7D32' }}>Vinculado</span>
            </div>
          </div>
          {[['Vehículo',driverForm.car||'—'],['Matrícula',driverForm.plate||'—'],['Estado','Verificado ✅']].map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', paddingBottom:'8px', marginBottom:'8px', borderBottom:'1px solid #F1F5F9' }}>
              <span style={{ fontSize:'12px', color:'#8A9BB5' }}>{l}</span>
              <span style={{ fontSize:'12px', fontWeight:'600', color: l==='Estado'?'#2E7D32':'#1A2B4A' }}>{v}</span>
            </div>
          ))}
          <div style={{ background:'#E3F2FD', borderRadius:'8px', padding:'8px 10px', display:'flex', gap:'6px' }}>
            <span style={{ fontSize:'14px', flexShrink:0 }}>🔒</span>
            <span style={{ fontSize:'11px', color:'#1565C0', lineHeight:'1.5' }}>Vehículo vinculado a tu cuenta. No puede ser traspasado sin autorización de MiTaxi GQ.</span>
          </div>
        </div>
        {/* Acciones */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
          <button onClick={() => setScreen('driver-requests')} className="taxi-action-btn"
            style={{ background:'linear-gradient(135deg,#0096C7,#48CAE4)', border:'none', borderRadius:'16px', padding:'16px', cursor:'pointer', textAlign:'left', transition:'all 0.2s', fontFamily:'inherit', boxShadow:'0 4px 12px rgba(0,150,199,0.3)' }}>
            <div style={{ marginBottom:'8px' }}><TaxiStandardIcon size={26} color="#fff" filled/></div>
            <div style={{ fontSize:'14px', fontWeight:'700', color:'#fff', marginBottom:'2px' }}>Solicitudes</div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.8)' }}>{requests.length} pendientes</div>
          </button>
          <button onClick={() => setScreen('driver-earnings')} className="taxi-action-btn"
            style={{ background:'#FFFFFF', border:'1.5px solid #E8EEF5', borderRadius:'16px', padding:'16px', cursor:'pointer', textAlign:'left', transition:'all 0.2s', fontFamily:'inherit', boxShadow:'0 2px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize:'26px', marginBottom:'8px' }}>📊</div>
            <div style={{ fontSize:'14px', fontWeight:'700', color:'#1A2B4A', marginBottom:'2px' }}>Ganancias</div>
            <div style={{ fontSize:'11px', color:'#8A9BB5' }}>Ver historial</div>
          </button>
        </div>
        <div style={{ height:'180px', borderRadius:'14px', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
          <RealMap status="idle"/>
        </div>
      </div>
    </div>
  );

  // ── DRIVER REQUESTS ───────────────────────────────────────────────────────
  if (screen === 'driver-requests') return (
    <div style={{ height:'100vh', background:'#EEF2F7', display:'flex', flexDirection:'column' }}>
      <Header title="Solicitudes" sub={`${requests.length} viajes disponibles`} back={() => setScreen('driver-home')}/>
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 90px' }}>
        {requests.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'300px', gap:'12px' }}>
            <TaxiIcon size={64} color="rgba(255,255,255,0.2)"/>
            <div style={{ fontSize:'16px', fontWeight:'700', color:'#8A9BB5' }}>Sin solicitudes por ahora</div>
            <div style={{ fontSize:'13px', color:'#8A9BB5' }}>Espera nuevas solicitudes en tu zona</div>
          </div>
        ) : requests.map(req => (
          <div key={req.id} style={{ background:'#FFFFFF', borderRadius:'16px', padding:'16px', marginBottom:'10px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'rgba(74,144,226,0.15)', border:'1px solid rgba(74,144,226,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <UserIcon size={20} color="#4A90E2" filled/>
                </div>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:'700', color:'#fff', marginBottom:'2px' }}>{req.passenger}</div>
                  <div style={{ fontSize:'12px', color:'#8A9BB5' }}>{req.from} → {req.to}</div>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'18px', fontWeight:'800', color:'#facc15' }}>{req.price.toLocaleString()}</div>
                <div style={{ fontSize:'10px', color:'#8A9BB5' }}>XAF</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
              {[{icon:'📍',v:req.dist},{icon:'⏱️',v:req.time}].map(d => (
                <div key={d.v} style={{ background:'#EEF2F7', borderRadius:'8px', padding:'6px 10px', display:'flex', alignItems:'center', gap:'5px' }}>
                  <span style={{ fontSize:'12px' }}>{d.icon}</span>
                  <span style={{ fontSize:'12px', color:'#8A9BB5' }}>{d.v}</span>
                </div>
              ))}
              <div style={{ background:'#EEF2F7', borderRadius:'8px', padding:'6px 10px', display:'flex', alignItems:'center', gap:'4px' }}>
                <StarIcon size={12} filled color="#FFB800"/>
                <span style={{ fontSize:'12px', color:'#FFB800', fontWeight:'600' }}>{req.rating}</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              <PBtn title="Aceptar viaje" onPress={() => { setActiveRequest(req); setRequests(p => p.filter(r => r.id!==req.id)); setScreen('driver-trip'); }} type="primary" icon={<TaxiIcon size={16} color="#1E293B" filled/>} fullWidth={false}/>
              <button onClick={() => setRequests(p => p.filter(r => r.id!==req.id))}
                style={{ flex:1, padding:'12px', background:'#EEF2F7', border:'none', borderRadius:'10px', color:'#8A9BB5', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>Rechazar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── DRIVER TRIP ───────────────────────────────────────────────────────────
  if (screen === 'driver-trip' && activeRequest) return (
    <div style={{ height:'100vh', background:'#EEF2F7', display:'flex', flexDirection:'column' }}>
      <Header title="Viaje activo" sub={`Pasajero: ${activeRequest.passenger}`} back={() => setScreen('driver-requests')}/>
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 90px' }}>
        <div style={{ height:'220px', marginBottom:'16px', borderRadius:'16px', overflow:'hidden' }}>
          <RealMap status="onway"/>
        </div>
        <div style={{ background:'#FFFFFF', borderRadius:'16px', padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:'800', color:'#1A2B4A' }}>{activeRequest.passenger.charAt(0)}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'16px', fontWeight:'700', color:'#1A2B4A' }}>{activeRequest.passenger}</div>
              <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'2px' }}>
                <StarIcon size={12} filled color="#FFB800"/><span style={{ fontSize:'12px', color:'#FFB800' }}>{activeRequest.rating}</span>
                <span style={{ fontSize:'12px', color:'#8A9BB5', marginLeft:'4px' }}>Pasajero frecuente</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              <button style={{ width:'38px', height:'38px', borderRadius:'50%', background:'rgba(0,200,160,0.15)', border:'1px solid rgba(0,200,160,0.3)', cursor:'pointer' }}>📞</button>
              <button style={{ width:'38px', height:'38px', borderRadius:'50%', background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.3)', cursor:'pointer' }}>💬</button>
            </div>
          </div>
          {/* Botón QR de cobro */}
          <div style={{ marginBottom:'14px' }}>
            <button onClick={() => setScreen('driver-qr')}
              style={{ width:'100%', padding:'12px', background:'linear-gradient(135deg,rgba(250,204,21,0.2),rgba(250,204,21,0.1))', border:'1px solid rgba(250,204,21,0.4)', borderRadius:'12px', color:'#facc15', fontSize:'13px', fontWeight:'800', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontFamily:'inherit' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 17h3M14 20h3"/></svg>
              Mostrar QR de cobro
            </button>
          </div>
          {/* Ruta */}
          <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
            <div style={{ flex:1, background:'#EEF2F7', borderRadius:'10px', padding:'10px', textAlign:'center' }}>
              <div style={{ fontSize:'10px', color:'#8A9BB5' }}>Recogida</div>
              <div style={{ fontSize:'12px', fontWeight:'700', color:'#00B4D8', marginTop:'2px' }}>{activeRequest.from}</div>
            </div>
            <div style={{ width:'20px', display:'flex', alignItems:'center', justifyContent:'center', color:'#8A9BB5' }}>→</div>
            <div style={{ flex:1, background:'#EEF2F7', borderRadius:'10px', padding:'10px', textAlign:'center' }}>
              <div style={{ fontSize:'10px', color:'#8A9BB5' }}>Destino</div>
              <div style={{ fontSize:'12px', fontWeight:'700', color:'#facc15', marginTop:'2px' }}>{activeRequest.to}</div>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', background:'rgba(250,204,21,0.08)', borderRadius:'10px', padding:'12px 14px', marginBottom:'14px' }}>
            <div>
              <div style={{ fontSize:'11px', color:'#8A9BB5' }}>Ganancia</div>
              <div style={{ fontSize:'20px', fontWeight:'800', color:'#facc15' }}>{activeRequest.price.toLocaleString()} XAF</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'11px', color:'#8A9BB5' }}>Distancia</div>
              <div style={{ fontSize:'14px', fontWeight:'700', color:'#1A2B4A' }}>{activeRequest.dist}</div>
            </div>
          </div>
          <button onClick={() => { setDriverEarnings(p => p+activeRequest.price); setDriverTripsToday(p => p+1); setActiveRequest(null); setScreen('driver-home'); }}
            style={{ width:'100%', padding:'16px', background:'linear-gradient(135deg,#48CAE4,#0096C7)', border:'none', borderRadius:'14px', color:'#fff', fontSize:'15px', fontWeight:'800', cursor:'pointer' }}>
            Completar viaje
          </button>
        </div>
      </div>
    </div>
  );

  // ── DRIVER EARNINGS ───────────────────────────────────────────────────────
  if (screen === 'driver-earnings') return (
    <div style={{ height:'100vh', background:'#EEF2F7', display:'flex', flexDirection:'column' }}>
      <Header title="Mis Ganancias" back={() => setScreen('driver-home')}/>
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 90px' }}>
        <div style={{ background:'linear-gradient(135deg,#161b27,#1e2535)', borderRadius:'20px', padding:'24px', marginBottom:'16px', textAlign:'center' }}>
          <div style={{ fontSize:'12px', color:'#8A9BB5', textTransform:'uppercase', marginBottom:'8px' }}>Ganancias totales</div>
          <div style={{ fontSize:'36px', fontWeight:'900', color:'#facc15', marginBottom:'4px' }}>{driverEarnings.toLocaleString()}</div>
          <div style={{ fontSize:'14px', color:'#8A9BB5' }}>XAF</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'16px' }}>
          {[{v:`${driverTripsToday}`,l:'Viajes hoy',c:'#00c8a0',icon:'🚗'},{v:'32',l:'Esta semana',c:'#3b82f6',icon:'📊'},{v:'4.8',l:'Rating medio',c:'#f59e0b',icon:'⭐'}].map(s => (
            <div key={s.l} style={{ background:'#FFFFFF', borderRadius:'12px', padding:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', textAlign:'center' }}>
              <div style={{ fontSize:'20px', marginBottom:'4px' }}>{s.icon}</div>
              <div style={{ fontSize:'18px', fontWeight:'800', color:s.c }}>{s.v}</div>
              <div style={{ fontSize:'10px', color:'#8A9BB5', marginTop:'2px' }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ background:'#FFFFFF', borderRadius:'16px', padding:'16px', marginBottom:'16px' }}>
          <div style={{ fontSize:'12px', fontWeight:'700', color:'#8A9BB5', marginBottom:'14px' }}>Ganancias esta semana</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:'6px', height:'80px' }}>
            {[{d:'L',v:65},{d:'M',v:80},{d:'X',v:45},{d:'J',v:90},{d:'V',v:100},{d:'S',v:75},{d:'D',v:55}].map(bar => (
              <div key={bar.d} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                <div style={{ width:'100%', background:'linear-gradient(180deg,#facc15,rgba(250,204,21,0.3))', borderRadius:'4px 4px 0 0', height:`${bar.v}%`, minHeight:'4px' }}/>
                <div style={{ fontSize:'10px', color:'#8A9BB5' }}>{bar.d}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize:'12px', fontWeight:'700', color:'#8A9BB5', marginBottom:'10px' }}>Historial de pagos</div>
        {[{date:'Hoy',trips:driverTripsToday,amount:driverEarnings},{date:'Ayer',trips:8,amount:52000},{date:'Lunes',trips:6,amount:38500},{date:'Domingo',trips:10,amount:67000}].map(h => (
          <div key={h.date} style={{ background:'#FFFFFF', borderRadius:'12px', padding:'13px 14px', marginBottom:'8px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:'13px', fontWeight:'600', color:'#1A2B4A' }}>{h.date}</div>
              <div style={{ fontSize:'11px', color:'#8A9BB5', marginTop:'2px' }}>{h.trips} viajes completados</div>
            </div>
            <div style={{ fontSize:'15px', fontWeight:'800', color:'#facc15' }}>{h.amount.toLocaleString()} XAF</div>
          </div>
        ))}
        <button onClick={() => { if(window.confirm(`¿Retirar ${driverEarnings.toLocaleString()} XAF a tu cuenta bancaria?`)){ alert('✅ Retiro solicitado. Recibirás el dinero en 24-48h.'); setDriverEarnings(0); }}} style={{ width:'100%', marginTop:'8px', padding:'16px', background:'linear-gradient(135deg,#48CAE4,#0096C7)', border:'none', borderRadius:'14px', color:'#fff', fontSize:'15px', fontWeight:'800', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
          <WalletIcon size={20} color="#fff" filled/> Retirar a cuenta bancaria
        </button>
      </div>
    </div>
  );

  return null;
};

export default MiTaxiView;
