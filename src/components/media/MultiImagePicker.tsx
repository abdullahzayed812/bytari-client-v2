import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Icon } from '@/components/content';
import { useToast } from '@/components/feedback';
import { Label, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import {
  isPermissionError,
  pickImages,
  useMediaUpload,
  type LocalFile,
  type PresignProvider,
} from '@/services/media';
import { useTheme } from '@/theme';

import { ImagePreview } from './ImagePreview';

const TILE_SIZE = 84;

interface GalleryItem {
  id: string;
  file: LocalFile;
  storageKey: string | null;
  status: 'uploading' | 'done' | 'error';
}

export interface MultiImagePickerProps {
  provider: PresignProvider;
  onChange: (storageKeys: string[]) => void;
  max?: number;
  disabled?: boolean;
  label?: string;
  hint?: string;
}

/**
 * The shared multi-photo field: pick several photos at once, upload each one
 * sequentially through the presigned-upload seam (`useMediaUpload`), and hand
 * the caller the finished storage keys. Each tile shows its own progress /
 * error / retry, in the same visual language as the single-image
 * `ImageUploader`.
 *
 * Used by every form that accepts more than one photo (Lost / Adoption /
 * Mating listings, vet-service listings / requests / offers, consultation and
 * inquiry attachments). Do not hand-roll another one.
 */
export function MultiImagePicker({
  provider,
  onChange,
  max = 8,
  disabled,
  label,
  hint,
}: MultiImagePickerProps) {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const toast = useToast();
  const up = useMediaUpload(provider);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current(items.filter((i) => i.storageKey).map((i) => i.storageKey as string));
  }, [items]);

  const uploadItem = async (id: string, file: LocalFile) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: 'uploading' } : it)));
    const result = await up.upload(file);
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, status: result ? 'done' : 'error', storageKey: result?.storageKey ?? null }
          : it,
      ),
    );
    if (!result) toast.show({ message: apiErrorMessage(up.error), tone: 'danger' });
  };

  const addPhotos = async () => {
    if (items.length >= max) return;
    try {
      const files = await pickImages({ max: max - items.length });
      for (const file of files) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setItems((prev) => [...prev, { id, file, storageKey: null, status: 'uploading' }]);

        await uploadItem(id, file);
      }
    } catch (error) {
      if (isPermissionError(error)) {
        toast.show({ message: t('media.permissionBody'), tone: 'warning' });
      } else {
        toast.show({ message: apiErrorMessage(error), tone: 'danger' });
      }
    }
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));
  const retryItem = (item: GalleryItem) => void uploadItem(item.id, item.file);

  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      {label ? <Label>{label}</Label> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
          {items.map((item) => (
            <ImagePreview
              key={item.id}
              uri={item.file.uri}
              size={TILE_SIZE}
              uploading={item.status === 'uploading'}
              error={item.status === 'error'}
              progress={item.status === 'uploading' ? up.progress : undefined}
              onRemove={disabled ? undefined : () => removeItem(item.id)}
              onRetry={() => retryItem(item)}
            />
          ))}
          {items.length < max ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('media.addImage')}
              disabled={disabled}
              onPress={() => void addPhotos()}
              style={{
                width: TILE_SIZE,
                height: TILE_SIZE,
                borderRadius: theme.radius.lg,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceAccent,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <Icon name="camera-outline" size="iconMd" color="primary" />
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
      {hint ? (
        <Text variant="caption" color="textMuted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
