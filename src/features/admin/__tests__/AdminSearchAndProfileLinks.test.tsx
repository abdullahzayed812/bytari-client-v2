import { initI18n } from '@/i18n';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { adminApi } from '../api';
import { AdminUserLink, DELETED_USER_ID, ViewUserProfileButton } from '../components';
import AdminOrganizationsScreen from '../screens/AdminOrganizationsScreen';
import AdminOrganizationDetailScreen from '../screens/AdminOrganizationDetailScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

let mockCanReadUsers = true;
jest.mock('@/hooks', () => ({
  ...jest.requireActual('@/hooks'),
  useCapabilities: () => ({
    isAdmin: mockCanReadUsers,
    isModerator: false,
    supervisorDomains: [],
    isSupervisorOf: () => false,
    can: () => mockCanReadUsers,
  }),
}));

let mockOwner: { id: string } | null = { id: 'owner-1' };
jest.mock('../hooks', () => ({
  ...jest.requireActual('../hooks'),
  useAdminOrganization: () => ({
    isLoading: false,
    isError: false,
    data: {
      id: 'o1',
      name: 'عيادة الشفاء',
      type: 'CLINIC',
      status: 'ACTIVE',
      description: null,
      ownerUserId: 'owner-1',
      owner: mockOwner
        ? {
            ...mockOwner,
            firstName: 'هدى',
            lastName: 'المالكة',
            email: 'huda@example.test',
            phone: null,
            country: null,
            governorate: null,
            avatarUrl: null,
          }
        : null,
      details: {},
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
      termsAcceptances: [],
    },
  }),
  useAdminOrganizationMembers: () => ({
    isLoading: false,
    data: [
      {
        id: 'm1',
        organizationId: 'o1',
        userId: 'vet-7',
        roleKey: 'VETERINARIAN',
        status: 'ACTIVE',
        addedBy: null,
        createdAt: '',
        updatedAt: '',
        user: { id: 'vet-7', email: 'vet@example.test', firstName: 'سامر', lastName: 'الطبيب' },
      },
    ],
  }),
  useAdminFarmRenewals: () => ({ requests: [] }),
  useOrgDecisionMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useSetFarmSubscriptionMutation: () => ({ mutate: jest.fn(), isPending: false }),
}));

const listOrganizations = jest.spyOn(adminApi, 'listOrganizations');
const listPending = jest.spyOn(adminApi, 'listPendingOrganizations');
const ORG = {
  id: 'o1',
  type: 'CLINIC' as const,
  name: 'عيادة الشفاء',
  description: null,
  ownerUserId: 'owner-1',
  status: 'ACTIVE' as const,
  decidedBy: null,
  decidedAt: null,
  decisionReason: null,
  createdAt: '',
  updatedAt: '',
};
const page = <T,>(items: T[]) => ({
  items,
  meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 },
});

beforeAll(() => initI18n('ar'));
beforeEach(() => {
  resetRouterMock();
  mockCanReadUsers = true;
  mockOwner = { id: 'owner-1' };
  listOrganizations.mockReset().mockResolvedValue(page([ORG]));
  listPending.mockReset().mockResolvedValue(page([]));
});
afterAll(() => jest.restoreAllMocks());

describe('§18 admin section search', () => {
  it('sends the debounced term to the server within the section type, keeping the tab', async () => {
    setSearchParams({ type: 'CLINIC' });
    renderWithProviders(<AdminOrganizationsScreen />);
    await waitFor(() => expect(listOrganizations).toHaveBeenCalledTimes(1));

    listOrganizations.mockResolvedValue(page([]));
    fireEvent.changeText(
      screen.getByLabelText('ابحث بالاسم أو المالك أو البريد أو الهاتف…'),
      '  huda@example.test ',
    );
    await waitFor(() =>
      expect(listOrganizations).toHaveBeenLastCalledWith(
        expect.objectContaining({ type: 'CLINIC', search: 'huda@example.test' }),
      ),
    );
    // an empty result reads "no matches", not "no organizations"
    expect(await screen.findByText('لا توجد نتائج مطابقة لـ «huda@example.test»')).toBeTruthy();

    // switching to the pending tab keeps the term AND the section type
    fireEvent.press(screen.getByText('بانتظار المراجعة'));
    await waitFor(() =>
      expect(listPending).toHaveBeenLastCalledWith(
        expect.objectContaining({ type: 'CLINIC', search: 'huda@example.test' }),
      ),
    );
  });
});

describe('§21 owner profile from organization management', () => {
  it('list rows open the owner by the real ownerUserId', async () => {
    setSearchParams({ type: 'CLINIC' });
    renderWithProviders(<AdminOrganizationsScreen />);
    fireEvent.press(await screen.findByText('عرض ملف المالك'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/admin/users/owner-1');
    // …not the organization file (the row's own action)
    expect(routerMock.push).not.toHaveBeenCalledWith('/(app)/admin/organizations/o1');
  });

  it('the detail page marks the primary owner and links every member', () => {
    renderWithProviders(<AdminOrganizationDetailScreen />);
    expect(screen.getByText('المالك الأساسي')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'عرض ملف المالك' }));
    expect(routerMock.push).toHaveBeenLastCalledWith('/(app)/admin/users/owner-1');
    fireEvent.press(screen.getByText('سامر الطبيب'));
    expect(routerMock.push).toHaveBeenLastCalledWith('/(app)/admin/users/vet-7');
  });

  it('a missing owner shows a clear fallback instead of a broken action', () => {
    mockOwner = null;
    renderWithProviders(<AdminOrganizationDetailScreen />);
    expect(screen.getByText('لا يوجد مالك مرتبط بهذه المؤسسة')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'عرض ملف المالك' })).toBeNull();
  });

  it('without user.read there is no profile action at all', async () => {
    mockCanReadUsers = false;
    renderWithProviders(<ViewUserProfileButton userId="owner-1" />);
    expect(screen.queryByRole('button', { name: 'عرض ملف المستخدم' })).toBeNull();
  });
});

describe('§19 message sender → admin profile', () => {
  it('a sender name opens that user id; a deleted sender is plain text', async () => {
    renderWithProviders(
      <>
        <AdminUserLink userId="sender-9" name="نور المرسلة" />
        <AdminUserLink userId={DELETED_USER_ID} name="ignored" />
      </>,
    );
    fireEvent.press(screen.getByRole('link'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/admin/users/sender-9');
    expect(screen.getByText('حساب محذوف')).toBeTruthy();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('without user.read the name is shown but not linked', () => {
    mockCanReadUsers = false;
    renderWithProviders(<AdminUserLink userId="sender-9" name="نور المرسلة" />);
    expect(screen.getByText('نور المرسلة')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
