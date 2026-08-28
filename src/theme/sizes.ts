/** Fixed component dimensions. Keeps touch targets and control heights consistent. */
export const sizes = {
  /** Minimum accessible touch target (WCAG / platform guidance). */
  touchTarget: 44,

  controlHeightSm: 36,
  controlHeightMd: 48,
  controlHeightLg: 56,

  iconXs: 14,
  iconSm: 18,
  iconMd: 22,
  iconLg: 28,
  iconXl: 36,

  avatarSm: 32,
  avatarMd: 44,
  avatarLg: 64,
  avatarXl: 96,

  tabBarHeight: 64,
  tabBarHomeButton: 60,
  headerHeight: 56,

  bannerHeight: 168,
  hairline: 1,
} as const;

export type SizeToken = keyof typeof sizes;
