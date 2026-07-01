export type BetSlipItem = {
  id: string; matchLabel: string; pick: string; odds: number; stake: string;
};

export type Match = {
  id: string; league: string; home: string; away: string; time: string;
  live?: boolean; score?: string;
  odds1: number; oddsX?: number; odds2: number;
};

export type Company = {
  id: string; name: string; tagline: string; color: string;
  type: 'sports' | 'casino' | 'lottery';
  bonus: string; minBet: number; url: string;
  sports?: { id: string; label: string; icon: string; matches: Match[] }[];
  casino?: { id: string; name: string; icon: string; rtp: string }[];
  lottery?: { id: string; name: string; icon: string; jackpot: string; price: number }[];
};

const m = (
  id: string, league: string, home: string, away: string, time: string,
  o1: number, oX: number | undefined, o2: number, live?: boolean, score?: string,
): Match => ({ id, league, home, away, time, live, score, odds1: o1, oddsX: oX, odds2: o2 });

export const COMPANIES: Company[] = [
  {
    id: 'africagames', name: 'Africa Games', tagline: 'Apuestas deportivas · GQ',
    color: '#16a34a', type: 'sports', bonus: '50% primer depósito hasta 25,000 XAF',
    minBet: 200, url: 'https://africagames.gq',
    sports: [{
      id: 'futbol', label: 'Fútbol', icon: '⚽',
      matches: [
        m('ag1', 'Premier League', 'Liverpool', 'Arsenal', 'Hoy 21:00', 1.55, 4.2, 5.5, true, '2-1'),
        m('ag2', 'La Liga', 'Real Madrid', 'Barcelona', 'Sáb 21:00', 2.2, 3.4, 3.1),
        m('ag3', 'Copa África', 'Senegal', 'Marruecos', 'Sáb 20:00', 2.6, 3.1, 2.6),
      ],
    }],
  },
  {
    id: 'forza', name: 'Forza Bet', tagline: 'Casino online · GQ · Slots & Live',
    color: '#7c3aed', type: 'casino', bonus: '100 giros gratis al registrarte',
    minBet: 200, url: 'https://forzabet.gq',
    casino: [
      { id: 'slots1', name: 'EGCHAT Fortune', icon: '🎰', rtp: '96.2%' },
      { id: 'crash', name: 'Crash XAF', icon: '🚀', rtp: '97%' },
      { id: 'roulette', name: 'Ruleta Live', icon: '🎡', rtp: '97.3%' },
    ],
  },
  {
    id: 'geloto', name: 'Geloto GQ', tagline: 'Lotería Oficial Guinea Ecuatorial',
    color: '#d97706', type: 'lottery', bonus: 'Rasca gratis al registrarte',
    minBet: 100, url: 'https://geloto.gq',
    lottery: [
      { id: 'lotto', name: 'Lotería CEMAC', icon: '🎱', jackpot: '50,000,000 XAF', price: 500 },
      { id: 'keno', name: 'Keno GQ', icon: '🔢', jackpot: '10,000,000 XAF', price: 100 },
    ],
  },
  {
    id: 'betomax', name: 'Bettomax', tagline: 'Leisure World Holdings · 5 países',
    color: '#dc2626', type: 'sports', bonus: 'Apuesta 5,000 XAF → 1,000 gratis',
    minBet: 500, url: 'https://www.bettomax.com',
    sports: [{
      id: 'futbol', label: 'Fútbol', icon: '⚽',
      matches: [
        m('bt1', 'Ligue 1', 'PSG', 'Marseille', 'Dom 21:00', 1.55, 4.2, 5.5),
        m('bt2', 'Champions', 'Man City', 'PSG', 'Mar 21:00', 1.75, 3.8, 4.5),
      ],
    }],
  },
  {
    id: '1xbet', name: '1XBET', tagline: 'Líder mundial · +60 deportes',
    color: '#1d4ed8', type: 'sports', bonus: '100% primer depósito hasta 50,000 XAF',
    minBet: 200, url: 'https://1xbet.com/es',
    sports: [{
      id: 'futbol', label: 'Fútbol', icon: '⚽',
      matches: [
        m('xb1', 'Bundesliga', 'Bayern', 'Dortmund', 'Sáb 18:30', 1.65, 4, 5),
        m('xb2', 'NBA', 'Lakers', 'Warriors', 'Hoy 02:30', 1.95, undefined, 1.88, true, '89-94'),
      ],
    }],
  },
];
