import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/content';

import { PUBLICATION_KIND_TONE } from '../constants';
import type { PublicationKind } from '../types';

interface Props {
  kind: PublicationKind;
  size?: 'sm' | 'md';
}

/** Localised Lost / Adoption / Mating pill. */
export function PublicationKindBadge({ kind, size = 'sm' }: Props) {
  const { t } = useTranslation('publications');
  return <Badge label={t(`kind.${kind}`)} tone={PUBLICATION_KIND_TONE[kind]} size={size} />;
}
