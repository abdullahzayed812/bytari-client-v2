import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Select } from '@/components/forms';
import { Caption } from '@/components/typography';
import type { FarmBatchKind, FarmBatchLinkInput } from '@/features/farm/types';
import { useTheme } from '@/theme';

import { useActiveFarmBatches } from '../hooks';

/** Picker value for "no batch" (a farm-wide row). */
const NONE = '__none__';

/** The request field that carries a link of this batch kind. */
const LINK_KEY: Record<FarmBatchKind, keyof FarmBatchLinkInput> = {
  POULTRY: 'poultryFlockId',
  SHEEP: 'sheepBatchId',
  CATTLE: 'cattleBatchId',
};

/** `{ poultryFlockId: id }` / `{ sheepBatchId: id }` / … — or `{}` for a farm-wide row. */
export function batchLinkInput(kind: FarmBatchKind, batchId: string | null): FarmBatchLinkInput {
  return batchId ? { [LINK_KEY[kind]]: batchId } : {};
}

/**
 * Optional "الدفعة" picker for a manual expense / appointment: one of the
 * farm's ACTIVE batches, or farm-wide. Selling the chosen batch permanently
 * deletes the row (server-side), which the hint says.
 */
export function FarmBatchSelect({
  organizationId,
  kind,
  value,
  onChange,
}: {
  organizationId: string;
  kind: FarmBatchKind;
  value: string | null;
  onChange: (batchId: string | null) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const batches = useActiveFarmBatches(organizationId, kind);

  return (
    <View style={{ rowGap: theme.spacing.xs }}>
      <Select<string>
        label={t('expenses.batchField')}
        placeholder={t('expenses.batchNone')}
        value={value ?? NONE}
        disabled={batches.isLoading}
        options={[
          { value: NONE, label: t('expenses.batchNone') },
          ...(batches.data ?? []).map((b) => ({
            value: b.id,
            label: b.batchNumber != null ? `${b.name} (#${b.batchNumber})` : b.name,
          })),
        ]}
        onChange={(v) => onChange(v === NONE ? null : v)}
      />
      <Caption>{t('expenses.batchHint')}</Caption>
    </View>
  );
}
