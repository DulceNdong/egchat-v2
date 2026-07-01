// Datos servicios públicos — paridad App.tsx / ServiciosModules.tsx web

export type UtilityVariant = 'elec' | 'agua';

export const UTILITY_CONFIG: Record<UtilityVariant, {
  title: string; subtitle: string; gradient: [string, string]; accent: string;
  icon: string; placeholder: string; hint: string; mockImporte: number;
}> = {
  elec: {
    title: 'SEGESA',
    subtitle: 'Sociedad de Electricidad de Guinea Ecuatorial',
    gradient: ['#1A3A6B', '#2A5298'],
    accent: '#1A3A6B',
    icon: '⚡',
    placeholder: 'Ej: 0012345678',
    hint: '📋 Encuéntralo en tu factura o en el medidor',
    mockImporte: 18500,
  },
  agua: {
    title: 'SNGE',
    subtitle: 'Sociedad Nacional de Gestión del Agua',
    gradient: ['#0A4A8A', '#1565C0'],
    accent: '#0A4A8A',
    icon: '💧',
    placeholder: 'Ej: SNGE-00456',
    hint: '📋 Encuéntralo en tu factura de agua',
    mockImporte: 8200,
  },
};

export const CLIENT_TYPES = ['Residencial', 'Comercial', 'Industrial'] as const;

export const PAY_METHODS = [
  { id: 'wallet', label: 'EGCHAT Wallet', icon: '💳' },
  { id: 'bank', label: 'Banco', icon: '🏦' },
  { id: 'cash', label: 'Efectivo', icon: '💵' },
] as const;

export const EDU_OPTIONS = [
  { id: 'matricula', label: 'Matrícula Escolar', sub: 'Colegios públicos y privados', price: 25000, color: '#6B5BD6', icon: '🏫' },
  { id: 'universidad', label: 'Universidad', sub: 'UNGE, UNIGE y otras', price: 150000, color: '#1485EE', icon: '🏛️' },
  { id: 'cursos', label: 'Cursos y Formación', sub: 'Formación profesional online', price: 50000, color: '#00c8a0', icon: '💻' },
  { id: 'libros', label: 'Material Escolar', sub: 'Libros y útiles escolares', price: 15000, color: '#F59E0B', icon: '📚' },
];

export const CORREOS_OPTIONS = [
  { id: 'carta', label: 'Carta Nacional', sub: 'Entrega en 2-3 días', price: 500, color: '#FA9D3B' },
  { id: 'paquete', label: 'Paquete Nacional', sub: 'Hasta 5kg', price: 2000, color: '#07C160' },
  { id: 'express', label: 'Envío Express', sub: 'Entrega en 24h', price: 5000, color: '#FA5151' },
  { id: 'internacional', label: 'Envío Internacional', sub: 'CEMAC y mundo', price: 15000, color: '#1485EE' },
];

export const IMPUESTOS_OPTIONS = [
  { id: 'irpf', label: 'IRPF / Renta', sub: 'Declaración anual', color: '#FA5151' },
  { id: 'iva', label: 'IVA', sub: 'Impuesto sobre el valor', color: '#576B95' },
  { id: 'municipal', label: 'Tasa Municipal', sub: 'Ayuntamiento', color: '#FA9D3B' },
  { id: 'vehiculo', label: 'Impuesto Vehículo', sub: 'Circulación anual', color: '#1485EE' },
];

export interface Hospital {
  id: string; name: string; city: string; address: string; phone: string;
  beds: number; doctors: number; emergency: boolean; rating: number;
  specialties: string[]; schedule: string; lat?: number; lng?: number;
}

export interface School {
  id: string; name: string; city: string; level: string;
  type: 'publica' | 'privada' | 'profesional';
  modality: string; plazas: number; phone: string;
}

export const EDU_CITIES = ['Malabo', 'Bata', 'Ebebiyín', 'Mongomo', 'Añisoc', 'Evinayong'] as const;
export const EDU_TYPE_FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'publica', label: 'Pública' },
  { id: 'privada', label: 'Privada' },
  { id: 'profesional', label: 'Profesional' },
] as const;

export const EDU_SCHOOLS: School[] = [
  { id: 's1', name: 'Santo Thomas de Aquino', city: 'Malabo', level: 'Primaria/Secundaria', type: 'privada', modality: 'Presencial', plazas: 400, phone: '+240 333 09 60 01' },
  { id: 's2', name: 'Santa Isabel', city: 'Malabo', level: 'Primaria/Secundaria', type: 'privada', modality: 'Presencial', plazas: 350, phone: '+240 333 09 60 02' },
  { id: 's3', name: 'Colegio Nacional de Malabo', city: 'Malabo', level: 'Primaria/Secundaria', type: 'publica', modality: 'Presencial', plazas: 600, phone: '+240 333 09 60 03' },
  { id: 's4', name: 'UNGE — Malabo', city: 'Malabo', level: 'Universitaria', type: 'publica', modality: 'Presencial', plazas: 1200, phone: '+240 333 09 61 00' },
  { id: 's5', name: 'Instituto Técnico de Bata', city: 'Bata', level: 'Formación Profesional', type: 'profesional', modality: 'Presencial', plazas: 280, phone: '+240 333 09 64 01' },
  { id: 's6', name: 'Colegio Español Bata', city: 'Bata', level: 'Primaria/Secundaria', type: 'privada', modality: 'Presencial', plazas: 320, phone: '+240 333 09 60 10' },
  { id: 's7', name: 'Centro Educativo Ebebiyín', city: 'Ebebiyín', level: 'Primaria/Secundaria', type: 'publica', modality: 'Presencial', plazas: 450, phone: '+240 333 09 60 20' },
  { id: 's8', name: 'Escuela Profesional Mongomo', city: 'Mongomo', level: 'Formación Profesional', type: 'profesional', modality: 'Presencial', plazas: 180, phone: '+240 333 09 64 02' },
  { id: 's9', name: 'Colegio Añisoc', city: 'Añisoc', level: 'Primaria/Secundaria', type: 'publica', modality: 'Presencial', plazas: 220, phone: '+240 333 09 60 30' },
  { id: 's10', name: 'Instituto Evinayong', city: 'Evinayong', level: 'Primaria/Secundaria', type: 'publica', modality: 'Presencial', plazas: 300, phone: '+240 333 09 60 40' },
];

export interface Pharmacy {
  id: string; name: string; barrio: string; city: string; address: string;
  phone: string; schedule: string; emergency: boolean; services: string[];
}

export interface Medicamento {
  id: string; name: string; cat: string; price: number; stock: boolean;
  desc: string; requiereReceta: boolean;
}

export const HOSPITALS: Hospital[] = [
  { id: 'h1', name: 'Hospital General de Malabo', city: 'Malabo', address: 'Av. de la Independencia, Malabo', phone: '+240 333 09 70 00', beds: 400, doctors: 350, emergency: true, rating: 4.2, specialties: ['Medicina Interna', 'Cirugía', 'Ortopedia', 'Urgencias'], schedule: '24h', lat: 3.7523, lng: 8.7737 },
  { id: 'h2', name: 'Hospital La Paz', city: 'Malabo', address: 'Barrio Residencial, Malabo', phone: '+240 333 09 71 00', beds: 300, doctors: 250, emergency: true, rating: 4.5, specialties: ['Cardiología', 'Neurología', 'Cirugía General'], schedule: '24h', lat: 3.755, lng: 8.776 },
  { id: 'h3', name: 'Hospital de la Santa Cruz', city: 'Malabo', address: 'Centro Malabo', phone: '+240 333 09 72 00', beds: 200, doctors: 180, emergency: true, rating: 4.1, specialties: ['Cirugía General', 'Cardiología', 'Urología'], schedule: '24h', lat: 3.751, lng: 8.772 },
  { id: 'h4', name: 'Hospital de Nkuantoma', city: 'Malabo', address: 'Nkuantoma, Malabo', phone: '+240 333 09 73 00', beds: 250, doctors: 220, emergency: false, rating: 4.0, specialties: ['Neurología', 'Ortopedia', 'Gastroenterología'], schedule: 'L-V 8-20h', lat: 3.748, lng: 8.77 },
  { id: 'h5', name: 'Clínica Médica Malabo', city: 'Malabo', address: 'Av. Hassan II, Malabo', phone: '+240 333 09 74 00', beds: 150, doctors: 120, emergency: false, rating: 4.3, specialties: ['Medicina Interna', 'Cirugía', 'Cardiología'], schedule: 'L-S 7-22h', lat: 3.753, lng: 8.775 },
  { id: 'h6', name: 'Clínica Santa Teresa', city: 'Malabo', address: 'Caracolas, Malabo', phone: '+240 333 09 75 00', beds: 250, doctors: 220, emergency: false, rating: 4.4, specialties: ['Medicina Interna', 'Cirugía', 'Ortopedia'], schedule: 'L-S 8-20h', lat: 3.7598, lng: 8.7779 },
  { id: 'h7', name: 'Hospital General de Bata', city: 'Bata', address: 'Centro Bata', phone: '+240 333 09 76 00', beds: 350, doctors: 300, emergency: true, rating: 4.2, specialties: ['Pediatría', 'Obstetricia', 'Medicina Interna'], schedule: '24h', lat: 1.8575, lng: 9.7686 },
  { id: 'h8', name: 'Hospital de la Mujer y el Niño', city: 'Bata', address: 'Bata Centro', phone: '+240 333 09 77 00', beds: 180, doctors: 150, emergency: true, rating: 4.6, specialties: ['Obstetricia', 'Ginecología', 'Pediatría'], schedule: '24h', lat: 1.86, lng: 9.77 },
  { id: 'h9', name: 'Hospital Obiang Nguema Mbasogo', city: 'Malabo', address: 'Sipopo, Malabo', phone: '+240 333 09 78 00', beds: 250, doctors: 220, emergency: true, rating: 4.3, specialties: ['Cardiología', 'Medicina Interna', 'Neurología'], schedule: '24h', lat: 3.7765, lng: 8.7899 },
  { id: 'h10', name: 'Hospital Provincial de Bioko Norte', city: 'Malabo', address: 'Malabo Norte', phone: '+240 333 09 79 00', beds: 350, doctors: 300, emergency: true, rating: 4.1, specialties: ['Neurología', 'Cardiología', 'Pediatría'], schedule: '24h', lat: 3.76, lng: 8.78 },
];

export const PHARMACIES: Pharmacy[] = [
  { id: 'f1', name: 'Farmacia Central', barrio: 'Centro', city: 'Malabo', address: 'Av. de la Independencia', phone: '+240 222 10 00 01', schedule: 'L-S 8:00-22:00', emergency: true, services: ['Medicamentos', 'Inyectables'] },
  { id: 'f2', name: 'Farmacia San Carlos', barrio: 'Centro', city: 'Malabo', address: 'Centro Comercial', phone: '+240 222 10 00 02', schedule: 'L-V 8:00-20:00', emergency: false, services: ['Medicamentos', 'Parafarmacia'] },
  { id: 'f3', name: 'Farmacia La Salud', barrio: 'Centro', city: 'Malabo', address: 'Calle del Rey Boncoro', phone: '+240 222 10 00 07', schedule: 'L-S 8:00-21:00', emergency: false, services: ['Medicamentos', 'Ortopedia'] },
  { id: 'f4', name: 'Farmacia Bioko', barrio: 'Caracolas', city: 'Malabo', address: 'Barrio Caracolas', phone: '+240 222 10 00 03', schedule: 'L-D 7:00-23:00', emergency: true, services: ['Medicamentos', 'Urgencias'] },
  { id: 'f5', name: 'Farmacia Caracolas', barrio: 'Caracolas', city: 'Malabo', address: 'Av. Caracolas s/n', phone: '+240 222 10 00 08', schedule: 'L-S 8:00-20:00', emergency: false, services: ['Medicamentos', 'Vitaminas'] },
  { id: 'f6', name: 'Farmacia Ela Nguema', barrio: 'Ela Nguema', city: 'Malabo', address: 'Barrio Ela Nguema', phone: '+240 222 10 00 04', schedule: 'L-S 8:00-21:00', emergency: false, services: ['Medicamentos', 'Parafarmacia'] },
  { id: 'f7', name: 'Farmacia Nueva Vida', barrio: 'Ela Nguema', city: 'Malabo', address: 'Calle Principal Ela Nguema', phone: '+240 222 10 00 09', schedule: 'L-V 8:00-20:00', emergency: false, services: ['Medicamentos', 'Inyectables'] },
  { id: 'f8', name: 'Farmacia Puerto', barrio: 'Puerto', city: 'Malabo', address: 'Puerto de Malabo', phone: '+240 222 10 00 06', schedule: 'L-V 8:00-20:00', emergency: false, services: ['Medicamentos', 'Parafarmacia'] },
  { id: 'f9', name: 'Farmacia Marina', barrio: 'Puerto', city: 'Malabo', address: 'Av. del Puerto', phone: '+240 222 10 00 10', schedule: 'L-S 8:00-21:00', emergency: false, services: ['Medicamentos', 'Vitaminas'] },
  { id: 'f10', name: 'Farmacia Luba Road', barrio: 'Luba Road', city: 'Malabo', address: 'Carretera Luba km 3', phone: '+240 222 10 00 11', schedule: 'L-S 8:00-20:00', emergency: false, services: ['Medicamentos', 'Inyectables'] },
  { id: 'f11', name: 'Farmacia Aeropuerto', barrio: 'Aeropuerto', city: 'Malabo', address: 'Zona Aeropuerto', phone: '+240 222 10 00 12', schedule: 'L-D 6:00-22:00', emergency: true, services: ['Medicamentos', 'Urgencias'] },
  { id: 'f12', name: 'Farmacia Malabo II', barrio: 'Malabo II', city: 'Malabo', address: 'Barrio Malabo II', phone: '+240 222 10 00 13', schedule: 'L-S 8:00-21:00', emergency: false, services: ['Medicamentos', 'Cosméticos'] },
  { id: 'f13', name: 'Farmacia Bienestar', barrio: 'Malabo II', city: 'Malabo', address: 'Av. Malabo II', phone: '+240 222 10 00 14', schedule: 'L-V 8:00-20:00', emergency: false, services: ['Medicamentos', 'Parafarmacia'] },
  { id: 'f14', name: 'Farmacia Bata Centro', barrio: 'Centro', city: 'Bata', address: 'Centro de Bata', phone: '+240 222 10 00 05', schedule: 'L-D 7:00-22:00', emergency: true, services: ['Medicamentos', 'Urgencias'] },
  { id: 'f15', name: 'Farmacia Continental', barrio: 'Centro', city: 'Bata', address: 'Av. de la Libertad', phone: '+240 222 10 00 15', schedule: 'L-S 8:00-21:00', emergency: false, services: ['Medicamentos', 'Vitaminas'] },
  { id: 'f16', name: 'Farmacia Nkolombong', barrio: 'Nkolombong', city: 'Bata', address: 'Barrio Nkolombong', phone: '+240 222 10 00 16', schedule: 'L-S 8:00-20:00', emergency: false, services: ['Medicamentos', 'Inyectables'] },
  { id: 'f17', name: 'Farmacia Litoral', barrio: 'Litoral', city: 'Bata', address: 'Paseo Marítimo', phone: '+240 222 10 00 17', schedule: 'L-D 7:00-23:00', emergency: true, services: ['Medicamentos', 'Urgencias'] },
  { id: 'f18', name: 'Farmacia Ebebiyín', barrio: 'Centro', city: 'Ebebiyín', address: 'Centro Ebebiyín', phone: '+240 222 10 00 18', schedule: 'L-S 8:00-20:00', emergency: false, services: ['Medicamentos', 'Parafarmacia'] },
  { id: 'f19', name: 'Farmacia Mongomo', barrio: 'Centro', city: 'Mongomo', address: 'Centro Mongomo', phone: '+240 222 10 00 19', schedule: 'L-S 8:00-20:00', emergency: false, services: ['Medicamentos', 'Inyectables'] },
];

export const MEDICAMENTOS: Medicamento[] = [
  { id: 'm1', name: 'Paracetamol 500mg', cat: 'Analgésico', price: 500, stock: true, desc: 'Caja 20 comprimidos.', requiereReceta: false },
  { id: 'm2', name: 'Ibuprofeno 400mg', cat: 'Antiinflamatorio', price: 800, stock: true, desc: 'Caja 20 comprimidos.', requiereReceta: false },
  { id: 'm3', name: 'Amoxicilina 500mg', cat: 'Antibiótico', price: 2500, stock: true, desc: 'Caja 21 cápsulas.', requiereReceta: true },
  { id: 'm4', name: 'Metformina 850mg', cat: 'Diabetes', price: 1800, stock: true, desc: 'Caja 30 comprimidos.', requiereReceta: true },
  { id: 'm5', name: 'Omeprazol 20mg', cat: 'Gastrointestinal', price: 1200, stock: true, desc: 'Caja 14 cápsulas.', requiereReceta: false },
  { id: 'm6', name: 'Losartán 50mg', cat: 'Cardiovascular', price: 2200, stock: true, desc: 'Caja 28 comprimidos.', requiereReceta: true },
  { id: 'm7', name: 'Loratadina 10mg', cat: 'Antihistamínico', price: 900, stock: true, desc: 'Caja 10 comprimidos.', requiereReceta: false },
  { id: 'm8', name: 'Azitromicina 500mg', cat: 'Antibiótico', price: 3500, stock: false, desc: 'Caja 3 comprimidos.', requiereReceta: true },
  { id: 'm9', name: 'Diclofenaco 50mg', cat: 'Antiinflamatorio', price: 1100, stock: true, desc: 'Caja 20 comprimidos.', requiereReceta: false },
  { id: 'm10', name: 'Vitamina C 1000mg', cat: 'Vitaminas', price: 1500, stock: true, desc: 'Caja 20 comprimidos efervescentes.', requiereReceta: false },
  { id: 'm11', name: 'Salbutamol inhalador', cat: 'Respiratorio', price: 4500, stock: true, desc: 'Inhalador 200 dosis.', requiereReceta: true },
  { id: 'm12', name: 'Metoclopramida 10mg', cat: 'Gastrointestinal', price: 700, stock: true, desc: 'Caja 30 comprimidos.', requiereReceta: false },
  { id: 'm13', name: 'Aciclovir 400mg', cat: 'Antiviral', price: 3200, stock: true, desc: 'Caja 25 comprimidos.', requiereReceta: true },
  { id: 'm14', name: 'Sulfato ferroso 325mg', cat: 'Vitaminas', price: 600, stock: true, desc: 'Caja 30 comprimidos.', requiereReceta: false },
  { id: 'm15', name: 'Prednisona 5mg', cat: 'Antiinflamatorio', price: 1400, stock: true, desc: 'Caja 20 comprimidos.', requiereReceta: true },
];

export const CITA_SPECIALTIES = [
  'Medicina General', 'Cardiología', 'Neurología', 'Pediatría',
  'Ginecología', 'Ortopedia', 'Cirugía', 'Urgencias', 'Laboratorio', 'Radiología',
];
