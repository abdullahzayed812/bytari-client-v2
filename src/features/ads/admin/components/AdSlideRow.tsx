import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Card } from '@/components/content';
import { ImageUploader } from '@/components/media';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import type { AdSlide } from '../../types';
import { useAdSlideImagePresignProvider } from '../hooks';

export interface AdSlideRowProps {
  campaignId: string;
  slide: AdSlide;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/** One slide row: image (own presign seam) + text summary + edit/delete/reorder actions. */
export function AdSlideRow({
  campaignId,
  slide,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: AdSlideRowProps) {
  const theme = useTheme();
  const { t } = useTranslation('ads');
  const imageProvider = useAdSlideImagePresignProvider(campaignId, slide.id);

  return (
    <Card variant="outlined" padding="md">
      <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
        <ImageUploader
          value={slide.imageUrl}
          provider={imageProvider}
          shape="square"
          size={64}
          onChange={() => undefined}
        />

        <View style={{ flex: 1, rowGap: 2 }}>
          <Text variant="bodyMedium" numberOfLines={1}>
            {slide.title || '—'}
          </Text>
          {slide.subtitle ? <Caption numberOfLines={1}>{slide.subtitle}</Caption> : null}
          {slide.ctaLabel ? <Caption numberOfLines={1}>{slide.ctaLabel}</Caption> : null}
        </View>

        <View style={{ rowGap: 4, alignItems: 'center' }}>
          <IconButton
            icon="chevron-up"
            size="sm"
            variant="plain"
            accessibilityLabel={t('admin.slides.moveUpA11y')}
            disabled={isFirst}
            onPress={onMoveUp}
          />
          <IconButton
            icon="chevron-down"
            size="sm"
            variant="plain"
            accessibilityLabel={t('admin.slides.moveDownA11y')}
            disabled={isLast}
            onPress={onMoveDown}
          />
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          columnGap: theme.spacing.md,
          marginTop: theme.spacing.sm,
          paddingTop: theme.spacing.sm,
          borderTopWidth: theme.sizes.hairline,
          borderTopColor: theme.colors.divider,
        }}
      >
        <IconButton
          icon="create-outline"
          size="sm"
          variant="plain"
          accessibilityLabel={t('admin.detail.editCta')}
          onPress={onEdit}
        />
        <IconButton
          icon="trash-outline"
          size="sm"
          variant="plain"
          color="danger"
          accessibilityLabel={t('admin.slides.deleteCta')}
          onPress={onDelete}
        />
      </View>
    </Card>
  );
}
