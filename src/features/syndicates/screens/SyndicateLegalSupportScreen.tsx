import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Divider, Icon } from '@/components/content';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Label, Text } from '@/components/typography';
import { useTheme } from '@/theme';

/** Contact number shown on the reference "الدعم القانوني" screen. */
const LEGAL_UNIT_PHONE = '+9642001234503';

function Bullet({ children, tone = 'primary' }: { children: string; tone?: 'primary' | 'warning' }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: theme.spacing.xs }}>
      <Icon name={tone === 'warning' ? 'alert-circle' : 'checkmark-circle'} size="iconXs" color={tone} />
      <Text variant="body" style={{ flex: 1 }}>
        {children}
      </Text>
    </View>
  );
}

/** Route `/(app)/syndicates/legal-support` — "الدعم القانوني" (static content). */
export default function SyndicateLegalSupportScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');

  return (
    <SafeAreaScreen>
      <AppHeader title={t('legalSupport.title')} showBack />
      <ScrollView contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.lg, paddingBottom: theme.spacing.huge }}>
        <Label>{t('legalSupport.serviceInfo')}</Label>
        <Text variant="body" color="textSecondary">
          {t('legalSupport.description')}
        </Text>

        <Card variant="outlined" padding="md" style={{ rowGap: theme.spacing.sm }}>
          <Text variant="bodyStrong">{t('legalSupport.includesTitle')}</Text>
          <Bullet>{t('legalSupport.includesItem1')}</Bullet>
          <Bullet>{t('legalSupport.includesItem2')}</Bullet>
          <Bullet>{t('legalSupport.includesItem3')}</Bullet>
          <Bullet>{t('legalSupport.includesItem4')}</Bullet>
        </Card>

        <Divider />

        <Card variant="outlined" padding="md" style={{ rowGap: theme.spacing.sm }}>
          <Text variant="bodyStrong">{t('legalSupport.notesTitle')}</Text>
          <Bullet tone="warning">{t('legalSupport.notesItem1')}</Bullet>
          <Bullet tone="warning">{t('legalSupport.notesItem2')}</Bullet>
          <Bullet tone="warning">{t('legalSupport.notesItem3')}</Bullet>
        </Card>

        <Card variant="outlined" padding="md" style={{ rowGap: theme.spacing.sm }}>
          <Text variant="bodyStrong">{t('legalSupport.contactTitle')}</Text>
          <Button
            label={t('legalSupport.callUs')}
            leftIcon="call-outline"
            onPress={() => void Linking.openURL(`tel:${LEGAL_UNIT_PHONE}`)}
          />
        </Card>
      </ScrollView>
    </SafeAreaScreen>
  );
}
