import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { formatSalary } from '../utils';
import type { PublicVetJobOffer } from '../types';

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

/** A job-offer card, matching the "عروض الوظائف" reference cards. */
export function JobOfferCard({
  offer,
  onPress,
}: {
  offer: PublicVetJobOffer;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('vetJobs');
  const location = [offer.governorate, offer.district].filter(Boolean).join(' - ');

  return (
    <Card variant="elevated" padding="md" onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: theme.spacing.md }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="briefcase-outline" size="iconMd" color="primary" />
        </View>
        <View style={{ flex: 1, rowGap: 4 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              columnGap: theme.spacing.sm,
            }}
          >
            <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={2}>
              {offer.title}
            </Text>
            <Badge label={t(`employmentType.${offer.employmentType}`)} tone="info" size="sm" />
          </View>
          <Caption numberOfLines={1}>{offer.organizationName}</Caption>
          <Row icon="location-outline">{location}</Row>
          {offer.experienceYearsRequired != null ? (
            <Row icon="briefcase-outline">{t('offers.experienceYears', { count: offer.experienceYearsRequired })}</Row>
          ) : null}
          {offer.applicationDeadline ? (
            <Row icon="calendar-outline">{t('offers.lastApplyDate', { date: offer.applicationDeadline })}</Row>
          ) : null}
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: theme.spacing.sm,
          columnGap: theme.spacing.sm,
        }}
      >
        <Text variant="label" color="primary">
          {formatSalary(offer.salaryAmount, offer.salaryNegotiable, t)}
        </Text>
        <Button label={t('offers.viewDetails')} variant="primary" size="sm" onPress={onPress} />
      </View>
    </Card>
  );
}
