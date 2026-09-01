import { useAuthStore } from '@/features/auth/store';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { organizationsApi } from '../api';
import OrganizationMembersScreen from '../screens/OrganizationMembersScreen';
import type { OrganizationDetail, OrganizationMember } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const detail: OrganizationDetail = {
  id: 'o1',
  type: 'CLINIC',
  name: 'عيادة',
  description: null,
  ownerUserId: 'u1',
  status: 'ACTIVE',
  decidedBy: null,
  decidedAt: null,
  decisionReason: null,
  createdAt: '',
  updatedAt: '',
  details: {},
  myRole: 'OWNER',
};

const mkMember = (over: Partial<OrganizationMember>): OrganizationMember => ({
  id: 'm1',
  organizationId: 'o1',
  userId: 'u2',
  roleKey: 'STAFF',
  status: 'ACTIVE',
  addedBy: 'u1',
  createdAt: '',
  updatedAt: '',
  user: { id: 'u2', email: 'staff@x.c', firstName: 'سالم', lastName: 'ع' },
  ...over,
});

describe('OrganizationMembersScreen (§28)', () => {
  const get = jest.spyOn(organizationsApi, 'get');
  const listMembers = jest.spyOn(organizationsApi, 'listMembers');
  const removeMember = jest.spyOn(organizationsApi, 'removeMember');

  beforeEach(() => {
    resetRouterMock();
    get.mockReset().mockResolvedValue(detail);
    listMembers.mockReset();
    removeMember.mockReset();
    setSearchParams({ organizationId: 'o1' });
    useAuthStore.setState({ session: null });
  });
  afterAll(() => jest.restoreAllMocks());

  const owner = mkMember({
    id: 'm0',
    userId: 'u1',
    roleKey: 'OWNER',
    user: { id: 'u1', email: 'owner@x.c', firstName: 'ريم', lastName: 'أ' },
  });
  const staff = mkMember({});

  it('lists members and protects the owner membership', async () => {
    listMembers.mockResolvedValue({
      items: [owner, staff],
      meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
    renderWithProviders(<OrganizationMembersScreen />);
    await waitFor(() => expect(screen.getByText('staff@x.c')).toBeOnTheScreen());
    expect(screen.getByText('لا يمكن تعديل عضوية المالك.')).toBeOnTheScreen();
  });

  it('the add CTA navigates to the add-member route', async () => {
    listMembers.mockResolvedValue({
      items: [owner],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<OrganizationMembersScreen />);
    await waitFor(() => expect(screen.getByText('owner@x.c')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('إضافة عضو'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/o1/members/add');
  });

  it('removing a member opens a confirm dialog then calls the backend', async () => {
    listMembers.mockResolvedValue({
      items: [staff],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    removeMember.mockResolvedValue({ success: true });
    renderWithProviders(<OrganizationMembersScreen />);
    await waitFor(() => expect(screen.getByText('staff@x.c')).toBeOnTheScreen());

    fireEvent.press(screen.getByLabelText('إدارة سالم ع'));
    fireEvent.press(screen.getByText('إزالة العضو'));
    // confirm dialog is now visible…
    await waitFor(() =>
      expect(
        screen.getByText('سيفقد هذا العضو وصوله إلى المؤسسة. يمكن إعادة إضافته لاحقاً.'),
      ).toBeOnTheScreen(),
    );
    // …press its confirm button (the dialog copy of the label, rendered last)
    const confirmButtons = screen.getAllByText('إزالة العضو');
    fireEvent.press(confirmButtons[confirmButtons.length - 1]!);

    await waitFor(() => expect(removeMember).toHaveBeenCalledWith('o1', 'm1'));
  });
});
