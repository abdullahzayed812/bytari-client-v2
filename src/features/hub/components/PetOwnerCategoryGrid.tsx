import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { useToast } from '@/components/feedback';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/colors';

export type PetOwnerCategoryKey =
  | 'consultations'
  | 'home'
  | 'clinics'
  | 'pets'
  | 'livestock'
  | 'poultry'
  | 'store'
  | 'appointments'
  | 'services'
  | 'settings'
  | 'contact'
  | 'profile';

type Tone = { surface: keyof ColorTokens; accent: keyof ColorTokens };

const TONES: Record<'green' | 'blue' | 'violet' | 'amber' | 'red' | 'peach', Tone> = {
  green: { surface: 'primarySoft', accent: 'primary' },
  blue: { surface: 'featureAdoptionSurface', accent: 'featureAdoptionAccent' },
  violet: { surface: 'featureMatingSurface', accent: 'featureMatingAccent' },
  amber: { surface: 'warningSoft', accent: 'warning' },
  red: { surface: 'dangerSoft', accent: 'danger' },
  peach: { surface: 'featureLostSurface', accent: 'featureLostAccent' },
};

interface Category {
  key: PetOwnerCategoryKey;
  icon: IconName;
  tone: keyof typeof TONES;
  /** An existing route, or `null` → the card shows a "not available yet" toast. */
  route: Href | null;
}

/**
 * Reference order (RTL reads right-to-left, top-to-bottom): the 4×3 grid from
 * the "كل الأقسام" design. Every entry points at a route that already exists;
 * an entry without one (`route: null`) surfaces a toast instead of dead-ending.
 */
const CATEGORIES: Category[] = [
  {
    key: 'consultations',
    icon: 'chatbubbles-outline',
    tone: 'green',
    route: Routes.support('consultations'),
  },
  { key: 'home', icon: 'shield-checkmark-outline', tone: 'blue', route: Routes.home },
  { key: 'clinics', icon: 'medkit-outline', tone: 'violet', route: Routes.organizationsDiscover },
  { key: 'pets', icon: 'paw-outline', tone: 'green', route: Routes.petsLanding },
  { key: 'livestock', icon: 'leaf-outline', tone: 'amber', route: Routes.sheepCattleFarms },
  { key: 'poultry', icon: 'egg-outline', tone: 'red', route: Routes.poultryFarms },
  { key: 'store', icon: 'bag-handle-outline', tone: 'peach', route: Routes.petOwnerStore },
  {
    key: 'appointments',
    icon: 'calendar-outline',
    tone: 'blue',
    route: Routes.petOwnerAppointments,
  },
  { key: 'services', icon: 'briefcase-outline', tone: 'green', route: Routes.vetServices },
  { key: 'settings', icon: 'settings-outline', tone: 'violet', route: Routes.settings },
  { key: 'contact', icon: 'headset-outline', tone: 'green', route: Routes.contact },
  { key: 'profile', icon: 'person-outline', tone: 'blue', route: Routes.account },
];

/**
 * The Pet Owner services grid — the single source for "كل الأقسام"
 * (`PetOwnerCategoriesScreen`) and the Pet Owner Home section, so both always
 * show the same entries, icons, order and destinations.
 */
export function PetOwnerCategoryGrid() {
  const { t } = useTranslation('nav');
  const theme = useTheme();
  const toast = useToast();

  const open = (c: Category) => {
    if (c.route) router.push(c.route);
    else toast.show({ message: t('categories.unavailable'), tone: 'info' });
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
      {CATEGORIES.map((c) => {
        const tone = TONES[c.tone];
        const label = t(`categories.items.${c.key}`);
        return (
          <Pressable
            key={c.key}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() => open(c)}
            style={({ pressed }) => [
              {
                width: '31%',
                flexGrow: 1,
                padding: theme.spacing.md,
                borderRadius: theme.radius.xl,
                backgroundColor: theme.colors[tone.surface],
                rowGap: theme.spacing.sm,
                alignItems: 'center',
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: theme.radius.lg,
                backgroundColor: theme.colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={c.icon} size="iconLg" color={tone.accent} />
            </View>
            <View style={{ rowGap: 2, alignItems: 'center' }}>
              <Text variant="bodyStrong" numberOfLines={1} style={{ textAlign: 'center' }}>
                {label}
              </Text>
              <Caption numberOfLines={2} style={{ textAlign: 'center' }}>
                {t(`categories.items.${c.key}Hint`)}
              </Caption>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
