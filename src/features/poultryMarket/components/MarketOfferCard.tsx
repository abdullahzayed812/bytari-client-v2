import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

export interface MarketOfferCardLine {
  label: string;
  value: string;
  accent?: boolean;
}

export interface MarketOfferCardProps {
  title: string;
  subtitle?: string;
  lines: MarketOfferCardLine[];
  locationLabel: string;
  createdAt: string;
  imageUrl?: string | null;
  fallbackIcon: Parameters<typeof Icon>[0]['name'];
  canDelete: boolean;
  onPressDetails: () => void;
  onPressCall: () => void;
  onPressWhatsapp: () => void;
  onPressDelete: () => void;
}

/** Half the row (minus the gap); grows to the full row when it is alone on it. */
const ACTION_CELL = { flexGrow: 1, flexBasis: '45%', minWidth: 120 } as const;

/** Shared poultry/egg market offer card — one shape, kind-specific `lines`. */
export function MarketOfferCard({
  title,
  subtitle,
  lines,
  locationLabel,
  createdAt,
  imageUrl,
  fallbackIcon,
  canDelete,
  onPressDetails,
  onPressCall,
  onPressWhatsapp,
  onPressDelete,
}: MarketOfferCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');

  return (
    <Card variant="outlined" padding="lg">
      <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
        <View style={{ flex: 1, rowGap: 4 }}>
          <Text variant="bodyStrong">{title}</Text>
          {subtitle ? <Caption>{subtitle}</Caption> : null}
          {lines.map((line) => (
            <Text
              key={line.label}
              variant="bodyMedium"
              style={line.accent ? { color: theme.colors.success } : undefined}
            >
              {line.label}: {line.value}
            </Text>
          ))}
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4, marginTop: 4 }}>
            <Icon name="location-outline" size="iconXs" color="textMuted" />
            <Caption>{locationLabel}</Caption>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
            <Icon name="time-outline" size="iconXs" color="textMuted" />
            <Caption>{formatDate(createdAt)}</Caption>
          </View>
        </View>
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.surfaceAccent,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {imageUrl ? (
            <Image source={imageUrl} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <Icon name={fallbackIcon} size="iconLg" color="primary" />
          )}
        </View>
      </View>

      {/*
        Two buttons per row (a lone last button takes the full row), so every
        label — Delete / Call / WhatsApp / Details, in Arabic, Kurdish or
        English — fits without being cut; `wrapLabel` is the safety net on very
        narrow screens or large font scales (wraps instead of an ellipsis).
      */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          columnGap: theme.spacing.sm,
          rowGap: theme.spacing.sm,
          marginTop: theme.spacing.md,
        }}
      >
        {canDelete ? (
          <View style={ACTION_CELL}>
            <Button
              label={t('actions.delete')}
              variant="danger"
              fullWidth
              wrapLabel
              leftIcon="trash-outline"
              onPress={onPressDelete}
            />
          </View>
        ) : null}
        <View style={ACTION_CELL}>
          <Button
            label={t('actions.call')}
            variant="primary"
            fullWidth
            wrapLabel
            leftIcon="call-outline"
            onPress={onPressCall}
          />
        </View>
        <View style={ACTION_CELL}>
          <Button
            label={t('actions.whatsapp')}
            variant="primary"
            fullWidth
            wrapLabel
            leftIcon="logo-whatsapp"
            onPress={onPressWhatsapp}
          />
        </View>
        <View style={ACTION_CELL}>
          <Button
            label={t('actions.details')}
            variant="outline"
            fullWidth
            wrapLabel
            onPress={onPressDetails}
          />
        </View>
      </View>
    </Card>
  );
}
