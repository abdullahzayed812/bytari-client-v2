import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { useToast } from '@/components/feedback';
import { Caption } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { isPermissionError, pickImage } from '@/services/media';
import type { LocalFile } from '@/services/files/types';
import { useTheme } from '@/theme';

export interface LocalImagePickerProps {
  label: string;
  hint?: string;
  error?: string;
  files: LocalFile[];
  onChange: (files: LocalFile[]) => void;
  max: number;
  disabled?: boolean;
}

const TILE_SIZE = 88;

/**
 * Multi-photo picker over LOCAL files only — no upload yet. Registration
 * screens ("تسجيل العيادة") pick gallery/license photos before the
 * organization exists (nothing to attach an upload to yet); they're uploaded
 * in a loop right after `organizationsApi.create` succeeds
 * (`@/features/organizations/lib/registrationUploads`).
 */
export function LocalImagePicker({
  label,
  hint,
  error,
  files,
  onChange,
  max,
  disabled,
}: LocalImagePickerProps) {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const { t: torg } = useTranslation('organizations');
  const toast = useToast();

  const addOne = async (): Promise<void> => {
    try {
      const file = await pickImage({ allowsEditing: false });
      if (!file) return;
      onChange([...files, file]);
    } catch (error) {
      if (isPermissionError(error)) {
        toast.show({ message: t('media.permissionBody'), tone: 'warning' });
      } else {
        toast.show({ message: apiErrorMessage(error), tone: 'danger' });
      }
    }
  };

  const removeAt = (index: number): void => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <View style={{ rowGap: theme.spacing.xs }}>
      <Caption>
        {label} · {torg('form.imageCount', { count: files.length, max })}
      </Caption>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {files.map((file, index) => (
          <View
            key={`${file.uri}-${index}`}
            style={{
              width: TILE_SIZE,
              height: TILE_SIZE,
              borderRadius: theme.radius.lg,
              overflow: 'hidden',
              backgroundColor: theme.colors.surfaceAccent,
            }}
          >
            <Image source={{ uri: file.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={torg('form.removeImageA11y')}
              onPress={() => removeAt(index)}
              hitSlop={6}
              style={{
                position: 'absolute',
                top: 4,
                insetInlineEnd: 4,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: theme.colors.overlay,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="close" size="iconXs" color="textInverse" />
            </Pressable>
          </View>
        ))}
        {files.length < max && !disabled ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={torg('form.addImageA11y')}
            onPress={() => void addOne()}
            style={({ pressed }) => [
              {
                width: TILE_SIZE,
                height: TILE_SIZE,
                borderRadius: theme.radius.lg,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                rowGap: 4,
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Icon name="add" size="iconMd" color="primary" />
            <Caption>{torg('form.addImage')}</Caption>
          </Pressable>
        ) : null}
      </View>
      {error ? <Caption color="danger">{error}</Caption> : hint ? <Caption>{hint}</Caption> : null}
    </View>
  );
}
