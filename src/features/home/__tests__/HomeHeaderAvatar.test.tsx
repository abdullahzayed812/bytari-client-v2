import { act } from 'react';
import { Image } from 'react-native';

import { Avatar } from '@/components/content';
import { useAuthStore } from '@/features/auth/store';
import { VeterinarianHomeHeader } from '@/features/veterinarian/components/VeterinarianHomeHeader';
import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { HomeHeader } from '../components/HomeHeader';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
jest.mock('@/features/notifications/hooks', () => ({ useUnreadCount: () => ({ data: 0 }) }));
jest.mock('@/features/chat/hooks', () => ({
  useConversations: () => ({ unreadTotal: 0, conversations: [] }),
}));
jest.mock('@/features/globalChat/hooks', () => ({
  useChatRooms: () => ({ unreadTotal: 0 }),
}));

const user = (avatarUrl: string | null) =>
  ({
    id: 'u',
    email: 'e@x.c',
    firstName: 'Reem',
    lastName: 'Ali',
    phone: null,
    status: 'ACTIVE',
    veterinarianStatus: 'APPROVED',
    traderStatus: 'NOT_REGISTERED',
    avatarUrl,
    createdAt: '',
    updatedAt: '',
  }) as never;

const imageUris = (): string[] =>
  screen.UNSAFE_queryAllByType(Image).map((i) => (i.props.source as { uri: string }).uri);

describe('Home headers — profile photo', () => {
  it.each([
    ['pet owner', HomeHeader],
    ['veterinarian', VeterinarianHomeHeader],
  ])(
    '%s header shows the signed-in user photo and follows a change without re-login',
    (_, Header) => {
      useAuthStore.setState({ status: 'authenticated', user: user('https://cdn/a1.png') } as never);
      renderWithProviders(<Header />);
      expect(imageUris()).toContain('https://cdn/a1.png');

      // a new upload refreshes `/auth/me` → the store's user → the header
      act(() => useAuthStore.setState({ user: user('https://cdn/a2.png') } as never));
      expect(imageUris()).toContain('https://cdn/a2.png');
    },
  );
});

describe('Avatar', () => {
  it('falls back to initials on a load error, then retries when the uri changes', () => {
    const { rerender } = renderWithProviders(<Avatar uri="https://cdn/bad.png" name="Reem Ali" />);
    fireEvent(screen.UNSAFE_getByType(Image), 'error');
    expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);
    rerender(<Avatar uri="https://cdn/good.png" name="Reem Ali" />);
    expect(imageUris()).toEqual(['https://cdn/good.png']);
  });
});
