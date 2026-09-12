import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/colors';

type CardKey = 'jobOffers' | 'lookingForJob' | 'myAdsAndApplications';

/** Route `/(app)/vet-jobs` — "الوظائف البيطرية" home (reference screenshot 1). */
export default function VetJobsHomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetJobs');

  const cards: {
    key: CardKey;
    icon: IconName;
    surface: keyof ColorTokens;
    accent: keyof ColorTokens;
    onPress: () => void;
  }[] = [
    {
      key: 'jobOffers',
      icon: 'briefcase-outline',
      surface: 'serviceSurface',
      accent: 'serviceAccent',
      onPress: () => router.push(Routes.vetJobOffers),
    },
    {
      key: 'lookingForJob',
      icon: 'person-outline',
      surface: 'requestSurface',
      accent: 'requestAccent',
      onPress: () => router.push(Routes.vetJobSeekers),
    },
    {
      key: 'myAdsAndApplications',
      icon: 'clipboard-outline',
      surface: 'primarySoft',
      accent: 'primary',
      onPress: () => router.push(Routes.vetJobMy),
    },
  ];

  return (
    <ScrollScreen padded={false}>
      <AppHeader title={t('home.title')} showBack />
      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.sm }}>
        {cards.map((c) => (
          <Section key={c.key}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(`home.${c.key}`)}
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
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: theme.radius.lg,
                  backgroundColor: theme.colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={c.icon} size="iconXl" color={c.accent} />
              </View>
              <View style={{ flex: 1, rowGap: theme.spacing.xs }}>
                <Text variant="subtitle" weight="bold" style={{ color: theme.colors[c.accent] }}>
                  {t(`home.${c.key}`)}
                </Text>
                <Text color="textSecondary">{t(`home.${c.key}Hint`)}</Text>
              </View>
              <Icon name="chevron-forward" directional color={c.accent} />
            </Pressable>
          </Section>
        ))}
      </View>
    </ScrollScreen>
  );
}
