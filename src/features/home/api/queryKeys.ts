export const homeAdKeys = {
  all: ['homeAds'] as const,
  list: () => [...homeAdKeys.all, 'list'] as const,
};
