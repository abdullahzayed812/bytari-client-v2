import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Card, Divider, Icon } from '@/components/content';
import { Alert } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { useTheme } from '@/theme';

function Bullet({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: theme.spacing.xs }}>
      <Icon name="checkmark-circle" size="iconXs" color="primary" />
      <Text variant="body" style={{ flex: 1 }}>
        {children}
      </Text>
    </View>
  );
}

/** Route `/(app)/syndicates/id-requirements` — "إصدار / تجديد هوية نقابية" (static content). */
export default function SyndicateIdRequirementsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');

  return (
    <SafeAreaScreen>
      <AppHeader title={t('idRequirements.title')} showBack />
      <ScrollView contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.lg, paddingBottom: theme.spacing.huge }}>
        <Label>{t('idRequirements.requirements')}</Label>

        <Card variant="outlined" padding="md" style={{ rowGap: theme.spacing.sm }}>
          <Text variant="bodyStrong">{t('idRequirements.newTitle')}</Text>
          <Bullet>{t('idRequirements.newItem1')}</Bullet>
          <Bullet>{t('idRequirements.newItem2')}</Bullet>
          <Bullet>{t('idRequirements.newItem3')}</Bullet>
          <Bullet>{t('idRequirements.newItem4')}</Bullet>
          <Bullet>{t('idRequirements.newItem5')}</Bullet>
        </Card>

        <Divider />

        <Card variant="outlined" padding="md" style={{ rowGap: theme.spacing.sm }}>
          <Text variant="bodyStrong">{t('idRequirements.renewTitle')}</Text>
          <Bullet>{t('idRequirements.renewItem1')}</Bullet>
          <Bullet>{t('idRequirements.renewItem2')}</Bullet>
          <Bullet>{t('idRequirements.renewItem3')}</Bullet>
          <Bullet>{t('idRequirements.renewItem4')}</Bullet>
        </Card>

        <Caption color="textMuted">{t('idRequirements.processingTime')}</Caption>
        <Alert tone="info" message={t('idRequirements.note')} />
      </ScrollView>
    </SafeAreaScreen>
  );
}
