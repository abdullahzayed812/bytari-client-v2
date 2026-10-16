import { router } from 'expo-router';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { Pressable, View, type ViewStyle } from 'react-native';

import { EmptyState } from '@/components/feedback';
import { Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import type { AdminActivityItem } from '@/features/admin/types';
import { useTheme, type Theme } from '@/theme';

type ActionTone = 'success' | 'danger' | 'info' | 'neutral';

/**
 * The `AuditAction` catalogue is a consistent `NOUN_VERB_PAST` naming scheme
 * (confirmed against the backend enum) — deriving a dot colour from the verb
 * suffix avoids hand-maintaining a per-action colour map for ~150 values.
 */
function actionTone(action: string): ActionTone {
  if (
    /_(APPROVED|CREATED|ACTIVATED|PUBLISHED|ASSIGNED|PLACED|SENT|RESTORED|JOINED|GRANTED)$/.test(
      action,
    )
  ) {
    return 'success';
  }
  if (
    /_(REJECTED|DELETED|REMOVED|SUSPENDED|DEACTIVATED|CANCELLED|CLOSED|BLOCKED|ARCHIVED|REVOKED)$/.test(
      action,
    )
  ) {
    return 'danger';
  }
  if (/_(UPDATED|CHANGED|ADJUSTED|SET|SAVED|REORDERED|REGENERATED|TRANSFERRED)$/.test(action)) {
    return 'info';
  }
  return 'neutral';
}

/** "10:24 ص" — 12-hour time with Latin digits, as in the dashboard reference. */
function formatActivityTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const lang = i18n.language?.startsWith('en') ? 'en-GB' : 'ar-u-nu-latn';
  return new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit', hour12: true }).format(
    date,
  );
}

/** The reference's status-dot colours (Tailwind emerald/red/blue/amber-500). */
const REF_DOT: Record<ActionTone, string> = {
  success: '#10b981',
  danger: '#ef4444',
  info: '#3b82f6',
  neutral: '#f59e0b',
};

/** White rounded row card used by the dashboard's activity + task lists. */
export function activityCardStyle(theme: Theme, dark: boolean): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: dark ? theme.colors.border : '#f1f5f9',
    backgroundColor: theme.colors.surface,
    ...theme.shadows.xs,
  };
}

interface Props {
  items: AdminActivityItem[];
}

export function AdminActivityFeed({ items }: Props) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';
  const { t } = useTranslation('admin');

  if (items.length === 0) {
    return <EmptyState icon="pulse-outline" title={t('dashboard.activity.empty')} />;
  }

  return (
    <View style={{ rowGap: 10 }}>
      {items.map((item) => {
        const tone = actionTone(item.action);
        const dotColor = dark
          ? tone === 'success'
            ? theme.colors.success
            : tone === 'danger'
              ? theme.colors.danger
              : tone === 'info'
                ? theme.colors.info
                : theme.colors.textMuted
          : REF_DOT[tone];

        return (
          // Opens the read-only details screen — tapping never runs the action itself.
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityHint={t('audit.detail.openHint')}
            onPress={() => router.push(Routes.adminAuditLog(item.id))}
            style={({ pressed }) => [
              activityCardStyle(theme, dark),
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                columnGap: 10,
                flex: 1,
                minWidth: 0,
              }}
            >
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dotColor }} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={2}
                  style={{
                    fontFamily: theme.fontFamily.displayBold,
                    fontSize: 12,
                    lineHeight: 16,
                    color: dark ? theme.colors.textPrimary : '#0f172a',
                  }}
                >
                  {t(`activityActions.${item.action}`, { defaultValue: item.action })}
                </Text>
                <Text
                  weight="medium"
                  numberOfLines={1}
                  style={{
                    fontSize: 10,
                    lineHeight: 14,
                    marginTop: 2,
                    color: dark ? theme.colors.textMuted : '#94a3b8',
                  }}
                >
                  {item.actorName ?? t('dashboard.activity.unknownUser')}
                </Text>
              </View>
            </View>
            <Text
              style={{
                fontFamily: theme.fontFamily.displaySemiBold,
                fontSize: 11,
                lineHeight: 15,
                flexShrink: 0,
                color: dark ? theme.colors.textMuted : '#94a3b8',
              }}
            >
              {formatActivityTime(item.createdAt)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
