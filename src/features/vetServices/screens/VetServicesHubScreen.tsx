import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useCapabilities } from '@/hooks';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/colors';

/** Route `/(app)/vet-services` — "الخدمات" hub (reference screenshot 1). */
export default function VetServicesHubScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetServices');
  const caps = useCapabilities();

  type CardKey = 'listings' | 'requests' | 'my';
  const cards: {
    key: CardKey;
    icon: IconName;
    surface: keyof ColorTokens;
    accent: keyof ColorTokens;
    onPress: () => void;
  }[] = [
    {
      key: 'listings',
      icon: 'medkit-outline',
      surface: 'primarySoft',
      accent: 'primary',
      onPress: () => router.push(Routes.vetServiceListings),
    },
    {
      key: 'requests',
      icon: 'clipboard-outline',
      surface: 'featureAdoptionSurface',
      accent: 'featureAdoptionAccent',
      onPress: () => router.push(Routes.vetServiceRequests),
    },
    ...(caps.isApprovedVeterinarian
      ? [
          {
            key: 'my' as CardKey,
            icon: 'briefcase-outline' as IconName,
            surface: 'serviceSurface' as keyof ColorTokens,
            accent: 'serviceAccent' as keyof ColorTokens,
            onPress: () => router.push(Routes.vetServiceMy),
          },
        ]
      : []),
  ];

  return (
    <ScrollScreen padded={false}>
      <AppHeader title={t('hub.title')} showBack />
      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.sm }}>
        <Caption color="textSecondary" center style={{ marginBottom: theme.spacing.lg }}>
          {t('hub.subtitle')}
        </Caption>

        {cards.map((c) => (
          <Section key={c.key}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(`hub.${c.key}.cta`)}
              onPress={c.onPress}
              style={({ pressed }) => [
                {
                  borderRadius: theme.radius.xl,
                  padding: theme.spacing.xl,
                  backgroundColor: theme.colors[c.surface],
                  flexDirection: 'row',
                  alignItems: 'center',
                  columnGap: theme.spacing.lg,
                },
                pressed && { opacity: 0.9 },
              ]}
            >
              <View style={{ flex: 1, rowGap: theme.spacing.sm }}>
                <Heading level={3} style={{ color: theme.colors[c.accent] }}>
                  {t(`hub.${c.key}.title`)}
                </Heading>
                <Text color="textSecondary">{t(`hub.${c.key}.body`)}</Text>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: theme.spacing.xs,
                    backgroundColor: theme.colors.surface,
                    paddingHorizontal: theme.spacing.lg,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.radius.pill,
                  }}
                >
                  <Text variant="label" style={{ color: theme.colors[c.accent] }}>
                    {t(`hub.${c.key}.cta`)}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: theme.radius.lg,
                  backgroundColor: theme.colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={c.icon} size="iconXl" color={c.accent} />
              </View>
            </Pressable>
          </Section>
        ))}
      </View>
    </ScrollScreen>
  );
}
