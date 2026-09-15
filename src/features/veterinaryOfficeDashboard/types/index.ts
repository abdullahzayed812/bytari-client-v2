/**
 * Veterinary Office Dashboard contract. Mirrors the backend EXACTLY —
 * `server/src/modules/veterinary-office/application/veterinary-office-dashboard.service.ts`
 * (stats summary) and `server/src/modules/organizations/application/organization-broadcast.service.ts`
 * (follower broadcast, generic across organization types). No invented fields.
 *
 *   GET  /organizations/:organizationId/office-dashboard/summary
 *   POST /organizations/:organizationId/broadcast/image-upload-url
 *   POST /organizations/:organizationId/broadcast
 */

export interface VeterinaryOfficeDashboardSummary {
  productsCount: number;
  followersCount: number;
  rating: number | null;
  reviewsCount: number;
  /** Always `0` — no orders/checkout system exists yet for office products (catalog-only). */
  salesCount: number;
}

export interface SendFollowerBroadcastInput {
  title: string;
  body: string;
  imageStorageKey?: string | null;
}

export interface BroadcastImageUploadUrlInput {
  filename: string;
  mimeType: string;
  size: number;
}

export interface BroadcastImageUploadUrlResult {
  storageKey: string;
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresInSeconds: number;
}
