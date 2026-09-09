import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Divider, Icon } from '@/components/content';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Text } from '@/components/typography';
import { useTheme } from '@/theme';

/** Route: `/(app)/settings/about` — "عن التطبيق". */
export default function AboutScreen() {
  const theme = useTheme();
  const { t } = useTranslation('settings');
  const { t: tc } = useTranslation('common');
  const version = Constants.expoConfig?.version ?? '—';

  return (
    <ScrollScreen padded={false}>
      <AppHeader title={t('about.title')} showBack />

      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.xl }}>
        <View style={{ alignItems: 'center', rowGap: theme.spacing.md }}>
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: theme.radius.xl,
              backgroundColor: theme.colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="paw" size="iconXl" color="primary" />
          </View>
          <Heading level={2}>{tc('appName')}</Heading>
          <Caption color="textSecondary">{tc('tagline')}</Caption>
        </View>

        <Section spacing="xl">
          <Card padding="lg">
            <Text color="textSecondary">{t('about.description')}</Text>
            <Divider spacing="md" />
            <Row justify="space-between">
              <Caption color="textSecondary">{t('about.version')}</Caption>
              <Caption>{version}</Caption>
            </Row>
          </Card>
        </Section>
      </View>
    </ScrollScreen>
  );
}
