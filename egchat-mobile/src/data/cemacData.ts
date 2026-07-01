export type Lang = 'ES' | 'FR' | 'EN' | 'AR';
export type CountryCode = 'GQ' | 'CM' | 'GA' | 'CG' | 'CF' | 'TD';
export type CemacTab = 'servicios' | 'ocio' | 'cajeros' | 'cuenta' | 'noticias' | 'cambio';

export const LANGS = [
  { code: 'ES' as Lang, native: 'Español' },
  { code: 'FR' as Lang, native: 'Français' },
  { code: 'EN' as Lang, native: 'English' },
  { code: 'AR' as Lang, native: 'العربية' },
];

export const COUNTRIES = [
  { code: 'GQ' as CountryCode, shortES: 'Guinea', nameES: 'Guinea Ecuatorial', nameFR: 'Guinée Équatoriale', capital: 'Malabo', g1: '#00b96b', g2: '#00e5a0', flag: '🇬🇶' },
  { code: 'CM' as CountryCode, shortES: 'Camerún', nameES: 'Camerún', nameFR: 'Cameroun', capital: 'Yaundé', g1: '#007a3d', g2: '#00c060', flag: '🇨🇲' },
  { code: 'GA' as CountryCode, shortES: 'Gabón', nameES: 'Gabón', nameFR: 'Gabon', capital: 'Libreville', g1: '#009e60', g2: '#00d080', flag: '🇬🇦' },
  { code: 'CG' as CountryCode, shortES: 'Congo', nameES: 'Congo', nameFR: 'Congo', capital: 'Brazzaville', g1: '#009a44', g2: '#00cc66', flag: '🇨🇬' },
  { code: 'CF' as CountryCode, shortES: 'R.', nameES: 'R. Centroafricana', nameFR: 'R. Centrafricaine', capital: 'Bangui', g1: '#1a56db', g2: '#3b82f6', flag: '🇨🇫' },
  { code: 'TD' as CountryCode, shortES: 'Chad', nameES: 'Chad', nameFR: 'Tchad', capital: "N'Djamena", g1: '#1e40af', g2: '#3b82f6', flag: '🇹🇩' },
];

export const T: Record<Lang, Record<string, string>> = {
  ES: { back: 'Atrás', services: 'Servicios', leisure: 'Ocio', atms: 'Cajeros', account: 'Cuenta', news: 'Noticias', exchange: 'Cambio', search: 'Buscar servicios...', sendMoney: 'Enviar dinero', balance: 'Saldo disponible', amount: 'Cantidad (XAF)', recipient: 'Destinatario', send: 'Enviar', cancel: 'Cancelar', convert: 'Convertir', rates: 'Tasas de cambio', result: 'Resultado', noResults: 'Sin resultados', fee: 'Comisión', from: 'De', to: 'A' },
  FR: { back: 'Retour', services: 'Services', leisure: 'Loisirs', atms: 'Guichets', account: 'Compte', news: 'Actualités', exchange: 'Change', search: 'Rechercher...', sendMoney: 'Envoyer argent', balance: 'Solde disponible', amount: 'Montant (XAF)', recipient: 'Destinataire', send: 'Envoyer', cancel: 'Annuler', convert: 'Convertir', rates: 'Taux de change', result: 'Résultat', noResults: 'Aucun résultat', fee: 'Commission', from: 'De', to: 'À' },
  EN: { back: 'Back', services: 'Services', leisure: 'Leisure', atms: 'ATMs', account: 'Account', news: 'News', exchange: 'Exchange', search: 'Search services...', sendMoney: 'Send money', balance: 'Available balance', amount: 'Amount (XAF)', recipient: 'Recipient', send: 'Send', cancel: 'Cancel', convert: 'Convert', rates: 'Exchange rates', result: 'Result', noResults: 'No results', fee: 'Fee', from: 'From', to: 'To' },
  AR: { back: 'رجوع', services: 'الخدمات', leisure: 'الترفيه', atms: 'الصرافات', account: 'الحساب', news: 'الأخبار', exchange: 'الصرف', search: 'بحث...', sendMoney: 'إرسال المال', balance: 'الرصيد المتاح', amount: 'المبلغ (XAF)', recipient: 'المستلم', send: 'إرسال', cancel: 'إلغاء', convert: 'تحويل', rates: 'أسعار الصرف', result: 'النتيجة', noResults: 'لا نتائج', fee: 'العمولة', from: 'من', to: 'إلى' },
};

export const SERVICES = [
  { id: 's1', icon: '🏦', nameES: 'Transferencias', desc: 'Envía dinero a cualquier banco CEMAC', bg: '#EFF6FF', ac: '#3B82F6' },
  { id: 's2', icon: '📱', nameES: 'Pagos QR', desc: 'Paga escaneando un código QR', bg: '#F0FDF4', ac: '#22C55E' },
  { id: 's3', icon: '💱', nameES: 'Cambio de Divisa', desc: 'Cambia XAF a EUR, USD y más', bg: '#FEFCE8', ac: '#EAB308' },
  { id: 's4', icon: '📶', nameES: 'Recarga Móvil', desc: 'Recarga tu línea o la de un amigo', bg: '#FDF4FF', ac: '#A855F7' },
  { id: 's5', icon: '⚡', nameES: 'Electricidad', desc: 'Paga tu factura de luz', bg: '#FFF7ED', ac: '#F97316' },
  { id: 's6', icon: '💧', nameES: 'Agua', desc: 'Paga tu factura de agua', bg: '#EFF6FF', ac: '#0EA5E9' },
  { id: 's7', icon: '🛡️', nameES: 'Seguros', desc: 'Gestiona tus pólizas de seguro', bg: '#F0FDF4', ac: '#16A34A' },
  { id: 's8', icon: '📈', nameES: 'Inversiones', desc: 'Fondos y productos de inversión', bg: '#FDF2F8', ac: '#EC4899' },
];

export const LEISURE = [
  { id: 'l1', cat: 'hotel', nameES: 'Hotel Sofitel Malabo', rating: 4.8, price: '85,000 XAF/noche', addr: 'Av. de la Independencia, Malabo' },
  { id: 'l2', cat: 'restaurant', nameES: 'Restaurante La Bahía', rating: 4.6, price: '15,000 XAF/persona', addr: 'Puerto de Malabo' },
  { id: 'l3', cat: 'cinema', nameES: 'Cine Malabo', rating: 4.2, price: '5,000 XAF', addr: 'Centro Comercial, Malabo' },
  { id: 'l4', cat: 'spa', nameES: 'Spa & Wellness Center', rating: 4.9, price: '25,000 XAF/sesión', addr: 'Barrio Residencial, Malabo' },
];

export const CAT_ICON: Record<string, string> = { hotel: '🏨', restaurant: '🍽️', cinema: '🎬', spa: '💆' };

export const ATMS = [
  { id: 'a1', bank: 'BANGE', addr: 'Av. de la Independencia 12, Malabo', fee: '500 XAF', limit: '500,000 XAF', ok: true },
  { id: 'a2', bank: 'CCEI Bank', addr: 'Centro Comercial Malabo', fee: '0 XAF', limit: '300,000 XAF', ok: true },
  { id: 'a3', bank: 'BGFI Bank', addr: 'Calle Rey Malabo 45', fee: '750 XAF', limit: '400,000 XAF', ok: false },
  { id: 'a4', bank: 'Ecobank', addr: 'Aeropuerto Internacional de Malabo', fee: '1,000 XAF', limit: '600,000 XAF', ok: true },
];

export const NEWS = [
  { id: 'n1', title: 'BEAC mantiene tipos de interés estables para el segundo trimestre', source: 'BEAC', cat: 'economy', time: '08:30' },
  { id: 'n2', title: 'Guinea Ecuatorial lidera el crecimiento del PIB en la zona CEMAC', source: 'FMI', cat: 'economy', time: '10:15' },
  { id: 'n3', title: 'Nueva plataforma de pagos digitales lanzada en Camerún', source: 'Noticias CEMAC', cat: 'tech', time: '11:45' },
  { id: 'n4', title: 'Cumbre de jefes de Estado CEMAC en Libreville', source: 'Presidencia GQ', cat: 'politics', time: '14:00' },
];

export const RATES: Record<string, number> = { EUR: 0.001524, USD: 0.001648, GBP: 0.001302, CHF: 0.001489, CNY: 0.011920, XOF: 1.0 };

export const HISTORY = [
  { id: 'h1', type: 'in' as const, amount: 150000, desc: 'Salario Marzo 2026', date: '01/03/2026' },
  { id: 'h2', type: 'out' as const, amount: 25000, desc: 'Transferencia a Maria', date: '05/03/2026' },
  { id: 'h3', type: 'out' as const, amount: 8500, desc: 'Pago electricidad', date: '10/03/2026' },
];

export const NEWS_COLOR: Record<string, string> = { economy: '#3B82F6', tech: '#8B5CF6', politics: '#EF4444' };
