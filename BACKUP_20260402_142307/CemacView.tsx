import React, { useState } from 'react';

type Lang = 'ES' | 'FR' | 'EN' | 'AR';
type CountryCode = 'GQ' | 'CM' | 'GA' | 'CG' | 'CF' | 'TD';
type Tab = 'servicios' | 'ocio' | 'cuenta' | 'noticias' | 'cambio';

const LANGS = [
  { code: 'ES' as Lang, native: 'Espanol', sub: 'Spanish' },
  { code: 'FR' as Lang, native: 'Francais', sub: 'French' },
  { code: 'EN' as Lang, native: 'English', sub: 'English' },
  { code: 'AR' as Lang, native: 'Al-Arabiya', sub: 'Arabic' },
];

const COUNTRIES: { code: CountryCode; name: Record<Lang,string>; capital: string; g1: string; g2: string; flag: string; fc: string[] }[] = [
  { code:'GQ', name:{ES:'Guinea Ecuatorial',FR:'Guinee Equatoriale',EN:'Equatorial Guinea',AR:'Guinea Ecuatorial'}, capital:'Malabo',     g1:'#00b96b', g2:'#00e5a0', flag:'GQ', fc:['#3E9A00','#FFFFFF','#E32118','#0073CE'] },
  { code:'CM', name:{ES:'Camerun',          FR:'Cameroun',          EN:'Cameroon',         AR:'Camerun'},          capital:'Yaunde',     g1:'#007a3d', g2:'#00c060', flag:'CM', fc:['#007A5E','#CE1126','#FCD116'] },
  { code:'GA', name:{ES:'Gabon',            FR:'Gabon',             EN:'Gabon',            AR:'Gabon'},            capital:'Libreville', g1:'#009e60', g2:'#00d080', flag:'GA', fc:['#009E60','#FCD116','#003189'] },
  { code:'CG', name:{ES:'Congo',            FR:'Congo',             EN:'Congo',            AR:'Congo'},            capital:'Brazzaville',g1:'#009a44', g2:'#00cc66', flag:'CG', fc:['#009543','#FBDE4A','#DC241F'] },
  { code:'CF', name:{ES:'R. Centroafricana',FR:'R. Centrafricaine', EN:'C. African Rep.',  AR:'R. Centroafricana'},capital:'Bangui',     g1:'#1a56db', g2:'#3b82f6', flag:'CF', fc:['#003082','#FFFFFF','#289728','#FFCB00','#BC0026'] },
  { code:'TD', name:{ES:'Chad',             FR:'Tchad',             EN:'Chad',             AR:'Chad'},             capital:"N'Djamena",  g1:'#1e40af', g2:'#3b82f6', flag:'TD', fc:['#002664','#FECB00','#C60C30'] },
];

const T: Record<Lang, Record<string,string>> = {
  ES:{ back:'Atras', selLang:'Elige tu idioma', selCountry:'Selecciona tu pais', services:'Servicios', leisure:'Ocio', atms:'Cajeros', account:'Cuenta', news:'Noticias', exchange:'Cambio', search:'Buscar servicios...', featured:'Destacado', viewMap:'Ver en mapa', sendMoney:'Enviar dinero', balance:'Saldo disponible', bank:'Banco', history:'Historial', amount:'Cantidad (XAF)', recipient:'Destinatario', send:'Enviar', cancel:'Cancelar', convert:'Convertir', rates:'Tasas de cambio', result:'Resultado', noResults:'Sin resultados', deposit:'Depositar', withdraw:'Retirar', reserve:'Reservar', available:'Disponible', unavailable:'No disponible', readMore:'Leer mas', source:'Fuente', fee:'Comision', limit:'Limite diario', network:'Red', economy:'Economia', tech:'Tecnologia', politics:'Politica', health:'Salud', sport:'Deporte', culture:'Cultura', from:'De', to:'A' },
  FR:{ back:'Retour', selLang:'Choisissez votre langue', selCountry:'Selectionnez votre pays', services:'Services', leisure:'Loisirs', atms:'Guichets', account:'Compte', news:'Actualites', exchange:'Change', search:'Rechercher...', featured:'Vedette', viewMap:'Voir sur carte', sendMoney:'Envoyer argent', balance:'Solde disponible', bank:'Banque', history:'Historique', amount:'Montant (XAF)', recipient:'Destinataire', send:'Envoyer', cancel:'Annuler', convert:'Convertir', rates:'Taux de change', result:'Resultat', noResults:'Aucun resultat', deposit:'Deposer', withdraw:'Retirer', reserve:'Reserver', available:'Disponible', unavailable:'Indisponible', readMore:'Lire plus', source:'Source', fee:'Commission', limit:'Limite journaliere', network:'Reseau', economy:'Economie', tech:'Technologie', politics:'Politique', health:'Sante', sport:'Sport', culture:'Culture', from:'De', to:'A' },
  EN:{ back:'Back', selLang:'Choose your language', selCountry:'Select your country', services:'Services', leisure:'Leisure', atms:'ATMs', account:'Account', news:'News', exchange:'Exchange', search:'Search services...', featured:'Featured', viewMap:'View on map', sendMoney:'Send money', balance:'Available balance', bank:'Bank', history:'History', amount:'Amount (XAF)', recipient:'Recipient', send:'Send', cancel:'Cancel', convert:'Convert', rates:'Exchange rates', result:'Result', noResults:'No results', deposit:'Deposit', withdraw:'Withdraw', reserve:'Reserve', available:'Available', unavailable:'Unavailable', readMore:'Read more', source:'Source', fee:'Fee', limit:'Daily limit', network:'Network', economy:'Economy', tech:'Technology', politics:'Politics', health:'Health', sport:'Sport', culture:'Culture', from:'From', to:'To' },
  AR:{ back:'Rjou3', selLang:'Ikhtaar lughtak', selCountry:'Ikhtaar baladak', services:'Al-Khadamat', leisure:'Al-Tarfih', atms:'Al-Sarrafat', account:'Al-Hisab', news:'Al-Akhbar', exchange:'Al-Sarf', search:'Bahth...', featured:'Mumayyaz', viewMap:'3ard 3ala al-kharita', sendMoney:'Irsal al-mal', balance:'Al-Rasid al-mutah', bank:'Al-Bank', history:'Al-Sijil', amount:'Al-Mablagh (XAF)', recipient:'Al-Mustalam', send:'Irsal', cancel:'Ilgha', convert:'Tahwil', rates:'As3ar al-sarf', result:'Al-Natija', noResults:'La nataij', deposit:'Ida3', withdraw:'Sahb', reserve:'Hajz', available:'Mutah', unavailable:'Ghair mutah', readMore:'Iqra aktar', source:'Al-Masdar', fee:'Al-3umula', limit:'Al-Had al-yawmi', network:'Al-Shabaka', economy:'Iqtisad', tech:'Tiknulujia', politics:'Siyasa', health:'Sihha', sport:'Riyada', culture:'Thaqafa', from:'Min', to:'Ila' },
};

const SERVICES = [
  { id:'s1',  icon:'bank',    nameES:'Transferencias',   nameFR:'Transferts',         nameEN:'Transfers',        nameAR:'Tahwilat',       bg:'#EFF6FF', ac:'#3B82F6', desc:'Envia dinero a cualquier banco CEMAC' },
  { id:'s2',  icon:'qr',      nameES:'Pagos QR',          nameFR:'Paiements QR',       nameEN:'QR Payments',      nameAR:'Madfu3at QR',    bg:'#F0FDF4', ac:'#22C55E', desc:'Paga escaneando un codigo QR' },
  { id:'s3',  icon:'fx',      nameES:'Cambio de Divisa',  nameFR:'Change de Devises',  nameEN:'Currency Exchange', nameAR:'Sarf al-3umlat', bg:'#FEFCE8', ac:'#EAB308', desc:'Cambia XAF a EUR, USD y mas' },
  { id:'s4',  icon:'mobile',  nameES:'Recarga Movil',     nameFR:'Recharge Mobile',    nameEN:'Mobile Top-up',    nameAR:'Shahn al-hatif', bg:'#FDF4FF', ac:'#A855F7', desc:'Recarga tu linea o la de un amigo' },
  { id:'s5',  icon:'bolt',    nameES:'Electricidad',      nameFR:'Electricite',        nameEN:'Electricity',      nameAR:'Al-Kahraba',     bg:'#FFF7ED', ac:'#F97316', desc:'Paga tu factura de luz' },
  { id:'s6',  icon:'drop',    nameES:'Agua',              nameFR:'Eau',                nameEN:'Water',            nameAR:'Al-Ma',          bg:'#EFF6FF', ac:'#0EA5E9', desc:'Paga tu factura de agua' },
  { id:'s7',  icon:'shield',  nameES:'Seguros',           nameFR:'Assurances',         nameEN:'Insurance',        nameAR:'Al-Tamin',       bg:'#F0FDF4', ac:'#16A34A', desc:'Gestiona tus polizas de seguro' },
  { id:'s8',  icon:'chart',   nameES:'Inversiones',       nameFR:'Investissements',    nameEN:'Investments',      nameAR:'Al-Istithmar',   bg:'#FDF2F8', ac:'#EC4899', desc:'Fondos y productos de inversion' },
  { id:'s9',  icon:'loan',    nameES:'Prestamos',         nameFR:'Prets',              nameEN:'Loans',            nameAR:'Al-Qurud',       bg:'#FFF1F2', ac:'#F43F5E', desc:'Solicita un credito rapido' },
  { id:'s10', icon:'doc',     nameES:'Impuestos',         nameFR:'Impots',             nameEN:'Taxes',            nameAR:'Al-Daraib',      bg:'#F8FAFC', ac:'#64748B', desc:'Declara y paga tus impuestos' },
  { id:'s11', icon:'wifi',    nameES:'Internet',          nameFR:'Internet',           nameEN:'Internet',         nameAR:'Al-Internet',    bg:'#ECFDF5', ac:'#10B981', desc:'Paga tu plan de datos' },
  { id:'s12', icon:'gov',     nameES:'Tramites Gov.',     nameFR:'Demarches Gov.',     nameEN:'Gov. Services',    nameAR:'Khadamat hukumiya',bg:'#F0F9FF', ac:'#0284C7', desc:'Documentos y tramites oficiales' },
];

const LEISURE = [
  { id:'l1', cat:'hotel',      nameES:'Hotel Sofitel Malabo',   nameFR:'Hotel Sofitel Malabo',   nameEN:'Sofitel Hotel Malabo',   nameAR:'Funduq Sofitel Malabo',  rating:4.8, price:'85,000 XAF/noche',   addr:'Av. de la Independencia, Malabo',  hours:'24h' },
  { id:'l2', cat:'restaurant', nameES:'Restaurante La Bahia',   nameFR:'Restaurant La Bahia',    nameEN:'La Bahia Restaurant',    nameAR:'Mat3am La Bahia',        rating:4.6, price:'15,000 XAF/persona', addr:'Puerto de Malabo',                 hours:'12:00-23:00' },
  { id:'l3', cat:'cinema',     nameES:'Cine Malabo',            nameFR:'Cinema Malabo',          nameEN:'Malabo Cinema',          nameAR:'Sinima Malabo',          rating:4.2, price:'5,000 XAF',          addr:'Centro Comercial, Malabo',         hours:'10:00-22:00' },
  { id:'l4', cat:'spa',        nameES:'Spa & Wellness Center',  nameFR:'Centre Spa & Bien-etre', nameEN:'Spa & Wellness Center',  nameAR:'Markaz Spa',             rating:4.9, price:'25,000 XAF/sesion', addr:'Barrio Residencial, Malabo',       hours:'09:00-20:00' },
  { id:'l5', cat:'sport',      nameES:'Club Deportivo Malabo',  nameFR:'Club Sportif Malabo',    nameEN:'Malabo Sports Club',     nameAR:'Nadi Malabo al-Riyadi',  rating:4.3, price:'8,000 XAF/mes',     addr:'Zona Deportiva, Malabo',           hours:'06:00-22:00' },
  { id:'l6', cat:'culture',    nameES:'Museo Nacional',         nameFR:'Musee National',         nameEN:'National Museum',        nameAR:'Al-Mathaf al-Watani',    rating:4.5, price:'2,000 XAF',          addr:'Plaza de la Independencia',        hours:'09:00-17:00' },
];

const CAT_ICON: Record<string,string> = { hotel:'H', restaurant:'R', cinema:'C', spa:'S', sport:'D', culture:'M' };
const CAT_COLOR: Record<string,string> = { hotel:'#EFF6FF', restaurant:'#FFF7ED', cinema:'#FDF4FF', spa:'#F0FDF4', sport:'#FEFCE8', culture:'#FDF2F8' };
const CAT_AC: Record<string,string>    = { hotel:'#3B82F6', restaurant:'#F97316', cinema:'#A855F7', spa:'#22C55E', sport:'#EAB308', culture:'#EC4899' };

const ATMS = [
  { id:'a1', bank:'BANGE',            addr:'Av. de la Independencia 12, Malabo',   net:'VISA / Mastercard',            fee:'500 XAF',   limit:'500,000 XAF', ok:true,  lat:3.7520, lng:8.7740 },
  { id:'a2', bank:'CCEI Bank',        addr:'Centro Comercial Malabo, Planta Baja', net:'VISA / Mastercard / UnionPay', fee:'0 XAF',     limit:'300,000 XAF', ok:true,  lat:3.7505, lng:8.7715 },
  { id:'a3', bank:'BGFI Bank',        addr:'Calle Rey Malabo 45',                  net:'VISA / Mastercard',            fee:'750 XAF',   limit:'400,000 XAF', ok:false, lat:3.7535, lng:8.7755 },
  { id:'a4', bank:'Ecobank',          addr:'Aeropuerto Internacional de Malabo',   net:'VISA / Mastercard / Amex',     fee:'1,000 XAF', limit:'600,000 XAF', ok:true,  lat:3.7550, lng:8.7770 },
  { id:'a5', bank:'Societe Generale', addr:'Barrio Ela Nguema, Malabo',            net:'VISA / Mastercard',            fee:'500 XAF',   limit:'350,000 XAF', ok:true,  lat:3.7490, lng:8.7700 },
];

const NEWS = [
  { id:'n1', title:'BEAC mantiene tipos de interes estables para el segundo trimestre', source:'BEAC',          cat:'economy',  time:'08:30', date:'24/03/2026', body:'El Banco de los Estados de Africa Central anuncia la estabilidad de los tipos de referencia para apoyar el crecimiento regional.' },
  { id:'n2', title:'Guinea Ecuatorial lidera el crecimiento del PIB en la zona CEMAC',  source:'FMI',           cat:'economy',  time:'10:15', date:'24/03/2026', body:'El Fondo Monetario Internacional proyecta un crecimiento del 4.2% para Guinea Ecuatorial en 2026.' },
  { id:'n3', title:'Nueva plataforma de pagos digitales lanzada en Camerun',            source:'Noticias CEMAC',cat:'tech',     time:'11:45', date:'24/03/2026', body:'MTN y Orange lanzan una plataforma unificada de pagos moviles para toda la region CEMAC.' },
  { id:'n4', title:'Cumbre de jefes de Estado CEMAC en Libreville',                     source:'Presidencia GQ',cat:'politics', time:'14:00', date:'23/03/2026', body:'Los seis presidentes de la zona CEMAC se reunen para discutir la integracion economica regional.' },
  { id:'n5', title:'Programa de vacunacion masiva en la region',                        source:'OMS Africa',    cat:'health',   time:'09:00', date:'23/03/2026', body:'La OMS y los gobiernos CEMAC lanzan una campana de vacunacion que beneficiara a 50 millones de personas.' },
  { id:'n6', title:'Festival Panafricano de Musica en Brazzaville',                     source:'UNESCO',        cat:'culture',  time:'16:30', date:'22/03/2026', body:'El mayor festival de musica africana reune a artistas de 30 paises en la capital congolena.' },
];

const RATES: Record<string,number> = { EUR:0.001524, USD:0.001648, GBP:0.001302, CHF:0.001489, CNY:0.011920, XOF:1.0 };

const HISTORY = [
  { id:'h1', type:'in'  as const, amount:150000, desc:'Salario Marzo 2026',    date:'01/03/2026' },
  { id:'h2', type:'out' as const, amount:25000,  desc:'Transferencia a Maria', date:'05/03/2026' },
  { id:'h3', type:'out' as const, amount:8500,   desc:'Pago electricidad',     date:'10/03/2026' },
  { id:'h4', type:'in'  as const, amount:35000,  desc:'Reembolso seguro',      date:'15/03/2026' },
  { id:'h5', type:'out' as const, amount:12000,  desc:'Recarga movil',         date:'18/03/2026' },
];

const NEWS_COLOR: Record<string,string> = { economy:'#3B82F6', tech:'#8B5CF6', politics:'#EF4444', health:'#22C55E', sport:'#F97316', culture:'#EC4899' };

const sn = (s: typeof SERVICES[0], l: Lang) => ({ ES:s.nameES, FR:s.nameFR, EN:s.nameEN, AR:s.nameAR }[l]);
const ln = (item: typeof LEISURE[0], l: Lang) => ({ ES:item.nameES, FR:item.nameFR, EN:item.nameEN, AR:item.nameAR }[l]);
const cn = (c: typeof COUNTRIES[0], l: Lang) => c.name[l];

const Stars = ({ v }: { v: number }) => (
  <span style={{ display:'flex', gap:1 }}>
    {[1,2,3,4,5].map(i => (
      <svg key={i} width="12" height="12" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={i <= Math.round(v) ? '#F59E0B' : '#E5E7EB'} stroke="none"/>
      </svg>
    ))}
  </span>
);

const Chip = ({ label, bg, color }: { label:string; bg:string; color:string }) => (
  <span style={{ background:bg, color, borderRadius:8, padding:'3px 9px', fontSize:11, fontWeight:600, whiteSpace:'nowrap', display:'inline-block' }}>{label}</span>
);

const Sheet = ({ children, onClose }: { children: React.ReactNode; onClose: ()=>void }) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'flex-end', zIndex:999 }} onClick={onClose}>
    <div style={{ background:'#fff', borderRadius:'22px 22px 0 0', padding:'20px 20px 44px', width:'100%', boxSizing:'border-box' }} onClick={e => e.stopPropagation()}>
      <div style={{ width:36, height:4, background:'#E5E7EB', borderRadius:2, margin:'0 auto 18px' }} />
      {children}
    </div>
  </div>
);

const SvcIcon = ({ icon, ac }: { icon:string; ac:string }) => {
  const paths: Record<string,string> = {
    bank:   'M3 10h18M3 10l9-7 9 7M5 10v8h14v-8M9 14v4M15 14v4',
    qr:     'M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h4M19 19h2M15 19v2',
    fx:     'M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4',
    mobile: 'M5 2h14a2 2 0 012 2v16a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2zM12 18h.01',
    bolt:   'M13 2L4.5 13.5H12L11 22l8.5-11.5H12L13 2z',
    drop:   'M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z',
    shield: 'M12 2l8 3v6c0 5-3.5 9.5-8 11C7.5 20.5 4 16 4 11V5l8-3zM9 12l2 2 4-4',
    chart:  'M3 20h18M5 20V12M9 20V8M13 20V14M17 20V4',
    loan:   'M12 2a9 9 0 100 18A9 9 0 0012 2zM12 7v10M9.5 9.5C9.5 8.4 10.6 8 12 8s2.5.4 2.5 1.5-1 1.5-2.5 1.5-2.5.5-2.5 1.5S10.6 14 12 14s2.5-.4 2.5-1.5',
    doc:    'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M8 13h8M8 17h5',
    wifi:   'M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01',
    gov:    'M3 21h18M3 10h18M5 10V21M19 10V21M12 3L3 10h18L12 3z',
    atm:    'M2 5h20v14H2zM7 15h2M15 15h2M12 9v6M9 12h6',
  };
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      {(paths[icon] || paths.bank).split('M').filter(Boolean).map((d,i) => (
        <path key={i} d={'M'+d} stroke={ac} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      ))}
    </svg>
  );
};
export const CemacView: React.FC<{ onBack?: ()=>void }> = ({ onBack }) => {
  const [lang,    setLang]    = useState<Lang | null>(null);
  const [country, setCountry] = useState<CountryCode | null>(null);
  const [tab,     setTab]     = useState<Tab>('servicios');
  const [query,   setQuery]   = useState('');
  const [mapAtm,  setMapAtm]  = useState<typeof ATMS[0] | null>(null);
  const [openNews,setOpenNews]= useState<string|null>(null);
  const [xaf,     setXaf]     = useState('');
  const [cur,     setCur]     = useState('EUR');
  const [modal,   setModal]   = useState<'send'|'deposit'|'withdraw'|null>(null);
  const [mAmt,    setMAmt]    = useState('');
  const [mTo,     setMTo]     = useState('');
  const [mOk,     setMOk]     = useState(false);

  const t    = T[lang || 'ES'];
  const ctry = COUNTRIES.find(c => c.code === country);
  const g1   = ctry?.g1 || '#00c8a0';
  const g2   = ctry?.g2 || '#00b4e6';
  const grad = `linear-gradient(135deg,${g1},${g2})`;

  const closeModal = () => { setModal(null); setMAmt(''); setMTo(''); setMOk(false); };
  const confirmModal = () => { if (mAmt && (modal !== 'send' || mTo)) setMOk(true); };
  const filtered = SERVICES.filter(s => sn(s, lang||'ES')!.toLowerCase().includes(query.toLowerCase()));
  const converted = xaf && !isNaN(+xaf) ? (+xaf * (RATES[cur] || 1)).toFixed(4) : '';

  // PANTALLA BIENVENIDA + IDIOMA
  if (!country) return (
    <div
      style={{ width:'100%', height:'100%', background:'linear-gradient(160deg,#003d22 0%,#006b3c 35%,#00a86b 65%,#00c8a0 85%,#00b4e6 100%)', display:'flex', flexDirection:'column', paddingTop:56, boxSizing:'border-box', overflowY:'auto', WebkitOverflowScrolling:'touch' }}
    >

      {/* ESCUDO CEMAC */}
      <div style={{ textAlign:'center', padding:'14px 20px 10px', flexShrink:0 }}>
        {/* SVG del emblema CEMAC: circulo dorado, mapa Africa, estrella, ramas olivo, texto */}
        <svg width="80" height="80" viewBox="0 0 100 100" style={{ margin:'0 auto 8px', display:'block', filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.35))' }}>
          {/* Fondo circular dorado */}
          <circle cx="50" cy="50" r="48" fill="#F5C518" stroke="#fff" strokeWidth="2"/>
          <circle cx="50" cy="50" r="44" fill="#E8B400" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
          {/* Silueta simplificada de Africa */}
          <path d="M44 18 C40 18 36 20 34 24 C32 28 33 32 31 35 C29 38 26 39 25 43 C24 47 26 51 25 55 C24 59 21 62 22 66 C23 70 27 72 30 75 C33 78 35 82 39 84 C43 86 47 85 50 83 C53 81 55 78 58 76 C61 74 65 74 67 71 C69 68 68 64 69 60 C70 56 73 53 73 49 C73 45 70 42 70 38 C70 34 72 30 70 27 C68 24 64 23 61 22 C58 21 55 19 52 18 C49 17 47 18 44 18 Z" fill="#2d6a2d" stroke="#1a4a1a" strokeWidth="0.8"/>
          {/* Estrella de 8 puntas en el centro (Africa Central) */}
          <path d="M50 36 L52 45 L61 43 L54 49 L61 55 L52 53 L50 62 L48 53 L39 55 L46 49 L39 43 L48 45 Z" fill="#fff" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
          {/* Rama de olivo izquierda */}
          <g stroke="#2d6a2d" strokeWidth="1.2" fill="none">
            <path d="M18 70 C20 65 22 60 24 55"/>
            <ellipse cx="19" cy="68" rx="3" ry="2" fill="#3a8a3a" stroke="none" transform="rotate(-30 19 68)"/>
            <ellipse cx="21" cy="63" rx="3" ry="2" fill="#3a8a3a" stroke="none" transform="rotate(-20 21 63)"/>
            <ellipse cx="23" cy="58" rx="3" ry="2" fill="#3a8a3a" stroke="none" transform="rotate(-10 23 58)"/>
          </g>
          {/* Rama de olivo derecha */}
          <g stroke="#2d6a2d" strokeWidth="1.2" fill="none">
            <path d="M82 70 C80 65 78 60 76 55"/>
            <ellipse cx="81" cy="68" rx="3" ry="2" fill="#3a8a3a" stroke="none" transform="rotate(30 81 68)"/>
            <ellipse cx="79" cy="63" rx="3" ry="2" fill="#3a8a3a" stroke="none" transform="rotate(20 79 63)"/>
            <ellipse cx="77" cy="58" rx="3" ry="2" fill="#3a8a3a" stroke="none" transform="rotate(10 77 58)"/>
          </g>
          {/* Texto CEMAC */}
          <text x="50" y="90" textAnchor="middle" fontSize="9" fontWeight="900" fill="#003d22" fontFamily="Arial,sans-serif" letterSpacing="2">CEMAC</text>
        </svg>
        <div style={{ color:'#fff', fontSize:20, fontWeight:900, letterSpacing:-0.5, marginBottom:2, textShadow:'0 2px 8px rgba(0,0,0,0.3)' }}>Bienvenido a la CEMAC</div>
        <div style={{ color:'rgba(255,255,255,0.75)', fontSize:11, lineHeight:1.4, marginBottom:8 }}>Comunidad Economica y Monetaria de Africa Central</div>
        <div style={{ display:'flex', justifyContent:'center', gap:20 }}>
          {[{v:'6',l:'Paises'},{v:'XAF',l:'Moneda'},{v:'60M+',l:'Personas'}].map(s=>(
            <div key={s.v} style={{ textAlign:'center' }}>
              <div style={{ color:'#fff', fontSize:14, fontWeight:800 }}>{s.v}</div>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:10 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PAISES */}
      <div style={{ padding:'0 12px 8px', flexShrink:0 }}>
        <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:16, padding:'10px 10px 12px', border:'1px solid rgba(255,255,255,0.18)' }}>
          <div style={{ color:'rgba(255,255,255,0.75)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:10, textAlign:'center' }}>Toca un pais para entrar</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {COUNTRIES.map(ctry => (
              <button key={ctry.code}
                onClick={() => { setLang(lang || 'ES'); setCountry(ctry.code); }}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, cursor:'pointer', background:'none', border:'none', padding:'4px 0' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px) scale(1.06)'; e.currentTarget.style.transition='all 0.18s'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0) scale(1)'; }}>
                <div style={{ width:52, height:52, borderRadius:14, overflow:'hidden', border:'2px solid rgba(255,255,255,0.4)', boxShadow:'0 3px 10px rgba(0,0,0,0.25)', flexShrink:0 }}>
                  {ctry.code==='CM' && <svg viewBox="0 0 3 2" width="52" height="52" preserveAspectRatio="none" style={{display:'block',width:52,height:52}}><rect width="1" height="2" fill="#007A5E"/><rect x="1" width="1" height="2" fill="#CE1126"/><rect x="2" width="1" height="2" fill="#FCD116"/><polygon points="1.5,0.55 1.6,0.85 1.9,0.85 1.65,1.02 1.75,1.32 1.5,1.15 1.25,1.32 1.35,1.02 1.1,0.85 1.4,0.85" fill="#FCD116"/></svg>}
                  
                  {ctry.code==='GQ' && <svg viewBox="0 0 3 2" width="52" height="52" preserveAspectRatio="none" style={{display:'block',width:52,height:52}}><rect width="3" height="0.667" fill="#3E9A00"/><rect y="0.667" width="3" height="0.667" fill="#FFFFFF"/><rect y="1.333" width="3" height="0.667" fill="#E32118"/><polygon points="0,0 0.75,1 0,2" fill="#0073CE"/><ellipse cx="1.5" cy="1" rx="0.3" ry="0.3" fill="#fff" stroke="#ddd" stroke-width="0.02"/><rect x="1.47" y="0.84" width="0.06" height="0.24" fill="#5D4037"/><ellipse cx="1.5" cy="0.8" rx="0.13" ry="0.09" fill="#2E7D32"/><ellipse cx="1.5" cy="0.74" rx="0.09" ry="0.06" fill="#388E3C"/><text x="1.5" y="0.7" text-anchor="middle" font-size="0.1" fill="#FCD116" font-family="Arial">* * * * * *</text><text x="1.5" y="1.25" text-anchor="middle" font-size="0.07" fill="#003082" font-family="Arial" font-weight="bold">UNIDAD PAZ</text></svg>}
                  {ctry.code==='GA' && <svg viewBox="0 0 3 2" width="52" height="52" preserveAspectRatio="none" style={{display:'block',width:52,height:52}}><rect width="3" height="0.667" fill="#009E60"/><rect y="0.667" width="3" height="0.667" fill="#FCD116"/><rect y="1.333" width="3" height="0.667" fill="#003189"/></svg>}
                  {ctry.code==='CG' && <svg viewBox="0 0 3 2" width="52" height="52" preserveAspectRatio="none" style={{display:'block',width:52,height:52}}><rect width="3" height="2" fill="#DC241F"/><polygon points="0,0 1.5,0 0,2" fill="#009543"/><polygon points="3,0 3,2 1.5,2" fill="#FBDE4A"/></svg>}
                  {ctry.code==='CF' && <svg viewBox="0 0 3 2" width="52" height="52" preserveAspectRatio="none" style={{display:'block',width:52,height:52}}><rect width="3" height="0.5" fill="#003082"/><rect y="0.5" width="3" height="0.5" fill="#FFFFFF"/><rect y="1" width="3" height="0.5" fill="#289728"/><rect y="1.5" width="3" height="0.5" fill="#FFCB00"/><rect x="1.2" width="0.6" height="2" fill="#BC0026"/><polygon points="0.35,0.08 0.44,0.35 0.72,0.35 0.5,0.52 0.58,0.79 0.35,0.62 0.12,0.79 0.2,0.52 0,0.35 0.26,0.35" fill="#FFCB00"/></svg>}
                  {ctry.code==='TD' && <svg viewBox="0 0 3 2" width="52" height="52" preserveAspectRatio="none" style={{display:'block',width:52,height:52}}><rect width="1" height="2" fill="#002664"/><rect x="1" width="1" height="2" fill="#FECB00"/><rect x="2" width="1" height="2" fill="#C60C30"/></svg>}
                </div>
                <div style={{ color:'#fff', fontSize:11, fontWeight:700, textAlign:'center', lineHeight:1.2, textShadow:'0 1px 3px rgba(0,0,0,0.4)' }}>{ctry.name[lang || 'ES'].split(' ')[0]}</div>
                <div style={{ color:'rgba(255,255,255,0.6)', fontSize:9, textAlign:'center' }}>{ctry.capital}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* IDIOMAS */}
      <div style={{ padding:'0 12px 20px', flexShrink:0 }}>
        <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:16, padding:'10px 10px 12px', border:'1px solid rgba(255,255,255,0.18)' }}>
          <div style={{ color:'rgba(255,255,255,0.75)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:10, textAlign:'center' }}>Elige tu idioma</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
            {LANGS.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                style={{ background: lang === l.code ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', border: lang === l.code ? '2px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.2)', borderRadius:12, padding:'10px 4px', display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'pointer', transition:'all 0.18s', outline:'none', position:'relative', boxShadow: lang === l.code ? '0 0 0 2px rgba(255,255,255,0.15)' : 'none' }}
                onMouseEnter={e => { if(lang !== l.code){ e.currentTarget.style.background='rgba(255,255,255,0.2)'; }}}
                onMouseLeave={e => { if(lang !== l.code){ e.currentTarget.style.background='rgba(255,255,255,0.1)'; }}}>
                {lang === l.code && (
                  <div style={{ position:'absolute', top:4, right:5, width:14, height:14, borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="8" height="8" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#00c8a0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                  </div>
                )}
                <div style={{ width:32, height:32, borderRadius:10, background: lang === l.code ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:11 }}>{l.code}</div>
                <div style={{ color:'#fff', fontWeight: lang === l.code ? 800 : 600, fontSize:11, textShadow:'0 1px 2px rgba(0,0,0,0.3)' }}>{l.native}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );

    // VISTA MAPA ATM
  if (mapAtm) return (
    <div style={{ width:'100%', height:'100%', background:'#F0F2F5', display:'flex', flexDirection:'column', paddingTop:56, boxSizing:'border-box' }}>
      <div style={{ background:grad, padding:'12px 16px', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        <button onClick={() => setMapAtm(null)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:10, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff', fontSize:20 }}>Back</button>
        <div style={{ color:'#fff', fontWeight:700, fontSize:16 }}>{mapAtm.bank}</div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:16 }}>
        <div style={{ borderRadius:18, overflow:'hidden', boxShadow:'0 4px 16px rgba(0,0,0,0.1)', marginBottom:14 }}>
          <iframe title="map" width="100%" height="240" style={{ border:'none', display:'block' }}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapAtm.lng-0.01},${mapAtm.lat-0.01},${mapAtm.lng+0.01},${mapAtm.lat+0.01}&layer=mapnik&marker=${mapAtm.lat},${mapAtm.lng}`} />
        </div>
        <div style={{ background:'#fff', borderRadius:18, padding:16, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ fontWeight:700, fontSize:16, color:'#111', marginBottom:10 }}>{mapAtm.bank}</div>
          <div style={{ fontSize:13, color:'#555', marginBottom:12 }}>Pin: {mapAtm.addr}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            <Chip label={mapAtm.ok ? t.available : t.unavailable} bg={mapAtm.ok?'#F0FDF4':'#FFF1F2'} color={mapAtm.ok?'#16A34A':'#DC2626'} />
            <Chip label={`${t.fee}: ${mapAtm.fee}`} bg="#F0F9FF" color="#0284C7" />
            <Chip label={`${t.limit}: ${mapAtm.limit}`} bg="#FEFCE8" color="#854D0E" />
            <Chip label={mapAtm.net} bg="#F8FAFC" color="#475569" />
          </div>
        </div>
      </div>
    </div>
  );

  // MODAL
  const ModalContent = () => {
    const titles: Record<string,string> = { send: t.sendMoney, deposit: t.deposit, withdraw: t.withdraw };
    const btnGrad = modal === 'withdraw' ? 'linear-gradient(135deg,#F97316,#EF4444)' : grad;
    const btnLabel = modal === 'send' ? t.send : modal === 'deposit' ? t.deposit : t.withdraw;
    return (
      <Sheet onClose={closeModal}>
        <div style={{ fontWeight:700, fontSize:18, color:'#111', marginBottom:18 }}>{titles[modal!]}</div>
        {mOk ? (
          <div style={{ textAlign:'center', padding:'16px 0 8px' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'#F0FDF4', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:32 }}>v</div>
            <div style={{ fontWeight:700, fontSize:16, color:'#16A34A', marginBottom:6 }}>
              {modal === 'send' ? 'Transferencia enviada' : modal === 'deposit' ? 'Deposito realizado' : 'Retiro procesado'}
            </div>
            {modal === 'send' && <div style={{ color:'#888', fontSize:13 }}>{mAmt} XAF a {mTo}</div>}
            <button onClick={closeModal} style={{ marginTop:20, background:grad, border:'none', borderRadius:14, padding:'12px 36px', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer' }}>OK</button>
          </div>
        ) : (
          <>
            {modal === 'send' && (
              <input value={mTo} onChange={e => setMTo(e.target.value)} placeholder={t.recipient}
                style={{ width:'100%', border:'1.5px solid #E5E7EB', borderRadius:12, padding:'12px 14px', fontSize:15, marginBottom:12, boxSizing:'border-box', outline:'none', color:'#111' }} />
            )}
            <input value={mAmt} onChange={e => setMAmt(e.target.value)} placeholder={t.amount} type="number"
              style={{ width:'100%', border:'1.5px solid #E5E7EB', borderRadius:12, padding:'12px 14px', fontSize:15, marginBottom:20, boxSizing:'border-box', outline:'none', color:'#111' }} />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={closeModal} style={{ flex:1, background:'#F3F4F6', border:'none', borderRadius:12, padding:'12px', color:'#374151', fontWeight:600, fontSize:14, cursor:'pointer' }}>{t.cancel}</button>
              <button onClick={confirmModal} style={{ flex:2, background:btnGrad, border:'none', borderRadius:12, padding:'12px', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>{btnLabel}</button>
            </div>
          </>
        )}
      </Sheet>
    );
  };

  const TABS: { id:Tab; label:string; icon:string }[] = [
    { id:'servicios', label:t.services, icon:'S' },
    { id:'ocio',      label:t.leisure,  icon:'O' },
    { id:'cuenta',    label:t.account,  icon:'$' },
    { id:'noticias',  label:t.news,     icon:'N' },
    { id:'cambio',    label:t.exchange, icon:'X' },
  ];

  const renderTab = () => {
    if (tab === 'servicios') return (
      <div style={{ padding:'12px 14px 90px' }}>
        <div style={{ background:'#fff', borderRadius:14, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, marginBottom:14, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#aaa" strokeWidth="2"/><path d="M16.5 16.5L21 21" stroke="#aaa" strokeWidth="2" strokeLinecap="round"/></svg>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search}
            style={{ border:'none', outline:'none', flex:1, fontSize:14, color:'#333', background:'transparent' }} />
          {query && <button onClick={() => setQuery('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#aaa', fontSize:16, padding:0 }}>x</button>}
        </div>
        {filtered.length === 0 && <div style={{ textAlign:'center', color:'#aaa', padding:'40px 0', fontSize:14 }}>{t.noResults}</div>}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {filtered.map(s => (
            <div key={s.id} style={{ background:'#fff', borderRadius:18, padding:'16px 14px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)', cursor:'pointer' }}>
              <div style={{ width:46, height:46, borderRadius:14, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
                <SvcIcon icon={s.icon} ac={s.ac} />
              </div>
              <div style={{ fontWeight:700, fontSize:13, color:'#111', lineHeight:1.3, marginBottom:4 }}>{sn(s, lang)}</div>
              <div style={{ fontSize:11, color:'#888', lineHeight:1.4 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );

    if (tab === 'ocio') return (
      <div style={{ padding:'12px 14px 90px', display:'flex', flexDirection:'column', gap:12 }}>
        {LEISURE.map(l => (
          <div key={l.id} style={{ background:'#fff', borderRadius:18, padding:16, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:10 }}>
              <div style={{ width:50, height:50, borderRadius:15, background:CAT_COLOR[l.cat]||'#F8FAFC', display:'flex', alignItems:'center', justifyContent:'center', color:CAT_AC[l.cat]||'#888', fontWeight:800, fontSize:18, flexShrink:0 }}>{CAT_ICON[l.cat]||'?'}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:14, color:'#111' }}>{ln(l, lang)}</span>
                  {l.rating >= 4.5 && <Chip label={t.featured} bg="#FEF3C7" color="#92400E" />}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <Stars v={l.rating} />
                  <span style={{ fontSize:12, color:'#888' }}>{l.rating}</span>
                </div>
                <div style={{ fontSize:12, color:'#0284C7', fontWeight:600 }}>{l.price}</div>
              </div>
            </div>
            <div style={{ fontSize:12, color:'#666', marginBottom:12 }}>Pin: {l.addr}</div>
            <div style={{ display:'flex', gap:8 }}>
              <button style={{ flex:1, background:grad, border:'none', borderRadius:12, padding:'11px', color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer' }}>{t.reserve}</button>
              <button style={{ flex:1, background:'#F3F4F6', border:'none', borderRadius:12, padding:'11px', color:'#374151', fontWeight:600, fontSize:13, cursor:'pointer' }}>{l.hours}</button>
            </div>
          </div>
        ))}
      </div>
    );

    if (tab === 'cuenta') return (
      <div style={{ padding:'12px 14px 90px' }}>
        <div style={{ background:grad, borderRadius:22, padding:'20px 18px', marginBottom:16, color:'#fff' }}>
          <div style={{ fontSize:13, opacity:0.85, marginBottom:6 }}>{t.balance}</div>
          <div style={{ fontSize:34, fontWeight:800, letterSpacing:-1, marginBottom:4 }}>245,000 <span style={{ fontSize:16, fontWeight:500 }}>XAF</span></div>
          <div style={{ fontSize:12, opacity:0.75, marginBottom:18 }}>{t.bank}: BANGE . CCEI Bank</div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => { setModal('deposit'); setMOk(false); }} style={{ flex:1, background:'rgba(255,255,255,0.2)', border:'1.5px solid rgba(255,255,255,0.35)', borderRadius:12, padding:'10px 4px', color:'#fff', fontWeight:600, fontSize:12, cursor:'pointer' }}>{t.deposit}</button>
            <button onClick={() => { setModal('withdraw'); setMOk(false); }} style={{ flex:1, background:'rgba(255,255,255,0.2)', border:'1.5px solid rgba(255,255,255,0.35)', borderRadius:12, padding:'10px 4px', color:'#fff', fontWeight:600, fontSize:12, cursor:'pointer' }}>{t.withdraw}</button>
            <button onClick={() => { setModal('send'); setMOk(false); }} style={{ flex:1, background:'#fff', border:'none', borderRadius:12, padding:'10px 4px', color:g1, fontWeight:700, fontSize:12, cursor:'pointer' }}>{t.sendMoney}</button>
          </div>
        </div>
        <div style={{ fontWeight:700, fontSize:15, color:'#111', marginBottom:12 }}>{t.history}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {HISTORY.map(h => (
            <div key={h.id} style={{ background:'#fff', borderRadius:14, padding:'13px 16px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ width:40, height:40, borderRadius:12, background:h.type==='in'?'#F0FDF4':'#FFF1F2', display:'flex', alignItems:'center', justifyContent:'center', color:h.type==='in'?'#16A34A':'#DC2626', fontWeight:700, fontSize:18, flexShrink:0 }}>{h.type==='in'?'v':'^'}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13, color:'#111' }}>{h.desc}</div>
                <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>{h.date}</div>
              </div>
              <div style={{ fontWeight:700, fontSize:14, color:h.type==='in'?'#16A34A':'#DC2626' }}>{h.type==='in'?'+':'-'}{h.amount.toLocaleString()} XAF</div>
            </div>
          ))}
        </div>
        <div style={{ fontWeight:700, fontSize:15, color:'#111', margin:'16px 0 12px' }}>{t.atms}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {ATMS.map(a => (
            <div key={a.id} style={{ background:'#fff', borderRadius:18, padding:16, boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                <div style={{ width:46, height:46, borderRadius:14, background:a.ok?'#F0FDF4':'#FFF1F2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <SvcIcon icon="atm" ac={a.ok?'#16A34A':'#DC2626'} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15, color:'#111', marginBottom:4 }}>{a.bank}</div>
                  <Chip label={a.ok ? t.available : t.unavailable} bg={a.ok?'#F0FDF4':'#FFF1F2'} color={a.ok?'#16A34A':'#DC2626'} />
                </div>
              </div>
              <div style={{ fontSize:12, color:'#666', marginBottom:10 }}>{a.addr}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                <Chip label={a.net} bg="#F8FAFC" color="#475569" />
                <Chip label={`${t.fee}: ${a.fee}`} bg="#FEFCE8" color="#854D0E" />
                <Chip label={`${t.limit}: ${a.limit}`} bg="#F0F9FF" color="#0284C7" />
              </div>
              <button onClick={() => setMapAtm(a)} style={{ width:'100%', background:grad, border:'none', borderRadius:12, padding:'11px', color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                {t.viewMap}
              </button>
            </div>
          ))}
        </div>
      </div>
    );

        if (tab === 'noticias') return (
      <div style={{ padding:'12px 14px 90px', display:'flex', flexDirection:'column', gap:12 }}>
        {NEWS.map(n => (
          <div key={n.id} style={{ background:'#fff', borderRadius:18, padding:16, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', cursor:'pointer' }} onClick={() => setOpenNews(openNews===n.id?null:n.id)}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <Chip label={(t as any)[n.cat]||n.cat} bg={(NEWS_COLOR[n.cat]||'#888')+'18'} color={NEWS_COLOR[n.cat]||'#888'} />
              <span style={{ fontSize:11, color:'#aaa', marginLeft:'auto' }}>{n.time} . {n.date}</span>
            </div>
            <div style={{ fontWeight:700, fontSize:14, color:'#111', lineHeight:1.45, marginBottom:6 }}>{n.title}</div>
            <div style={{ fontSize:12, color:'#888' }}>{t.source}: {n.source}</div>
            {openNews === n.id && (
              <div style={{ marginTop:10, fontSize:13, color:'#444', lineHeight:1.65, borderTop:'1px solid #F3F4F6', paddingTop:10 }}>{n.body}</div>
            )}
            <div style={{ marginTop:8, fontSize:12, color:NEWS_COLOR[n.cat]||'#888', fontWeight:600 }}>{openNews===n.id?'^ Cerrar':'v '+t.readMore}</div>
          </div>
        ))}
      </div>
    );

    if (tab === 'cambio') return (
      <div style={{ padding:'12px 14px 90px' }}>
        <div style={{ background:'#fff', borderRadius:20, padding:'18px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)', marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:16, color:'#111', marginBottom:16 }}>{t.convert}</div>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, color:'#888', marginBottom:6 }}>{t.from}: XAF</div>
            <input value={xaf} onChange={e => setXaf(e.target.value)} placeholder="0" type="number"
              style={{ width:'100%', border:'1.5px solid #E5E7EB', borderRadius:12, padding:'12px 14px', fontSize:20, fontWeight:700, boxSizing:'border-box', outline:'none', color:'#111' }} />
          </div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, color:'#888', marginBottom:6 }}>{t.to}</div>
            <select value={cur} onChange={e => setCur(e.target.value)}
              style={{ width:'100%', border:'1.5px solid #E5E7EB', borderRadius:12, padding:'12px 14px', fontSize:15, boxSizing:'border-box', outline:'none', background:'#fff', color:'#111' }}>
              {Object.keys(RATES).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {converted && (
            <div style={{ background:'#F0FDF4', borderRadius:14, padding:'16px', textAlign:'center' }}>
              <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>{t.result}</div>
              <div style={{ fontSize:30, fontWeight:800, color:'#16A34A' }}>{converted} <span style={{ fontSize:16 }}>{cur}</span></div>
              <div style={{ fontSize:12, color:'#aaa', marginTop:4 }}>1 XAF = {RATES[cur]} {cur}</div>
            </div>
          )}
        </div>
        <div style={{ background:'#fff', borderRadius:20, padding:'16px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ fontWeight:700, fontSize:14, color:'#111', marginBottom:12 }}>{t.rates}</div>
          {Object.entries(RATES).map(([c, r]) => (
            <div key={c} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #F3F4F6' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, color:'#3B82F6' }}>{c}</div>
                <div style={{ fontSize:12, color:'#888' }}>1 XAF</div>
              </div>
              <div style={{ fontWeight:700, fontSize:14, color:'#3B82F6' }}>{r.toFixed(6)}</div>
            </div>
          ))}
        </div>
      </div>
    );

    return null;
  };

  return (
    <div style={{ width:'100%', height:'100%', background:'#F0F2F5', display:'flex', flexDirection:'column', overflow:'hidden', paddingTop:56, boxSizing:'border-box' }}>

      {/* HEADER */}
      <div style={{ background:grad, flexShrink:0, boxShadow:'0 2px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px 8px' }}>
          <button onClick={() => setCountry(null)}
            style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:10, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff', fontSize:20, flexShrink:0, transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.35)'; e.currentTarget.style.transform='scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.2)'; e.currentTarget.style.transform='scale(1)'; }}>Back</button>
          <div style={{ flex:1 }}>
            <div style={{ color:'#fff', fontWeight:800, fontSize:16, letterSpacing:-0.3, lineHeight:1 }}>CEMAC</div>
            <div style={{ color:'rgba(255,255,255,0.8)', fontSize:11, marginTop:1 }}>{cn(ctry!, lang)} . {ctry!.capital}</div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.22)', borderRadius:8, padding:'4px 10px', color:'#fff', fontSize:11, fontWeight:700 }}>{lang}</div>
        </div>
        <div style={{ display:'flex', overflowX:'auto', scrollbarWidth:'none', padding:'0 10px', gap:2 }}>
          {TABS.map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              style={{ flexShrink:0, background:tab===tb.id?'#fff':'transparent', border:'none', borderRadius:'10px 10px 0 0', padding:'8px 13px', color:tab===tb.id?g1:'rgba(255,255,255,0.85)', fontWeight:tab===tb.id?700:400, fontSize:12, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.2s', outline:'none' }}
              onMouseEnter={e => { if(tab!==tb.id){ e.currentTarget.style.background='rgba(255,255,255,0.2)'; }}}
              onMouseLeave={e => { if(tab!==tb.id){ e.currentTarget.style.background='transparent'; }}}>
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none' }}>
        {renderTab()}
      </div>
      {modal && <ModalContent />}
    </div>
  );
};

export default CemacView;
