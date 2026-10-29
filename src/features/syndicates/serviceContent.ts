import type { TFunction } from 'i18next';

import type {
  SyndicateContentSection,
  SyndicateServiceContent,
  SyndicateServiceItem,
  SyndicateServiceKey,
} from './types';

/** Services with an internal content page (the server accepts `content` only for these). */
export const CONTENT_SERVICE_KEYS = ['ID_CARD', 'LEGAL_SUPPORT', 'OFFICE_LICENSES'] as const;
export type ContentServiceKey = (typeof CONTENT_SERVICE_KEYS)[number];

export function hasContentPage(key: SyndicateServiceKey): key is ContentServiceKey {
  return (CONTENT_SERVICE_KEYS as readonly string[]).includes(key);
}

type T = TFunction<'syndicates'>;

const section = (
  t: T,
  id: string,
  titleKey: string,
  itemKeys: string[],
  style: SyndicateContentSection['style'] = 'CHECK',
): SyndicateContentSection => ({
  id,
  title: t(titleKey as never),
  style,
  items: itemKeys.map((k, i) => ({ id: `${id}-${i + 1}`, text: t(k as never) })),
});

const keys = (prefix: string, n: number): string[] =>
  Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);

/**
 * The built-in page content (what every syndicate shows until a manager edits
 * it) — the same i18n text the pages always rendered, as one document, so
 * the page and the editor share a single shape.
 */
export function defaultServiceContent(key: ContentServiceKey, t: T): SyndicateServiceContent {
  switch (key) {
    case 'ID_CARD':
      return {
        heading: t('idRequirements.requirements'),
        body: null,
        sections: [
          section(t, 'new', 'idRequirements.newTitle', keys('idRequirements.newItem', 5)),
          section(t, 'renew', 'idRequirements.renewTitle', keys('idRequirements.renewItem', 4)),
        ],
        footnote: t('idRequirements.processingTime'),
        note: t('idRequirements.note'),
      };
    case 'OFFICE_LICENSES':
      return {
        heading: t('officeLicenses.requirements'),
        body: null,
        sections: [
          section(t, 'new', 'officeLicenses.newTitle', keys('officeLicenses.newItem', 5)),
          section(t, 'renew', 'officeLicenses.renewTitle', keys('officeLicenses.renewItem', 3)),
        ],
        footnote: t('officeLicenses.processingTime'),
        note: t('officeLicenses.note'),
      };
    case 'LEGAL_SUPPORT':
      return {
        heading: t('legalSupport.serviceInfo'),
        body: t('legalSupport.description'),
        sections: [
          section(
            t,
            'includes',
            'legalSupport.includesTitle',
            keys('legalSupport.includesItem', 4),
          ),
          section(t, 'notes', 'legalSupport.notesTitle', keys('legalSupport.notesItem', 3), 'NOTE'),
        ],
        footnote: null,
        note: null,
      };
  }
}

/** The syndicate's saved content for the page, else the built-in one. */
export function resolveServiceContent(
  service: SyndicateServiceItem | undefined,
  key: ContentServiceKey,
  t: T,
): SyndicateServiceContent {
  return service?.content ?? defaultServiceContent(key, t);
}
