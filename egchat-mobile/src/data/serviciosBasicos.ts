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

export const MOBILE_OPERATORS = [
  { id: 'mo1', name: 'GETESA', color: '#003082', cat: 'Operador Móvil / Telefonía', cov: 'Nacional', desc: 'Operador estatal de telecomunicaciones' },
  { id: 'mo2', name: 'GECOMSA', color: '#0066CC', cat: 'Operador Móvil / Datos', cov: 'Nacional', desc: 'Operador móvil de datos y telefonía' },
  { id: 'mo3', name: 'MUNI', color: '#FF6B00', cat: 'Operador Móvil', cov: 'Nacional', desc: 'MUNI Telecomunicaciones Guinea Ecuatorial' },
  { id: 'mo4', name: 'Orange GE', color: '#FF6600', cat: 'Operador Móvil', cov: 'Nacional', desc: 'Orange Guinea Ecuatorial' },
  { id: 'mo5', name: 'Otro', color: '#8A9BB5', cat: 'Otros Operadores', cov: 'Nacional', desc: 'Otros operadores disponibles' },
];

export type MobilePackage = { id: string; name: string; type: string; desc: string; price: number; validity: string };

export const MOBILE_PACKAGES: Record<string, MobilePackage[]> = {
  mo1: [
    { id: 'r1', name: 'Recarga 500 XAF', type: 'Saldo', desc: 'Recarga de saldo', price: 500, validity: 'Sin caducidad' },
    { id: 'r2', name: 'Recarga 1,000 XAF', type: 'Saldo', desc: 'Recarga de saldo', price: 1000, validity: 'Sin caducidad' },
    { id: 'r3', name: 'Recarga 2,000 XAF', type: 'Saldo', desc: 'Recarga de saldo', price: 2000, validity: 'Sin caducidad' },
    { id: 'r4', name: 'Recarga 5,000 XAF', type: 'Saldo', desc: 'Recarga de saldo', price: 5000, validity: 'Sin caducidad' },
    { id: 'r5', name: 'Datos 1 GB', type: 'Datos', desc: '1 GB datos móviles', price: 1500, validity: '7 días' },
    { id: 'r6', name: 'Datos 5 GB', type: 'Datos', desc: '5 GB datos móviles', price: 5000, validity: '30 días' },
    { id: 'r7', name: 'Pack Mixto', type: 'Mixto', desc: '500 MB + 100 min llamadas', price: 3000, validity: '30 días' },
  ],
  mo2: [
    { id: 'r8', name: 'Recarga 500 XAF', type: 'Saldo', desc: 'Recarga de saldo', price: 500, validity: 'Sin caducidad' },
    { id: 'r9', name: 'Datos Diario 1GB', type: 'Datos', desc: '1 GB datos 24h', price: 500, validity: '1 día' },
    { id: 'r10', name: 'Datos Semanal 5GB', type: 'Datos', desc: '5 GB datos 7 días', price: 2500, validity: '7 días' },
    { id: 'r11', name: 'Datos Mensual 25GB', type: 'Datos', desc: '25 GB datos 30 días', price: 15000, validity: '30 días' },
    { id: 'r12', name: 'Ilimitado Mensual', type: 'Datos', desc: 'Datos ilimitados 30 días', price: 25000, validity: '30 días' },
  ],
  mo3: [
    { id: 'r13', name: 'Recarga 500 XAF', type: 'Saldo', desc: 'Recarga de saldo MUNI', price: 500, validity: 'Sin caducidad' },
    { id: 'r14', name: 'Recarga 1,000 XAF', type: 'Saldo', desc: 'Recarga de saldo MUNI', price: 1000, validity: 'Sin caducidad' },
    { id: 'r15', name: 'Datos Diario 500MB', type: 'Datos', desc: '500 MB datos 24h', price: 300, validity: '1 día' },
    { id: 'r16', name: 'Datos Semanal 3GB', type: 'Datos', desc: '3 GB datos 7 días', price: 2000, validity: '7 días' },
    { id: 'r17', name: 'Datos Mensual 10GB', type: 'Datos', desc: '10 GB datos 30 días', price: 8000, validity: '30 días' },
    { id: 'r18', name: 'Pack Mixto MUNI', type: 'Mixto', desc: '1 GB + 60 min llamadas', price: 3500, validity: '30 días' },
  ],
  mo4: [
    { id: 'r19', name: 'Recarga 1,000 XAF', type: 'Saldo', desc: 'Recarga de saldo', price: 1000, validity: 'Sin caducidad' },
    { id: 'r20', name: 'Fly 1G', type: 'Datos', desc: '1 GB datos 3 días', price: 1000, validity: '3 días' },
    { id: 'r21', name: 'Max 20G', type: 'Datos', desc: '20 GB datos 30 días', price: 12000, validity: '30 días' },
  ],
  mo5: [{ id: 'r22', name: 'Recarga Genérica', type: 'Saldo', desc: 'Recarga de saldo', price: 1000, validity: 'Sin caducidad' }],
};

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
