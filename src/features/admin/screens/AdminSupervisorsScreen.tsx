import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, IconButton } from '@/components/actions';
import { ConfirmationDialog, Skeleton, useToast } from '@/components/feedback';
import { Checkbox, Input } from '@/components/forms';
import { Caption } from '@/components/typography';
import { Modal } from '@/components/overlays';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';

import { AdminListScreen, AdminRow, FilterChips } from '../components';
import { adminApi } from '../api';
import {
  useAdminSupervisors,
  useRemoveSupervisorMutation,
  useSetSupervisorDomainsMutation,
  useSupervisorDomainCatalogue,
} from '../hooks';
import { SUPERVISOR_DOMAINS, type SupervisorAssignment, type SupervisorDomain } from '../types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminSupervisorsScreen() {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const toast = useToast();

  const [domain, setDomain] = useState<SupervisorDomain | undefined>(undefined);
  const q = useAdminSupervisors({ domain, status: 'ACTIVE' });
  const assignMut = useSetSupervisorDomainsMutation();
  const removeMut = useRemoveSupervisorMutation();
  // The sections come from the server catalogue (every assignable Admin
  // management area); the constant is only an offline fallback.
  const catalogue = useSupervisorDomainCatalogue();
  const allDomains: readonly SupervisorDomain[] =
    catalogue.data?.map((d) => d.domain) ?? SUPERVISOR_DOMAINS;

  const [removing, setRemoving] = useState<SupervisorAssignment | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [email, setEmail] = useState('');
  /** Set when editing an existing supervisor's sections (email is then fixed). */
  const [editingUser, setEditingUser] = useState<SupervisorAssignment['user'] | null>(null);
  const [selected, setSelected] = useState<SupervisorDomain[]>([]);

  const toggle = (d: SupervisorDomain) =>
    setSelected((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  const openCreate = () => {
    setEditingUser(null);
    setEmail('');
    setSelected([]);
    setAssignOpen(true);
  };

  const openEdit = async (a: SupervisorAssignment) => {
    setEditingUser(a.user);
    setEmail(a.user.email);
    setAssignOpen(true);
    try {
      const page = await adminApi.listSupervisors({
        page: 1,
        pageSize: 50,
        userId: a.userId,
        status: 'ACTIVE',
      });
      setSelected(page.items.map((x) => x.domain));
    } catch (e) {
      toast.show({ message: apiErrorMessage(e), tone: 'danger' });
    }
  };

  const submitAssign = () => {
    assignMut.mutate(
      editingUser
        ? { userId: editingUser.id, domains: selected }
        : { email: email.trim(), domains: selected },
      {
        onSuccess: () => {
          toast.show({ message: t('supervisors.toast.assigned'), tone: 'success' });
          setAssignOpen(false);
          setEmail('');
          setEditingUser(null);
        },
        onError: (e) =>
          toast.show({
            message:
              e instanceof ApiError && e.status === 404
                ? t('supervisors.emailNotFound')
                : apiErrorMessage(e),
            tone: 'danger',
          }),
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
            onPress={openCreate}
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
              ...allDomains.map((d) => ({
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
              <>
                <Button
                  label={t('supervisors.editSections')}
                  variant="outline"
                  onPress={() => void openEdit(a)}
                />
                <Button
                  label={t('supervisors.remove')}
                  variant="danger"
                  onPress={() => setRemoving(a)}
                />
              </>
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
        title={editingUser ? t('supervisors.editSections') : t('supervisors.assignTitle')}
        dismissable={!assignMut.isPending}
      >
        <View style={{ rowGap: theme.spacing.md }}>
          <Input
            label={t('supervisors.emailLabel')}
            placeholder={t('supervisors.emailPlaceholder')}
            hint={t('supervisors.emailHint')}
            value={email}
            onChangeText={setEmail}
            editable={editingUser == null}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Caption>{t('supervisors.sectionsHint')}</Caption>
          <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ rowGap: theme.spacing.sm }}>
            {allDomains.map((d) => (
              <Checkbox
                key={d}
                label={t(`supervisors.domain.${d}`)}
                checked={selected.includes(d)}
                onChange={() => toggle(d)}
              />
            ))}
          </ScrollView>
          <Button
            label={editingUser ? t('supervisors.saveSections') : t('supervisors.assign')}
            variant="primary"
            fullWidth
            loading={assignMut.isPending}
            disabled={
              !EMAIL_RE.test(email.trim()) || (editingUser == null && selected.length === 0)
            }
            onPress={submitAssign}
          />
        </View>
      </Modal>
    </>
  );
}
