import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { organizationsApi } from '../api';
import MyVeterinaryOrganizationsScreen from '../screens/MyVeterinaryOrganizationsScreen';
import type { MyOrganization } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function org(over: Partial<MyOrganization>): MyOrganization {
  return {
    id: 'o1',
    type: 'CLINIC',
    name: 'عيادة الرحمة',
    description: null,
    ownerUserId: 'u1',
    status: 'ACTIVE',
    decidedBy: null,
    decidedAt: null,
    decisionReason: null,
    createdAt: '',
    updatedAt: '',
    myRole: 'OWNER',
    ...over,
  };
}

describe('MyVeterinaryOrganizationsScreen — card navigation', () => {
  const list = jest.spyOn(organizationsApi, 'listMine');

  beforeEach(() => {
    resetRouterMock();
    list.mockReset().mockResolvedValue({
      items: [
        org({ id: 'c1', type: 'CLINIC', name: 'عيادة الرحمة' }),
        org({ id: 'v1', type: 'VETERINARY_OFFICE', name: 'مكتب الشفاء' }),
      ],
      meta: { page: 1, pageSize: 50, total: 2, totalPages: 1 },
    });
  });
  afterAll(() => jest.restoreAllMocks());

  it('a CLINIC card opens the Clinic Dashboard with that clinic id', async () => {
    renderWithProviders(<MyVeterinaryOrganizationsScreen />);
    await waitFor(() => expect(screen.getByText('عيادة الرحمة')).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('button', { name: 'عيادة الرحمة' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/clinic-dashboard/c1');
  });

  it('the CLINIC card’s "دخول لوحة التحكم" also opens the Clinic Dashboard', async () => {
    renderWithProviders(<MyVeterinaryOrganizationsScreen />);
    await waitFor(() => expect(screen.getByText('عيادة الرحمة')).toBeOnTheScreen());
    fireEvent.press(screen.getAllByRole('button', { name: 'دخول لوحة التحكم' })[0]!);
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/clinic-dashboard/c1');
  });

  it('a VETERINARY_OFFICE card still opens the office dashboard (unchanged)', async () => {
    renderWithProviders(<MyVeterinaryOrganizationsScreen />);
    await waitFor(() => expect(screen.getByText('مكتب الشفاء')).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('button', { name: 'مكتب الشفاء' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/vet-office-dashboard/v1');
  });
});

describe('MyVeterinaryOrganizationsScreen — leaving an organization', () => {
  // Spied per test: the previous block's `restoreAllMocks` would undo
  // describe-time spies before these tests run.
  let list: jest.SpyInstance;
  let leave: jest.SpyInstance;
  const memberOf = [
    org({ id: 'c1', type: 'CLINIC', name: 'عيادة الرحمة', myRole: 'VETERINARIAN' }),
    org({ id: 'v1', type: 'VETERINARY_OFFICE', name: 'مكتب الشفاء', myRole: 'STAFF' }),
    org({ id: 'f1', type: 'FARM', name: 'مزرعة النور', myRole: 'VETERINARIAN' }),
    org({ id: 'c2', type: 'CLINIC', name: 'عيادتي', myRole: 'OWNER' }),
  ];
  const pageOf = (items: MyOrganization[]) => ({
    items,
    meta: { page: 1, pageSize: 50, total: items.length, totalPages: 1 },
  });

  beforeEach(() => {
    resetRouterMock();
    list = jest.spyOn(organizationsApi, 'listMine').mockResolvedValue(pageOf(memberOf));
    leave = jest.spyOn(organizationsApi, 'leave');
  });
  afterEach(() => jest.restoreAllMocks());

  it('offers "leave" on clinics, offices and farms the user is a member of — never on owned ones', async () => {
    renderWithProviders(<MyVeterinaryOrganizationsScreen />);
    await waitFor(() => expect(screen.getByText('عيادتي')).toBeOnTheScreen());
    expect(screen.getAllByText('مغادرة العيادة')).toHaveLength(1); // c1 only, not the owned c2
    expect(screen.getByText('مغادرة المكتب أو الشركة البيطرية')).toBeOnTheScreen();
    expect(screen.getByText('مغادرة المزرعة')).toBeOnTheScreen();
  });

  it('asks for confirmation naming the organization, then leaves and refreshes the list', async () => {
    leave.mockResolvedValue({ success: true });
    renderWithProviders(<MyVeterinaryOrganizationsScreen />);
    await waitFor(() => expect(screen.getByText('مغادرة المزرعة')).toBeOnTheScreen());

    fireEvent.press(screen.getByText('مغادرة المزرعة'));
    expect(screen.getByText('مغادرة مزرعة النور')).toBeOnTheScreen();
    expect(screen.getByText(/سيتم إنهاء عضويتك في «مزرعة النور»/)).toBeOnTheScreen();
    expect(leave).not.toHaveBeenCalled();

    list.mockResolvedValue(pageOf(memberOf.filter((o) => o.id !== 'f1')));
    fireEvent.press(screen.getByRole('button', { name: 'مغادرة' }));
    await waitFor(() => expect(leave).toHaveBeenCalledWith('f1'));
    await waitFor(() => expect(screen.getByText('تمت مغادرة «مزرعة النور».')).toBeOnTheScreen());
    await waitFor(() => expect(screen.queryByText('مزرعة النور')).toBeNull());
  });

  it('cancelling the dialog does nothing', async () => {
    renderWithProviders(<MyVeterinaryOrganizationsScreen />);
    await waitFor(() => expect(screen.getByText('مغادرة العيادة')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('مغادرة العيادة'));
    fireEvent.press(screen.getByRole('button', { name: 'إلغاء' }));
    expect(leave).not.toHaveBeenCalled();
    expect(screen.getByText('عيادة الرحمة')).toBeOnTheScreen();
  });

  it('a backend refusal (e.g. owner / not a member) is shown and the organization stays', async () => {
    const { ApiError } = jest.requireActual('@/services/api');
    leave.mockRejectedValue(
      new ApiError({ code: 'CONFLICT', message: 'owner cannot leave', status: 409 }),
    );
    renderWithProviders(<MyVeterinaryOrganizationsScreen />);
    await waitFor(() => expect(screen.getByText('مغادرة العيادة')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('مغادرة العيادة'));
    fireEvent.press(screen.getByRole('button', { name: 'مغادرة' }));
    await waitFor(() => expect(leave).toHaveBeenCalledWith('c1'));
    await waitFor(() => expect(screen.getByText(/تعارض مع الحالة الحالية/)).toBeOnTheScreen());
    expect(screen.getByText('عيادة الرحمة')).toBeOnTheScreen();
  });
});

describe('MyVeterinaryOrganizationsScreen — "طلب تجديد الاشتراك" is owner-only', () => {
  let list: jest.SpyInstance;
  beforeEach(() => {
    resetRouterMock();
    list = jest.spyOn(organizationsApi, 'listMine');
  });
  afterEach(() => list.mockRestore());

  it('never shows renewal to a clinic / office veterinarian, supervisor or employee — even when expired', async () => {
    const roles = ['VETERINARIAN', 'SUPERVISOR', 'STAFF'] as const;
    const items = roles.flatMap((role) =>
      (['CLINIC', 'VETERINARY_OFFICE'] as const).map((type) =>
        org({ id: `${type}-${role}`, type, name: `${type}-${role}`, myRole: role }),
      ),
    );
    list.mockResolvedValue({
      items: items.map((o) => ({ ...o, subscriptionStatus: 'EXPIRED' })),
      meta: { page: 1, pageSize: 50, total: items.length, totalPages: 1 },
    });
    renderWithProviders(<MyVeterinaryOrganizationsScreen />);
    await waitFor(() => expect(screen.getByText('CLINIC-STAFF')).toBeOnTheScreen());
    expect(screen.getAllByText('منتهي').length).toBe(items.length);
    expect(screen.queryByText('طلب تجديد الاشتراك')).toBeNull();
  });

  it('the owner of an expired clinic / office does get it, and it opens the renewal screen', async () => {
    list.mockResolvedValue({
      items: [
        { ...org({ id: 'c1', type: 'CLINIC', name: 'عيادتي' }), subscriptionStatus: 'EXPIRED' },
        {
          ...org({ id: 'v1', type: 'VETERINARY_OFFICE', name: 'مكتبي' }),
          subscriptionStatus: 'EXPIRED',
        },
      ],
      meta: { page: 1, pageSize: 50, total: 2, totalPages: 1 },
    });
    renderWithProviders(<MyVeterinaryOrganizationsScreen />);
    await waitFor(() => expect(screen.getByText('عيادتي')).toBeOnTheScreen());
    const renew = screen.getAllByText('طلب تجديد الاشتراك');
    expect(renew).toHaveLength(2);
    fireEvent.press(renew[0]!);
    expect(routerMock.push).toHaveBeenCalledWith(
      expect.stringContaining('/organizations/c1/subscription-renewal'),
    );
  });
});
