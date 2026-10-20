import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Text } from '@/components/typography';
import { physicalRow } from '@/lib/rtl';
import { useTheme } from '@/theme';

export interface CenteredTitleHeaderProps {
  title: string;
  subtitle?: string;
  /** Green line icon next to the title. */
  icon?: IconName;
  /** Optional action on the side opposite the back button. */
  right?: ReactNode;
  onBack?: () => void;
}

/**
 * Header of the magazine / books references: round bordered back button on
 * the physical left (app-wide back convention, `lib/rtl`), the title with a
 * green icon centred, an optional action on the other side, and a centred
 * subtitle line underneath.
 */
export function CenteredTitleHeader({
  title,
  subtitle,
  icon,
  right,
  onBack,
}: CenteredTitleHeaderProps) {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const dark = theme.scheme === 'dark';
  const SLOT = 40;

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 }}>
      <View style={{ flexDirection: physicalRow(), alignItems: 'center', minHeight: 44 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('actions.back')}
          onPress={onBack ?? (() => router.back())}
          hitSlop={6}
          style={({ pressed }) => ({
            width: SLOT,
            height: SLOT,
            borderRadius: SLOT / 2,
            borderWidth: 1,
            borderColor: dark ? theme.colors.border : '#E3E9E6',
            backgroundColor: pressed ? theme.colors.surfaceAccent : theme.colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Icon name="arrow-back" size="iconSm" color="textPrimary" />
        </Pressable>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            columnGap: 6,
            paddingHorizontal: 6,
            minWidth: 0,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontFamily: theme.fontFamily.displayBold,
              fontSize: 20,
              lineHeight: 30,
              color: theme.colors.textPrimary,
              flexShrink: 1,
            }}
          >
            {title}
          </Text>
          {icon ? <Icon name={icon} size={22} color="primary" /> : null}
        </View>
        <View style={{ width: SLOT, alignItems: 'center' }}>{right}</View>
      </View>
      {subtitle ? (
        <Text
          center
          numberOfLines={2}
          style={{ fontSize: 12, lineHeight: 18, color: theme.colors.textMuted, marginTop: 4 }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
