import { useTranslation } from 'react-i18next';
import { Image, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { ANIMAL_TYPE_ICON, formatPrice } from '../constants';
import type { ServiceListing } from '../types';

import { ModerationStatusBadge } from './badges';

export function ServiceListingCard({
  listing,
  onPress,
  onPrimary,
  primaryLabel,
  showStatus,
}: {
  listing: ServiceListing;
  onPress: () => void;
  onPrimary?: () => void;
  primaryLabel?: string;
  showStatus?: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation('vetServices');
  const img = listing.imageUrls[0] ?? null;

  return (
    <Card variant="elevated" padding="none" onPress={onPress} style={{ overflow: 'hidden' }}>
      <View style={{ height: 120, backgroundColor: theme.colors.serviceSurface }}>
        {img ? (
          <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={ANIMAL_TYPE_ICON[listing.animalType]} size="iconXl" color="serviceAccent" />
          </View>
        )}
        <View
          style={{
            position: 'absolute',
            top: theme.spacing.sm,
            insetInlineStart: theme.spacing.sm,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: theme.colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={ANIMAL_TYPE_ICON[listing.animalType]} size="iconXs" color="serviceAccent" />
        </View>
        {showStatus ? (
          <View style={{ position: 'absolute', top: theme.spacing.sm, insetInlineEnd: theme.spacing.sm }}>
            <ModerationStatusBadge status={listing.status} />
          </View>
        ) : null}
      </View>

      <View style={{ padding: theme.spacing.md, rowGap: 4 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {listing.title}
        </Text>
        <Row icon="person-outline">
          {t('common.doctorPrefix', {
            name: `${listing.veterinarian.firstName} ${listing.veterinarian.lastName}`,
          })}
        </Row>
        <Row icon="medkit-outline">{t(`serviceType.${listing.serviceType}`)}</Row>
        <Row icon="location-outline">
          {[listing.governorate, listing.district].filter(Boolean).join(' - ')}
        </Row>
        <Text variant="bodyStrong" style={{ marginTop: 2, color: theme.colors.serviceAccent }}>
          {formatPrice(listing.priceAmount)}
        </Text>
        {onPrimary ? (
          <View style={{ marginTop: theme.spacing.xs }}>
            <Button
              label={primaryLabel ?? t('actions.viewService')}
              variant="primary"
              size="sm"
              fullWidth
              onPress={onPrimary}
            />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function Row({ icon, children }: { icon: Parameters<typeof Icon>[0]['name']; children: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
      <Icon name={icon} size="iconXs" color="textMuted" />
      <Caption color="textSecondary" numberOfLines={1} style={{ flex: 1 }}>
        {children}
      </Caption>
    </View>
  );
}
