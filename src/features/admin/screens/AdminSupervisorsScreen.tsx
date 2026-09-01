import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, IconButton } from '@/components/actions';
import { ConfirmationDialog, Skeleton, useToast } from '@/components/feedback';
import { Input, Select } from '@/components/forms';
import { Modal } from '@/components/overlays';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { AdminListScreen, AdminRow, FilterChips } from '../components';
import {
  useAdminSupervisors,
  useAssignSupervisorMutation,
  useRemoveSupervisorMutation,
} from '../hooks';
import { SUPERVISOR_DOMAINS, type SupervisorAssignment, type SupervisorDomain } from '../types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function AdminSupervisorsScreen() {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const toast = useToast();

  const [domain, setDomain] = useState<SupervisorDomain | undefined>(undefined);
  const q = useAdminSupervisors({ domain, status: 'ACTIVE' });
  const assignMut = useAssignSupervisorMutation();
  const removeMut = useRemoveSupervisorMutation();

  const [removing, setRemoving] = useState<SupervisorAssignment | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [assignDomain, setAssignDomain] = useState<SupervisorDomain>('ANIMAL');

  const submitAssign = () => {
    assignMut.mutate(
      { userId: userId.trim(), domain: assignDomain },
      {
        onSuccess: () => {
          toast.show({ message: t('supervisors.toast.assigned'), tone: 'success' });
          setAssignOpen(false);
          setUserId('');
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  const submitRemove = () => {
    if (!removing) return;
    removeMut.mutate(
      { assignmentId: removing.id },
      {
        onSuccess: () => {
          toast.show({ message: t('supervisors.toast.removed'), tone: 'success' });
          setRemoving(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <>
      <AdminListScreen<SupervisorAssignment>
        title={t('supervisors.title')}
        right={
          <IconButton
            icon="add"
            variant="soft"
            accessibilityLabel={t('supervisors.assign')}
            onPress={() => setAssignOpen(true)}
          />
        }
        query={q}
        data={q.assignments}
        keyExtractor={(a) => a.id}
        skeletonRow={
          <View style={{ rowGap: 8, padding: theme.spacing.md }}>
            <Skeleton width="50%" height={16} />
            <Skeleton width="70%" height={12} />
          </View>
        }
        emptyIcon="shield-outline"
        emptyTitle={t('supervisors.empty')}
        emptyMessage={t('supervisors.emptyHint')}
        loadingMoreLabel={t('common.loadingMore')}
        filterBar={
          <FilterChips<SupervisorDomain>
            value={domain}
            onChange={setDomain}
            options={[
              { value: undefined, label: t('users.filter.all') },
              ...SUPERVISOR_DOMAINS.map((d) => ({
                value: d,
                label: t(`supervisors.domain.${d}`),
              })),
            ]}
          />
        }
        renderItem={(a) => (
          <AdminRow
            title={`${a.user.firstName} ${a.user.lastName}`.trim() || a.user.email}
            subtitle={a.user.email}
            badge={{ label: t(`supervisors.domain.${a.domain}`), tone: 'primary' }}
            actions={
              <Button
                label={t('supervisors.remove')}
                variant="danger"
                onPress={() => setRemoving(a)}
              />
            }
          />
        )}
      />

      <ConfirmationDialog
        visible={removing != null}
        title={t('supervisors.removeTitle')}
        message={t('supervisors.removeBody')}
        confirmLabel={t('supervisors.remove')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={removeMut.isPending}
        onConfirm={submitRemove}
        onCancel={() => setRemoving(null)}
      />

      <Modal
        visible={assignOpen}
        onClose={() => setAssignOpen(false)}
        title={t('supervisors.assignTitle')}
        dismissable={!assignMut.isPending}
      >
        <View style={{ rowGap: theme.spacing.md }}>
          <Input
            label={t('supervisors.userIdLabel')}
            placeholder={t('supervisors.userIdPlaceholder')}
            value={userId}
            onChangeText={setUserId}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Select
            label={t('supervisors.domainLabel')}
            value={assignDomain}
            onChange={(v) => setAssignDomain(v as SupervisorDomain)}
            options={SUPERVISOR_DOMAINS.map((d) => ({
              value: d,
              label: t(`supervisors.domain.${d}`),
            }))}
          />
          <Button
            label={t('supervisors.assign')}
            variant="primary"
            fullWidth
            loading={assignMut.isPending}
            disabled={!UUID_RE.test(userId.trim())}
            onPress={submitAssign}
          />
        </View>
      </Modal>
    </>
  );
}
