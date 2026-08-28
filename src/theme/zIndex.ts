/** Stacking order for overlays. Keep every elevated surface on this scale. */
export const zIndex = {
  base: 0,
  header: 10,
  tabBar: 10,
  dropdown: 100,
  sticky: 200,
  banner: 300,
  overlay: 1000,
  modal: 1100,
  toast: 1200,
  tooltip: 1300,
} as const;

export type ZIndexToken = keyof typeof zIndex;
