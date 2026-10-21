import { useAuthStore } from '@/features/auth/store';
import type { VeterinarianStatus } from '@/features/auth/types';
import { organizationsApi } from '@/features/organizations';
import { petsApi } from '@/features/pets';
import { veterinarianApi } from '@/features/veterinarian';
import { useAppModeStore } from '@/store';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import ModeAwareHomeScreen from '../screens/ModeAwareHomeScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function seed(status: VeterinarianStatus) {
  useAuthStore.setState({
    session: {
      user: {
        id: 'u1',
        email: 'e@x.c',
        firstName: 'ريم',
        lastName: 'أحمد',
        phone: null,
        status: 'ACTIVE',
        veterinarianStatus: status,
        traderStatus: 'NOT_REGISTERED' as const,
        createdAt: '',
        updatedAt: '',
      },
      roles: status === 'APPROVED' ? ['PET_OWNER', 'VETERINARIAN'] : ['PET_OWNER'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
      veterinarian: { status, approved: status === 'APPROVED' },
      trader: { status: 'NOT_REGISTERED', approved: false },
    },
  });
}

describe('ModeAwareHomeScreen — APP MODE ≠ ROLE; Pet Owner features never removed', () => {
  beforeEach(() => {
    resetRouterMock();
    jest.spyOn(petsApi, 'list').mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 3, total: 0, totalPages: 1 },
    });
    jest
      .spyOn(veterinarianApi, 'myStatus')
      .mockResolvedValue({ veterinarianStatus: 'APPROVED', application: null });
    jest.spyOn(organizationsApi, 'listMine').mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 1, total: 0, totalPages: 1 },
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    useAppModeStore.setState({ activeMode: 'owner' });
    useAuthStore.setState({ session: null });
  });

  it('owner mode renders the Pet Owner Home', async () => {
    seed('APPROVED');
    useAppModeStore.setState({ activeMode: 'owner' });
    renderWithProviders(<ModeAwareHomeScreen />);
    await waitFor(() => expect(screen.getByText('أرسل استشارتك وسنجيبك فوراً')).toBeOnTheScreen());
  });

  it('owner Home lists "الخدمات" in its Sections (beside poultry), opening the services screen', async () => {
    seed('NOT_APPLIED');
    useAppModeStore.setState({ activeMode: 'owner' });
    renderWithProviders(<ModeAwareHomeScreen />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'الخدمات' })).toBeOnTheScreen());
    for (const name of ['الاستشارات', 'العيادات', 'المتجر', 'المواعيد', 'تواصل معنا', 'الرئيسية']) {
      expect(screen.queryByRole('button', { name })).toBeNull();
    }
    expect(screen.queryByText('كل الأقسام')).toBeNull();
    expect(screen.getByText('خدمات بيطرية متنوعة')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'الخدمات' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/vet-services');
  });

  it('veterinarian Home does not get the Pet Owner services card', async () => {
    seed('APPROVED');
    useAppModeStore.setState({ activeMode: 'veterinarian' });
    renderWithProviders(<ModeAwareHomeScreen />);
    await waitFor(() => expect(screen.getByText('المكاتب أو الشركات البيطرية')).toBeOnTheScreen());
    // Its own "الخدمات" shortcut is unchanged; the Pet Owner card (with its hint) is absent.
    expect(screen.queryByText('خدمات بيطرية متنوعة')).toBeNull();
  });

  it('veterinarian mode renders the Veterinarian Home', async () => {
    seed('APPROVED');
    useAppModeStore.setState({ activeMode: 'veterinarian' });
    renderWithProviders(<ModeAwareHomeScreen />);
    await waitFor(() => expect(screen.getByText('المكاتب أو الشركات البيطرية')).toBeOnTheScreen());
  });

  it('a non-approved user in veterinarian mode falls back to the Pet Owner Home', async () => {
    seed('PENDING');
    useAppModeStore.setState({ activeMode: 'veterinarian' });
    renderWithProviders(<ModeAwareHomeScreen />);
    // useAppMode() self-corrects to owner → Pet Owner Home
    await waitFor(() => expect(screen.getByText('أرسل استشارتك وسنجيبك فوراً')).toBeOnTheScreen());
  });
});
