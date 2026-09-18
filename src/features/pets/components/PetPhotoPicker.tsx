import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Icon } from '@/components/content';
import { ImagePreview } from '@/components/media';
import { Caption, Label } from '@/components/typography';
import type { LocalFile } from '@/services/files/types';
import { useTheme } from '@/theme';

const TILE_SIZE = 84;
const MAX_PHOTOS = 8;

export interface PetPhotoPickerProps {
  photos: LocalFile[];
  onAdd: () => void;
  onRemove: (uri: string) => void;
}

/**
 * Local, pre-upload photo staging for the Add Pet form — no `petId` exists
 * yet to upload against. Mirrors `CreatePublicationScreen`'s inline
 * `PhotoPicker`; photos are uploaded to the new pet's gallery right after
 * `POST /animals` succeeds.
 */
export function PetPhotoPicker({ photos, onAdd, onRemove }: PetPhotoPickerProps) {
  const theme = useTheme();
  const { t } = useTranslation('pets');

  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      <Label>{t('form.galleryLabel')}</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
          {photos.map((file) => (
            <ImagePreview
              key={file.uri}
              uri={file.uri}
              size={TILE_SIZE}
              onRemove={() => onRemove(file.uri)}
            />
          ))}
          {photos.length < MAX_PHOTOS ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('form.addPhotoA11y')}
              onPress={onAdd}
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
              }}
            >
              <Icon name="camera-outline" size="iconMd" color="primary" />
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
      <Caption color="textMuted">{t('form.galleryCount', { count: photos.length, max: MAX_PHOTOS })}</Caption>
    </View>
  );
}
