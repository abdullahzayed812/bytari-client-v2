import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { useToast } from '@/components/feedback';
import { BottomSheet } from '@/components/overlays';
import { Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { isPermissionError, pickImage } from '@/services/media';
import type { LocalFile } from '@/services/files/types';
import { useTheme } from '@/theme';

import { ImagePreview } from './ImagePreview';

export interface LocalImageUploaderProps {
  /** The currently staged file, or `null`. Controlled — like `ImageUploader`, but holds a `LocalFile`, never uploads it. */
  value: LocalFile | null;
  onChange: (file: LocalFile | null) => void;
  size?: number;
  shape?: 'circle' | 'square';
  label?: string;
  disabled?: boolean;
  /** Empty-state glyph. Defaults to a camera (photo picker); pass e.g. `arrow-up-outline` for document uploads. */
  icon?: IconName;
}

/**
 * `ImageUploader`'s local-only sibling: pick → preview → replace/remove, with
 * NO network call — the picked file just sits in `value` until the caller
 * uploads it itself, later, through the ordinary presigned-upload seam
 * (`FileUploadService` / `useMediaUpload`).
 *
 * For the ONE thing `ImageUploader` cannot do: stage a photo picked BEFORE
 * the entity it belongs to exists yet — e.g. an avatar picked mid-registration,
 * before `register()` has returned a session to upload it with. Mirrors
 * `LocalImagePicker` (`features/organizations`, multi-image) at the
 * single-image granularity `ImageUploader` itself uses; reuse that instead for
 * a multi-photo field, and reuse `MultiImagePicker` for a multi-photo field
 * that uploads eagerly.
 */
export function LocalImageUploader({
  value,
  onChange,
  size = 96,
  shape = 'square',
  label,
  disabled,
  icon = 'camera-outline',
}: LocalImageUploaderProps) {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const toast = useToast();
  const [sheet, setSheet] = useState(false);

  const start = async (source: 'camera' | 'library') => {
    setSheet(false);
    try {
      const file = await pickImage({ source, allowsEditing: true });
      if (!file) return;
      onChange(file);
    } catch (error) {
      if (isPermissionError(error)) {
        toast.show({ message: t('media.permissionBody'), tone: 'warning' });
      } else {
        toast.show({ message: apiErrorMessage(error), tone: 'danger' });
      }
    }
  };

  const remove = () => onChange(null);
  const borderRadius = shape === 'circle' ? size / 2 : theme.radius.lg;

  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      {label ? (
        <Text variant="label" color="textSecondary">
          {label}
        </Text>
      ) : null}

      {value ? (
        <ImagePreview
          uri={value.uri}
          size={size}
          shape={shape}
          onRemove={disabled ? undefined : remove}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('media.addImage')}
          disabled={disabled}
          onPress={() => setSheet(true)}
          style={{
            width: size,
            height: size,
            borderRadius,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceAccent,
            alignItems: 'center',
            justifyContent: 'center',
            rowGap: 4,
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <Icon name={icon} size="iconMd" color="primary" />
        </Pressable>
      )}

      <BottomSheet visible={sheet} onClose={() => setSheet(false)} title={t('media.addImage')}>
        <View style={{ rowGap: theme.spacing.xs, paddingBottom: theme.spacing.md }}>
          <SheetRow
            icon="camera-outline"
            label={t('media.camera')}
            onPress={() => void start('camera')}
          />
          <SheetRow
            icon="images-outline"
            label={t('media.library')}
            onPress={() => void start('library')}
          />
        </View>
      </BottomSheet>
    </View>
  );
}

function SheetRow({
  icon,
  label,
  onPress,
}: {
  icon: 'camera-outline' | 'images-outline';
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.sm,
          borderRadius: theme.radius.md,
        },
        pressed && { backgroundColor: theme.colors.surfaceMuted },
      ]}
    >
      <Icon name={icon} size="iconMd" color="primary" />
      <Text variant="bodyMedium">{label}</Text>
    </Pressable>
  );
}
