import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, IconButton } from '@/components/actions';
import { Avatar, Card } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { formatPrice, formatVetServiceDate } from '../constants';
import type { ListingRequest, ServiceOffer } from '../types';

import { EngagementStatusBadge } from './badges';

interface CommonProps {
  onPress?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  busy?: boolean;
}

/** A vet's offer on a pet-owner request (request-owner view + "my offers" view). */
export function OfferCard({
  offer,
  onPress,
  onAccept,
  onReject,
  busy,
}: CommonProps & { offer: ServiceOffer }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation('vetServices');
  return (
    <Card variant="elevated" padding="md" onPress={onPress}>
      <View style={{ flexDirection: 'row', columnGap: theme.spacing.md, alignItems: 'flex-start' }}>
        <Avatar name={`${offer.veterinarian.firstName} ${offer.veterinarian.lastName}`} size="avatarMd" />
        <View style={{ flex: 1, rowGap: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
              {t('common.doctorPrefix', {
                name: `${offer.veterinarian.firstName} ${offer.veterinarian.lastName}`,
              })}
            </Text>
            <EngagementStatusBadge status={offer.status} />
          </View>
          {offer.request ? (
            <Caption color="textSecondary" numberOfLines={1}>
              {offer.request.title}
            </Caption>
          ) : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
            <Text variant="bodyMedium" style={{ color: theme.colors.serviceAccent }}>
              {formatPrice(offer.proposedAmount)}
            </Text>
            <Caption color="textMuted">
              {t('offer.submittedAt', { date: formatVetServiceDate(offer.createdAt, i18n.language) })}
            </Caption>
          </View>
        </View>
      </View>
      {offer.details ? (
        <Text color="textSecondary" numberOfLines={2} style={{ marginTop: theme.spacing.sm }}>
          {offer.details}
        </Text>
      ) : null}
      {onAccept && onReject && offer.status === 'PENDING' ? (
        <Actions onAccept={onAccept} onReject={onReject} busy={busy} onPress={onPress} />
      ) : null}
    </Card>
  );
}

/** A pet-owner's request against ONE of the caller's listings ("الموافقة على الخدمة"). */
export function ListingRequestCard({
  listingRequest,
  onPress,
  onAccept,
  onReject,
  busy,
}: CommonProps & { listingRequest: ListingRequest }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation('vetServices');
  const lr = listingRequest;
  return (
    <Card variant="elevated" padding="md" onPress={onPress}>
      <View style={{ flexDirection: 'row', columnGap: theme.spacing.md, alignItems: 'flex-start' }}>
        <Avatar name={`${lr.petOwner.firstName} ${lr.petOwner.lastName}`} size="avatarMd" />
        <View style={{ flex: 1, rowGap: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
              {lr.listing?.title ?? lr.requestNumber}
            </Text>
            <EngagementStatusBadge status={lr.status} />
          </View>
          <Caption color="textSecondary" numberOfLines={1}>
            {`${lr.petOwner.firstName} ${lr.petOwner.lastName}`}
          </Caption>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
            <Text variant="bodyMedium" style={{ color: theme.colors.serviceAccent }}>
              {t('offer.proposedPrice', { price: formatPrice(lr.listing?.priceAmount ?? null) })}
            </Text>
            <Caption color="textMuted">{formatVetServiceDate(lr.createdAt, i18n.language)}</Caption>
          </View>
        </View>
      </View>
      {onAccept && onReject && lr.status === 'PENDING' ? (
        <Actions onAccept={onAccept} onReject={onReject} busy={busy} onPress={onPress} />
      ) : null}
    </Card>
  );
}

function Actions({
  onAccept,
  onReject,
  busy,
  onPress,
}: {
  onAccept: () => void;
  onReject: () => void;
  busy?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('vetServices');
  return (
    <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm, marginTop: theme.spacing.md, alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Button label={t('actions.reject')} variant="danger" size="sm" fullWidth leftIcon="close" disabled={busy} onPress={onReject} />
      </View>
      <View style={{ flex: 1 }}>
        <Button label={t('actions.approve')} variant="primary" size="sm" fullWidth leftIcon="checkmark" loading={busy} onPress={onAccept} />
      </View>
      {onPress ? (
        <IconButton
          icon="document-text-outline"
          variant="soft"
          size="sm"
          accessibilityLabel={t('actions.viewDetails')}
          onPress={onPress}
        />
      ) : null}
    </View>
  );
}
