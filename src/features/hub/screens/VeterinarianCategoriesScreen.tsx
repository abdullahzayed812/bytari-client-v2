import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { useToast } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useUnreadCount } from '@/features/notifications/hooks';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/colors';

type CategoryKey =
  | 'inquiries'
  | 'home'
  | 'magazine'
  | 'books'
  | 'store'
  | 'syndicate'
  | 'profile'
  | 'jobs'
  | 'offices'
  | 'courses'
  | 'chats'
  | 'contact';

type Tone = { surface: keyof ColorTokens; accent: keyof ColorTokens };

const TONES: Record<'green' | 'blue' | 'violet' | 'amber' | 'red' | 'peach' | 'teal', Tone> = {
  green: { surface: 'primarySoft', accent: 'primary' },
  blue: { surface: 'featureAdoptionSurface', accent: 'featureAdoptionAccent' },
  violet: { surface: 'featureMatingSurface', accent: 'featureMatingAccent' },
  amber: { surface: 'warningSoft', accent: 'warning' },
  red: { surface: 'dangerSoft', accent: 'danger' },
  peach: { surface: 'requestSurface', accent: 'requestAccent' },
  teal: { surface: 'serviceSurface', accent: 'serviceAccent' },
};

interface Category {
  key: CategoryKey;
  icon: IconName;
  tone: keyof typeof TONES;
  /** An existing route, or `null` → the card shows a "not available yet" toast. */
  route: Href | null;
}

/**
 * Reference order (RTL reads right-to-left, top-to-bottom): the 4×3 grid from
 * the "كل الأقسام" design for Veterinarian mode. Every entry points at a route
 * that already exists; an entry without one (`route: null`) surfaces a toast
 * instead of dead-ending. Pet Owner mode keeps its own grid — see
 * `PetOwnerCategoriesScreen`.
 */
const CATEGORIES: Category[] = [
  { key: 'inquiries', icon: 'chatbubbles-outline', tone: 'green', route: Routes.support('inquiries') },
  { key: 'home', icon: 'shield-checkmark-outline', tone: 'blue', route: Routes.home },
  { key: 'magazine', icon: 'newspaper-outline', tone: 'violet', route: Routes.veterinaryMagazineHome },
  { key: 'books', icon: 'book-outline', tone: 'amber', route: Routes.veterinaryBooksHome },
  { key: 'store', icon: 'bag-handle-outline', tone: 'green', route: Routes.veterinarianStore },
  { key: 'syndicate', icon: 'people-outline', tone: 'red', route: Routes.syndicates },
  { key: 'profile', icon: 'person-outline', tone: 'blue', route: Routes.account },
  { key: 'jobs', icon: 'briefcase-outline', tone: 'peach', route: Routes.vetJobs },
  { key: 'offices', icon: 'business-outline', tone: 'teal', route: Routes.veterinaryOffices },
  { key: 'courses', icon: 'school-outline', tone: 'green', route: Routes.vetCourses },
  { key: 'chats', icon: 'chatbox-outline', tone: 'violet', route: Routes.chat },
  { key: 'contact', icon: 'call-outline', tone: 'green', route: Routes.contact },
];

interface HeaderButtonProps {
  icon: IconName;
  label: string;
  showDot?: boolean;
  onPress: () => void;
}

function HeaderButton({ icon, label, showDot, onPress }: HeaderButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        {
          width: theme.sizes.controlHeightMd,
          height: theme.sizes.controlHeightMd,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Icon name={icon} size="iconMd" color="primary" />
      {showDot ? (
        <View
          style={{
            position: 'absolute',
            top: 6,
            end: 6,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.danger,
          }}
        />
      ) : null}
    </Pressable>
  );
}

/**
 * "كل الأقسام" — the leftmost bottom tab in Veterinarian mode. A single grid
 * of every veterinarian destination. Cards whose screen already exists deep
 * link straight to it; the rest explain (via toast) that they are not ready.
 * Pet Owner mode keeps its own grid — see `CategoriesTabScreen`.
 */
export default function VeterinarianCategoriesScreen() {
  const { t } = useTranslation('nav');
  const theme = useTheme();
  const toast = useToast();
  const { data: unread = 0 } = useUnreadCount();

  const open = (c: Category) => {
    if (c.route) router.push(c.route);
    else toast.show({ message: t('categories.unavailable'), tone: 'info' });
  };

  return (
    <ScrollScreen>
      <Section spacing="lg">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            columnGap: theme.spacing.md,
          }}
        >
          <HeaderButton
            icon="search-outline"
            label={t('vetCategories.searchA11y')}
            onPress={() => toast.show({ message: t('categories.unavailable'), tone: 'info' })}
          />
          <View style={{ flex: 1, alignItems: 'center', rowGap: 4 }}>
            <Text variant="title" weight="bold" style={{ textAlign: 'center' }}>
              {t('vetCategories.title')}
            </Text>
            <Caption style={{ textAlign: 'center' }}>{t('vetCategories.subtitle')}</Caption>
          </View>
          <HeaderButton
            icon="notifications-outline"
            label={t('more.notifications')}
            showDot={unread > 0}
            onPress={() => router.push(Routes.notifications)}
          />
        </View>
      </Section>

      <Section spacing="xl">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
          {CATEGORIES.map((c) => {
            const tone = TONES[c.tone];
            const label = t(`vetCategories.items.${c.key}`);
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
                    {t(`vetCategories.items.${c.key}Hint`)}
                  </Caption>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Section>
    </ScrollScreen>
  );
}
