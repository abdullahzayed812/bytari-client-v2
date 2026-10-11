import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card } from '@/components/content';
import { ErrorState, Loading } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDateTime } from '@/utils';

import { useAdminAuditEntry } from '../hooks';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', columnGap: 12 }}>
      <Caption>{label}</Caption>
      <Text variant="caption" selectable style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

/** Structured values (objects / arrays) are pretty-printed; scalars shown as-is. */
export function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value || '—';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

const isStructured = (v: unknown) => v !== null && typeof v === 'object';

/**
 * Read-only details of one audit-log / "أحدث الأنشطة" entry. Shows only what
 * the server returned for an `audit.read` holder — metadata arrives already
 * redacted (credentials → `[redacted]`); missing fields are simply omitted.
 * Nothing on this screen triggers an action.
 */
export default function AdminAuditLogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const q = useAdminAuditEntry(id);
  const e = q.data;

  const metadataEntries = e ? Object.entries(e.metadata ?? {}) : [];
  const scalars = metadataEntries.filter(([, v]) => !isStructured(v));
  const structured = metadataEntries.filter(([, v]) => isStructured(v));

  return (
    <ScrollScreen>
      <AppHeader title={t('audit.detail.title')} showBack />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !e ? (
        <Section spacing="lg">
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </Section>
      ) : (
        <>
          <Section spacing="lg">
            <Text variant="heading">
              {t(`activityActions.${e.action}`, { defaultValue: e.action })}
            </Text>
            <Caption selectable>{e.action}</Caption>
          </Section>

          <Section spacing="lg">
            <Label>{t('audit.detail.eventSection')}</Label>
            <Card variant="outlined" padding="md">
              <View style={{ rowGap: theme.spacing.sm }}>
                <InfoRow label={t('audit.detail.time')} value={formatDateTime(e.createdAt)} />
                <InfoRow
                  label={t('audit.actorLabel')}
                  value={
                    e.actorUserId
                      ? (e.actorName ??
                        (e.actorExists ? e.actorUserId : t('audit.detail.removedActor')))
                      : t('audit.systemActor')
                  }
                />
                {e.actorUserId ? (
                  <InfoRow label={t('audit.detail.actorId')} value={e.actorUserId} />
                ) : null}
                <InfoRow
                  label={t('audit.detail.entityType')}
                  value={t(`audit.entityTypes.${e.entityType}`, { defaultValue: e.entityType })}
                />
                {e.entityId ? (
                  <InfoRow label={t('audit.detail.entityId')} value={e.entityId} />
                ) : null}
                {e.organization ? (
                  <InfoRow
                    label={t('audit.detail.organization')}
                    value={e.organization.name ?? e.organization.id}
                  />
                ) : null}
                {e.requestId ? (
                  <InfoRow label={t('audit.detail.requestId')} value={e.requestId} />
                ) : null}
                {e.ip ? <InfoRow label={t('audit.detail.ip')} value={e.ip} /> : null}
                {e.userAgent ? (
                  <InfoRow label={t('audit.detail.userAgent')} value={e.userAgent} />
                ) : null}
              </View>
            </Card>
          </Section>

          <Section spacing="lg">
            <Label>{t('audit.detail.metadataSection')}</Label>
            {metadataEntries.length === 0 ? (
              <Caption>{t('audit.detail.noMetadata')}</Caption>
            ) : (
              <Card variant="outlined" padding="md">
                <View style={{ rowGap: theme.spacing.sm }}>
                  {scalars.map(([k, v]) => (
                    <InfoRow key={k} label={k} value={formatAuditValue(v)} />
                  ))}
                  {structured.map(([k, v]) => (
                    <View key={k} style={{ rowGap: theme.spacing.xs }}>
                      <Caption>{k}</Caption>
                      <View
                        style={{
                          backgroundColor: theme.colors.surfaceMuted,
                          borderRadius: theme.radius.md,
                          padding: theme.spacing.sm,
                          direction: 'ltr',
                        }}
                      >
                        <Text variant="caption" selectable style={{ textAlign: 'left' }}>
                          {formatAuditValue(v)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Card>
            )}
          </Section>
        </>
      )}
    </ScrollScreen>
  );
}
