import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { LocalImageUploader } from '@/components/media';
import { Caption, Label } from '@/components/typography';
import type { LocalFile } from '@/services/files/types';
import { useTheme } from '@/theme';

export interface DocumentUploadTileProps {
  label: string;
  required?: boolean;
  value: LocalFile | null;
  onChange: (file: LocalFile | null) => void;
  error?: string;
}

/**
 * One document-photo slot in the veterinarian application (license/ID, student
 * ID front/back, …). Stages the picked file locally (`LocalImageUploader`) —
 * there is no account, and so no session, to upload it with yet. The staged
 * file sits here in RHF state until `VeterinarianRegisterScreen`'s submit
 * handler uploads every staged document right after `register()` succeeds,
 * batched into the same `apply()` call.
 */
export function DocumentUploadTile({ label, required, value, onChange, error }: DocumentUploadTileProps) {
  const { t } = useTranslation('registration');
  const theme = useTheme();

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

        <LocalImageUploader
          value={value}
          onChange={onChange}
          shape="square"
          size={64}
          icon="arrow-up-outline"
        />
      </View>

      {!value && error ? <Caption color="danger">{error}</Caption> : null}
    </View>
  );
}
