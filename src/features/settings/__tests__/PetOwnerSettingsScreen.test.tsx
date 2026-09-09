import { notificationsApi } from '@/features/notifications';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import PetOwnerSettingsScreen from '../screens/PetOwnerSettingsScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const getPrefs = jest.spyOn(notificationsApi, 'getPreferences');

beforeEach(() => {
  resetRouterMock();
  getPrefs.mockReset().mockResolvedValue({ pushEnabled: true, updatedAt: '' });
});
afterAll(() => jest.restoreAllMocks());

describe('PetOwnerSettingsScreen — "الإعدادات"', () => {
  it('renders the reference rows', async () => {
    renderWithProviders(<PetOwnerSettingsScreen />);
    expect(screen.getByText('اللغة')).toBeTruthy();
    expect(screen.getByText('الإشعارات')).toBeTruthy();
    expect(screen.getByText('الخصوصية والأمان')).toBeTruthy();
    expect(screen.getByText('تغيير كلمة المرور')).toBeTruthy();
    expect(screen.getByText('مظهر التطبيق')).toBeTruthy();
    expect(screen.getByText('مساعدة')).toBeTruthy();
    expect(screen.getByText('عن التطبيق')).toBeTruthy();
    expect(screen.getByText('تسجيل الخروج')).toBeTruthy();
    await waitFor(() => expect(getPrefs).toHaveBeenCalled());
  });

  it('help opens the Contact page and about opens the About screen', () => {
    renderWithProviders(<PetOwnerSettingsScreen />);
    fireEvent.press(screen.getByText('مساعدة'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/contact');
    fireEvent.press(screen.getByText('عن التطبيق'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/settings/about');
  });

  it('unbuilt rows show a "coming soon" toast and do not navigate', () => {
    renderWithProviders(<PetOwnerSettingsScreen />);
    fireEvent.press(screen.getByText('الخصوصية والأمان'));
    expect(screen.getByText('هذا القسم غير متاح حالياً.')).toBeTruthy();
    fireEvent.press(screen.getByText('تغيير كلمة المرور'));
    expect(routerMock.push).not.toHaveBeenCalled();
  });
});
