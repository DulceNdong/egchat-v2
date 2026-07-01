export interface HomeNewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  url?: string;
}

export const HOME_NEWS: HomeNewsItem[] = [
  {
    id: '1',
    title: 'Nuevas inversiones en infraestructura en Malabo',
    source: 'La Gaceta de Guinea',
    time: 'Hace 2 h',
    url: 'https://lagacetadeguinea.com',
  },
  {
    id: '2',
    title: 'Actualización del sistema bancario en la zona CEMAC',
    source: 'Economía GQ',
    time: 'Hace 5 h',
  },
  {
    id: '3',
    title: 'Festival cultural de Bata reunirá a artistas regionales',
    source: 'TVGE Noticias',
    time: 'Ayer',
    url: 'https://tvge.gq',
  },
  {
    id: '4',
    title: 'EGCHAT amplía pagos móviles entre usuarios',
    source: 'EGCHAT',
    time: 'Hoy',
  },
];

export const NEWS_SOURCES = [
  { icon: '📰', name: 'La Gaceta de Guinea', desc: 'Diario oficial y noticias nacionales', url: 'https://lagacetadeguinea.com' },
  { icon: '📡', name: 'TVGE Noticias', desc: 'Televisión de Guinea Ecuatorial', url: 'https://tvge.gq' },
  { icon: '🌍', name: 'Noticias CEMAC', desc: 'Noticias de la región CEMAC', url: 'https://cemac.int' },
  { icon: '📻', name: 'Radio Nacional GQ', desc: 'Radio pública de Guinea Ecuatorial', url: '' },
  { icon: '💼', name: 'Economía GQ', desc: 'Noticias económicas y empresariales', url: '' },
];
