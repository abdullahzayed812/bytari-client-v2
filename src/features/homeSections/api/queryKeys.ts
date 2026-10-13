export const homeSectionKeys = {
  all: ['home-sections'] as const,
  list: () => [...homeSectionKeys.all, 'list'] as const,
  adminList: () => [...homeSectionKeys.all, 'admin'] as const,
};
