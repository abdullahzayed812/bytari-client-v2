import { StyleSheet, Image as RNImage } from 'react-native';

import { useAuthStore } from '@/features/auth/store';
import HomeScreen from '@/features/home/screens/HomeScreen';
import { organizationsApi } from '@/features/organizations';
import { inquiryApi } from '@/features/support';
import VeterinarianHomeScreen from '@/features/veterinarian/screens/VeterinarianHomeScreen';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { homeSectionsApi } from '../api';
import AdminHomeSectionsScreen from '../screens/AdminHomeSectionsScreen';
import { HOME_SECTION_KEYS, type HomeSectionImage, type HomeSectionKey } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
// Render expo-image as RN Image so the shown URIs can be asserted.
jest.mock('expo-image', () => ({ Image: require('react-native').Image }));

const sections = (images: Partial<Record<HomeSectionKey, string>> = {}): HomeSectionImage[] =>
  HOME_SECTION_KEYS.map((key) => ({
    key,
    page: key.startsWith('VET_') ? 'VETERINARIAN_HOME' : 'PET_OWNER_HOME',
    imageUrl: images[key] ?? null,
    updatedAt: images[key] ? '2026-10-13T10:00:00.000Z' : null,
  }));

const imageUris = (): string[] =>
  screen.UNSAFE_queryAllByType(RNImage).map((i) => (i.props.source as { uri: string }).uri);

const emptyPage = { items: [], meta: { page: 1, pageSize: 3, total: 0, totalPages: 1 } };

function seedApprovedVet() {
  useAuthStore.setState({
    session: {
      user: {
        id: 'u1',
        email: 'e@x.c',
        firstName: 'ريم',
        lastName: 'أحمد',
        phone: null,
        status: 'ACTIVE',
        veterinarianStatus: 'APPROVED',
        traderStatus: 'NOT_REGISTERED' as const,
        createdAt: '',
        updatedAt: '',
      },
      roles: ['PET_OWNER', 'VETERINARIAN'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
      veterinarian: { status: 'APPROVED', approved: true },
      trader: { status: 'NOT_REGISTERED', approved: false },
    },
  });
}

describe('home pages — admin-managed section images', () => {
  const list = jest.spyOn(homeSectionsApi, 'list');

  beforeEach(() => {
    resetRouterMock();
    list.mockReset();
    jest.spyOn(organizationsApi, 'discover').mockResolvedValue(emptyPage as never);
    jest.spyOn(inquiryApi, 'listMine').mockResolvedValue(emptyPage as never);
  });
  afterAll(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ session: null });
  });

  it('Pet Owner home shows a configured section image; the other sections keep their icons and titles', async () => {
    list.mockResolvedValue(sections({ PET_OWNER_POULTRY: 'https://cdn/poultry.png' }));
    renderWithProviders(<HomeScreen />);

    await waitFor(() => expect(imageUris()).toContain('https://cdn/poultry.png'));
    expect(imageUris()).toHaveLength(1);
    // Titles + navigation are unchanged.
    fireEvent.press(screen.getByLabelText('الدواجن والطيور'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/poultry');
  });

  it('falls back to the built-in icons when no image is configured or the request fails', async () => {
    list.mockRejectedValue(new Error('offline'));
    renderWithProviders(<HomeScreen />);
    expect(await screen.findByText('الدواجن والطيور')).toBeOnTheScreen();
    expect(imageUris()).toHaveLength(0);
  });

  it('Veterinarian home shows configured quick-link images', async () => {
    seedApprovedVet();
    list.mockResolvedValue(
      sections({ VET_BOOKS: 'https://cdn/books.png', VET_CHAT: 'https://cdn/chat.png' }),
    );
    renderWithProviders(<VeterinarianHomeScreen />);
    await waitFor(() =>
      expect(imageUris().sort()).toEqual(['https://cdn/books.png', 'https://cdn/chat.png']),
    );
  });
});

describe('home pages — consultation / inquiry text is centered', () => {
  beforeEach(() => {
    jest.spyOn(homeSectionsApi, 'list').mockResolvedValue(sections());
    jest.spyOn(organizationsApi, 'discover').mockResolvedValue(emptyPage as never);
    jest.spyOn(inquiryApi, 'listMine').mockResolvedValue(emptyPage as never);
  });
  afterEach(() => jest.restoreAllMocks());

  it('Pet Owner home: the "send a consultation" texts are centered and the button still works', async () => {
    renderWithProviders(<HomeScreen />);
    const title = await screen.findByText('أرسل استشارتك وسنجيبك فوراً');
    expect(StyleSheet.flatten(title.props.style).textAlign).toBe('center');
    fireEvent.press(screen.getByLabelText('إرسال استشارة'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/support/consultations/create');
  });

  it('Veterinarian home: the "send an inquiry" text is centered', async () => {
    seedApprovedVet();
    renderWithProviders(<VeterinarianHomeScreen />);
    const text = await screen.findByText(/إذا كان لديك أي استفسار/);
    expect(StyleSheet.flatten(text.props.style).textAlign).toBe('center');
    expect(screen.getByText('أرسل استفسارك')).toBeOnTheScreen();
  });
});

describe('AdminHomeSectionsScreen', () => {
  afterEach(() => jest.restoreAllMocks());

  it('lists every existing section under its home page, with its own title and image state', async () => {
    jest
      .spyOn(homeSectionsApi, 'adminList')
      .mockResolvedValue(sections({ VET_SERVICES: 'https://cdn/services.png' }));
    renderWithProviders(<AdminHomeSectionsScreen />);

    expect(await screen.findByText('الصفحة الرئيسية لأصحاب الحيوانات')).toBeOnTheScreen();
    expect(screen.getByText('الصفحة الرئيسية للأطباء البيطريين')).toBeOnTheScreen();
    // The cards' own titles — no new / renamed sections.
    for (const title of ['الحيوانات الأليفة', 'الدواجن والطيور']) {
      expect(screen.getByText(title)).toBeOnTheScreen();
    }
    expect(screen.getAllByText('لا توجد صورة — تُعرض الأيقونة الافتراضية.')).toHaveLength(6);
    expect(screen.getAllByText('تُعرض الصورة المرفوعة في الصفحة الرئيسية.')).toHaveLength(1);
  });
});
