// Kanta design tokens, taken from the MixPlay design system page (docs/design/MixPlay-reference.pdf).
import type { Source } from '../modules/kanta-media/src/types';

export const colors = {
  primary: '#A855F7',
  accent: '#6826F5',
  background: '#08090E',
  surface: '#24222E',
  surfaceRaised: '#2E2B3A',
  surfaceSunken: '#15141C',
  text: '#F8F6FC',
  textMuted: 'rgba(248,246,252,0.6)',
  textFaint: 'rgba(248,246,252,0.38)',
  border: 'rgba(168,85,247,0.35)',
  danger: '#F87171',
  source: {
    spotify: '#1DB954',
    ytmusic: '#FF0033',
    applemusic: '#FA2D48',
    local: '#A855F7',
  } satisfies Record<Source, string>,
};

/** 4 / 8 / 12 / 16 / 24 / 32 */
export const space = [4, 8, 12, 16, 24, 32] as const;
export const s = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 12, md: 16, lg: 24, xl: 32 } as const;

export const fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

export const type = {
  display: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, color: colors.text },
  heading: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 28, color: colors.text },
  title: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.text },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.text },
  caption: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, color: colors.textMuted },
} as const;

export const icon = { size: 20, stroke: 1.8 } as const;

export const gradient = {
  primary: [colors.primary, colors.accent] as [string, string],
  hero: ['#7C3AED', '#3B1475'] as [string, string],
  art: ['#9333EA', '#4C1D95'] as [string, string],
};
