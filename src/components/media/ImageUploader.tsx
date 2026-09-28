import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { TextButton } from '@/components/actions';
import { Icon, type IconName } from '@/components/content';
import { useToast } from '@/components/feedback';
import { BottomSheet } from '@/components/overlays';
import { Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import {
  isPermissionError,
  pickImage,
  type ImageEditOptions,
  useMediaUpload,
  type LocalFile,
  type PresignProvider,
  type UploadResult,
} from '@/services/media';
import { useTheme } from '@/theme';

import { ImagePreview } from './ImagePreview';

export interface ImageUploaderProps {
  /** Existing remote image URL (already uploaded), or `null`. */
  value?: string | null;
  provider: PresignProvider;
  /** Called with the finished upload (storageKey + size), or `null` after remove. */
  onChange: (result: UploadResult | null) => void;
  size?: number;
  shape?: 'circle' | 'square';
  label?: string;
  disabled?: boolean;
  /** Empty-state glyph. Defaults to a camera (photo picker); pass e.g. `arrow-up-outline` for document uploads. */
  icon?: IconName;
  /**
   * Shared crop / resize step before upload. `false` keeps the ORIGINAL file —
   * use it for identity documents and certificates.
   */
  edit?: ImageEditOptions | false;
  /**
   * Show a "change image" action under an existing image (and make the preview
   * tappable) so the current image can be replaced through the same provider.
   */
  replaceable?: boolean;
  /**
   * Overrides the preview's remove (×) action — e.g. a server-side delete.
   * Without it, remove only clears the local selection via `onChange(null)`.
   */
  onRemove?: () => void;
}

/**
 * Reusable single-image field: tap → camera / library → secure presigned upload
 * → preview, with progress, retry, remove. Never touches storage credentials.
 */
export function ImageUploader({
  value,
  provider,
  onChange,
  size = 96,
  shape = 'square',
  label,
  disabled,
  icon = 'camera-outline',
  edit,
  replaceable,
  onRemove,
}: ImageUploaderProps) {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const toast = useToast();
  const up = useMediaUpload(provider);
  const [sheet, setSheet] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);

  useEffect(() => {
    if (up.status === 'success' && up.result) {
      onChange(up.result);
    }
    if (up.status === 'error') {
      toast.show({ message: apiErrorMessage(up.error), tone: 'danger' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [up.status]);

  const start = async (source: 'camera' | 'library') => {
    setSheet(false);
    try {
      const file = await pickImage({
        source,
        allowsEditing: true,
        // Round (avatar-style) fields lock a square crop; documents pass `false`.
        edit: edit ?? (shape === 'circle' ? { aspects: ['1:1'], defaultAspect: '1:1' } : {}),
      });
      if (!file) return;
      setLocalUri(file.uri);
      await up.upload(file);
    } catch (error) {
      if (isPermissionError(error)) {
        toast.show({ message: t('media.permissionBody'), tone: 'warning' });
      } else {
        toast.show({ message: apiErrorMessage(error), tone: 'danger' });
      }
    }
  };

  const retry = () => {
    if (up.file) void up.upload(up.file as LocalFile);
  };

  const remove = () => {
    if (onRemove) {
      onRemove();
      return;
    }
    up.reset();
    setLocalUri(null);
    onChange(null);
  };

  const uploading = up.status === 'uploading';
  const canReplace = replaceable === true && !disabled && !uploading;

  const previewUri = localUri ?? value ?? null;
  const borderRadius = shape === 'circle' ? size / 2 : theme.radius.lg;

  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      {label ? (
        <Text variant="label" color="textSecondary">
          {label}
        </Text>
      ) : null}

      {previewUri ? (
        <View style={{ alignItems: 'center', rowGap: theme.spacing.xs }}>
          <Pressable
            accessibilityRole={canReplace ? 'button' : undefined}
            accessibilityLabel={canReplace ? t('media.changeImage') : undefined}
            disabled={!canReplace}
            onPress={() => setSheet(true)}
          >
            <ImagePreview
              uri={previewUri}
              size={size}
              shape={shape}
              uploading={uploading}
              progress={up.progress}
              error={up.status === 'error'}
              onRetry={retry}
              onRemove={disabled ? undefined : remove}
            />
          </Pressable>
          {canReplace ? (
            <TextButton
              label={t('media.changeImage')}
              icon="swap-horizontal-outline"
              onPress={() => setSheet(true)}
            />
          ) : null}
        </View>
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
