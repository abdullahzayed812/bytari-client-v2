import { initI18n } from '@/i18n';
import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import WelcomeScreen from '../screens/WelcomeScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

beforeAll(() => initI18n('ar'));
beforeEach(() => resetRouterMock());

describe('WelcomeScreen', () => {
  it('renders the title and both primary actions', () => {
    renderWithProviders(<WelcomeScreen />);
    expect(screen.getByText('مرحباً بك في بيطري')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'تسجيل الدخول' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'إنشاء حساب جديد' })).toBeOnTheScreen();
  });

  it('routes "create account" to account-type, not straight to register', () => {
    renderWithProviders(<WelcomeScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'إنشاء حساب جديد' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(auth)/account-type');
  });

  it('routes "sign in" to the sign-in screen', () => {
    renderWithProviders(<WelcomeScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'تسجيل الدخول' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(auth)/sign-in');
  });

  it('shows a coming-soon toast for guest browsing, without navigating', () => {
    renderWithProviders(<WelcomeScreen />);
    fireEvent.press(screen.getByText('تصفح كضيف'));
    expect(routerMock.push).not.toHaveBeenCalled();
  });
});
