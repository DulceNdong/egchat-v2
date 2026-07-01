// Datos servicios financieros — paridad ServiciosModules.tsx web

export type BankAccount = { type: string; number: string; balance: number };

export type GQBank = {
  id: string;
  name: string;
  full: string;
  founded: number;
  color: string;
  color2: string;
  initials: string;
  desc: string;
  address: string;
  phone: string;
  web: string;
  swift: string;
  branches: number;
  atms: number;
  services: string[];
  accounts: BankAccount[];
};

export const GQ_BANKS: GQBank[] = [
  {
    id: 'bange', name: 'BANGE', full: 'Banco Nacional de Guinea Ecuatorial',
    founded: 2006, color: '#003082', color2: '#0052CC', initials: 'BN',
    desc: 'Banco nacional con capital ecuatoguineano. Principal institución financiera del Estado.',
    address: 'Av. de la Independencia, Malabo', phone: '+240 333 09 10 00', web: 'bange.gq', swift: 'BANGEGQXX',
    branches: 8, atms: 12,
    services: ['Cuenta Corriente', 'Cuenta de Ahorros', 'Transferencias Nacionales', 'Transferencias CEMAC', 'Préstamos Personales', 'Tarjeta de Débito', 'Banca Digital'],
    accounts: [{ type: 'Cuenta Corriente', number: '****4521', balance: 45200 }, { type: 'Cuenta Ahorros', number: '****8834', balance: 120000 }],
  },
  {
    id: 'ccei', name: 'CCEI Bank GE', full: "Crédit Communautaire d'Afrique — Guinea Ecuatorial",
    founded: 1994, color: '#C8102E', color2: '#E8192C', initials: 'CC',
    desc: 'Filial del grupo Afriland First Bank. Pionero en Guinea Ecuatorial desde 1994.',
    address: 'Calle del Presidente Obiang, Malabo', phone: '+240 333 09 20 00', web: 'cceibank.gq', swift: 'CCEIGQXX',
    branches: 6, atms: 9,
    services: ['Cuenta Corriente', 'Cuenta de Ahorros', 'Transferencias Internacionales', 'Tarjetas Bancarias', 'Banca Digital'],
    accounts: [{ type: 'Cuenta Corriente', number: '****7712', balance: 80000 }],
  },
  {
    id: 'bgfi', name: 'BGFIBank GE', full: 'Banque Gabonaise et Française Internationale — GE',
    founded: 2001, color: '#00539B', color2: '#0070CC', initials: 'BG',
    desc: 'Grupo financiero panafricano en 10 países. Especializado en empresas y grandes cuentas.',
    address: 'Av. Hassan II, Malabo', phone: '+240 333 09 30 00', web: 'bgfi.gq', swift: 'BGFIGQXX',
    branches: 5, atms: 7,
    services: ['Banca Corporativa', 'Banca Personal', 'Pagos QR', 'Inversiones', 'Tarjetas Premium'],
    accounts: [],
  },
  {
    id: 'ecobank', name: 'Ecobank GE', full: 'Ecobank Equatorial Guinea',
    founded: 2010, color: '#00A3E0', color2: '#0077B6', initials: 'EC',
    desc: 'Banco panafricano en 35 países. Líder en banca móvil y pagos digitales en África.',
    address: 'Calle de Argelia, Malabo', phone: '+240 333 09 40 00', web: 'ecobank.com', swift: 'ECOBGQXX',
    branches: 4, atms: 8,
    services: ['Banca Móvil Xpress', 'Transferencias Pan-Africanas', 'Tarjeta Ecobank', 'Banca Digital'],
    accounts: [],
  },
  {
    id: 'cbge', name: 'CBGE', full: 'Commercial Bank Guinée Equatoriale',
    founded: 2008, color: '#1B5E20', color2: '#2E7D32', initials: 'CB',
    desc: 'Filial del Commercial Bank Group. Enfocado en financiamiento comercial y empresarial.',
    address: 'Av. de la Libertad, Malabo', phone: '+240 333 09 50 00', web: 'cbge.gq', swift: 'CBGEGQXX',
    branches: 3, atms: 5,
    services: ['Cuenta Corriente Empresarial', 'Financiamiento Comercial', 'Cartas de Crédito', 'Banca Digital'],
    accounts: [],
  },
];

export type InsProduct = {
  id: string; name: string; type: string; price: string; coverage: string; desc: string; docs: string[];
};

export type InsCompany = {
  id: string; name: string; color: string; color2: string; initials: string;
  desc: string; phone: string; address: string; products: InsProduct[];
};

export const INS_COMPANIES: InsCompany[] = [
  {
    id: 'gepetrol', name: 'GEPetrol Seguros', color: '#1B5E20', color2: '#2E7D32', initials: 'GP',
    desc: 'Aseguradora oficial del sector petrolero y energético de Guinea Ecuatorial.',
    phone: '+240 333 09 60 00', address: 'Av. de la Independencia, Malabo',
    products: [
      { id: 'gp1', name: 'Seguro de Vida', type: 'vida', price: '8,000 XAF/mes', coverage: 'Hasta 50M XAF', desc: 'Cobertura familiar completa.', docs: ['DNI / Pasaporte', 'Certificado médico', 'Formulario de beneficiarios'] },
      { id: 'gp2', name: 'Seguro de Salud', type: 'salud', price: '12,000 XAF/mes', coverage: 'Hospitalización + consultas', desc: 'Cubre hospitalización, consultas y urgencias.', docs: ['DNI / Pasaporte', 'Historial médico', 'Formulario de solicitud'] },
      { id: 'gp3', name: 'Seguro de Vehículo', type: 'auto', price: '15,000 XAF/mes', coverage: 'Todo riesgo', desc: 'Cobertura total: robo, accidente, terceros.', docs: ['DNI', 'Permiso de conducir', 'Tarjeta de circulación'] },
    ],
  },
  {
    id: 'activa', name: 'Activa Assurances GQ', color: '#E65100', color2: '#F57C00', initials: 'AA',
    desc: 'Filial del grupo Activa, presente en 12 países de África Central y Occidental.',
    phone: '+240 333 09 61 00', address: 'Calle de Argelia, Malabo',
    products: [
      { id: 'aa1', name: 'Seguro de Vida', type: 'vida', price: '7,500 XAF/mes', coverage: 'Hasta 40M XAF', desc: 'Protección financiera para tu familia.', docs: ['DNI / Pasaporte', 'Certificado médico'] },
      { id: 'aa2', name: 'Seguro del Hogar', type: 'hogar', price: '5,000 XAF/mes', coverage: 'Robo, incendio', desc: 'Protege tu vivienda y contenido.', docs: ['DNI', 'Escritura o contrato'] },
      { id: 'aa3', name: 'Seguro de Vehículo', type: 'auto', price: '13,000 XAF/mes', coverage: 'Todo riesgo o terceros', desc: 'Cobertura total o responsabilidad civil.', docs: ['DNI', 'Permiso de conducir'] },
      { id: 'aa4', name: 'Seguro de Viaje', type: 'viaje', price: '3,000 XAF/viaje', coverage: 'Cobertura internacional', desc: 'Asistencia médica en el extranjero.', docs: ['DNI / Pasaporte', 'Billete de avión'] },
    ],
  },
  {
    id: 'sunu', name: 'Sunu Assurances GQ', color: '#1565C0', color2: '#1976D2', initials: 'SA',
    desc: 'Grupo panafricano de seguros con presencia en 15 países africanos.',
    phone: '+240 333 09 62 00', address: 'Av. Hassan II, Malabo',
    products: [
      { id: 'sa1', name: 'Seguro de Salud', type: 'salud', price: '10,000 XAF/mes', coverage: 'Hospitalización + especialistas', desc: 'Red médica privada y reembolsos.', docs: ['DNI', 'Historial médico'] },
      { id: 'sa2', name: 'Seguro de Vida', type: 'vida', price: '6,000 XAF/mes', coverage: 'Hasta 30M XAF', desc: 'Vida con ahorro y cobertura por invalidez.', docs: ['DNI', 'Certificado médico'] },
      { id: 'sa3', name: 'Seguro Empresarial', type: 'empresa', price: 'Consultar', coverage: 'Personalizado', desc: 'Responsabilidad civil empresarial.', docs: ['Registro mercantil', 'NIF empresa'] },
    ],
  },
  {
    id: 'allianz', name: 'Allianz GQ', color: '#003781', color2: '#0057A8', initials: 'AL',
    desc: 'Filial del grupo Allianz, líder mundial en seguros.',
    phone: '+240 333 09 63 00', address: 'Centro Comercial, Malabo',
    products: [
      { id: 'al1', name: 'Seguro de Vida Premium', type: 'vida', price: '15,000 XAF/mes', coverage: 'Hasta 100M XAF', desc: 'Cobertura premium con ahorro.', docs: ['DNI', 'Certificado médico completo'] },
      { id: 'al2', name: 'Seguro de Salud Premium', type: 'salud', price: '20,000 XAF/mes', coverage: 'Total + dental + óptica', desc: 'La cobertura más completa.', docs: ['DNI', 'Historial médico completo'] },
      { id: 'al3', name: 'Seguro de Vehículo Premium', type: 'auto', price: '18,000 XAF/mes', coverage: 'Todo riesgo + asistencia 24h', desc: 'Asistencia en carretera 24h.', docs: ['DNI', 'Permiso de conducir', 'Ficha técnica'] },
    ],
  },
  {
    id: 'axa', name: 'AXA GQ', color: '#00008F', color2: '#0000CC', initials: 'AX',
    desc: 'Grupo AXA en Guinea Ecuatorial. Seguros de vida, salud y patrimonio.',
    phone: '+240 333 09 64 00', address: 'Barrio Residencial, Malabo',
    products: [
      { id: 'ax1', name: 'Seguro de Vida', type: 'vida', price: '9,000 XAF/mes', coverage: 'Hasta 60M XAF', desc: 'Protección de vida con invalidez.', docs: ['DNI', 'Certificado médico'] },
      { id: 'ax2', name: 'Seguro del Hogar', type: 'hogar', price: '6,500 XAF/mes', coverage: 'Robo, incendio, RC', desc: 'Protección integral del hogar.', docs: ['DNI', 'Escritura'] },
      { id: 'ax3', name: 'Seguro de Viaje', type: 'viaje', price: '4,000 XAF/viaje', coverage: 'Médico + equipaje', desc: 'Cobertura completa para viajes.', docs: ['DNI', 'Billete de avión'] },
    ],
  },
];

export const INS_COLORS: Record<string, string> = {
  vida: '#E05C7A', salud: '#2E9E6B', auto: '#3B7DD8', hogar: '#C47D2A', viaje: '#6B5BD6', empresa: '#0E7FA8',
};

export type Bill = {
  id: string; service: string; provider: string; amount: number;
  dueDate: string; status: 'pendiente' | 'vencida' | 'pagada'; ref: string; icon: string; color: string;
};

export const INITIAL_BILLS: Bill[] = [
  { id: 'b1', service: 'Electricidad', provider: 'SEGESA', amount: 18500, dueDate: '30/04/2026', status: 'pendiente', ref: '0012345678', icon: '⚡', color: '#C47D2A' },
  { id: 'b2', service: 'Agua', provider: 'SNGE', amount: 8200, dueDate: '15/04/2026', status: 'vencida', ref: 'SNGE-00456', icon: '💧', color: '#1485EE' },
  { id: 'b3', service: 'Internet', provider: 'GETESA', amount: 25000, dueDate: '05/05/2026', status: 'pendiente', ref: 'GET-789012', icon: '📶', color: '#6B5BD6' },
  { id: 'b4', service: 'Electricidad', provider: 'SEGESA', amount: 16800, dueDate: '28/03/2026', status: 'pagada', ref: '0012345678', icon: '⚡', color: '#C47D2A' },
];

export const BILL_CATEGORIES = [
  { id: 'elec', label: 'Electricidad', provider: 'SEGESA', icon: '⚡', color: '#C47D2A' },
  { id: 'agua', label: 'Agua', provider: 'SNGE', icon: '💧', color: '#1485EE' },
  { id: 'gas', label: 'Gas', provider: 'GEPetrol', icon: '🔥', color: '#EF4444' },
  { id: 'internet', label: 'Internet', provider: 'GETESA', icon: '📶', color: '#6B5BD6' },
  { id: 'telefono', label: 'Teléfono', provider: 'GETESA', icon: '📞', color: '#2E9E6B' },
  { id: 'alquiler', label: 'Alquiler', provider: 'Propietario', icon: '🏠', color: '#0E7FA8' },
  { id: 'seguro', label: 'Seguro', provider: 'Aseguradora', icon: '🛡️', color: '#7C3AED' },
  { id: 'otro', label: 'Otro', provider: '', icon: '📄', color: '#5A7090' },
];

export const INVEST_OPTIONS = [
  { id: 'plazo', label: 'Depósito a Plazo', sub: '3-24 meses', rate: '+6% anual', color: '#07C160' },
  { id: 'fondos', label: 'Fondos de Inversión', sub: 'Cartera diversificada', rate: '+8-12% anual', color: '#1485EE' },
  { id: 'bonos', label: 'Bonos del Estado', sub: 'Renta fija CEMAC', rate: '+5% anual', color: '#576B95' },
  { id: 'acciones', label: 'Acciones BVMAC', sub: 'Bolsa de Libreville', rate: 'Variable', color: '#FA9D3B' },
  { id: 'inmobiliario', label: 'Inversión Inmobiliaria', sub: 'Propiedades en Malabo y Bata', rate: '+15% anual', color: '#6B5BD6' },
  { id: 'energia', label: 'Sector energético', sub: 'Proyectos GEPetrol', rate: 'Consultar', color: '#F97316' },
];

export const MOCK_TX_HISTORY = [
  { type: 'in', desc: 'Transferencia recibida de Juan', amount: 50000, date: '12/03/2026' },
  { type: 'out', desc: 'Pago servicio electricidad', amount: 25000, date: '10/03/2026' },
  { type: 'out', desc: 'Transferencia enviada a María', amount: 15000, date: '08/03/2026' },
  { type: 'in', desc: 'Depósito salario', amount: 150000, date: '01/03/2026' },
  { type: 'out', desc: 'Recarga móvil GETESA', amount: 5000, date: '28/02/2026' },
  { type: 'out', desc: 'Pago agua SNGE', amount: 8200, date: '25/02/2026' },
];
