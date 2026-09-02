// Datos servicios básicos — paridad ServiciosModules.tsx web

export const INTERNET_PROVIDERS = [
  { id: 'ip1', name: 'GETESA', full: 'Guinea Ecuatorial de Telecomunicaciones S.A.', color: '#003082', cat: 'Telecom / Internet', cov: 'Nacional', type: 'Operador / Proveedor Internet' },
  { id: 'ip2', name: 'GECOMSA', full: 'GECOMSA Telecomunicaciones', color: '#0066CC', cat: 'Telecom / Internet Móvil', cov: 'Nacional', type: 'Operador Móvil / Datos' },
  { id: 'ip3', name: 'Conexxia', full: 'Conexxia Internet Empresarial', color: '#8B5CF6', cat: 'Internet Empresarial', cov: 'Nacional', type: 'Internet Empresa / Redes' },
  { id: 'ip4', name: 'Guineanet', full: 'Guineanet Proveedor de Internet', color: '#10B981', cat: 'Proveedor de Internet', cov: 'Nacional', type: 'Conectividad / Internet' },
  { id: 'ip5', name: 'Fenix', full: 'Fenix Tecnología e Internet', color: '#F97316', cat: 'Tecnología / Internet', cov: 'Nacional', type: 'Internet Residencial / Empresarial' },
  { id: 'ip6', name: 'IPX EG', full: 'IPX EG Conectividad e Infraestructura', color: '#6366F1', cat: 'Conectividad / Infraestructura', cov: 'Nacional', type: 'Internet / Redes / Telecom' },
  { id: 'ip7', name: 'Officetech', full: 'Officetech Tecnología y Conectividad', color: '#0EA5E9', cat: 'Tecnología / Conectividad', cov: 'Nacional', type: 'Internet / Soporte TI' },
  { id: 'ip8', name: 'GITGE', full: 'GITGE Infraestructura Telecom', color: '#1E293B', cat: 'Infraestructura Telecom', cov: 'Nacional', type: 'Backbone / Infraestructura' },
  { id: 'ip9', name: 'ORTEL GE', full: 'ORTEL GE Supervisión Sectorial', color: '#DC2626', cat: 'Telecom / Supervisión', cov: 'Nacional', type: 'Telecom / Soporte Sectorial' },
];

export type InternetService = { id: string; name: string; type: string; desc: string; price: string; speed: string };

export const INTERNET_SERVICES: Record<string, InternetService[]> = {
  ip1: [
    { id: 's1', name: 'Internet Hogar Básico', type: 'Hogar', desc: 'Conexión ADSL residencial', price: '15,000 XAF/mes', speed: '10 Mbps' },
    { id: 's2', name: 'Fibra Óptica Hogar', type: 'Hogar', desc: 'Fibra óptica de alta velocidad', price: '30,000 XAF/mes', speed: '100 Mbps' },
    { id: 's3', name: 'Internet Empresa', type: 'Empresa', desc: 'Conectividad empresarial dedicada', price: '80,000 XAF/mes', speed: '500 Mbps' },
    { id: 's4', name: 'Router + Instalación', type: 'Servicio', desc: 'Instalación completa con router', price: '25,000 XAF', speed: '—' },
  ],
  ip2: [
    { id: 's5', name: 'Datos Móvil Diario', type: 'Móvil', desc: '1 GB datos móviles 24h', price: '500 XAF/día', speed: '4G' },
    { id: 's6', name: 'Paquete Mensual 10GB', type: 'Móvil', desc: '10 GB datos 30 días', price: '8,000 XAF/mes', speed: '4G' },
    { id: 's7', name: 'Paquete Ilimitado', type: 'Móvil', desc: 'Datos ilimitados 30 días', price: '20,000 XAF/mes', speed: '4G' },
  ],
  ip3: [
    { id: 's8', name: 'Internet Empresarial', type: 'Empresa', desc: 'Conectividad dedicada empresas', price: '120,000 XAF/mes', speed: '1 Gbps' },
    { id: 's9', name: 'VPN Corporativa', type: 'Empresa', desc: 'Red privada virtual segura', price: '50,000 XAF/mes', speed: '—' },
  ],
  ip4: [
    { id: 's10', name: 'Internet Residencial', type: 'Hogar', desc: 'Conexión inalámbrica residencial', price: '12,000 XAF/mes', speed: '20 Mbps' },
    { id: 's11', name: 'Internet Inalámbrico', type: 'Hogar', desc: 'Conexión wireless sin cables', price: '18,000 XAF/mes', speed: '50 Mbps' },
  ],
  ip5: [
    { id: 's12', name: 'Fibra Residencial', type: 'Hogar', desc: 'Fibra óptica para el hogar', price: '22,000 XAF/mes', speed: '100 Mbps' },
    { id: 's13', name: 'Paquete Empresarial', type: 'Empresa', desc: 'Solución completa para empresas', price: '95,000 XAF/mes', speed: '500 Mbps' },
  ],
  ip6: [
    { id: 's14', name: 'Internet Dedicado', type: 'Empresa', desc: 'Línea dedicada garantizada', price: '200,000 XAF/mes', speed: '1 Gbps' },
    { id: 's15', name: 'Infraestructura de Red', type: 'Empresa', desc: 'Diseño e instalación de redes', price: 'Consultar', speed: '—' },
  ],
  ip7: [
    { id: 's16', name: 'Internet + Soporte TI', type: 'Empresa', desc: 'Conectividad con soporte técnico', price: '60,000 XAF/mes', speed: '200 Mbps' },
    { id: 's17', name: 'Revisión de Línea', type: 'Servicio', desc: 'Diagnóstico y revisión técnica', price: '5,000 XAF', speed: '—' },
  ],
  ip8: [{ id: 's18', name: 'Backbone Nacional', type: 'Infraestructura', desc: 'Infraestructura de backbone', price: 'Consultar', speed: '10 Gbps' }],
  ip9: [{ id: 's19', name: 'Soporte Sectorial', type: 'Soporte', desc: 'Supervisión y soporte telecom', price: 'Consultar', speed: '—' }],
};

// Datos servicios básicos — Configuración para backend real
// Los operadores y paquetes móviles ahora se obtienen desde la API

export const MOBILE_OPERATORS = [
  { id: 'getesa', name: 'GETESA', color: '#003082' },
  { id: 'gecomsa', name: 'GECOMSA', color: '#0066CC' },
  { id: 'orange', name: 'Orange GE', color: '#FF6600' }
];

export type MobilePackage = { 
  id: string; 
  name: string; 
  type: string; 
  desc: string; 
  price: number; 
  validity: string 
};

// Los paquetes ahora se cargan dinámicamente desde /api/services/mobile/operators/:id/packages
export const MOBILE_PACKAGES: Record<string, MobilePackage[]> = {};

export const CHANNEL_COMPANIES = [
  { id: 'cc1', name: 'Canal Sol', full: 'Canal Sol Guinea Ecuatorial', color: '#0A2463', cat: 'TV Local / Generalista', desc: 'Canal de televisión local de Guinea Ecuatorial', cov: 'Nacional' },
  { id: 'cc2', name: 'Cachu y Hnos', full: 'Cachu y Hermanos Entretenimiento', color: '#1B4332', cat: 'TV Local / Entretenimiento', desc: 'Producción y entretenimiento local GQ', cov: 'Nacional' },
  { id: 'cc3', name: 'Guinea Vista', full: 'Guinea Vista Televisión', color: '#B45309', cat: 'TV Local / Informativa', desc: 'Televisión local informativa de Guinea Ecuatorial', cov: 'Nacional' },
  { id: 'cc4', name: 'Canal Sat', full: 'Canal Sat Guinea Ecuatorial', color: '#1E3A5F', cat: 'TV Satélite', desc: 'Televisión por satélite para Guinea Ecuatorial', cov: 'Nacional' },
  { id: 'cc5', name: 'Canal+', full: 'Canal+ Guinea Ecuatorial', color: '#0A0A0A', cat: 'TV Premium', desc: 'Cine, series y deportes premium en HD', cov: 'Con internet / satélite' },
  { id: 'cc6', name: 'Sony Sat', full: 'Sony Sat Guinea Ecuatorial', color: '#1A1A1A', cat: 'TV Satélite / Internacional', desc: 'Televisión por satélite Sony en Guinea Ecuatorial', cov: 'Nacional' },
  { id: 'cc7', name: 'Kuryebe', full: 'Kuryebe Televisión GQ', color: '#7C3AED', cat: 'TV Local / Digital', desc: 'Canal digital local de Guinea Ecuatorial', cov: 'Nacional' },
];

export type ChannelPackage = { id: string; name: string; type: string; desc: string; price: string; duration: string; channels: string[] };

export const CHANNEL_PACKAGES: Record<string, ChannelPackage[]> = {
  cc1: [
    { id: 'cp1', name: 'Sol Básico', type: 'Básico', desc: 'Programación general diaria', price: '3,000 XAF/mes', duration: '1 mes', channels: ['Noticias locales', 'Entretenimiento', 'Deportes GQ', 'Cultura'] },
    { id: 'cp2', name: 'Sol Plus', type: 'Completo', desc: 'Acceso completo a Canal Sol', price: '6,000 XAF/mes', duration: '1 mes', channels: ['Todo Canal Sol', 'Repeticiones', 'Archivo', 'Eventos en directo'] },
    { id: 'cp3', name: 'Sol Anual', type: 'Anual', desc: 'Suscripción anual con descuento', price: '60,000 XAF/año', duration: '12 meses', channels: ['Todo Canal Sol', 'Acceso prioritario', 'Sin interrupciones'] },
  ],
  cc2: [
    { id: 'cp4', name: 'Cachu Básico', type: 'Básico', desc: 'Entretenimiento y shows locales', price: '2,500 XAF/mes', duration: '1 mes', channels: ['Shows locales', 'Humor GQ', 'Música africana', 'Eventos'] },
    { id: 'cp5', name: 'Cachu Premium', type: 'Premium', desc: 'Contenido exclusivo Cachu y Hnos', price: '5,000 XAF/mes', duration: '1 mes', channels: ['Contenido exclusivo', 'Estrenos', 'Detrás de cámaras', 'Archivo'] },
  ],
  cc3: [
    { id: 'cp6', name: 'Guinea Vista Info', type: 'Informativo', desc: 'Noticias y actualidad de GQ', price: '2,000 XAF/mes', duration: '1 mes', channels: ['Noticias 24h', 'Política GQ', 'Economía', 'Internacional'] },
    { id: 'cp7', name: 'Guinea Vista Plus', type: 'Completo', desc: 'Programación completa Guinea Vista', price: '4,500 XAF/mes', duration: '1 mes', channels: ['Noticias', 'Documentales', 'Reportajes', 'Entrevistas', 'Cultura'] },
  ],
  cc4: [
    { id: 'cp8', name: 'Sat Básico', type: 'Satélite', desc: 'Paquete satélite básico', price: '8,000 XAF/mes', duration: '1 mes', channels: ['50+ canales', 'Noticias internacionales', 'Deportes', 'Cine'] },
    { id: 'cp9', name: 'Sat Familiar', type: 'Familiar', desc: 'Paquete familiar por satélite', price: '14,000 XAF/mes', duration: '1 mes', channels: ['80+ canales', 'Infantil', 'Deportes', 'Películas', 'Documentales'] },
    { id: 'cp10', name: 'Sat Premium', type: 'Premium', desc: 'Paquete satélite completo', price: '25,000 XAF/mes', duration: '1 mes', channels: ['150+ canales', 'HD', 'Deportes premium', 'Cine premium', 'Series'] },
  ],
  cc5: [
    { id: 'cp11', name: 'Canal+ Séries', type: 'Series', desc: 'Las mejores series internacionales', price: '18,000 XAF/mes', duration: '1 mes', channels: ['Canal+ Séries', 'Canal+ Cinéma', 'OCS', 'HBO'] },
    { id: 'cp12', name: 'Canal+ Sport', type: 'Deportes', desc: 'Fútbol y deportes premium', price: '22,000 XAF/mes', duration: '1 mes', channels: ['Canal+ Sport', 'beIN Sports', 'Eurosport', 'LaLiga'] },
    { id: 'cp13', name: 'Canal+ Tout', type: 'Premium', desc: 'Paquete completo Canal+', price: '38,000 XAF/mes', duration: '1 mes', channels: ['Todos los canales Canal+', '4K', 'Sin anuncios'] },
  ],
  cc6: [
    { id: 'cp14', name: 'Sony Sat Básico', type: 'Satélite', desc: 'Canales Sony por satélite', price: '10,000 XAF/mes', duration: '1 mes', channels: ['Sony Entertainment', 'Sony Movies', 'Sony Ten', 'AXN'] },
    { id: 'cp15', name: 'Sony Sat Plus', type: 'Premium', desc: 'Paquete completo Sony Sat', price: '18,000 XAF/mes', duration: '1 mes', channels: ['Todos los canales Sony', 'HD', 'Deportes', 'Cine', 'Series'] },
  ],
  cc7: [
    { id: 'cp16', name: 'Kuryebe Básico', type: 'Básico', desc: 'Programación local Kuryebe', price: '2,000 XAF/mes', duration: '1 mes', channels: ['Entretenimiento local', 'Música GQ', 'Noticias', 'Cultura'] },
    { id: 'cp17', name: 'Kuryebe Plus', type: 'Completo', desc: 'Acceso completo a Kuryebe', price: '4,000 XAF/mes', duration: '1 mes', channels: ['Todo Kuryebe', 'Eventos en directo', 'Archivo', 'Exclusivos'] },
  ],
};
