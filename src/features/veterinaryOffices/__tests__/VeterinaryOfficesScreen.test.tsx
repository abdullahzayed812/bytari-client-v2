import { organizationsApi } from '@/features/organizations';
import type { PublicOrganization } from '@/features/organizations';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import VeterinaryOfficesScreen from '../browse/screens/VeterinaryOfficesScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const office = (over: Partial<PublicOrganization> = {}): PublicOrganization => ({
  id: 'o1',
  type: 'VETERINARY_OFFICE',
  name: 'مكتب الرحمة البيطري',
  description: null,
  address: 'بغداد - الكرادة',
  latitude: null,
  longitude: null,
  phone: '0770 123 4567',
  logoUrl: null,
  workingHours: null,
  services: [],
  email: null,
  whatsapp: null,
  instagramUrl: null,
  facebookUrl: null,
  tiktokUrl: null,
  galleryUrls: [],
  distanceKm: null,
  rating: 4.8,
  reviewsCount: 128,
  createdAt: '2026-01-01',
  ...over,
});

const page = (items: PublicOrganization[]) => ({
  items,
  meta: { page: 1, pageSize: 6, total: items.length, totalPages: 1 },
});

describe('VeterinaryOfficesScreen', () => {
  const discover = jest.spyOn(organizationsApi, 'discover');

  beforeEach(() => {
    resetRouterMock();
    discover.mockReset().mockResolvedValue(page([]));
  });
  afterAll(() => jest.restoreAllMocks());

  it('lists ACTIVE veterinary offices with their rating and phone', async () => {
    discover.mockResolvedValue(page([office()]));
    renderWithProviders(<VeterinaryOfficesScreen />);
    await waitFor(() => expect(screen.getByText('مكتب الرحمة البيطري')).toBeOnTheScreen());
    expect(screen.getByText('بغداد - الكرادة')).toBeOnTheScreen();
    expect(screen.getByText('0770 123 4567')).toBeOnTheScreen();
    expect(screen.getByText('4.8')).toBeOnTheScreen();
    expect(discover).toHaveBeenCalledWith(expect.objectContaining({ type: 'VETERINARY_OFFICE' }));
  });

  it('shows the empty state when there are none', async () => {
    renderWithProviders(<VeterinaryOfficesScreen />);
    await waitFor(() =>
      expect(screen.getByText('لا توجد مكاتب بيطرية متاحة حالياً')).toBeOnTheScreen(),
    );
  });

  it('pressing a card navigates to the office details screen', async () => {
    discover.mockResolvedValue(page([office()]));
    renderWithProviders(<VeterinaryOfficesScreen />);
    await waitFor(() => expect(screen.getByText('مكتب الرحمة البيطري')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('مكتب الرحمة البيطري'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/veterinary-offices/o1');
  });

  it('searching sends the term to the backend (server-side search)', async () => {
    discover.mockResolvedValue(page([]));
    renderWithProviders(<VeterinaryOfficesScreen />);
    fireEvent.changeText(
      screen.getByPlaceholderText('بحث عن مكتب بيطري...'),
      'الرحمة',
    );
    await waitFor(
      () => expect(discover).toHaveBeenCalledWith(expect.objectContaining({ search: 'الرحمة' })),
      { timeout: 5000, interval: 60 },
    );
  });
});
