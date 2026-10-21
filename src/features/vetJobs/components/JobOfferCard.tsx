import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import type { PublicVetJobOffer } from '../types';
import { formatSalary } from '../utils';

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

/**
 * A job-offer card, matching the "عروض الوظائف" reference cards. `grid` is
 * the compact, vertical variant for the 2-up grid (same shape as the
 * Services `ServiceListingCard`: a top band, details, then the footer).
 */
export function JobOfferCard({
  offer,
  onPress,
  variant = 'list',
}: {
  offer: PublicVetJobOffer;
  onPress: () => void;
  variant?: 'list' | 'grid';
}) {
  const theme = useTheme();
  const { t } = useTranslation('vetJobs');
  const location = [offer.governorate, offer.district].filter(Boolean).join(' - ');

  if (variant === 'grid') {
    return (
      <Card
        variant="elevated"
        padding="none"
        onPress={onPress}
        style={{ flexGrow: 1, overflow: 'hidden' }}
      >
        <View
          style={{
            height: 72,
            backgroundColor: theme.colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="briefcase-outline" size="iconXl" color="primary" />
          <View
            style={{
              position: 'absolute',
              top: theme.spacing.sm,
              insetInlineEnd: theme.spacing.sm,
              maxWidth: '70%',
            }}
          >
            <Badge label={t(`employmentType.${offer.employmentType}`)} tone="info" size="sm" />
          </View>
        </View>

        <View style={{ flexGrow: 1, padding: theme.spacing.md, rowGap: 4 }}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {offer.title}
          </Text>
          <Caption numberOfLines={1}>{offer.organizationName}</Caption>
          <Row icon="location-outline">{location}</Row>
          {offer.experienceYearsRequired != null ? (
            <Row icon="briefcase-outline">
              {t('offers.experienceYears', { count: offer.experienceYearsRequired })}
            </Row>
          ) : null}
          {offer.applicationDeadline ? (
            <Row icon="calendar-outline">
              {t('offers.lastApplyDate', { date: formatDate(offer.applicationDeadline) })}
            </Row>
          ) : null}
          {/* `marginTop: 'auto'` pins salary + button to the bottom of equal-height cells. */}
          <View
            style={{ marginTop: 'auto', paddingTop: theme.spacing.sm, rowGap: theme.spacing.sm }}
          >
            <Text variant="label" color="primary" numberOfLines={1}>
              {formatSalary(offer.salaryAmount, offer.salaryNegotiable, t)}
            </Text>
            <Button
              label={t('offers.viewDetails')}
              variant="primary"
              size="sm"
              fullWidth
              onPress={onPress}
            />
          </View>
        </View>
      </Card>
    );
  }

  return (
    // `flexGrow: 1` + the footer's `marginTop: 'auto'` keep cards in one grid row the
    // same height, with the salary / button line aligned at the bottom.
    <Card
      variant="elevated"
      padding="md"
      onPress={onPress}
      style={{ flexGrow: 1, borderRadius: theme.radius.lg }}
    >
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
            <Row icon="briefcase-outline">
              {t('offers.experienceYears', { count: offer.experienceYearsRequired })}
            </Row>
          ) : null}
          {offer.applicationDeadline ? (
            <Row icon="calendar-outline">
              {t('offers.lastApplyDate', { date: formatDate(offer.applicationDeadline) })}
            </Row>
          ) : null}
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: theme.spacing.sm,
          columnGap: theme.spacing.sm,
        }}
      >
        <Text variant="label" color="primary" style={{ flexShrink: 1 }} numberOfLines={2}>
          {formatSalary(offer.salaryAmount, offer.salaryNegotiable, t)}
        </Text>
        <Button label={t('offers.viewDetails')} variant="primary" size="sm" onPress={onPress} />
      </View>
    </Card>
  );
}
