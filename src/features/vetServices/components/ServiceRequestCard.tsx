import { useTranslation } from 'react-i18next';
import { Image, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { ANIMAL_TYPE_ICON, formatPrice, formatVetServiceDate } from '../constants';
import type { ServiceRequest } from '../types';

import { ModerationStatusBadge, UrgencyBadge } from './badges';

export function ServiceRequestCard({
  request,
  onPress,
  onPrimary,
  primaryLabel,
  showStatus,
}: {
  request: ServiceRequest;
  onPress: () => void;
  onPrimary?: () => void;
  primaryLabel?: string;
  showStatus?: boolean;
}) {
  const theme = useTheme();
  const { t, i18n } = useTranslation('vetServices');
  const img = request.imageUrls[0] ?? null;

  return (
    <Card variant="elevated" padding="none" onPress={onPress} style={{ overflow: 'hidden' }}>
      <View style={{ height: 110, backgroundColor: theme.colors.requestSurface }}>
        {img ? (
          <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={ANIMAL_TYPE_ICON[request.animalType]} size="iconXl" color="requestAccent" />
          </View>
        )}
        <View
          style={{
            position: 'absolute',
            top: theme.spacing.sm,
            insetInlineStart: theme.spacing.sm,
            flexDirection: 'row',
            columnGap: 4,
          }}
        >
          <UrgencyBadge urgency={request.urgency} />
          {showStatus ? <ModerationStatusBadge status={request.status} /> : null}
        </View>
      </View>

      <View style={{ padding: theme.spacing.md, rowGap: 4 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {request.title}
        </Text>
        <Row icon="location-outline">
          {[request.governorate, request.district].filter(Boolean).join(' - ')}
        </Row>
        <Row icon="paw-outline">
          {[
            t(`animalType.${request.animalType}`),
            request.animalCount ? t('common.count', { count: request.animalCount }) : null,
            request.animalAge,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Row>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
          <Text variant="bodyStrong" style={{ color: theme.colors.requestAccent }}>
            {formatPrice(request.budgetAmount)}
          </Text>
          <Caption color="textMuted">{formatVetServiceDate(request.createdAt, i18n.language)}</Caption>
        </View>
        {onPrimary ? (
          <View style={{ marginTop: theme.spacing.xs }}>
            <Button
              label={primaryLabel ?? t('actions.submitOffer')}
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
