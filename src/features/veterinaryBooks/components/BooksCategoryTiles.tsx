import { ScrollView, Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { BOOKS_C } from './BookGridCard';

export interface BooksCategoryTile {
  key: string;
  label: string;
  icon: IconName;
}

/**
 * The round category tiles of the books references ("الكل", the book
 * categories, "المفضلة") — the active one filled green.
 */
export function BooksCategoryTiles({
  tiles,
  activeKey,
  onSelect,
}: {
  tiles: BooksCategoryTile[];
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';
  return (
    <View
      style={{
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: dark ? theme.colors.border : '#F3F4F6',
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          columnGap: 12,
          paddingHorizontal: 16,
          flexGrow: 1,
          justifyContent: 'space-between',
        }}
      >
        {tiles.map((tile) => {
          const active = tile.key === activeKey;
          return (
            <Pressable
              key={tile.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tile.label}
              onPress={() => onSelect(tile.key)}
              style={({ pressed }) => ({
                alignItems: 'center',
                rowGap: 6,
                minWidth: 52,
                transform: pressed ? [{ scale: 0.95 }] : undefined,
              })}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? BOOKS_C.primary : theme.colors.surface,
                  borderWidth: active ? 0 : 1,
                  borderColor: dark ? theme.colors.border : BOOKS_C.border,
                  ...(active ? theme.shadows.xs : null),
                }}
              >
                <Icon name={tile.icon} size={20} color={active ? 'onPrimary' : 'primary'} />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: active ? theme.fontFamily.displayBold : theme.fontFamily.bodyMedium,
                  fontSize: 11,
                  lineHeight: 16,
                  color: active
                    ? dark
                      ? theme.colors.primary
                      : BOOKS_C.primary
                    : theme.colors.textSecondary,
                }}
              >
                {tile.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** "جميع الكتب موثوقة ومراجعة…" footer banner of the references. */
export function BooksTrustBanner({ text }: { text: string }) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 10,
        padding: 12,
        borderRadius: 12,
        backgroundColor: dark ? theme.colors.surfaceAccent : BOOKS_C.primaryLight,
        borderWidth: 1,
        borderColor: dark ? theme.colors.border : '#C6ECD8',
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: BOOKS_C.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="shield-checkmark" size={13} color="onPrimary" />
      </View>
      <Text
        style={{
          flex: 1,
          fontFamily: theme.fontFamily.bodyMedium,
          fontSize: 11,
          lineHeight: 18,
          color: dark ? theme.colors.primary : '#077A44',
        }}
      >
        {text}
      </Text>
    </View>
  );
}

/** Section title row ("الكل" / "الكتب المفضلة") with an optional "عرض الكل" link. */
export function BooksSectionHeader({
  title,
  icon,
  actionLabel,
  onAction,
}: {
  title: string;
  icon: IconName;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
        <Icon name={icon} size={16} color="primary" />
        <Text
          style={{
            fontFamily: theme.fontFamily.displayBold,
            fontSize: 14,
            lineHeight: 21,
            color: theme.colors.textPrimary,
          }}
        >
          {title}
        </Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="link"
          onPress={onAction}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', columnGap: 2 }}
        >
          <Text
            style={{
              fontFamily: theme.fontFamily.bodyMedium,
              fontSize: 12,
              lineHeight: 18,
              color: theme.scheme === 'dark' ? theme.colors.primary : BOOKS_C.primary,
            }}
          >
            {actionLabel}
          </Text>
          <Icon name="chevron-forward" directional size={12} color="primary" />
        </Pressable>
      ) : null}
    </View>
  );
}
