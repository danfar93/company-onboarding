/**
 * Seapoint design tokens.
 *
 * A single source of truth for colour, spacing, radius, typography and
 * elevation, modelled on the seapoint.co brand: a clean, modern fintech look
 * — strong brand blue, a green success accent, white surfaces on a light-grey
 * canvas, charcoal text, flat shapes with soft shadows.
 *
 * Screens should reference these tokens rather than hard-coding values, so the
 * whole app restyles from one place.
 */

/**
 * Values below are taken directly from the seapoint.co design tokens
 * (their CSS custom properties, light theme). Seapoint's identity is warm and
 * indigo-led — a periwinkle primary on a warm off-white canvas with cream
 * muted surfaces — not the cool blue/grey of a generic SaaS theme.
 */
export const colors = {
  // Brand (--primary / --ring)
  brand: '#595FFF', // Seapoint indigo — primary actions, focus, links
  brandDark: '#4A50E6', // pressed / hover
  brandTint: '#DCD7FC', // washed brand background (chips, highlights)
  brandDisabled: '#BFC1FA', // disabled primary button

  // Accent (success / positive) — from brand chart palette
  accent: '#009588', // teal-green
  accentTint: '#E3F4F1',
  accentDark: '#00776C',

  // Warm decorative tones (illustration / highlight accents)
  peach: '#F7C49D',
  cream: '#F6E9DF',
  lavender: '#DCD7FC',

  // Surfaces
  background: '#FBFAF9', // warm off-white app canvas (--background)
  surface: '#FFFFFF', // cards, inputs (--card / --input)
  surfaceAlt: '#F6F3EF', // muted warm cream (--muted / --accent)

  // Text
  textPrimary: '#2B2A3F', // indigo-charcoal (--foreground)
  textSecondary: '#676677', // (--muted-foreground)
  textMuted: '#9C9AAB',
  textInverse: '#FAFAFB', // (--primary-foreground)

  // Lines
  border: '#E6E1DC', // warm border (--border)
  borderStrong: '#D8D2CB',

  // Status
  danger: '#E40014', // (--destructive)
  dangerTint: '#FDECEE',
  dangerBorder: '#F7C6CB',
  warning: '#F9730C', // (--highlight)
  warningTint: '#FEF0E6',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

/**
 * Reusable text styles. fontWeight values are string literals so they satisfy
 * React Native's TextStyle typing when spread into StyleSheet.create.
 */
export const typography = {
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: colors.textPrimary },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: colors.textPrimary },
  title: { fontSize: 17, lineHeight: 22, fontWeight: '600', color: colors.textPrimary },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400', color: colors.textPrimary },
  subtitle: { fontSize: 15, lineHeight: 21, fontWeight: '400', color: colors.textSecondary },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '500', color: colors.textSecondary },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', color: colors.textMuted },
  button: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
} as const;

/**
 * Soft card elevation. iOS uses shadow*, Android uses elevation; both are set
 * so the look is consistent across platforms.
 */
export const shadow = {
  card: {
    shadowColor: '#2B2A3F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

export const theme = { colors, spacing, radius, typography, shadow } as const;

export type Theme = typeof theme;
