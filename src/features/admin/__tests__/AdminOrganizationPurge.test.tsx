import { initI18n } from '@/i18n';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import AdminOrganizationDetailScreen from '../screens/AdminOrganizationDetailScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const mockMutate = jest.fn();
let mockStatus = 'DEACTIVATED';
let mockType = 'VETERINARY_OFFICE';
let mockIsAdmin = true;

jest.mock('../hooks', () => ({
  ...jest.requireActual('../hooks'),
  useFarmRenewalDecisionMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useAdminOrganization: () => ({
    isLoading: false,
    isError: false,
    data: {
      id: 'o1',
      name: 'مكتب الشفاء',
      type: mockType,
      status: mockStatus,
      description: null,
      ownerUserId: 'u1',
      owner: null,
      details: {},
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
      termsAcceptances: [],
    },
  }),
  useAdminOrganizationMembers: () => ({ data: [], isLoading: false }),
  useAdminFarmRenewals: () => ({ requests: [] }),
  useOrgDecisionMutation: () => ({ mutate: mockMutate, isPending: false }),
  useSetFarmSubscriptionMutation: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('@/hooks', () => ({
  ...jest.requireActual('@/hooks'),
  useCapabilities: () => ({ isAdmin: mockIsAdmin, can: () => mockIsAdmin }),
}));

beforeAll(() => initI18n('ar'));
beforeEach(() => {
  resetRouterMock();
  mockMutate.mockReset();
  mockStatus = 'DEACTIVATED';
  mockType = 'VETERINARY_OFFICE';
  mockIsAdmin = true;
});

describe('Admin organization — permanent delete ("حذف نهائي")', () => {
  it('a deleted office offers "حذف نهائي"; confirming purges it and leaves the screen', async () => {
    mockMutate.mockImplementation((_input, opts: { onSuccess: () => void }) => opts.onSuccess());
    renderWithProviders(<AdminOrganizationDetailScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'حذف نهائي' }));
    expect(screen.getByText('حذف المؤسسة نهائياً')).toBeOnTheScreen();
    const buttons = screen.getAllByRole('button', { name: 'حذف نهائي' });
    fireEvent.press(buttons[buttons.length - 1]!);

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith({ decision: 'purge' }, expect.anything()),
    );
    expect(routerMock.back).toHaveBeenCalled();
  });

  it('not offered before the soft delete, for other types, or without the ADMIN permission', () => {
    mockStatus = 'ACTIVE';
    const active = renderWithProviders(<AdminOrganizationDetailScreen />);
    expect(screen.queryByRole('button', { name: 'حذف نهائي' })).toBeNull();
    expect(screen.getByRole('button', { name: 'حذف المؤسسة' })).toBeOnTheScreen();
    active.unmount();

    mockStatus = 'DEACTIVATED';
    mockType = 'SYNDICATE';
    const syndicate = renderWithProviders(<AdminOrganizationDetailScreen />);
    expect(screen.queryByRole('button', { name: 'حذف نهائي' })).toBeNull();
    syndicate.unmount();

    mockType = 'CLINIC';
    mockIsAdmin = false;
    renderWithProviders(<AdminOrganizationDetailScreen />);
    expect(screen.queryByRole('button', { name: 'حذف نهائي' })).toBeNull();
  });
});
