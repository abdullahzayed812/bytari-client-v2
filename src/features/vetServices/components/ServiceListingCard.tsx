import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { ANIMAL_TYPE_ICON, formatPrice } from '../constants';
import type { ServiceListing } from '../types';

import { ModerationStatusBadge } from './badges';

/**
 * A service in a list. Tapping opens the Service Details page — the ONLY place
 * with the "طلب الخدمة" / "تواصل مع الطبيب" actions (none on the card itself).
 */
export function ServiceListingCard({
  listing,
  onPress,
  showStatus,
}: {
  listing: ServiceListing;
  onPress: () => void;
  showStatus?: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation('vetServices');
  const img = listing.imageUrls[0] ?? null;

  return (
    <Card variant="elevated" padding="none" onPress={onPress} style={{ overflow: 'hidden' }}>
      <View style={{ height: 120, backgroundColor: theme.colors.serviceSurface }}>
        {img ? (
          <Image
            source={{ uri: img }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={150}
            accessibilityIgnoresInvertColors
          />
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
          <View
            style={{
              position: 'absolute',
              top: theme.spacing.sm,
              insetInlineEnd: theme.spacing.sm,
            }}
          >
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
