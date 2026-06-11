/**
 * 🎨 Modern Theme System for Web
 * Temiz Dünya Web Platform
 */

export const colors = {
  // Primary Colors
  primary: '#1B6E4F',      // Derin Yeşil
  primaryLight: '#2ECC71', // Canlı Yeşil
  primaryDark: '#0F4C35',  // Koyu Yeşil
  
  // Secondary Colors
  secondary: '#4ECDC4',    // Turkuaz
  tertiary: '#FFE66D',     // Canlı Sarı
  accent: '#FF6B6B',       // Dinamik Kırmızı
  
  // Status Colors
  success: '#51CF66',      // Başarı Yeşili
  warning: '#FFA94D',      // Uyarı Sarısı
  error: '#FF6B6B',        // Hata Kırmızısı
  info: '#4ECDC4',         // Bilgi Turkuazı
  
  // Neutral Colors
  white: '#FFFFFF',
  dark: '#0F1419',
  light: '#F8FAFC',
  lightBg: '#F5F5F5',
  cardBg: '#FFFFFF',
  
  // Text Colors
  text: {
    primary: '#2D3E50',
    secondary: '#7A8A99',
    tertiary: '#ABB3BF',
    light: '#E8EAED',
  },
  
  // Borders
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
};

export const typography = {
  fonts: {
    primary: "'Poppins', sans-serif",
    mono: "'Monaco', 'Courier New', monospace",
  },
  sizes: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
  },
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
  base: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
};

export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

export const transitions = {
  fast: '200ms ease-in-out',
  base: '300ms ease-in-out',
  slow: '500ms ease-in-out',
};

// Gradient Presets
export const gradients = {
  primary: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
  success: `linear-gradient(135deg, ${colors.success} 0%, ${colors.primaryLight} 100%)`,
  warning: `linear-gradient(135deg, ${colors.warning} 0%, ${colors.tertiary} 100%)`,
  error: `linear-gradient(135deg, ${colors.error} 0%, ${colors.accent} 100%)`,
  cool: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.info} 100%)`,
};

export const theme = {
  colors,
  typography,
  shadows,
  spacing,
  radius,
  transitions,
  gradients,
};

export default theme;
