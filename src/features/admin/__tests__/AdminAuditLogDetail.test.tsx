import { apiClient } from '@/services/api';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { adminApi } from '../api';
import { DeleteUserDialog } from '../components';
import AdminAuditLogDetailScreen, { formatAuditValue } from '../screens/AdminAuditLogDetailScreen';
import AdminAuditLogScreen from '../screens/AdminAuditLogScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const entry = {
  id: 'e1',
  actorUserId: 'u-admin',
  actorName: 'Admin One',
  actorExists: true,
  action: 'USER_SUSPENDED',
  entityType: 'USER',
  entityId: 'u-target',
  metadata: {
    reason: 'policy violation',
    newPassword: '[redacted]',
    changes: { email: 'a@b.test', nested: [1, 2] },
  },
  ip: null,
  userAgent: null,
  requestId: 'req-123',
  organization: { id: 'o1', name: 'Clinic Z', type: 'CLINIC' },
  createdAt: '2026-10-11T10:00:00.000Z',
};

beforeEach(() => {
  resetRouterMock();
  jest.restoreAllMocks();
});

describe('Admin audit log — details', () => {
  it('a list row opens the details screen (and runs no action)', async () => {
    const post = jest.spyOn(apiClient, 'post');
    jest.spyOn(adminApi, 'listAuditLog').mockResolvedValue({
      items: [entry],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<AdminAuditLogScreen />);
    const row = await screen.findByText(/Admin One/);
    fireEvent.press(row);
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/admin/audit-logs/e1');
    expect(post).not.toHaveBeenCalled();
  });

  it('shows the available fields, formats structured metadata and skips missing ones', async () => {
    setSearchParams({ id: 'e1' });
    const get = jest.spyOn(adminApi, 'getAuditLog').mockResolvedValue(entry);
    renderWithProviders(<AdminAuditLogDetailScreen />);
    await waitFor(() => expect(get).toHaveBeenCalledWith('e1'));
    expect(await screen.findByText('Admin One')).toBeTruthy();
    expect(screen.getByText('u-target')).toBeTruthy();
    expect(screen.getByText('Clinic Z')).toBeTruthy();
    expect(screen.getByText('req-123')).toBeTruthy();
    expect(screen.getByText('policy violation')).toBeTruthy();
    // server-redacted value is shown as-is, never a secret
    expect(screen.getByText('[redacted]')).toBeTruthy();
    expect(screen.getByText(formatAuditValue(entry.metadata.changes))).toBeTruthy();
    // ip / user agent are absent → their rows are not rendered
    expect(screen.queryByText(/IP/)).toBeNull();
  });

  it('formatAuditValue pretty-prints objects and dashes empty values', () => {
    expect(formatAuditValue(null)).toBe('—');
    expect(formatAuditValue('')).toBe('—');
    expect(formatAuditValue(3)).toBe('3');
    expect(formatAuditValue({ a: 1 })).toBe('{\n  "a": 1\n}');
  });
});

describe('DeleteUserDialog', () => {
  it('enables the destructive button only after the exact e-mail is typed', () => {
    const onConfirm = jest.fn();
    renderWithProviders(
      <DeleteUserDialog
        visible
        name="Sara Ali"
        email="sara@example.com"
        loading={false}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByText('Sara Ali')).toBeTruthy();
    const confirm = () => screen.getByRole('button', { name: 'حذف نهائياً' });
    expect(confirm()).toBeDisabled();
    fireEvent.changeText(screen.getByPlaceholderText('sara@example.com'), 'someone@else.com');
    expect(confirm()).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByPlaceholderText('sara@example.com'), 'SARA@example.com ');
    expect(confirm()).not.toBeDisabled();
    fireEvent.press(confirm(), { stopPropagation: jest.fn() });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
