import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Icon } from '@/components/content';
import { useToast } from '@/components/feedback';
import { ImagePreview } from '@/components/media';
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

const TILE_SIZE = 84;

interface GalleryItem {
  id: string;
  file: LocalFile;
  storageKey: string | null;
  status: 'uploading' | 'done' | 'error';
}

export interface AnimalGalleryPickerProps {
  provider: PresignProvider;
  onChange: (storageKeys: string[]) => void;
  max?: number;
  disabled?: boolean;
  label?: string;
  hint?: string;
}

/**
 * Multi-photo picker for the "Add Lost / Adoption / Mating Animal" forms —
 * "يمكنك إضافة أكثر من صورة واضحة للحيوان". Uploads sequentially through the
 * existing presigned-upload seam (`useMediaUpload`); each tile shows its own
 * progress / error / retry, same visual language as the single-image
 * `ImageUploader`.
 */
export function AnimalGalleryPicker({
  provider,
  onChange,
  max = 8,
  disabled,
  label,
  hint,
}: AnimalGalleryPickerProps) {
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
