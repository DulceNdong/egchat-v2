import { r as reactExports, j as jsxRuntimeExports } from "./react-core-B1rSPtcn.js";
const s = (/* @__PURE__ */ new Date()).getDate() + (/* @__PURE__ */ new Date()).getMonth() * 31;
const rng = (n) => {
  const x = Math.sin(n + s) * 1e4;
  return x - Math.floor(x);
};
const ro = (b, n) => parseFloat(Math.max(1.01, b + rng(n) * 0.5 - 0.25).toFixed(2));
const m = (id, league, li, home, away, time, o1, oX, o2, live, score, min, mkts) => ({
  id,
  league,
  leagueIcon: li,
  home,
  away,
  time,
  live,
  score,
  minute: min,
  odds1: ro(o1, o1 * 7),
  oddsX: oX ? ro(oX, oX * 13) : void 0,
  odds2: ro(o2, o2 * 11),
  markets: mkts
});
const AG_SPORTS = [
  { id: "futbol", label: "Fútbol", icon: "⚽", matches: [
    m("ag1", "Premier League", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Liverpool", "Arsenal", "Hoy 21:00", 1.55, 4.2, 5.5, true, "2-1", 67, [
      { name: "Más/Menos goles", options: [{ label: "+2.5", odds: 1.55 }, { label: "-2.5", odds: 2.4 }] },
      { name: "Ambos marcan", options: [{ label: "Sí", odds: 1.65 }, { label: "No", odds: 2.1 }] },
      { name: "1er gol", options: [{ label: "Liverpool", odds: 1.8 }, { label: "Arsenal", odds: 2.2 }, { label: "Sin gol", odds: 8 }] }
    ]),
    m("ag2", "Premier League", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Man City", "Chelsea", "Hoy 18:30", 1.8, 3.6, 4.2, false, void 0, void 0, [
      { name: "Más/Menos goles", options: [{ label: "+2.5", odds: 1.7 }, { label: "-2.5", odds: 2.1 }] },
      { name: "Handicap", options: [{ label: "Man City -1", odds: 2.2 }, { label: "Chelsea +1", odds: 1.7 }] }
    ]),
    m("ag3", "Premier League", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Man United", "Tottenham", "Mañana 16:00", 2.1, 3.4, 3.3),
    m("ag4", "Premier League", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Newcastle", "Aston Villa", "Sáb 14:00", 2.3, 3.2, 3.1),
    m("ag5", "Premier League", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Brighton", "West Ham", "Dom 15:00", 2.05, 3.3, 3.6),
    m("ag6", "La Liga", "🇪🇸", "Real Madrid", "Barcelona", "Sáb 21:00", 2.2, 3.4, 3.1, false, void 0, void 0, [
      { name: "Más/Menos goles", options: [{ label: "+2.5", odds: 1.6 }, { label: "-2.5", odds: 2.25 }] },
      { name: "Ambos marcan", options: [{ label: "Sí", odds: 1.7 }, { label: "No", odds: 2.05 }] },
      { name: "Goleador", options: [{ label: "Mbappé", odds: 2.5 }, { label: "Lewandowski", odds: 3 }, { label: "Vinicius", odds: 3.5 }] }
    ]),
    m("ag7", "La Liga", "🇪🇸", "Atletico Madrid", "Sevilla", "Dom 18:30", 1.75, 3.5, 4.5),
    m("ag8", "La Liga", "🇪🇸", "Athletic Bilbao", "Real Sociedad", "Sáb 16:15", 2.4, 3.2, 2.9),
    m("ag9", "La Liga", "🇪🇸", "Valencia", "Villarreal", "Lun 21:00", 2.6, 3.1, 2.7),
    m("ag10", "Serie A", "🇮🇹", "Inter Milan", "AC Milan", "Dom 20:45", 2, 3.3, 3.6, false, void 0, void 0, [
      { name: "Más/Menos goles", options: [{ label: "+2.5", odds: 1.75 }, { label: "-2.5", odds: 2 }] }
    ]),
    m("ag11", "Serie A", "🇮🇹", "Juventus", "Napoli", "Sáb 18:00", 2.3, 3.2, 3),
    m("ag12", "Serie A", "🇮🇹", "Roma", "Lazio", "Dom 18:00", 2.2, 3.25, 3.2),
    m("ag13", "Bundesliga", "🇩🇪", "Bayern Munich", "Borussia Dortmund", "Sáb 18:30", 1.65, 4, 5, false, void 0, void 0, [
      { name: "Más/Menos goles", options: [{ label: "+3.5", odds: 1.8 }, { label: "-3.5", odds: 1.95 }] },
      { name: "Handicap", options: [{ label: "Bayern -1.5", odds: 2.1 }, { label: "Dortmund +1.5", odds: 1.75 }] }
    ]),
    m("ag14", "Bundesliga", "🇩🇪", "Bayer Leverkusen", "RB Leipzig", "Dom 15:30", 2.1, 3.3, 3.4),
    m("ag15", "Ligue 1", "🇫🇷", "PSG", "Marseille", "Dom 21:00", 1.55, 4.2, 5.5),
    m("ag16", "Ligue 1", "🇫🇷", "Monaco", "Lyon", "Sáb 21:00", 2.2, 3.2, 3.3),
    m("ag17", "Champions League", "⭐", "Real Madrid", "Bayern Munich", "Mar 21:00", 2.1, 3.5, 3.3, false, void 0, void 0, [
      { name: "Más/Menos goles", options: [{ label: "+2.5", odds: 1.65 }, { label: "-2.5", odds: 2.2 }] },
      { name: "Ambos marcan", options: [{ label: "Sí", odds: 1.75 }, { label: "No", odds: 2 }] },
      { name: "Clasificado", options: [{ label: "Real Madrid", odds: 1.8 }, { label: "Bayern", odds: 2 }] }
    ]),
    m("ag18", "Champions League", "⭐", "Barcelona", "Inter Milan", "Mié 21:00", 1.9, 3.6, 4),
    m("ag19", "Champions League", "⭐", "Man City", "PSG", "Mar 21:00", 1.75, 3.8, 4.5),
    m("ag20", "Champions League", "⭐", "Liverpool", "Juventus", "Mié 21:00", 1.6, 4, 5.5),
    m("ag21", "Europa League", "🟠", "Atletico Madrid", "Roma", "Jue 21:00", 1.95, 3.4, 3.8),
    m("ag22", "Europa League", "🟠", "Tottenham", "Eintracht Frankfurt", "Jue 18:45", 2, 3.3, 3.6),
    m("ag23", "Copa África", "🌍", "Senegal", "Marruecos", "Sáb 20:00", 2.6, 3.1, 2.6),
    m("ag24", "Copa África", "🌍", "Nigeria", "Camerún", "Dom 17:00", 2.2, 3.2, 3.1),
    m("ag25", "Copa África", "🌍", "Costa de Marfil", "Ghana", "Lun 20:00", 2.1, 3.3, 3.4),
    m("ag26", "CAF Champions League", "🌍", "Al Ahly", "Wydad Casablanca", "Mar 20:00", 1.85, 3.4, 4.2),
    m("ag27", "Clasificación Mundial", "🌐", "Brasil", "Argentina", "Mar 02:00", 2.3, 3.2, 2.9),
    m("ag28", "Clasificación Mundial", "🌐", "Francia", "Portugal", "Vie 20:45", 2, 3.4, 3.5)
  ] },
  { id: "baloncesto", label: "Baloncesto", icon: "🏀", matches: [
    m("agb1", "NBA", "🇺🇸", "LA Lakers", "Golden State Warriors", "Hoy 02:30", 1.95, void 0, 1.88, true, "89-94", 38, [
      { name: "Total puntos", options: [{ label: "+215.5", odds: 1.9 }, { label: "-215.5", odds: 1.9 }] },
      { name: "Handicap", options: [{ label: "Lakers -3.5", odds: 1.9 }, { label: "Warriors +3.5", odds: 1.9 }] }
    ]),
    m("agb2", "NBA", "🇺🇸", "Boston Celtics", "Miami Heat", "Hoy 01:00", 1.65, void 0, 2.3),
    m("agb3", "NBA", "🇺🇸", "Denver Nuggets", "Phoenix Suns", "Mañana 03:00", 1.8, void 0, 2.05),
    m("agb4", "NBA", "🇺🇸", "Milwaukee Bucks", "Philadelphia 76ers", "Sáb 01:30", 1.75, void 0, 2.1),
    m("agb5", "EuroLiga", "🇪🇺", "Real Madrid", "CSKA Moscú", "Jue 20:45", 1.7, void 0, 2.2),
    m("agb6", "EuroLiga", "🇪🇺", "Barcelona", "Fenerbahce", "Vie 20:00", 1.85, void 0, 2)
  ] },
  { id: "tenis", label: "Tenis", icon: "🎾", matches: [
    m("agt1", "ATP Masters 1000", "🎾", "Carlos Alcaraz", "Jannik Sinner", "Hoy 14:00", 1.75, void 0, 2.1, true, "6-4, 3-2", 0, [
      { name: "Sets", options: [{ label: "2-0", odds: 2.5 }, { label: "2-1", odds: 2.8 }, { label: "0-2", odds: 3.2 }, { label: "1-2", odds: 3.5 }] },
      { name: "Total games", options: [{ label: "+22.5", odds: 1.85 }, { label: "-22.5", odds: 1.9 }] }
    ]),
    m("agt2", "ATP Masters 1000", "🎾", "Novak Djokovic", "Alexander Zverev", "Mañana 15:00", 1.6, void 0, 2.4),
    m("agt3", "ATP 500", "🎾", "Daniil Medvedev", "Casper Ruud", "Sáb 13:00", 1.9, void 0, 1.95),
    m("agt4", "WTA Premier", "🎾", "Iga Swiatek", "Aryna Sabalenka", "Dom 12:00", 1.65, void 0, 2.25),
    m("agt5", "WTA 1000", "🎾", "Coco Gauff", "Elena Rybakina", "Sáb 11:00", 1.8, void 0, 2.05)
  ] },
  { id: "boxeo", label: "Boxeo", icon: "🥊", matches: [
    m("agx1", "Peso Pesado WBC", "🥊", "Tyson Fury", "Anthony Joshua", "Sáb 23:00", 1.8, void 0, 2.05, false, void 0, void 0, [
      { name: "Método victoria", options: [{ label: "KO/TKO Fury", odds: 2.5 }, { label: "Decisión Fury", odds: 3 }, { label: "KO/TKO Joshua", odds: 3.5 }, { label: "Decisión Joshua", odds: 4.5 }, { label: "Empate", odds: 18 }] },
      { name: "Ronda final", options: [{ label: "1-4", odds: 3.5 }, { label: "5-8", odds: 2.8 }, { label: "9-12", odds: 3.2 }, { label: "Decisión", odds: 2.2 }] }
    ]),
    m("agx2", "Peso Welter WBA", "🥊", "Errol Spence Jr.", "Terence Crawford", "Dom 02:00", 2.1, void 0, 1.75),
    m("agx3", "Peso Medio WBO", "🥊", "Canelo Álvarez", "Jermall Charlo", "Sáb 02:30", 1.55, void 0, 2.6)
  ] },
  { id: "mma", label: "MMA/UFC", icon: "🥋", matches: [
    m("agm1", "UFC 310", "🥋", "Jon Jones", "Stipe Miocic", "Dom 04:00", 1.55, void 0, 2.55, false, void 0, void 0, [
      { name: "Método", options: [{ label: "KO/TKO Jones", odds: 2.2 }, { label: "Sumisión Jones", odds: 4 }, { label: "Decisión Jones", odds: 3.5 }, { label: "KO/TKO Miocic", odds: 4.5 }] },
      { name: "Ronda", options: [{ label: "Ronda 1", odds: 3 }, { label: "Ronda 2", odds: 3.5 }, { label: "Ronda 3+", odds: 2.5 }] }
    ]),
    m("agm2", "UFC Fight Night", "🥋", "Israel Adesanya", "Alex Pereira", "Sáb 03:00", 2.3, void 0, 1.65),
    m("agm3", "Bellator", "🥋", "Patricio Pitbull", "AJ McKee", "Vie 02:00", 1.9, void 0, 1.95)
  ] },
  { id: "esports", label: "eSports", icon: "🎮", matches: [
    m("age1", "CS2 - ESL Pro League", "🎮", "Natus Vincere", "FaZe Clan", "Hoy 17:00", 1.75, void 0, 2.1, true, "1-0 mapas", 0, [
      { name: "Mapas", options: [{ label: "2-0", odds: 2.8 }, { label: "2-1", odds: 2.2 }, { label: "0-2", odds: 3.5 }, { label: "1-2", odds: 2.8 }] }
    ]),
    m("age2", "LoL - LEC", "🎮", "G2 Esports", "Fnatic", "Hoy 19:00", 1.6, void 0, 2.35),
    m("age3", "Dota 2 - The International", "🎮", "Team Spirit", "OG", "Mañana 12:00", 1.85, void 0, 2),
    m("age4", "FIFA eWorld Cup", "🎮", "MoAuba", "Tekkz", "Sáb 16:00", 1.95, void 0, 1.9)
  ] }
];
const BT_SPORTS = [
  { id: "futbol", label: "Fútbol", icon: "⚽", matches: [
    m("bt1", "Premier League", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Arsenal", "Man City", "Hoy 20:00", 3.2, 3.5, 2.1, true, "0-1", 55, [
      { name: "Más/Menos goles", options: [{ label: "+2.5", odds: 1.6 }, { label: "-2.5", odds: 2.3 }] },
      { name: "Ambos marcan", options: [{ label: "Sí", odds: 1.7 }, { label: "No", odds: 2.05 }] }
    ]),
    m("bt2", "Premier League", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Chelsea", "Newcastle", "Mañana 18:30", 1.9, 3.4, 3.8),
    m("bt3", "Premier League", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Tottenham", "Liverpool", "Sáb 17:30", 4.5, 3.8, 1.7),
    m("bt4", "La Liga", "🇪🇸", "Barcelona", "Atletico Madrid", "Dom 20:00", 1.85, 3.5, 4, false, void 0, void 0, [
      { name: "Más/Menos goles", options: [{ label: "+2.5", odds: 1.65 }, { label: "-2.5", odds: 2.2 }] },
      { name: "Goleador", options: [{ label: "Lewandowski", odds: 2.8 }, { label: "Griezmann", odds: 3.5 }, { label: "Yamal", odds: 4 }] }
    ]),
    m("bt5", "La Liga", "🇪🇸", "Real Madrid", "Girona", "Sáb 16:15", 1.45, 4.5, 7),
    m("bt6", "Serie A", "🇮🇹", "Napoli", "Juventus", "Dom 15:00", 2.8, 3.2, 2.5),
    m("bt7", "Serie A", "🇮🇹", "AC Milan", "Atalanta", "Sáb 20:45", 2.2, 3.3, 3.2),
    m("bt8", "Bundesliga", "🇩🇪", "Borussia Dortmund", "Bayer Leverkusen", "Sáb 15:30", 2.8, 3.3, 2.5),
    m("bt9", "Champions League", "⭐", "PSG", "Arsenal", "Mar 21:00", 2, 3.5, 3.6, false, void 0, void 0, [
      { name: "Más/Menos goles", options: [{ label: "+2.5", odds: 1.7 }, { label: "-2.5", odds: 2.1 }] },
      { name: "Clasificado", options: [{ label: "PSG", odds: 1.9 }, { label: "Arsenal", odds: 1.9 }] }
    ]),
    m("bt10", "Champions League", "⭐", "Juventus", "Man City", "Mié 21:00", 3.5, 3.4, 2),
    m("bt11", "Europa League", "🟠", "Man United", "Ajax", "Jue 21:00", 1.8, 3.5, 4.2),
    m("bt12", "CAF Champions League", "🌍", "Al Ahly", "Wydad Casablanca", "Mar 20:00", 1.85, 3.4, 4.2),
    m("bt13", "CAF Champions League", "🌍", "Espérance Tunis", "TP Mazembe", "Mié 18:00", 2.1, 3.2, 3.4),
    m("bt14", "Copa África", "🌍", "Marruecos", "Nigeria", "Dom 19:00", 2.2, 3.2, 3.3),
    m("bt15", "Clasificación Mundial", "🌐", "Camerún", "Senegal", "Vie 20:00", 2.8, 3.1, 2.5)
  ] },
  { id: "baloncesto", label: "Baloncesto", icon: "🏀", matches: [
    m("btb1", "NBA", "🇺🇸", "Boston Celtics", "Cleveland Cavaliers", "Hoy 00:30", 1.6, void 0, 2.4, [
      { name: "Total puntos", options: [{ label: "+220.5", odds: 1.9 }, { label: "-220.5", odds: 1.9 }] }
    ]),
    m("btb2", "NBA", "🇺🇸", "Golden State Warriors", "San Antonio Spurs", "Hoy 03:00", 1.5, void 0, 2.6),
    m("btb3", "EuroLiga", "🇪🇺", "Olympiacos", "Panathinaikos", "Jue 19:00", 2.1, void 0, 1.75)
  ] },
  { id: "rugby", label: "Rugby", icon: "🏉", matches: [
    m("btr1", "Six Nations", "🏉", "Francia", "Inglaterra", "Sáb 16:45", 1.85, void 0, 1.98, false, void 0, void 0, [
      { name: "Hándicap", options: [{ label: "Francia -5.5", odds: 1.9 }, { label: "Inglaterra +5.5", odds: 1.9 }] },
      { name: "Total puntos", options: [{ label: "+42.5", odds: 1.85 }, { label: "-42.5", odds: 1.9 }] }
    ]),
    m("btr2", "Six Nations", "🏉", "Irlanda", "Gales", "Sáb 14:15", 1.4, void 0, 2.9),
    m("btr3", "Rugby Championship", "🏉", "Nueva Zelanda", "Sudáfrica", "Dom 09:05", 1.7, void 0, 2.15),
    m("btr4", "Premiership", "🏉", "Saracens", "Leicester Tigers", "Sáb 15:00", 1.75, void 0, 2.1)
  ] },
  { id: "tenis", label: "Tenis", icon: "🎾", matches: [
    m("btt1", "ATP Masters 1000", "🎾", "Novak Djokovic", "Rafael Nadal", "Mañana 15:00", 1.6, void 0, 2.4, [
      { name: "Sets", options: [{ label: "2-0", odds: 2.2 }, { label: "2-1", odds: 2.6 }, { label: "0-2", odds: 4 }, { label: "1-2", odds: 4.5 }] }
    ]),
    m("btt2", "ATP 500", "🎾", "Carlos Alcaraz", "Holger Rune", "Sáb 14:00", 1.55, void 0, 2.5),
    m("btt3", "WTA 1000", "🎾", "Iga Swiatek", "Coco Gauff", "Dom 13:00", 1.7, void 0, 2.2)
  ] },
  { id: "boxeo", label: "Boxeo", icon: "🥊", matches: [
    m("btx1", "Peso Semipesado WBC", "🥊", "Dmitry Bivol", "Artur Beterbiev", "Sáb 22:00", 2.2, void 0, 1.7, false, void 0, void 0, [
      { name: "Método", options: [{ label: "KO/TKO", odds: 2 }, { label: "Decisión", odds: 1.85 }, { label: "Empate", odds: 20 }] }
    ]),
    m("btx2", "Peso Pesado IBF", "🥊", "Anthony Joshua", "Deontay Wilder", "Dom 23:00", 1.9, void 0, 1.95)
  ] },
  { id: "mma", label: "MMA", icon: "🥋", matches: [
    m("btm1", "UFC Fight Night", "🥋", "Conor McGregor", "Dustin Poirier", "Sáb 04:00", 1.8, void 0, 2.05, false, void 0, void 0, [
      { name: "Método", options: [{ label: "KO/TKO", odds: 1.9 }, { label: "Sumisión", odds: 3.5 }, { label: "Decisión", odds: 2.8 }] }
    ]),
    m("btm2", "Bellator", "🥋", "Ryan Bader", "Vadim Nemkov", "Dom 03:00", 2.1, void 0, 1.75)
  ] },
  { id: "esports", label: "eSports", icon: "🎮", matches: [
    m("bte1", "CS2 - BLAST Premier", "🎮", "Astralis", "Team Vitality", "Hoy 18:00", 2.2, void 0, 1.7),
    m("bte2", "LoL - LCK", "🎮", "T1", "Gen.G", "Mañana 10:00", 1.65, void 0, 2.3),
    m("bte3", "Valorant Champions", "🎮", "Sentinels", "LOUD", "Sáb 20:00", 1.9, void 0, 1.95)
  ] },
  { id: "hockey", label: "Hockey", icon: "🏒", matches: [
    m("bth1", "NHL", "🏒", "Toronto Maple Leafs", "Boston Bruins", "Hoy 01:00", 1.9, void 0, 1.95, false, void 0, void 0, [
      { name: "Total goles", options: [{ label: "+5.5", odds: 1.85 }, { label: "-5.5", odds: 1.9 }] }
    ]),
    m("bth2", "NHL", "🏒", "Colorado Avalanche", "Vegas Golden Knights", "Mañana 03:00", 1.85, void 0, 2),
    m("bth3", "KHL", "🏒", "CSKA Moscú", "SKA San Petersburgo", "Mié 17:00", 1.8, void 0, 2.05)
  ] }
];
const XB_SPORTS = [
  { id: "futbol", label: "Fútbol", icon: "⚽", matches: [
    m("xb1", "Premier League", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Liverpool", "Man City", "Hoy 21:00", 2.4, 3.3, 2.8, true, "1-1", 72, [
      { name: "Más/Menos goles", options: [{ label: "+2.5", odds: 1.55 }, { label: "-2.5", odds: 2.4 }] },
      { name: "Ambos marcan", options: [{ label: "Sí", odds: 1.6 }, { label: "No", odds: 2.2 }] },
      { name: "Handicap asiático", options: [{ label: "Liverpool -0.5", odds: 2.5 }, { label: "Man City -0.5", odds: 2.9 }] },
      { name: "Córners", options: [{ label: "+9.5", odds: 1.85 }, { label: "-9.5", odds: 1.9 }] }
    ]),
    m("xb2", "Premier League", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Arsenal", "Chelsea", "Mañana 20:00", 1.95, 3.4, 3.7),
    m("xb3", "Premier League", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Aston Villa", "Man United", "Sáb 15:00", 2.2, 3.3, 3.2),
    m("xb4", "La Liga", "🇪🇸", "Real Madrid", "Atletico Madrid", "Dom 21:00", 2, 3.4, 3.6, false, void 0, void 0, [
      { name: "Más/Menos goles", options: [{ label: "+2.5", odds: 1.7 }, { label: "-2.5", odds: 2.1 }] },
      { name: "Ambos marcan", options: [{ label: "Sí", odds: 1.75 }, { label: "No", odds: 2 }] },
      { name: "Goleador", options: [{ label: "Mbappé", odds: 2.4 }, { label: "Griezmann", odds: 3.2 }, { label: "Vinicius", odds: 3 }] },
      { name: "Tarjetas", options: [{ label: "+3.5", odds: 1.9 }, { label: "-3.5", odds: 1.85 }] }
    ]),
    m("xb5", "La Liga", "🇪🇸", "Barcelona", "Sevilla", "Sáb 18:30", 1.6, 3.8, 5.5),
    m("xb6", "Serie A", "🇮🇹", "Inter Milan", "Juventus", "Dom 20:45", 2.1, 3.2, 3.4, false, void 0, void 0, [
      { name: "Más/Menos goles", options: [{ label: "+2.5", odds: 1.8 }, { label: "-2.5", odds: 1.95 }] },
      { name: "Handicap", options: [{ label: "Inter -0.5", odds: 2.2 }, { label: "Juventus +0.5", odds: 1.7 }] }
    ]),
    m("xb7", "Serie A", "🇮🇹", "Napoli", "Roma", "Sáb 15:00", 1.9, 3.4, 4),
    m("xb8", "Bundesliga", "🇩🇪", "Bayern Munich", "RB Leipzig", "Sáb 18:30", 1.7, 3.8, 4.8, false, void 0, void 0, [
      { name: "Más/Menos goles", options: [{ label: "+3.5", odds: 1.75 }, { label: "-3.5", odds: 2 }] },
      { name: "Handicap", options: [{ label: "Bayern -1.5", odds: 2 }, { label: "Leipzig +1.5", odds: 1.85 }] }
    ]),
    m("xb9", "Ligue 1", "🇫🇷", "PSG", "Nice", "Sáb 21:00", 1.4, 4.8, 8),
    m("xb10", "Ligue 1", "🇫🇷", "Marseille", "Monaco", "Dom 20:00", 2.5, 3.2, 2.8),
    m("xb11", "Champions League", "⭐", "Barcelona", "Bayern Munich", "Mar 21:00", 2.3, 3.4, 3, false, void 0, void 0, [
      { name: "Más/Menos goles", options: [{ label: "+2.5", odds: 1.6 }, { label: "-2.5", odds: 2.25 }] },
      { name: "Ambos marcan", options: [{ label: "Sí", odds: 1.7 }, { label: "No", odds: 2.05 }] },
      { name: "Clasificado", options: [{ label: "Barcelona", odds: 2 }, { label: "Bayern", odds: 1.8 }] },
      { name: "Goleador", options: [{ label: "Lewandowski", odds: 2.8 }, { label: "Kane", odds: 3 }, { label: "Yamal", odds: 4 }] }
    ]),
    m("xb12", "Champions League", "⭐", "Man City", "Real Madrid", "Mié 21:00", 2.2, 3.5, 3.1),
    m("xb13", "Champions League", "⭐", "PSG", "Liverpool", "Mar 21:00", 2.4, 3.3, 2.9),
    m("xb14", "Champions League", "⭐", "Atletico Madrid", "Inter Milan", "Mié 21:00", 2.6, 3.2, 2.7),
    m("xb15", "Europa League", "🟠", "Man United", "Ajax", "Jue 21:00", 1.8, 3.5, 4.2),
    m("xb16", "Europa League", "🟠", "Roma", "Sevilla", "Jue 18:45", 2.1, 3.3, 3.4),
    m("xb17", "Copa África", "🌍", "Marruecos", "Senegal", "Sáb 20:00", 2.3, 3.2, 3),
    m("xb18", "Copa África", "🌍", "Egipto", "Nigeria", "Dom 18:00", 2.5, 3.1, 2.8),
    m("xb19", "CAF Champions League", "🌍", "Al Ahly", "Espérance Tunis", "Mar 20:00", 2, 3.3, 3.6),
    m("xb20", "Clasificación Mundial", "🌐", "Argentina", "Uruguay", "Jue 01:00", 1.8, 3.5, 4.5),
    m("xb21", "Clasificación Mundial", "🌐", "España", "Alemania", "Vie 20:45", 2.1, 3.3, 3.4)
  ] },
  { id: "baloncesto", label: "Baloncesto", icon: "🏀", matches: [
    m("xbb1", "NBA", "🇺🇸", "Denver Nuggets", "LA Lakers", "Hoy 03:00", 1.75, void 0, 2.1, true, "102-98", 45, [
      { name: "Total puntos", options: [{ label: "+218.5", odds: 1.9 }, { label: "-218.5", odds: 1.9 }] },
      { name: "Handicap", options: [{ label: "Nuggets -4.5", odds: 1.9 }, { label: "Lakers +4.5", odds: 1.9 }] }
    ]),
    m("xbb2", "NBA", "🇺🇸", "Miami Heat", "Chicago Bulls", "Hoy 01:30", 1.65, void 0, 2.3),
    m("xbb3", "NBA", "🇺🇸", "Brooklyn Nets", "Toronto Raptors", "Mañana 00:00", 1.8, void 0, 2.05),
    m("xbb4", "EuroLiga", "🇪🇺", "Anadolu Efes", "Maccabi Tel Aviv", "Jue 20:00", 1.65, void 0, 2.3)
  ] },
  { id: "tenis", label: "Tenis", icon: "🎾", matches: [
    m("xbt1", "ATP Masters 1000", "🎾", "Carlos Alcaraz", "Daniil Medvedev", "Hoy 16:00", 1.7, void 0, 2.2, [
      { name: "Sets", options: [{ label: "2-0", odds: 2.4 }, { label: "2-1", odds: 2.7 }, { label: "0-2", odds: 3.5 }, { label: "1-2", odds: 3.8 }] },
      { name: "Total games", options: [{ label: "+23.5", odds: 1.85 }, { label: "-23.5", odds: 1.9 }] }
    ]),
    m("xbt2", "Roland Garros", "🎾", "Rafael Nadal", "Novak Djokovic", "Mañana 14:00", 2.2, void 0, 1.65),
    m("xbt3", "Wimbledon", "🎾", "Carlos Alcaraz", "Jannik Sinner", "Sáb 15:00", 1.8, void 0, 2.05),
    m("xbt4", "WTA Finals", "🎾", "Iga Swiatek", "Aryna Sabalenka", "Dom 14:00", 1.65, void 0, 2.25)
  ] },
  { id: "rugby", label: "Rugby", icon: "🏉", matches: [
    m("xbr1", "Rugby Championship", "🏉", "Australia", "Argentina", "Dom 11:00", 1.8, void 0, 2.05),
    m("xbr2", "Six Nations", "🏉", "Escocia", "Italia", "Sáb 15:00", 1.55, void 0, 2.5)
  ] },
  { id: "mma", label: "MMA", icon: "🥋", matches: [
    m("xbm1", "UFC 311", "🥋", "Charles Oliveira", "Islam Makhachev", "Sáb 04:00", 2.5, void 0, 1.55, false, void 0, void 0, [
      { name: "Método", options: [{ label: "KO/TKO", odds: 3 }, { label: "Sumisión", odds: 2.5 }, { label: "Decisión", odds: 2.2 }] },
      { name: "Ronda", options: [{ label: "Ronda 1", odds: 3.5 }, { label: "Ronda 2", odds: 4 }, { label: "Ronda 3+", odds: 2 }] }
    ]),
    m("xbm2", "ONE Championship", "🥋", "Rodtang Jitmuangnon", "Demetrious Johnson", "Dom 14:00", 1.7, void 0, 2.2)
  ] },
  { id: "esports", label: "eSports", icon: "🎮", matches: [
    m("xbe1", "CS2 - Major", "🎮", "Team Liquid", "Cloud9", "Hoy 20:00", 1.8, void 0, 2.05),
    m("xbe2", "LoL - Worlds", "🎮", "T1", "JDG", "Mañana 09:00", 1.75, void 0, 2.1),
    m("xbe3", "Dota 2 - ESL One", "🎮", "Team Secret", "Evil Geniuses", "Sáb 18:00", 1.9, void 0, 1.95),
    m("xbe4", "Valorant", "🎮", "Fnatic", "NaVi", "Dom 17:00", 2, void 0, 1.85)
  ] },
  { id: "hockey", label: "Hockey", icon: "🏒", matches: [
    m("xbh1", "NHL", "🏒", "New York Rangers", "Pittsburgh Penguins", "Hoy 00:00", 1.85, void 0, 2),
    m("xbh2", "NHL", "🏒", "Tampa Bay Lightning", "Florida Panthers", "Mañana 01:00", 1.9, void 0, 1.95)
  ] },
  { id: "beisbol", label: "Béisbol", icon: "⚾", matches: [
    m("xbb1b", "MLB", "⚾", "New York Yankees", "LA Dodgers", "Hoy 00:10", 1.95, void 0, 1.88, true, "3-2 (7ª)", 0, [
      { name: "Total carreras", options: [{ label: "+8.5", odds: 1.9 }, { label: "-8.5", odds: 1.9 }] }
    ]),
    m("xbb2b", "MLB", "⚾", "Houston Astros", "Atlanta Braves", "Mañana 00:05", 1.8, void 0, 2.05)
  ] },
  { id: "voleibol", label: "Voleibol", icon: "🏐", matches: [
    m("xbv1", "Liga de Naciones", "🏐", "Brasil", "Polonia", "Sáb 20:00", 1.7, void 0, 2.2, [
      { name: "Sets", options: [{ label: "3-0", odds: 2.8 }, { label: "3-1", odds: 2.5 }, { label: "3-2", odds: 3.5 }, { label: "0-3", odds: 4.5 }] }
    ]),
    m("xbv2", "Liga de Naciones", "🏐", "Francia", "Italia", "Dom 18:00", 2, void 0, 1.85)
  ] }
];
const FORZA_CASINO = [
  { id: "aviator", name: "Aviator", icon: "✈️", provider: "Spribe", rtp: "97.0%", hot: true, type: "crash" },
  { id: "crash", name: "Crash", icon: "🚀", provider: "Spribe", rtp: "97.0%", hot: true, type: "crash" },
  { id: "mines", name: "Mines", icon: "💣", provider: "Spribe", rtp: "97.0%", hot: true, type: "crash" },
  { id: "plinko", name: "Plinko", icon: "🔵", provider: "Spribe", rtp: "97.0%", type: "crash" },
  { id: "dice", name: "Dice", icon: "🎲", provider: "Spribe", rtp: "98.0%", type: "crash" },
  { id: "olympus", name: "Gates of Olympus", icon: "⚡", provider: "Pragmatic Play", rtp: "96.5%", hot: true, type: "slots" },
  { id: "bonanza", name: "Sweet Bonanza", icon: "🍭", provider: "Pragmatic Play", rtp: "96.5%", hot: true, type: "slots" },
  { id: "bass", name: "Big Bass Bonanza", icon: "🎣", provider: "Pragmatic Play", rtp: "96.7%", type: "slots" },
  { id: "wolf", name: "Wolf Gold", icon: "🐺", provider: "Pragmatic Play", rtp: "96.0%", type: "slots" },
  { id: "book", name: "Book of Dead", icon: "📖", provider: "Play'n GO", rtp: "96.2%", type: "slots" },
  { id: "star", name: "Starburst", icon: "⭐", provider: "NetEnt", rtp: "96.1%", type: "slots" },
  { id: "ruleta", name: "Ruleta Europea", icon: "🎡", provider: "Evolution Gaming", rtp: "97.3%", hot: true, type: "live" },
  { id: "lightning", name: "Lightning Roulette", icon: "⚡", provider: "Evolution Gaming", rtp: "97.3%", hot: true, type: "live" },
  { id: "baccarat", name: "Baccarat en Vivo", icon: "🎴", provider: "Evolution Gaming", rtp: "98.9%", hot: true, type: "live" },
  { id: "crazy", name: "Crazy Time", icon: "🎪", provider: "Evolution Gaming", rtp: "96.1%", hot: true, type: "live" },
  { id: "monopoly", name: "Monopoly Live", icon: "🎩", provider: "Evolution Gaming", rtp: "96.2%", type: "live" },
  { id: "blackjack", name: "Blackjack VIP", icon: "🃏", provider: "Evolution Gaming", rtp: "99.5%", type: "table" },
  { id: "poker", name: "Casino Hold'em", icon: "♠️", provider: "Evolution Gaming", rtp: "97.8%", type: "table" }
];
const GELOTO_LOTTERY = [
  { id: "supermillones", name: "Super Millones GQ", icon: "💰", jackpot: "100,000,000 XAF", price: 1e3, draw: "Viernes 20:00", pickCount: 6, maxNum: 49 },
  { id: "nacional", name: "Lotería Nacional GQ", icon: "🎟️", jackpot: "50,000,000 XAF", price: 500, draw: "Sábados 20:00", pickCount: 6, maxNum: 49 },
  { id: "cemac", name: "Lotería CEMAC", icon: "🌍", jackpot: "500,000,000 XAF", price: 500, draw: "1er Sábado del mes", pickCount: 6, maxNum: 49 },
  { id: "loto649", name: "Loto 6/49", icon: "🎱", jackpot: "25,000,000 XAF", price: 300, draw: "Miércoles y Sábado", pickCount: 6, maxNum: 49 },
  { id: "keno", name: "Keno GQ", icon: "🔢", jackpot: "10,000,000 XAF", price: 100, draw: "Cada 5 minutos", pickCount: 10, maxNum: 80 },
  { id: "quiniela", name: "Quiniela Semanal", icon: "⚽", jackpot: "15,000,000 XAF", price: 500, draw: "Domingos 22:00", pickCount: 5, maxNum: 15 },
  { id: "bingo", name: "Bingo GQ", icon: "🎯", jackpot: "2,000,000 XAF", price: 200, draw: "Cada hora", pickCount: 5, maxNum: 75 },
  { id: "rasca", name: "Rasca y Gana", icon: "🪙", jackpot: "5,000,000 XAF", price: 200, draw: "Instantáneo", pickCount: 3, maxNum: 20 }
];
const COMPANIES = [
  { id: "africagames", name: "Africa Games", tagline: "Apuestas deportivas · GQ", color: "#16a34a", type: "sports", bonus: "50% primer depósito hasta 25,000 XAF", minBet: 200, minDeposit: 500, url: "https://africagames.gq", sports: AG_SPORTS },
  { id: "betomax", name: "Bettomax", tagline: "Leisure World Holdings · 5 países África", color: "#dc2626", type: "sports", bonus: "Apuesta 5,000 XAF → 1,000 gratis", minBet: 500, minDeposit: 1e3, url: "https://www.bettomax.com", sports: BT_SPORTS },
  { id: "1xbet", name: "1XBET", tagline: "Líder mundial · +60 deportes · +1000 mercados", color: "#1d4ed8", type: "sports", bonus: "100% primer depósito hasta 50,000 XAF", minBet: 200, minDeposit: 1e3, url: "https://1xbet.com/es", sports: XB_SPORTS },
  { id: "forza", name: "Forza Bet", tagline: "Casino online · GQ · Slots & Live", color: "#7c3aed", type: "casino", bonus: "100 giros gratis al registrarte", minBet: 200, minDeposit: 500, url: "https://forzabet.gq", casino: FORZA_CASINO },
  { id: "geloto", name: "Geloto GQ", tagline: "Lotería Oficial Guinea Ecuatorial", color: "#d97706", type: "lottery", bonus: "Rasca gratis al registrarte", minBet: 100, minDeposit: 500, url: "https://geloto.gq", lottery: GELOTO_LOTTERY }
];
const Logo = ({ id, size = 48 }) => {
  const r = Math.round(size * 0.22);
  const map = {
    africagames: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: size, height: size, viewBox: "0 0 100 100", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { width: "100", height: "100", rx: r, fill: "#16a34a" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M38 18C34 18 30 22 30 28L30 36C28 38 26 42 28 46C26 50 28 54 30 56L32 62C34 68 38 72 42 74C44 76 46 78 48 80C50 82 52 80 54 78C56 76 58 74 60 70L62 64C64 60 66 56 64 52C66 48 64 44 62 40L62 32C62 26 58 22 54 20C50 18 44 18 38 18Z", fill: "white", opacity: "0.9" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M50 30L52 36L58 36L53 40L55 46L50 42L45 46L47 40L42 36L48 36Z", fill: "#facc15" })
    ] }),
    betomax: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: size, height: size, viewBox: "0 0 100 100", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { width: "100", height: "100", rx: r, fill: "#dc2626" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "28", y: "20", width: "10", height: "60", rx: "3", fill: "white" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M38 20L54 20C61 20 67 25 67 33C67 39 63 43 57 44L38 44Z", fill: "white", opacity: "0.9" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M38 46L56 46C64 46 70 52 70 60C70 68 64 74 56 74L38 74Z", fill: "white", opacity: "0.9" })
    ] }),
    "1xbet": /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: size, height: size, viewBox: "0 0 100 100", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { width: "100", height: "100", rx: r, fill: "#1d4ed8" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: "14", y: "62", fill: "white", fontSize: "38", fontWeight: "900", fontFamily: "Arial Black,sans-serif", children: "1" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: "46", y: "62", fill: "#facc15", fontSize: "38", fontWeight: "900", fontFamily: "Arial Black,sans-serif", children: "X" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: "50", y: "82", textAnchor: "middle", fill: "white", fontSize: "10", fontWeight: "700", fontFamily: "Arial,sans-serif", letterSpacing: "2", children: "BET" })
    ] }),
    forza: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: size, height: size, viewBox: "0 0 100 100", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { width: "100", height: "100", rx: r, fill: "#7c3aed" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M58 15L35 52L50 52L42 85L68 45L52 45Z", fill: "white" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M58 15L35 52L50 52L42 85L68 45L52 45Z", fill: "#facc15", opacity: "0.4" })
    ] }),
    geloto: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: size, height: size, viewBox: "0 0 100 100", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { width: "100", height: "100", rx: r, fill: "#d97706" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "50", cy: "42", r: "26", fill: "white", opacity: "0.95" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: "50", y: "50", textAnchor: "middle", fill: "#d97706", fontSize: "20", fontWeight: "900", fontFamily: "Arial Black,sans-serif", children: "GQ" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: "50", y: "80", textAnchor: "middle", fill: "white", fontSize: "10", fontWeight: "700", fontFamily: "Arial,sans-serif", children: "GELOTO" })
    ] })
  };
  return map[id] || /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: size, height: size, viewBox: "0 0 100 100", children: /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { width: "100", height: "100", rx: r, fill: "#555" }) });
};
const OfficialBtn = ({ company }) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "fixed", bottom: "16px", left: "16px", right: "16px", zIndex: 100 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
  "button",
  {
    onClick: () => {
      const url = company.url;
      if (!url) return;
      try {
        if (window.require) {
          const { shell } = window.require("electron");
          shell.openExternal(url);
        } else {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      } catch {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    },
    style: { width: "100%", padding: "14px", background: "rgba(20,20,30,0.95)", border: `1px solid ${company.color}50`, borderRadius: "14px", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backdropFilter: "blur(10px)" },
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: company.color, strokeWidth: "2", strokeLinecap: "round", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "15 3 21 3 21 9" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "10", y1: "14", x2: "21", y2: "3" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: company.color }, children: [
        "Abrir ",
        company.name,
        " oficial"
      ] })
    ]
  }
) });
const ApuestasView = ({ onBack, userBalance, onDebit }) => {
  const [sel, setSel] = reactExports.useState(null);
  const [sportId, setSportId] = reactExports.useState("futbol");
  const [leagueFilter, setLeagueFilter] = reactExports.useState("Todos");
  const [betSlip, setBetSlip] = reactExports.useState([]);
  const [showSlip, setShowSlip] = reactExports.useState(false);
  const [result, setResult] = reactExports.useState(null);
  const [expandMkt, setExpandMkt] = reactExports.useState(null);
  const [casinoSel, setCasinoSel] = reactExports.useState(null);
  const [casinoAmt, setCasinoAmt] = reactExports.useState("");
  const [casinoRes, setCasinoRes] = reactExports.useState(null);
  const [lotSel, setLotSel] = reactExports.useState(null);
  const [lotNums, setLotNums] = reactExports.useState([]);
  const [lotRes, setLotRes] = reactExports.useState(null);
  const [rechAmt, setRechAmt] = reactExports.useState("");
  const [rechOk, setRechOk] = reactExports.useState(false);
  const [mainTab, setMainTab] = reactExports.useState("apostar");
  const ac = sel?.color || "#1d4ed8";
  const sport = sel?.sports?.find((s2) => s2.id === sportId);
  const leagues = sport ? ["Todos", ...Array.from(new Set(sport.matches.map((m2) => m2.league)))] : [];
  const visibleMatches = sport?.matches.filter((m2) => leagueFilter === "Todos" || m2.league === leagueFilter) ?? [];
  const totalStake = betSlip.reduce((s2, b) => s2 + (parseInt(b.stake) || 0), 0);
  const totalPayout = betSlip.reduce((s2, b) => s2 + Math.floor((parseInt(b.stake) || 0) * b.odds), 0);
  const addBet = (match, pick, odds) => {
    setBetSlip((prev) => {
      const ex = prev.findIndex((b) => b.id === match.id);
      const item = { id: match.id, matchLabel: `${match.home} vs ${match.away}`, pick, odds, stake: ex >= 0 ? prev[ex].stake : "" };
      if (ex >= 0) {
        const n = [...prev];
        n[ex] = item;
        return n;
      }
      return [...prev, item];
    });
  };
  const isSel = (id, pick) => betSlip.some((b) => b.id === id && b.pick === pick);
  const placeBets = () => {
    if (totalStake <= 0 || totalStake > userBalance) return;
    onDebit(totalStake);
    const win = Math.random() > 0.45;
    if (win) onDebit(-totalPayout);
    setResult({ win, payout: win ? totalPayout : 0 });
    setBetSlip([]);
    setShowSlip(false);
  };
  const playCasino = () => {
    const n = parseInt(casinoAmt);
    if (!n || n < (sel?.minBet || 200) || n > userBalance) return;
    onDebit(n);
    const mults = [0, 0, 0, 0.5, 1.5, 2, 3, 5, 10, 25];
    const mult = mults[Math.floor(Math.random() * mults.length)];
    const payout = Math.floor(n * mult);
    if (payout > 0) onDebit(-payout);
    setCasinoRes({ win: mult > 1, mult, payout });
    setCasinoAmt("");
  };
  const playLottery = () => {
    if (!lotSel || lotNums.length < lotSel.pickCount || lotSel.price > userBalance) return;
    onDebit(lotSel.price);
    const win = Math.random() > 0.8;
    const prizes = [500, 1e3, 2500, 5e3, 1e4, 5e4, 1e5];
    const prize = win ? prizes[Math.floor(Math.random() * prizes.length)] : 0;
    if (prize > 0) onDebit(-prize);
    setLotRes({ win, prize });
    setLotNums([]);
  };
  const goBack = () => {
    setSel(null);
    setBetSlip([]);
    setSportId("futbol");
    setLeagueFilter("Todos");
    setCasinoSel(null);
    setLotSel(null);
    setRechOk(false);
    setMainTab("apostar");
  };
  if (!sel) return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { height: "100%", background: "#0f0f13", display: "flex", flexDirection: "column", fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflow: "hidden" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "52px 16px 12px", flexShrink: 0 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onBack, style: { background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19 12H5M12 5l-7 7 7 7" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "18px", fontWeight: "800", color: "#fff" }, children: "Juegos & Apuestas" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.4)" }, children: "5 plataformas licenciadas" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.08)", borderRadius: "10px", padding: "5px 10px", textAlign: "right" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "9px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }, children: "SALDO" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "13px", fontWeight: "800", color: "#facc15" }, children: [
            userBalance.toLocaleString(),
            " XAF"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg,#1e3a8a,#7c3aed)", borderRadius: "16px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "32px" }, children: "🏆" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "800", color: "#fff" }, children: "+120 eventos en vivo ahora" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.6)" }, children: "Premier League · Champions · NBA · UFC · eSports" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, overflowY: "auto", padding: "8px 16px 80px" }, children: COMPANIES.map((co) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "10px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => {
            setSel(co);
            setSportId(co.sports?.[0]?.id || "futbol");
            setLeagueFilter("Todos");
          },
          style: { width: "100%", background: "#1a1a24", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px 16px 0 0", padding: "14px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "12px" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Logo, { id: co.id, size: 52 }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "15px", fontWeight: "800", color: "#fff" }, children: co.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: "rgba(0,200,160,0.15)", color: "#00c8a0", fontSize: "9px", fontWeight: "700", padding: "2px 6px", borderRadius: "6px" }, children: "✓ LICENCIADO" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }, children: co.tagline }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { background: co.color + "20", color: co.color, fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px" }, children: [
                "🎁 ",
                co.bonus
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "rgba(255,255,255,0.3)", strokeWidth: "2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "9 18 15 12 9 6" }) })
          ]
        }
      ),
      co.url && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => {
            try {
              if (window.require) {
                const { shell } = window.require("electron");
                shell.openExternal(co.url);
              } else {
                window.open(co.url, "_blank", "noopener,noreferrer");
              }
            } catch {
              window.open(co.url, "_blank", "noopener,noreferrer");
            }
          },
          style: { width: "100%", background: `linear-gradient(135deg, ${co.color}22, ${co.color}11)`, border: `1px solid ${co.color}40`, borderTop: "none", borderRadius: "0 0 16px 16px", padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: co.color, fontSize: "12px", fontWeight: "700" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "15 3 21 3 21 9" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "10", y1: "14", x2: "21", y2: "3" })
            ] }),
            "Abrir sitio oficial · ",
            co.url?.replace("https://", "")
          ]
        }
      )
    ] }, co.id)) })
  ] });
  if (sel.type === "sports") return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { height: "100%", background: "#0f0f13", display: "flex", flexDirection: "column", fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflow: "hidden" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#0f0f13", padding: "52px 16px 0", flexShrink: 0 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: goBack, style: { background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19 12H5M12 5l-7 7 7 7" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Logo, { id: sel.id, size: 34 }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "15px", fontWeight: "800", color: "#fff" }, children: sel.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "10px", color: "rgba(255,255,255,0.4)" }, children: sel.tagline })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.08)", borderRadius: "10px", padding: "5px 10px", textAlign: "right" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "9px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }, children: "SALDO" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "13px", fontWeight: "800", color: "#facc15" }, children: [
            userBalance.toLocaleString(),
            " XAF"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)" }, children: ["apostar", "recargar"].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setMainTab(t),
          style: { flex: 1, padding: "10px 0", background: "none", border: "none", borderBottom: `2px solid ${mainTab === t ? ac : "transparent"}`, color: mainTab === t ? ac : "rgba(255,255,255,0.4)", fontSize: "13px", fontWeight: 700, cursor: "pointer" },
          children: t === "apostar" ? "⚽ Apostar" : "💳 Recargar"
        },
        t
      )) })
    ] }),
    mainTab === "recargar" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, overflowY: "auto", padding: "16px 16px 80px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#1a1a24", borderRadius: "16px", padding: "16px", marginBottom: "12px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "13px", fontWeight: "700", color: "#fff", marginBottom: "12px" }, children: [
          "Recargar cuenta ",
          sel.name
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "number",
            value: rechAmt,
            onChange: (e) => setRechAmt(e.target.value),
            placeholder: `Mín. ${sel.minDeposit.toLocaleString()} XAF`,
            style: { width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff", fontSize: "16px", fontWeight: "800", outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: "10px" }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px", marginBottom: "12px" }, children: [1e3, 2500, 5e3, 1e4, 25e3, 5e4].map((v) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setRechAmt(String(v)), style: { padding: "8px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }, children: v.toLocaleString() }, v)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              const n = parseInt(rechAmt);
              if (n >= sel.minDeposit && n <= userBalance) {
                onDebit(n);
                setRechOk(true);
                setRechAmt("");
              }
            },
            style: { width: "100%", padding: "13px", background: ac, border: "none", borderRadius: "12px", color: "#fff", fontSize: "14px", fontWeight: "800", cursor: "pointer" },
            children: "Recargar con EGCHAT Wallet"
          }
        )
      ] }),
      rechOk && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(0,200,160,0.1)", border: "1px solid rgba(0,200,160,0.3)", borderRadius: "14px", padding: "16px", textAlign: "center" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "24px", marginBottom: "6px" }, children: "✅" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "14px", fontWeight: "800", color: "#00c8a0" }, children: "¡Recarga exitosa!" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(OfficialBtn, { company: sel })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", overflowX: "auto", padding: "10px 16px 6px", flexShrink: 0 }, children: sel.sports.map((sp) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => {
            setSportId(sp.id);
            setLeagueFilter("Todos");
          },
          style: { flexShrink: 0, padding: "7px 12px", borderRadius: "20px", border: "none", background: sportId === sp.id ? ac : "rgba(255,255,255,0.08)", color: sportId === sp.id ? "#fff" : "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 700, cursor: "pointer" },
          children: [
            sp.icon,
            " ",
            sp.label,
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { opacity: 0.6, fontSize: "10px" }, children: [
              "(",
              sp.matches.length,
              ")"
            ] })
          ]
        },
        sp.id
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", overflowX: "auto", padding: "0 16px 8px", flexShrink: 0 }, children: leagues.map((lg) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setLeagueFilter(lg),
          style: { flexShrink: 0, padding: "5px 10px", borderRadius: "12px", border: `1px solid ${leagueFilter === lg ? ac : "rgba(255,255,255,0.1)"}`, background: leagueFilter === lg ? ac + "20" : "transparent", color: leagueFilter === lg ? ac : "rgba(255,255,255,0.4)", fontSize: "10px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
          children: lg
        },
        lg
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, overflowY: "auto", padding: "0 16px 100px" }, children: [
        visibleMatches.some((m2) => m2.live) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" } }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "11px", fontWeight: "700", color: "#ef4444" }, children: [
            "EN VIVO — ",
            visibleMatches.filter((m2) => m2.live).length,
            " partidos"
          ] })
        ] }),
        visibleMatches.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,0.3)", fontSize: "13px" }, children: "No hay eventos disponibles" }),
        visibleMatches.map((match) => {
          const hasDraw = match.oddsX !== void 0;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#1a1a24", borderRadius: "14px", padding: "12px", marginBottom: "10px", border: match.live ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.05)" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }, children: [
                match.leagueIcon,
                " ",
                match.league
              ] }),
              match.live ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "10px", fontWeight: "800", color: "#ef4444", background: "rgba(239,68,68,0.15)", padding: "2px 7px", borderRadius: "6px" }, children: [
                "🔴 ",
                match.minute,
                "' ",
                match.score
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "10px", color: "rgba(255,255,255,0.4)" }, children: match.time })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "800", color: "#fff" }, children: match.home }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.3)", padding: "0 8px" }, children: "VS" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, textAlign: "right" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "800", color: "#fff" }, children: match.away }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: hasDraw ? "1fr 1fr 1fr" : "1fr 1fr", gap: "6px", marginBottom: match.markets ? "8px" : "0" }, children: [
              { key: "home", label: hasDraw ? "1" : match.home.split(" ")[0], val: match.odds1 },
              ...hasDraw ? [{ key: "draw", label: "X", val: match.oddsX }] : [],
              { key: "away", label: hasDraw ? "2" : match.away.split(" ")[0], val: match.odds2 }
            ].map((opt) => {
              const active = isSel(match.id, opt.key);
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => addBet(match, opt.key, opt.val),
                  style: { padding: "9px 6px", borderRadius: "10px", border: `1.5px solid ${active ? ac : "rgba(255,255,255,0.1)"}`, background: active ? ac + "25" : "rgba(255,255,255,0.04)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }, children: opt.label }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "14px", fontWeight: "900", color: active ? ac : "#fff" }, children: opt.val.toFixed(2) })
                  ]
                },
                opt.key
              );
            }) }),
            match.markets && match.markets.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setExpandMkt(expandMkt === match.id ? null : match.id),
                  style: { background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: "11px", cursor: "pointer", padding: "4px 0", fontWeight: 600 },
                  children: expandMkt === match.id ? "▲ Ocultar mercados" : `▼ +${match.markets.length} mercados`
                }
              ),
              expandMkt === match.id && match.markets.map((mkt) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "8px" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: 700, marginBottom: "5px", textTransform: "uppercase" }, children: mkt.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" }, children: mkt.options.map((opt) => {
                  const active = isSel(match.id, opt.label);
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      onClick: () => addBet(match, opt.label, opt.odds),
                      style: { padding: "6px 10px", borderRadius: "8px", border: `1px solid ${active ? ac : "rgba(255,255,255,0.1)"}`, background: active ? ac + "20" : "rgba(255,255,255,0.04)", cursor: "pointer", display: "flex", gap: "6px", alignItems: "center" },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "11px", color: "rgba(255,255,255,0.6)" }, children: opt.label }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "12px", fontWeight: "800", color: active ? ac : "#facc15" }, children: opt.odds.toFixed(2) })
                      ]
                    },
                    opt.label
                  );
                }) })
              ] }, mkt.name))
            ] })
          ] }, match.id);
        })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(OfficialBtn, { company: sel }),
    betSlip.length > 0 && !showSlip && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => setShowSlip(true),
        style: { position: "fixed", bottom: "72px", left: "50%", transform: "translateX(-50%)", background: ac, border: "none", borderRadius: "24px", padding: "12px 24px", color: "#fff", fontSize: "13px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", zIndex: 60 },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "900" }, children: betSlip.length }),
          "Boleto · ",
          totalPayout.toLocaleString(),
          " XAF posible"
        ]
      }
    ),
    showSlip && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "flex-end" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#1a1a24", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "80vh", overflow: "auto", padding: "20px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "16px", fontWeight: "800", color: "#fff" }, children: [
          "🎯 Boleto (",
          betSlip.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowSlip(false), style: { background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: "30px", height: "30px", color: "#fff", cursor: "pointer", fontSize: "16px" }, children: "✕" })
      ] }),
      betSlip.map((b, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "12px", marginBottom: "8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "6px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.5)" }, children: b.matchLabel }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "12px", fontWeight: "700", color: "#fff" }, children: [
              b.pick,
              " · ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#facc15" }, children: b.odds.toFixed(2) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setBetSlip((p) => p.filter((_, j) => j !== i)), style: { background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "16px" }, children: "✕" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "number",
            value: b.stake,
            onChange: (e) => setBetSlip((p) => p.map((x, j) => j === i ? { ...x, stake: e.target.value } : x)),
            placeholder: `Mín. ${sel.minBet.toLocaleString()} XAF`,
            style: { width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }
          }
        ),
        parseInt(b.stake) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "#00c8a0", marginTop: "3px" }, children: [
          "Ganancia: ",
          Math.floor(parseInt(b.stake) * b.odds).toLocaleString(),
          " XAF"
        ] })
      ] }, b.id)),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "12px", marginBottom: "12px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "4px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "12px", color: "rgba(255,255,255,0.5)" }, children: "Total apostado" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "12px", fontWeight: "800", color: "#fff" }, children: [
            totalStake.toLocaleString(),
            " XAF"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "12px", color: "rgba(255,255,255,0.5)" }, children: "Ganancia posible" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "14px", fontWeight: "900", color: "#facc15" }, children: [
            totalPayout.toLocaleString(),
            " XAF"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: placeBets,
          disabled: totalStake <= 0 || totalStake > userBalance,
          style: { width: "100%", padding: "14px", background: totalStake > 0 && totalStake <= userBalance ? ac : "rgba(255,255,255,0.1)", border: "none", borderRadius: "12px", color: "#fff", fontSize: "14px", fontWeight: "800", cursor: totalStake > 0 ? "pointer" : "not-allowed" },
          children: totalStake > userBalance ? "Saldo insuficiente" : `Confirmar · ${totalStake.toLocaleString()} XAF`
        }
      )
    ] }) }),
    result && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#1a1a24", borderRadius: "24px", padding: "32px 24px", textAlign: "center", maxWidth: "320px", width: "100%" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "56px", marginBottom: "12px" }, children: result.win ? "🏆" : "😔" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "22px", fontWeight: "900", color: result.win ? "#facc15" : "#ef4444", marginBottom: "8px" }, children: result.win ? "¡GANASTE!" : "Esta vez no" }),
      result.win && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "28px", fontWeight: "900", color: "#00c8a0", marginBottom: "8px" }, children: [
        result.payout.toLocaleString(),
        " XAF"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setResult(null), style: { width: "100%", padding: "13px", background: ac, border: "none", borderRadius: "12px", color: "#fff", fontSize: "14px", fontWeight: "800", cursor: "pointer", marginTop: "8px" }, children: "Continuar" })
    ] }) })
  ] });
  if (sel.type === "casino") return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { height: "100%", background: "#0f0f13", display: "flex", flexDirection: "column", fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflow: "hidden" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "52px 16px 12px", flexShrink: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: goBack, style: { background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19 12H5M12 5l-7 7 7 7" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Logo, { id: sel.id, size: 34 }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "15px", fontWeight: "800", color: "#fff" }, children: sel.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "10px", color: "rgba(255,255,255,0.4)" }, children: [
          "Casino Online · ",
          sel.casino.length,
          " juegos"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.08)", borderRadius: "10px", padding: "5px 10px", textAlign: "right" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "9px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }, children: "SALDO" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "13px", fontWeight: "800", color: "#facc15" }, children: [
          userBalance.toLocaleString(),
          " XAF"
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, overflowY: "auto", padding: "0 16px 80px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg,#4c1d95,#7c3aed)", borderRadius: "14px", padding: "14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "24px" }, children: "🎁" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "800", color: "#fff" }, children: sel.bonus }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.6)" }, children: [
            "Min. depósito: ",
            sel.minDeposit.toLocaleString(),
            " XAF"
          ] })
        ] })
      ] }),
      ["crash", "slots", "live", "table"].map((cat) => {
        const games = sel.casino.filter((g) => g.type === cat);
        if (!games.length) return null;
        const catLabel = { crash: "🚀 Crash & Instant", slots: "🎰 Slots", live: "🎥 Casino en Vivo", table: "🃏 Juegos de Mesa" };
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "16px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "700", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }, children: catLabel[cat] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }, children: games.map((g) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => {
                setCasinoSel(g);
                setCasinoRes(null);
              },
              style: { background: casinoSel?.id === g.id ? ac + "25" : "#1a1a24", border: `1.5px solid ${casinoSel?.id === g.id ? ac : "rgba(255,255,255,0.06)"}`, borderRadius: "14px", padding: "14px", cursor: "pointer", textAlign: "left", position: "relative" },
              children: [
                g.hot && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { position: "absolute", top: "8px", right: "8px", background: "#ef4444", color: "#fff", fontSize: "8px", fontWeight: "800", padding: "2px 5px", borderRadius: "6px" }, children: "HOT" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "28px", marginBottom: "6px" }, children: g.icon }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", fontWeight: "800", color: "#fff", marginBottom: "2px" }, children: g.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "10px", color: "rgba(255,255,255,0.4)", marginBottom: "3px" }, children: g.provider }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "10px", color: "#00c8a0", fontWeight: 700 }, children: [
                  "RTP ",
                  g.rtp
                ] })
              ]
            },
            g.id
          )) })
        ] }, cat);
      }),
      casinoSel && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#1a1a24", borderRadius: "16px", padding: "16px", marginTop: "8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "14px", fontWeight: "800", color: "#fff", marginBottom: "12px" }, children: [
          casinoSel.icon,
          " ",
          casinoSel.name
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "number",
            value: casinoAmt,
            onChange: (e) => setCasinoAmt(e.target.value),
            placeholder: `Mín. ${sel.minBet.toLocaleString()} XAF`,
            style: { width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff", fontSize: "16px", fontWeight: "800", outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: "10px" }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "6px", marginBottom: "12px" }, children: [500, 1e3, 2500, 5e3].map((v) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setCasinoAmt(String(v)), style: { flex: 1, padding: "7px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }, children: v.toLocaleString() }, v)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: playCasino, style: { width: "100%", padding: "13px", background: ac, border: "none", borderRadius: "12px", color: "#fff", fontSize: "14px", fontWeight: "800", cursor: "pointer" }, children: "🎰 Jugar ahora" }),
        casinoRes && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "12px", background: casinoRes.win ? "rgba(0,200,160,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${casinoRes.win ? "rgba(0,200,160,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: "12px", padding: "14px", textAlign: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "28px", marginBottom: "6px" }, children: casinoRes.win ? "🏆" : "😔" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "15px", fontWeight: "800", color: casinoRes.win ? "#00c8a0" : "#ef4444" }, children: casinoRes.win ? `×${casinoRes.mult} → ${casinoRes.payout.toLocaleString()} XAF` : "Sin suerte esta vez" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setCasinoRes(null), style: { marginTop: "8px", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "12px", cursor: "pointer" }, children: "Jugar de nuevo" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(OfficialBtn, { company: sel })
  ] });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { height: "100%", background: "#0f0f13", display: "flex", flexDirection: "column", fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflow: "hidden" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "52px 16px 12px", flexShrink: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: goBack, style: { background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19 12H5M12 5l-7 7 7 7" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Logo, { id: sel.id, size: 34 }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "15px", fontWeight: "800", color: "#fff" }, children: sel.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "10px", color: "rgba(255,255,255,0.4)" }, children: "Lotería Oficial Guinea Ecuatorial" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "rgba(255,255,255,0.08)", borderRadius: "10px", padding: "5px 10px", textAlign: "right" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "9px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }, children: "SALDO" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "13px", fontWeight: "800", color: "#facc15" }, children: [
          userBalance.toLocaleString(),
          " XAF"
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, overflowY: "auto", padding: "0 16px 80px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "linear-gradient(135deg,#78350f,#d97706)", borderRadius: "16px", padding: "16px", marginBottom: "14px", textAlign: "center" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "1px" }, children: "Bote acumulado" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "28px", fontWeight: "900", color: "#fff", margin: "4px 0" }, children: "100,000,000 XAF" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.6)" }, children: "Super Millones · Próximo sorteo: Viernes 20:00" })
      ] }),
      sel.lottery.map((g) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => {
            setLotSel(g);
            setLotNums([]);
            setLotRes(null);
          },
          style: { width: "100%", background: lotSel?.id === g.id ? ac + "20" : "#1a1a24", border: `1.5px solid ${lotSel?.id === g.id ? ac : "rgba(255,255,255,0.06)"}`, borderRadius: "14px", padding: "14px", marginBottom: "8px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "12px" },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "28px" }, children: g.icon }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "13px", fontWeight: "800", color: "#fff", marginBottom: "2px" }, children: g.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "10px", color: "#facc15", fontWeight: 700 }, children: [
                  "🏆 ",
                  g.jackpot
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: "10px", color: "rgba(255,255,255,0.4)" }, children: [
                  "🕐 ",
                  g.draw
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "right" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.4)" }, children: "Precio" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "13px", fontWeight: "800", color: ac }, children: [
                g.price.toLocaleString(),
                " XAF"
              ] })
            ] })
          ]
        },
        g.id
      )),
      lotSel && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#1a1a24", borderRadius: "16px", padding: "16px", marginTop: "8px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "14px", fontWeight: "800", color: "#fff", marginBottom: "4px" }, children: [
          lotSel.icon,
          " ",
          lotSel.name
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "10px" }, children: [
          "Elige ",
          lotSel.pickCount,
          " números del 1 al ",
          lotSel.maxNum
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "5px", marginBottom: "12px" }, children: Array.from({ length: Math.min(lotSel.maxNum, 49) }, (_, i) => i + 1).map((n) => {
          const picked = lotNums.includes(n);
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => {
                if (picked) setLotNums((p) => p.filter((x) => x !== n));
                else if (lotNums.length < lotSel.pickCount) setLotNums((p) => [...p, n]);
              },
              style: { aspectRatio: "1", borderRadius: "50%", border: `2px solid ${picked ? ac : "rgba(255,255,255,0.1)"}`, background: picked ? ac : "rgba(255,255,255,0.04)", color: picked ? "#fff" : "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: "800", cursor: "pointer" },
              children: n
            },
            n
          );
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "10px" }, children: [
          "Seleccionados (",
          lotNums.length,
          "/",
          lotSel.pickCount,
          "): ",
          [...lotNums].sort((a, b) => a - b).join(" · ") || "—"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: playLottery,
            disabled: lotNums.length < lotSel.pickCount,
            style: { width: "100%", padding: "13px", background: lotNums.length >= lotSel.pickCount ? ac : "rgba(255,255,255,0.1)", border: "none", borderRadius: "12px", color: "#fff", fontSize: "14px", fontWeight: "800", cursor: lotNums.length >= lotSel.pickCount ? "pointer" : "not-allowed" },
            children: [
              "🎟️ Comprar boleto · ",
              lotSel.price.toLocaleString(),
              " XAF"
            ]
          }
        ),
        lotRes && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: "12px", background: lotRes.win ? "rgba(250,204,21,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${lotRes.win ? "rgba(250,204,21,0.4)" : "rgba(239,68,68,0.3)"}`, borderRadius: "12px", padding: "16px", textAlign: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "32px", marginBottom: "8px" }, children: lotRes.win ? "🎉" : "😔" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "16px", fontWeight: "900", color: lotRes.win ? "#facc15" : "#ef4444" }, children: lotRes.win ? `¡Premio! ${lotRes.prize.toLocaleString()} XAF` : "Sin premio esta vez" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setLotRes(null), style: { marginTop: "8px", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "12px", cursor: "pointer" }, children: "Jugar de nuevo" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(OfficialBtn, { company: sel })
  ] });
};
export {
  ApuestasView
};
