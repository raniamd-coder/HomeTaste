export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  primary: string;
  danger: string;
  highlight: string;
};

export const lightColors: ThemeColors = {
  // Soft, warm palette (orange / light yellow / light beige / white)
  background: '#FFF7ED',
  surface: '#FFFFFF',
  text: '#7C2D12',
  mutedText: '#9A3412',
  border: '#FED7AA',
  primary: '#F97316',
  danger: '#DC2626',
  highlight: '#FDE68A',
};

export const darkColors: ThemeColors = {
  // Dark warm palette (keeps orange accent)
  background: '#0C0A09',
  surface: '#1C1917',
  text: '#FFEDD5',
  mutedText: '#FED7AA',
  border: '#292524',
  primary: '#FB923C',
  danger: '#EF4444',
  highlight: '#A16207',
};

export function getColors(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? darkColors : lightColors;
}

// Backward-compatible default export for older imports (light mode)
export const colors = lightColors;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
};
