export const homeSectionKeys = {
  all: ['home-sections'] as const,
  list: () => [...homeSectionKeys.all, 'list'] as const,
  adminList: () => [...homeSectionKeys.all, 'admin'] as const,
  featured: (placement: string) => [...homeSectionKeys.all, 'featured', placement] as const,
  adminFeatured: () => [...homeSectionKeys.all, 'admin-featured'] as const,
};
