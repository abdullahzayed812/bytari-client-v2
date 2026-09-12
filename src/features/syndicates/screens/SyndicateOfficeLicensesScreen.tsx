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

/** Route `/(app)/syndicates/office-licenses` — "إجازات المكاتب والعيادات" (static content). */
export default function SyndicateOfficeLicensesScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');

  return (
    <SafeAreaScreen>
      <AppHeader title={t('officeLicenses.title')} showBack />
      <ScrollView contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.lg, paddingBottom: theme.spacing.huge }}>
        <Label>{t('officeLicenses.requirements')}</Label>

        <Card variant="outlined" padding="md" style={{ rowGap: theme.spacing.sm }}>
          <Text variant="bodyStrong">{t('officeLicenses.newTitle')}</Text>
          <Bullet>{t('officeLicenses.newItem1')}</Bullet>
          <Bullet>{t('officeLicenses.newItem2')}</Bullet>
          <Bullet>{t('officeLicenses.newItem3')}</Bullet>
          <Bullet>{t('officeLicenses.newItem4')}</Bullet>
          <Bullet>{t('officeLicenses.newItem5')}</Bullet>
        </Card>

        <Divider />

        <Card variant="outlined" padding="md" style={{ rowGap: theme.spacing.sm }}>
          <Text variant="bodyStrong">{t('officeLicenses.renewTitle')}</Text>
          <Bullet>{t('officeLicenses.renewItem1')}</Bullet>
          <Bullet>{t('officeLicenses.renewItem2')}</Bullet>
          <Bullet>{t('officeLicenses.renewItem3')}</Bullet>
        </Card>

        <Caption color="textMuted">{t('officeLicenses.processingTime')}</Caption>
        <Alert tone="info" message={t('officeLicenses.note')} />
      </ScrollView>
    </SafeAreaScreen>
  );
}
