import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Skeleton } from '@/components/feedback';
import { useTheme } from '@/theme';

import { AdminListScreen, AdminRow } from '../components';
import { useAdminAuditLog } from '../hooks';
import type { AuditLogEntry } from '../types';

export default function AdminAuditLogScreen() {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const q = useAdminAuditLog();

  return (
    <AdminListScreen<AuditLogEntry>
      title={t('audit.title')}
      query={q}
      data={q.entries}
      keyExtractor={(e) => e.id}
      skeletonRow={
        <View style={{ rowGap: 8, padding: theme.spacing.md }}>
          <Skeleton width="45%" height={16} />
          <Skeleton width="65%" height={12} />
        </View>
      }
      emptyIcon="document-text-outline"
      emptyTitle={t('audit.empty')}
      emptyMessage={t('audit.emptyHint')}
      loadingMoreLabel={t('common.loadingMore')}
      renderItem={(e) => (
        <AdminRow
          title={e.action}
          subtitle={`${e.entityType}${e.entityId ? ` · ${e.entityId.slice(0, 8)}` : ''}`}
          meta={`${new Date(e.createdAt).toLocaleString()} · ${
            e.actorUserId ? e.actorUserId.slice(0, 8) : t('audit.systemActor')
          }`}
        />
      )}
    />
  );
}
