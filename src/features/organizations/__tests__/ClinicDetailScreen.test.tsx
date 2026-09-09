import { chatApi } from '@/features/chat';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { organizationsApi } from '../api';
import ClinicDetailScreen from '../screens/ClinicDetailScreen';
import type { PublicOrganizationDetail } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const base: PublicOrganizationDetail = {
  id: 'o1',
  type: 'CLINIC',
  name: 'عيادة الشفاء البيطرية',
  description: 'رعاية الحيوانات الأليفة والطيور',
  address: 'بغداد - المنصور',
  latitude: null,
  longitude: null,
  phone: '07712345678',
  logoUrl: null,
  workingHours: '9:00 ص - 8:00 م',
  services: ['فحص', 'تطعيم'],
  email: 'info@alshifa-vet.com',
  whatsapp: '07712345678',
  instagramUrl: null,
  facebookUrl: null,
  tiktokUrl: null,
  galleryUrls: [],
  distanceKm: null,
  createdAt: '',
  veterinarians: [{ id: 'v1', firstName: 'أحمد', lastName: 'محمد' }],
  engagement: { isFollowing: false, followersCount: 1248, rating: 4.8, reviewsCount: 126 },
};

describe('ClinicDetailScreen', () => {
  const getPublic = jest.spyOn(organizationsApi, 'getPublic');
  const follow = jest.spyOn(organizationsApi, 'follow');
  const startConversation = jest.spyOn(chatApi, 'start');

  beforeEach(() => {
    resetRouterMock();
    getPublic.mockReset();
    follow.mockReset();
    startConversation.mockReset();
    setSearchParams({ organizationId: 'o1' });
  });
  afterAll(() => jest.restoreAllMocks());

  it('renders the clinic profile: name, specialty, doctors, services, rating', async () => {
    getPublic.mockResolvedValue(base);
    renderWithProviders(<ClinicDetailScreen />);
    await waitFor(() => expect(screen.getByText('عيادة الشفاء البيطرية')).toBeOnTheScreen());
    expect(screen.getByText('رعاية الحيوانات الأليفة والطيور')).toBeOnTheScreen();
    expect(screen.getByText('د. أحمد محمد')).toBeOnTheScreen();
    expect(screen.getByText('فحص، تطعيم')).toBeOnTheScreen();
    expect(screen.getByText('4.8')).toBeOnTheScreen();
    expect(screen.getByText('1248')).toBeOnTheScreen();
  });

  it('a non-existent / non-ACTIVE clinic shows the not-found state, not a raw error', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    getPublic.mockRejectedValue(
      new ApiError({ code: 'NOT_FOUND', message: 'not found', status: 404 }),
    );
    renderWithProviders(<ClinicDetailScreen />);
    await waitFor(() =>
      expect(screen.getByText('هذه العيادة غير متاحة حالياً.')).toBeOnTheScreen(),
    );
  });

  it('pressing متابعة follows the clinic', async () => {
    getPublic.mockResolvedValue(base);
    follow.mockResolvedValue({ success: true });
    renderWithProviders(<ClinicDetailScreen />);
    await waitFor(() => expect(screen.getByText('عيادة الشفاء البيطرية')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('متابعة'));
    await waitFor(() => expect(follow).toHaveBeenCalledWith('o1'));
  });

  it('pressing تواصل مباشر starts a conversation and navigates to the thread', async () => {
    getPublic.mockResolvedValue(base);
    startConversation.mockResolvedValue({
      id: 'c1',
      type: 'PET_OWNER_CLINIC',
      organizationId: 'o1',
      counterpartUserId: null,
      viewerSide: 'PET_OWNER',
      subjectType: null,
      subjectId: null,
      status: 'OPEN',
      lastMessageAt: null,
      unreadCount: null,
      createdAt: '',
      updatedAt: '',
    });
    renderWithProviders(<ClinicDetailScreen />);
    await waitFor(() => expect(screen.getByText('عيادة الشفاء البيطرية')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('تواصل مباشر'));
    await waitFor(() => expect(startConversation).toHaveBeenCalledWith({ organizationId: 'o1' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/chat/c1');
  });
});
