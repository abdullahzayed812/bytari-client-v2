import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ImageUploader } from '@/components/media';
import { Caption, Label } from '@/components/typography';
import type { VeterinarianDocumentKind } from '@/features/veterinarian';
import { useTheme } from '@/theme';

import { useVeterinarianDocumentPresignProvider } from '../hooks';
import type { DocumentRef } from '../types';

export interface DocumentUploadTileProps {
  kind: VeterinarianDocumentKind;
  label: string;
  required?: boolean;
  value: DocumentRef | null;
  onChange: (ref: DocumentRef | null) => void;
  error?: string;
}

/**
 * One document-photo slot in the veterinarian application (license/ID, student
 * ID front/back, …). Wraps `ImageUploader`, bound to a per-kind presign
 * provider that has no `finalizeUpload` — the resulting storage key is kept
 * here, in RHF state, until the final batched `apply()` call.
 */
export function DocumentUploadTile({
  kind,
  label,
  required,
  value,
  onChange,
  error,
}: DocumentUploadTileProps) {
  const { t } = useTranslation('registration');
  const theme = useTheme();
  const { provider, toDocumentRef } = useVeterinarianDocumentPresignProvider(kind);

  return (
    <View style={{ rowGap: theme.spacing.xs }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.md,
        }}
      >
        <View style={{ flex: 1, rowGap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
            <Label>{label}</Label>
            <Caption color={required ? 'danger' : 'textMuted'}>
              {required ? t('veterinarian.requiredBadge') : t('veterinarian.optionalBadge')}
            </Caption>
          </View>
          <Caption>{t('veterinarian.maxSizeHint')}</Caption>
        </View>

        <ImageUploader
          value={null}
          provider={provider}
          shape="square"
          size={64}
          icon="arrow-up-outline"
          onChange={(result) => onChange(result ? toDocumentRef(result) : null)}
        />
      </View>

      {!value && error ? <Caption color="danger">{error}</Caption> : null}
    </View>
  );
}
