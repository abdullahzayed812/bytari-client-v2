import { useAuthStore } from '@/features/auth/store';
import type { SessionSnapshot } from '@/features/auth/types';
import { useAppModeStore } from '@/store';
import { renderWithProviders, screen, fireEvent } from '@/test-utils/render';
import { resetRouterMock, expoRouter } from '@/test-utils/routerMock';

import CategoriesTabScreen from '../screens/CategoriesTabScreen';
import MoreHubScreen from '../screens/MoreHubScreen';
import PetOwnerCategoriesScreen from '../screens/PetOwnerCategoriesScreen';
import ServicesHubScreen from '../screens/ServicesHubScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function session(overrides: Partial<SessionSnapshot>): SessionSnapshot {
  return {
    user: {
      id: 'me',
      email: 'me@example.test',
      firstName: 'نورة',
      lastName: 'القحطاني',
      phone: null,
      status: 'ACTIVE',
      veterinarianStatus: 'NOT_APPLIED',
      traderStatus: 'NOT_REGISTERED' as const,
      createdAt: '',
      updatedAt: '',
    },
    roles: ['PET_OWNER'],
    permissions: [],
    isAdmin: false,
    supervisorDomains: [],
    veterinarian: { status: 'NOT_APPLIED', approved: false },
    trader: { status: 'NOT_REGISTERED', approved: false },
    ...overrides,
  };
}

beforeEach(() => {
  resetRouterMock();
  useAppModeStore.setState({ activeMode: 'owner' });
});
afterAll(() => {
  useAuthStore.setState({ session: null });
  useAppModeStore.setState({ activeMode: 'owner' });
});

describe('ServicesHubScreen — no dead ends, capability-aware', () => {
  it('a pet owner sees core services and can open Consultations', () => {
    useAuthStore.setState({ session: session({}) });
    renderWithProviders(<ServicesHubScreen />);

    expect(screen.getByText('الاستشارات')).toBeTruthy();
    expect(screen.getByText('المكتبة المعرفية')).toBeTruthy();
    expect(screen.getByText('كن طبيباً بيطرياً')).toBeTruthy();
    // Vet-only entries hidden for a non-vet:
    expect(screen.queryByText('الاستفسارات')).toBeNull();

    fireEvent.press(screen.getByText('الاستشارات'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/support/consultations');
  });

  it('an approved vet additionally sees Inquiries and Join-farm', () => {
    const s = session({ roles: ['PET_OWNER', 'VETERINARIAN'] });
    s.user.veterinarianStatus = 'APPROVED';
    s.veterinarian = { status: 'APPROVED', approved: true };
    useAuthStore.setState({ session: s });
    renderWithProviders(<ServicesHubScreen />);

    expect(screen.getByText('الاستفسارات')).toBeTruthy();
    expect(screen.getByText('الانضمام إلى مزرعة')).toBeTruthy();
    expect(screen.queryByText('كن طبيباً بيطرياً')).toBeNull();
  });
});

describe('PetOwnerCategoriesScreen — "كل الأقسام" grid', () => {
  it('renders the header and deep-links a live category to its existing route', () => {
    useAuthStore.setState({ session: session({}) });
    renderWithProviders(<PetOwnerCategoriesScreen />);

    expect(screen.getByText('كل الأقسام')).toBeTruthy();
    expect(
      screen.getByText('جميع أدواتك وإمكانياتك في مكان واحد لأصحاب الحيوانات والمزارع'),
    ).toBeTruthy();
    expect(screen.getByText('الحيوانات الأليفة')).toBeTruthy();

    fireEvent.press(screen.getByText('الاستشارات'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/support/consultations');

    fireEvent.press(screen.getByText('المتجر'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/pet-owner-store');

    fireEvent.press(screen.getByText('العيادات'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/organizations/discover');

    fireEvent.press(screen.getByText('المواعيد'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/clinic-appointments');

    fireEvent.press(screen.getByText('الإعدادات'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/settings');

    fireEvent.press(screen.getByText('تواصل معنا'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/contact');
  });

  it('deep-links the Veterinary Services section to its hub', () => {
    useAuthStore.setState({ session: session({}) });
    renderWithProviders(<PetOwnerCategoriesScreen />);

    fireEvent.press(screen.getByText('الخدمات'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/vet-services');
  });
});

describe('CategoriesTabScreen — leftmost tab is mode-aware', () => {
  it('shows the category grid in Pet Owner mode', () => {
    useAuthStore.setState({ session: session({}) });
    useAppModeStore.setState({ activeMode: 'owner' });
    renderWithProviders(<CategoriesTabScreen />);

    expect(screen.getByText('كل الأقسام')).toBeTruthy();
    // the old Services hub headings are not rendered in owner mode
    expect(screen.queryByText('الرعاية والدعم')).toBeNull();
  });

  it('keeps the Services hub in Veterinarian mode', () => {
    const s = session({ roles: ['PET_OWNER', 'VETERINARIAN'] });
    s.user.veterinarianStatus = 'APPROVED';
    s.veterinarian = { status: 'APPROVED', approved: true };
    useAuthStore.setState({ session: s });
    useAppModeStore.setState({ activeMode: 'veterinarian' });
    renderWithProviders(<CategoriesTabScreen />);

    expect(screen.getByText('الرعاية والدعم')).toBeTruthy();
    expect(screen.queryByText('كل الأقسام')).toBeNull();
  });
});

describe('MoreHubScreen', () => {
  it('shows account utilities; Management only for admins', () => {
    useAuthStore.setState({ session: session({}) });
    const { rerender } = renderWithProviders(<MoreHubScreen />);

    expect(screen.getByText('الإشعارات')).toBeTruthy();
    expect(screen.queryByText('مركز الإدارة')).toBeNull();

    useAuthStore.setState({ session: session({ isAdmin: true }) });
    rerender(<MoreHubScreen />);
    expect(screen.getByText('مركز الإدارة')).toBeTruthy();

    fireEvent.press(screen.getByText('الإشعارات'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/notifications');
  });
});
