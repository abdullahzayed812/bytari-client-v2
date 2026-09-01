import { initI18n } from '@/i18n';
import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import AccountTypeScreen from '../screens/AccountTypeScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

beforeAll(() => initI18n('ar'));
beforeEach(() => resetRouterMock());

describe('AccountTypeScreen', () => {
  it('routes the Pet Owner card to /register', () => {
    renderWithProviders(<AccountTypeScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'صاحب حيوان' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(auth)/register');
  });

  it('routes the Veterinarian card to /register-veterinarian', () => {
    renderWithProviders(<AccountTypeScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'طبيب بيطري / طالب طب بيطري' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(auth)/register-veterinarian');
  });
});
