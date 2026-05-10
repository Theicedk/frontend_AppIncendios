/**
 * Extracted Color Palette from Stitch Design Files (Material Design 3 tokens)
 */

export const Colors = {
  // Primary Palette
  primary: '#af101a',
  onPrimary: '#ffffff',
  primaryContainer: '#d32f2f',
  onPrimaryContainer: '#fff2f0',
  inversePrimary: '#ffb3ac',

  // Secondary Palette
  secondary: '#005faf',
  onSecondary: '#ffffff',
  secondaryContainer: '#54a0fe',
  onSecondaryContainer: '#003567',

  // Tertiary Palette
  tertiary: '#8b4400',
  onTertiary: '#ffffff',
  tertiaryContainer: '#b05700',
  onTertiaryContainer: '#fff2eb',

  // Error Palette
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  // Background and Surface
  background: '#f9f9fa',
  onBackground: '#1a1c1d',
  surface: '#f9f9fa',
  onSurface: '#1a1c1d',
  surfaceVariant: '#e2e2e3',
  onSurfaceVariant: '#5b403d',
  surfaceTint: '#ba1a20',
  inverseSurface: '#2f3132',
  inverseOnSurface: '#f0f1f1',

  // Additional
  outline: '#8f6f6c',
  outlineVariant: '#e4beba',

  // React Native Expo specific light/dark adaptations
  light: {
    text: '#1a1c1d', // onBackground
    background: '#f9f9fa',
    tint: '#af101a', // primary
    icon: '#5b403d', // onSurfaceVariant
    tabIconDefault: '#5b403d',
    tabIconSelected: '#af101a',
  },
  dark: {
    text: '#f0f1f1', // inverseOnSurface
    background: '#2f3132', // inverseSurface
    tint: '#ffb3ac', // inversePrimary
    icon: '#e2e2e3', // surfaceVariant
    tabIconDefault: '#e2e2e3',
    tabIconSelected: '#ffb3ac',
  },
};
