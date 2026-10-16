import { LinearGradient } from 'expo-linear-gradient';
import i18n from 'i18next';
import { Pressable, TextInput, View } from 'react-native';

import { Icon } from '@/components/content';
import { Text } from '@/components/typography';
import { isRTL, physicalRow } from '@/lib/rtl';
import { useTheme } from '@/theme';
import { formatDate, formatWeekday } from '@/utils';

/**
 * Admin dashboard chrome, matching the `لوحة التحكم.html` reference: the
 * sticky top bar (back · name/role · initials) with the section search under
 * it, and the gradient welcome banner with the date badge. Light-theme hex
 * values are the reference's Tailwind colours; dark mode uses theme tokens.
 */

const REF = {
  ink: '#0f172a',
  muted: '#64748b',
  placeholder: '#94a3b8',
  emerald50: '#ecfdf5',
  emerald100: '#d1fae5',
  emerald600: '#059669',
  emerald950: '#022c22',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate600: '#475569',
  slate700: '#334155',
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return (
    parts
      .map((p) => p[0] ?? '')
      .join('')
      .toUpperCase() || '؟'
  );
}

interface TopBarProps {
  name: string;
  roleLabel: string;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  /** Hidden on the wide/web shell, where the sidebar is the navigation. */
  onBack?: () => void;
  backA11y: string;
}

export function AdminDashboardHeader({
  name,
  roleLabel,
  search,
  onSearchChange,
  searchPlaceholder,
  onBack,
  backA11y,
}: TopBarProps) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';

  return (
    <View
      style={{
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 8,
        backgroundColor: theme.colors.surface,
        ...theme.shadows.xs,
        zIndex: 1,
      }}
    >
      {/* Back pinned to the physical left (lib/rtl convention), initials on the right. */}
      <View
        style={{
          flexDirection: physicalRow(),
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={backA11y}
            onPress={onBack}
            hitSlop={6}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: dark ? theme.colors.surfaceMuted : REF.slate100,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Icon
              name="arrow-back"
              size={20}
              color="textPrimary"
              style={{ color: dark ? undefined : REF.slate700 }}
            />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}

        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
          <Text
            center
            numberOfLines={1}
            style={{
              fontFamily: theme.fontFamily.displayBold,
              fontSize: 16,
              lineHeight: 22,
              color: dark ? theme.colors.textPrimary : REF.ink,
            }}
          >
            {name}
          </Text>
          <Text
            center
            weight="medium"
            numberOfLines={1}
            style={{
              fontSize: 12,
              lineHeight: 16,
              marginTop: 2,
              color: dark ? theme.colors.textSecondary : REF.muted,
            }}
          >
            {roleLabel}
          </Text>
        </View>

        <View
          accessible
          accessibilityLabel={name}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: dark ? theme.colors.border : REF.emerald100,
            backgroundColor: dark ? theme.colors.primarySoft : REF.emerald50,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: theme.fontFamily.displayBold,
              fontSize: 12,
              lineHeight: 16,
              letterSpacing: 0.6,
              color: dark ? theme.colors.primary : REF.emerald600,
              padding: 0,
            }}
          >
            {initialsOf(name)}
          </Text>
        </View>
      </View>

      <View style={{ justifyContent: 'center' }}>
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder}
          accessibilityLabel={searchPlaceholder}
          placeholderTextColor={dark ? theme.colors.textMuted : REF.placeholder}
          returnKeyType="search"
          autoCorrect={false}
          style={{
            height: 44,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: dark ? theme.colors.border : 'rgba(226, 232, 240, 0.9)',
            backgroundColor: dark ? theme.colors.surfaceMuted : 'rgba(248, 250, 252, 0.8)',
            paddingStart: 44,
            paddingEnd: search ? 40 : 16,
            fontFamily: theme.fontFamily.bodyRegular,
            fontSize: 12,
            color: dark ? theme.colors.textPrimary : REF.slate700,
            textAlign: isRTL() ? 'right' : 'left',
            writingDirection: isRTL() ? 'rtl' : 'ltr',
          }}
        />
        <View
          pointerEvents="none"
          style={{ position: 'absolute', start: 14, top: 0, bottom: 0, justifyContent: 'center' }}
        >
          <Icon
            name="search-outline"
            size={16}
            color="textMuted"
            style={{ color: dark ? undefined : REF.placeholder }}
          />
        </View>
        {search ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => onSearchChange('')}
            hitSlop={8}
            style={{ position: 'absolute', end: 12, top: 0, bottom: 0, justifyContent: 'center' }}
          >
            <Icon name="close-circle" size={18} color="textMuted" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

interface BannerProps {
  /** "مرحباً بك،" — the name follows in a stronger colour. */
  greetingPrefix: string;
  name: string;
  subtitle: string;
}

/** Gradient welcome banner + date badge (start: greeting, end: date). */
export function AdminWelcomeBanner({ greetingPrefix, name, subtitle }: BannerProps) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';
  const now = new Date().toISOString();

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: dark ? theme.colors.border : 'rgba(209, 250, 229, 0.8)',
        overflow: 'hidden',
        ...theme.shadows.xs,
      }}
    >
      {/* bg-gradient-to-l: emerald-50/90 on the right → teal-50/60 on the left. */}
      <LinearGradient
        colors={
          dark
            ? [theme.colors.primarySoft, theme.colors.surface]
            : ['rgba(236, 253, 245, 0.9)', 'rgba(240, 253, 250, 0.6)']
        }
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
        style={{
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          columnGap: 8,
        }}
      >
        <View style={{ flexShrink: 1 }}>
          <Text
            numberOfLines={2}
            style={{
              fontFamily: theme.fontFamily.displayBold,
              fontSize: 13,
              lineHeight: 18,
              color: dark ? theme.colors.textPrimary : REF.ink,
            }}
          >
            {greetingPrefix}{' '}
            <Text
              style={{
                fontFamily: theme.fontFamily.displayBold,
                fontSize: 13,
                lineHeight: 18,
                color: dark ? theme.colors.primary : REF.emerald950,
              }}
            >
              {name}
            </Text>
          </Text>
          <Text
            weight="medium"
            numberOfLines={2}
            style={{
              fontSize: 10,
              lineHeight: 14,
              marginTop: 2,
              color: dark ? theme.colors.textSecondary : REF.muted,
            }}
          >
            {subtitle}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 6,
            flexShrink: 0,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: dark ? theme.colors.border : 'rgba(209, 250, 229, 0.6)',
            backgroundColor: dark ? theme.colors.surface : 'rgba(255, 255, 255, 0.8)',
          }}
        >
          <Icon
            name="calendar-outline"
            size={14}
            color="primary"
            style={{ color: dark ? undefined : REF.emerald600 }}
          />
          {(
            [
              [formatDate(now), REF.slate600],
              ['|', REF.slate300],
              [formatWeekday(now, i18n.language?.startsWith('en') ? 'en' : 'ar'), REF.slate600],
            ] as const
          ).map(([label, color], i) => (
            <Text
              key={i}
              style={{
                fontFamily: theme.fontFamily.displaySemiBold,
                fontSize: 11,
                lineHeight: 15,
                color: dark ? theme.colors.textSecondary : color,
              }}
            >
              {label}
            </Text>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}
