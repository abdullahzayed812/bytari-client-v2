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
