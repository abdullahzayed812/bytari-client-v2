import type { BadgeTone, IconName } from '@/components/content';

import type { ContentFileKind, ContentType, ContentTypeSlug } from './types';

/** Content type → line icon + URL slug + badge tone. */
export const CONTENT_TYPE_META: Record<
  ContentType,
  { icon: IconName; slug: ContentTypeSlug; tone: BadgeTone }
> = {
  ARTICLE: { icon: 'document-text-outline', slug: 'articles', tone: 'info' },
  BOOK: { icon: 'book-outline', slug: 'books', tone: 'success' },
  MAGAZINE: { icon: 'newspaper-outline', slug: 'magazines', tone: 'warning' },
};

export const CONTENT_TYPE_ORDER: readonly ContentType[] = ['ARTICLE', 'MAGAZINE', 'BOOK'];

const SLUG_TO_TYPE: Record<ContentTypeSlug, ContentType> = {
  articles: 'ARTICLE',
  books: 'BOOK',
  magazines: 'MAGAZINE',
};

export function contentTypeFromSlug(slug: string | undefined): ContentType | undefined {
  if (!slug) return undefined;
  return SLUG_TO_TYPE[slug as ContentTypeSlug];
}

export function contentTypeSlug(type: ContentType): ContentTypeSlug {
  return CONTENT_TYPE_META[type].slug;
}

/** File-kind → icon (used in the files list on the detail screen). */
export const CONTENT_FILE_KIND_ICON: Record<ContentFileKind, IconName> = {
  MAIN: 'reader-outline',
  COVER: 'image-outline',
  ATTACHMENT: 'attach-outline',
};

/**
 * MIME types the OS can render when handed the backend-authorized URL
 * (`Linking.openURL`). Everything the backend's `ALLOWED_MIME` permits is here;
 * anything else falls back to a plain "open externally" affordance (§10).
 */
export const VIEWABLE_MIME = new Set<string>([
  'application/pdf',
  'application/epub+zip',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

export function isViewableMime(mimeType: string | null | undefined): boolean {
  return mimeType != null && VIEWABLE_MIME.has(mimeType);
}

/** Short human label for a MIME type (falls back to the raw type). */
export function mimeLabel(mimeType: string): string {
  switch (mimeType) {
    case 'application/pdf':
      return 'PDF';
    case 'application/epub+zip':
      return 'EPUB';
    case 'image/png':
    case 'image/jpeg':
    case 'image/webp':
      return mimeType.replace('image/', '').toUpperCase();
    default:
      return mimeType;
  }
}

/** Presentation-only byte formatting. Never used for any request. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = unit === 0 ? value : Math.round(value * 10) / 10;
  return `${rounded} ${units[unit]}`;
}
