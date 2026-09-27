import { useAuthStore } from '@/features/auth/store';
import type { SessionSnapshot } from '@/features/auth/types';
import { Routes } from '@/constants/routes';
import { INTERFACE_SWITCH_ICON } from '@/hooks';
import { useAppModeStore } from '@/store';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { HomeHeader } from '../components/HomeHeader';
import { VeterinarianHomeHeader } from '@/features/veterinarian/components/VeterinarianHomeHeader';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
jest.mock('@/features/notifications/hooks', () => ({ useUnreadCount: () => ({ data: 0 }) }));
jest.mock('@/features/chat/hooks', () => ({
  useConversations: () => ({ unreadTotal: 0, conversations: [] }),
}));
jest.mock('@/features/globalChat/hooks', () => ({
  useChatRooms: () => ({ unreadTotal: 0 }),
}));

function session(approvedVet: boolean): SessionSnapshot {
  return {
    user: {
      id: 'u',
      email: 'e@x.c',
      firstName: 'F',
      lastName: 'L',
      phone: null,
      status: 'ACTIVE',
      veterinarianStatus: approvedVet ? 'APPROVED' : 'NOT_APPLIED',
      traderStatus: 'NOT_REGISTERED',
      createdAt: '',
      updatedAt: '',
    },
    roles: approvedVet ? ['PET_OWNER', 'VETERINARIAN'] : ['PET_OWNER'],
    permissions: [],
    isAdmin: false,
    supervisorDomains: [],
    veterinarian: { status: approvedVet ? 'APPROVED' : 'NOT_APPLIED', approved: approvedVet },
    trader: { status: 'NOT_REGISTERED', approved: false },
  } as SessionSnapshot;
}

function signIn(approvedVet: boolean, fresh: SessionSnapshot | null = session(approvedVet)) {
  useAuthStore.setState({
    status: 'authenticated',
    session: session(approvedVet),
    user: session(approvedVet).user,
    // `/auth/me` re-verification — returns what the backend says NOW.
    refreshSession: jest.fn(async () => {
      if (!fresh) return false;
      useAuthStore.setState({ session: fresh });
      return true;
    }),
  } as never);
}

beforeEach(() => {
  resetRouterMock();
  useAppModeStore.setState({ activeMode: 'owner' });
});

describe('Pet Owner header — interface switch', () => {
  it('a plain pet owner sees NO switch button (and no "become a vet" detour)', () => {
    signIn(false);
    renderWithProviders(<HomeHeader />);
    expect(screen.queryByLabelText('التبديل إلى وضع الطبيب البيطري')).toBeNull();
    expect(screen.queryByLabelText('التقديم لتصبح طبيباً بيطرياً معتمداً')).toBeNull();
  });

  it('an approved vet switches after backend re-verification, with the success toast', async () => {
    signIn(true);
    renderWithProviders(<HomeHeader />);
    fireEvent.press(screen.getByLabelText('التبديل إلى وضع الطبيب البيطري'));
    await waitFor(() => expect(useAppModeStore.getState().activeMode).toBe('veterinarian'));
    expect(await screen.findByText('تم تحويلك إلى واجهة الطبيب البيطري')).toBeOnTheScreen();
  });

  it('a revoked approval (fresh /auth/me says not approved) blocks the switch — no success toast', async () => {
    signIn(true, session(false));
    renderWithProviders(<HomeHeader />);
    fireEvent.press(screen.getByLabelText('التبديل إلى وضع الطبيب البيطري'));
    expect(
      await screen.findByText('واجهة الطبيب البيطري متاحة للأطباء المعتمدين فقط.'),
    ).toBeOnTheScreen();
    expect(useAppModeStore.getState().activeMode).toBe('owner');
    expect(screen.queryByText('تم تحويلك إلى واجهة الطبيب البيطري')).toBeNull();
  });
});

describe('Veterinarian header', () => {
  it('switches back to the pet owner interface with the toast', async () => {
    signIn(true);
    useAppModeStore.setState({ activeMode: 'veterinarian' });
    renderWithProviders(<VeterinarianHomeHeader />);
    fireEvent.press(screen.getByLabelText('التبديل إلى وضع مالك الحيوان'));
    await waitFor(() => expect(useAppModeStore.getState().activeMode).toBe('owner'));
    expect(await screen.findByText('تم تحويلك إلى واجهة صاحب الحيوان')).toBeOnTheScreen();
  });

  it('the messages icon opens the Conversations screen, not the public Global Chat', () => {
    signIn(true);
    renderWithProviders(<VeterinarianHomeHeader />);
    fireEvent.press(screen.getByLabelText('المحادثات'));
    expect(routerMock.push).toHaveBeenCalledWith(Routes.chat);
    expect(routerMock.push).not.toHaveBeenCalledWith(Routes.globalChat);
  });

  it('both headers use the same switch icon', () => {
    expect(INTERFACE_SWITCH_ICON).toBe('swap-horizontal-outline');
  });
});
