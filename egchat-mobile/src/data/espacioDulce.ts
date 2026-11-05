export interface EspacioPost {
  id: string;
  author: string;
  avatar: string;
  color: string;
  text: string;
  time: string;
  likes: number;
  comments: number;
  liked: boolean;
  isOfficial?: boolean;
  category?: string;
}

export interface Espacio {
  id: string;
  name: string;
  coverColor: string;
  emoji: string;
  description: string;
  type: 'publico' | 'comunidad';
  followers: number;
  following: boolean;
  isGov?: boolean;
  posts: EspacioPost[];
}

export const ESPACIOS: Espacio[] = [
  {
    id: 'e1', name: 'Gobierno GE', coverColor: '#0369a1', emoji: '🏛️',
    description: 'Noticias y comunicados oficiales del Gobierno de Guinea Ecuatorial',
    type: 'publico', followers: 48200, following: true, isGov: true,
    posts: [
      { id: 'p1', author: 'Gobierno GE', avatar: '🏛️', color: '#0369a1', text: 'Nueva infraestructura vial en Malabo. El presidente inaugura el tramo norte de la autopista.', time: '2h', likes: 1240, comments: 89, liked: false, isOfficial: true, category: 'Infraestructura' },
      { id: 'p2', author: 'Gobierno GE', avatar: '🏛️', color: '#0369a1', text: 'Convocatoria de becas universitarias 2026. Plazo hasta el 30 de abril.', time: '5h', likes: 3400, comments: 210, liked: true, isOfficial: true, category: 'Educación' },
    ],
  },
  {
    id: 'e2', name: 'Música GQ', coverColor: '#7c3aed', emoji: '🎵',
    description: 'Lo mejor de la música de Guinea Ecuatorial y África Central',
    type: 'comunidad', followers: 12800, following: false,
    posts: [
      { id: 'p3', author: 'DJ Malabo', avatar: 'DM', color: '#7c3aed', text: 'Nueva mezcla de Afrobeat + Makossa disponible ahora', time: '1h', likes: 567, comments: 43, liked: false },
      { id: 'p4', author: 'Bata Sounds', avatar: 'BS', color: '#db2777', text: 'Concierto en vivo este sábado en la Plaza de la Independencia. Entrada libre', time: '3h', likes: 892, comments: 156, liked: false },
    ],
  },
  {
    id: 'e3', name: 'Mercado Malabo', coverColor: '#059669', emoji: '🛒',
    description: 'Compra, vende e intercambia en Guinea Ecuatorial',
    type: 'comunidad', followers: 31500, following: true,
    posts: [
      { id: 'p6', author: 'Tienda Nguema', avatar: 'TN', color: '#059669', text: 'Vendo moto Honda 2023 en perfecto estado. 850.000 XAF.', time: '30m', likes: 23, comments: 8, liked: false },
    ],
  },
  {
    id: 'e4', name: 'Deportes GQ', coverColor: '#dc2626', emoji: '⚽',
    description: 'Fútbol, baloncesto y todos los deportes de Guinea Ecuatorial',
    type: 'publico', followers: 22100, following: false,
    posts: [
      { id: 'p8', author: 'FutbolGE', avatar: 'FG', color: '#dc2626', text: 'Nzalang Nacional convocatoria para la Copa África 2026.', time: '4h', likes: 4200, comments: 520, liked: false },
    ],
  },
  {
    id: 'e5', name: 'Tecnología GE', coverColor: '#1e40af', emoji: '💻',
    description: 'Innovación, startups y tecnología en Guinea Ecuatorial',
    type: 'comunidad', followers: 8900, following: true,
    posts: [
      { id: 'p10', author: 'TechMalabo', avatar: 'TM', color: '#1e40af', text: 'EGCHAT lanza Espacio Dulce, MiTaxi y CEMAC Market. La super-app de GE sigue creciendo', time: '1h', likes: 678, comments: 94, liked: true },
    ],
  },
];

export const formatFollowers = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n);
