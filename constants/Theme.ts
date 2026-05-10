/**
 * Extracted Theme Properties from Stitch Design Files
 */

export const Typography = {
  fontFamily: {
    headline: 'Inter',
    body: 'Inter',
    label: 'Inter',
    default: 'Inter',
  },
};

export const BorderRadius = {
  default: 2,  // 0.125rem
  lg: 4,       // 0.25rem
  xl: 8,       // 0.5rem
  full: 12,    // 0.75rem
  pill: 9999,  // commonly used for actual full rounded corners
};

export const Spacing = {
  // Extracted based on typical Tailwind spacing scale used in the design
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Theme = {
  typography: Typography,
  borderRadius: BorderRadius,
  spacing: Spacing,
};

import { Platform } from 'react-native';

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
