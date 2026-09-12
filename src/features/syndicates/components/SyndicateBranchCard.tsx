import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import type { PublicSyndicate } from '../types';

/** A syndicate branch card, matching the "فروع النقابة" reference grid. */
export function SyndicateBranchCard({ branch, onPress }: { branch: PublicSyndicate; onPress: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');

  return (
    <Card variant="elevated" padding="md" onPress={onPress} style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing.sm,
        }}
      >
        <Icon name="business-outline" size="iconLg" color="primary" />
      </View>
      <Text variant="bodyStrong" numberOfLines={1} style={{ textAlign: 'center' }}>
        {branch.governorate ?? branch.name}
      </Text>
      <Caption numberOfLines={2} style={{ textAlign: 'center' }}>
        {t('branches.cardSubtitle')}
      </Caption>
    </Card>
  );
}
