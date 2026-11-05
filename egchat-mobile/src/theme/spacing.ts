// EGCHAT Spacing System
// Extraído del design system web (index.css padding/margin/gap)

export const Spacing = {
  // Base units
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,

  // Específicos por componente (extraídos del CSS)
  listItemPaddingV: 12,   // .eg-list-item padding vertical
  listItemPaddingH: 16,   // .eg-list-item padding horizontal
  listItemGap: 12,        // gap entre avatar y texto
  inputPaddingV: 10,      // .eg-input padding vertical
  inputPaddingH: 14,      // .eg-input padding horizontal
  buttonPaddingV: 12,     // .eg-btn-primary padding vertical
  buttonPaddingH: 20,     // .eg-btn-primary padding horizontal
  cardPadding: 16,        // padding interno de cards
  screenPadding: 20,      // padding lateral de pantallas
  sectionTitlePaddingT: 12,
  sectionTitlePaddingB: 6,
  chatInputBarPadding: 8,
  chatInputBarGap: 8,
  bubblePaddingV: 8,
  bubblePaddingH: 12,
} as const;

export const BorderRadius = {
  sm: 8,    // --radius-sm
  md: 12,   // --radius-md — inputs, botones
  lg: 16,   // --radius-lg — cards
  xl: 20,   // --radius-xl — modales, sheets
  '2xl': 24,
  '3xl': 32,
  full: 999, // circular

  // Burbujas de chat
  bubbleOwn: {
    topLeft: 18,
    topRight: 18,
    bottomLeft: 18,
    bottomRight: 4,
  },
  bubbleOther: {
    topLeft: 18,
    topRight: 18,
    bottomLeft: 4,
    bottomRight: 18,
  },

  // Otros
  avatar: 999,   // circular
  badge: 10,
  proIcon: 20,
  sheet: 20,     // bottom sheet top corners
} as const;

import { Platform } from 'react-native';

// Helper: genera shadow compatible con web (boxShadow) y nativo (shadow*)
const makeShadow = (
  x: number, y: number, blur: number, opacity: number, elevation: number
) => Platform.OS === 'web'
  ? { boxShadow: `${x}px ${y}px ${blur}px rgba(0,0,0,${opacity})` }
  : {
      shadowColor: '#000',
      shadowOffset: { width: x, height: y },
      shadowOpacity: opacity,
      shadowRadius: blur,
      elevation,
    };

export const Shadow = {
  sm:      makeShadow(0, 1,  3,  0.06, 1),
  md:      makeShadow(0, 2,  8,  0.08, 3),
  lg:      makeShadow(0, 4,  16, 0.10, 5),
  bubble:  makeShadow(0, 1,  2,  0.08, 1),
  proIcon: makeShadow(0, 4,  16, 0.12, 4),
} as const;
