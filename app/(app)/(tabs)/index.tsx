import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Banner, Card, Icon, type IconName } from '@/components/content';
import { ScrollScreen, Row, Section } from '@/components/layout';
import { Caption, Heading, Text } from '@/components/typography';
import { useAppMode } from '@/hooks';
import { useAppHeaderGreeting } from '@/navigation/useAppHeaderGreeting';
import { useTheme } from '@/theme';

/**
 * Home tab — the visual anchor. Content shown here is illustrative foundation
 * scaffolding (no real data / no business modules); feature phases replace it.
 */
export default function HomeTab() {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const greeting = useAppHeaderGreeting();
  const { activeMode } = useAppMode();

  const quickLinks: { icon: IconName; label: string }[] = [
    { icon: 'calendar-outline', label: 'المواعيد' },
    { icon: 'medkit-outline', label: 'السجل الطبي' },
    { icon: 'chatbubbles-outline', label: 'استشارة' },
    { icon: 'storefront-outline', label: 'المتجر' },
  ];

  return (
    <ScrollScreen>
      <Section spacing="xl">
        <Row justify="space-between">
          <View>
            <Caption>{greeting}</Caption>
            <Heading level={2}>{t('appName')}</Heading>
          </View>
          <View
            style={{
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.surfaceAccent,
            }}
          >
            <Text variant="overline" color="primary">
              {activeMode === 'veterinarian' ? t('mode.veterinarian') : t('mode.owner')}
            </Text>
          </View>
        </Row>
      </Section>

      <Section spacing="xl">
        <Banner
          title="استشارة بيطرية فورية"
          body="تحدث مع طبيب بيطري معتمد خلال دقائق."
          actionLabel="ابدأ الآن"
        />
      </Section>

      <Section spacing="xl">
        <Row gap="md" wrap>
          {quickLinks.map((link) => (
            <Card
              key={link.label}
              variant="outlined"
              padding="lg"
              style={{ flexBasis: '47%', flexGrow: 1 }}
            >
              <View style={{ rowGap: theme.spacing.sm, alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: theme.radius.md,
                    backgroundColor: theme.colors.primarySoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={link.icon} size="iconMd" color="primary" />
                </View>
                <Text variant="bodyMedium">{link.label}</Text>
              </View>
            </Card>
          ))}
        </Row>
      </Section>

      <Section spacing="xl">
        <Text variant="caption" color="textMuted" center>
          هذه شاشة تأسيسية لعرض الهوية البصرية — لا توجد بيانات حقيقية بعد.
        </Text>
      </Section>
    </ScrollScreen>
  );
}
