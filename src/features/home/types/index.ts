/**
 * Home ad contract — mirrors the backend EXACTLY
 * (`server/src/modules/homeAds/domain/home-ad.types.ts` `HomeAdDTO`). No
 * invented fields. `imageUrl` is server-resolved (public R2 URL or a signed
 * fallback) — the client never builds it.
 */
export interface HomeAd {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
