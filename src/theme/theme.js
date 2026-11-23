/**
 * Habitime Design Tokens & Theme Specification
 * Direct React Native implementation based on DESIGN.md
 */

export const THEME = {
  colors: {
    // Tuval ve Baz
    canvas: '#FFFFFF',
    textMain: '#000000',
    surfaceMuted: '#F8FAFC',
    borderSubtle: '#E2E8F0',

    // Yaşayan Maskot / Gelişim (Elma Yeşili)
    living: {
      card: '#7ED957',
      container: '#A8F368',
      track: '#00BF63',
      fill: '#C7F974',
      text: '#000000',
      accent: '#15803D',
    },

    // Su / Hidrasyon (Pastel Gökyüzü Camgöbeği)
    water: {
      card: '#99E5F2',
      circle: '#00C2CB',
      track: '#003B73',
      fill: '#38BDF8',
      text: '#000000',
      badgeBg: '#56CFE1',
      badgeText: '#003B73',
      percent: '#0096C7',
    },

    // İlaç / Sağlık (Pastel Mercan Gül)
    medication: {
      card: '#F8A5A5',
      circle: '#F87171',
      track: '#881337',
      fill: '#FF6B6B',
      text: '#000000',
      badgeBg: '#F87171',
      badgeText: '#450A0A',
      badgeOrange: '#FB923C',
      badgeOrangeText: '#7C2D12',
      percent: '#F59E0B',
    },

    // Aksiyon Butonları (Kanıtla & Ertele)
    action: {
      yellow: '#FFD166',
      yellowHover: '#FCCE4E',
      textOrange: '#FF8500',
      textBrown: '#78350F',
      textDark: '#451A03',
    },

    // Rozetler & Chrome Vurguları
    badges: {
      purpleBg: '#E0AAFF',
      purpleText: '#7E22CE',
      orangeBg: '#FB923C',
      orangeText: '#7C2D12',
      cyan: '#00C2CB',
      gold: '#F59E0B',
    },
  },

  typography: {
    displayTitle: {
      fontSize: 28,
      fontWeight: '900',
      color: '#000000',
      letterSpacing: -0.5,
    },
    cardHeadline: {
      fontSize: 22,
      fontWeight: '900',
      color: '#000000',
      letterSpacing: 0.8,
    },
    metricLabel: {
      fontSize: 14,
      fontWeight: '800',
      color: '#000000',
    },
    actionButton: {
      fontSize: 16,
      fontWeight: '900',
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '800',
    },
    percentText: {
      fontSize: 15,
      fontWeight: '900',
    },
    microLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: '#000000',
    },
  },

  radii: {
    card: 28,
    container: 20,
    pill: 9999,
    circle: 9999,
    bar: 9999,
  },

  spacing: {
    gutter: 16,
    cardGap: 16,
    cardPadding: 18,
    badgeGap: 8,
    rowGap: 12,
  },

  shadows: {
    soft: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    action: {
      shadowColor: '#FF8500',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
  },
};

export default THEME;
