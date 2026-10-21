import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { useToast } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useUnreadCount } from '@/features/notifications/hooks';
import { useTheme } from '@/theme';

import { PetOwnerCategoryGrid } from '../components/PetOwnerCategoryGrid';

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
 * "كل الأقسام" — the leftmost bottom tab in Pet Owner mode. A single grid of
 * every pet-owner / farm destination. Cards whose screen already exists deep
 * link straight to it; the rest explain (via toast) that they are not ready.
 * Veterinarian mode keeps its own hub — see `CategoriesTabScreen`.
 */
export default function PetOwnerCategoriesScreen() {
  const { t } = useTranslation('nav');
  const theme = useTheme();
  const toast = useToast();
  const { data: unread = 0 } = useUnreadCount();

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
          {/* Reference layout: search pinned to the start (physical right in
              RTL), the notification bell to the end (physical left). */}
          <HeaderButton
            icon="search-outline"
            label={t('categories.searchA11y')}
            onPress={() => toast.show({ message: t('categories.unavailable'), tone: 'info' })}
          />
          <View style={{ flex: 1, alignItems: 'center', rowGap: 4 }}>
            <Text variant="title" weight="bold" style={{ textAlign: 'center' }}>
              {t('categories.title')}
            </Text>
            <Caption style={{ textAlign: 'center' }}>{t('categories.subtitle')}</Caption>
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
        <PetOwnerCategoryGrid />
      </Section>
    </ScrollScreen>
  );
}
