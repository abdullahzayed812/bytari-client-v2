import { useAuthStore } from '@/features/auth/store';
import HomeScreen from '@/features/home/screens/HomeScreen';
import { organizationsApi } from '@/features/organizations';
import type { PublicOrganization } from '@/features/organizations';
import { inquiryApi } from '@/features/support';
import VeterinarianHomeScreen from '@/features/veterinarian/screens/VeterinarianHomeScreen';
import { publicVeterinaryOfficeProductsApi } from '@/features/veterinaryOffices/browse/api/publicVeterinaryOfficeProductsApi';
import { renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock } from '@/test-utils/routerMock';

import { homeSectionsApi } from '../api';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const emptyPage = { items: [], meta: { page: 1, pageSize: 3, total: 0, totalPages: 1 } };

const org = (over: Partial<PublicOrganization>): PublicOrganization => ({
  id: 'o',
  type: 'CLINIC',
  name: '',
  description: null,
  address: null,
  latitude: null,
  longitude: null,
  phone: null,
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
  rating: null,
  reviewsCount: 0,
  createdAt: '2026-01-01',
  ...over,
});

const clinic = org({ id: 'c1', type: 'CLINIC', name: 'عيادة الشفاء' });
const office = org({ id: 'v1', type: 'VETERINARY_OFFICE', name: 'شركة النهرين البيطرية' });

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

describe('featured organizations — one audience type per home page', () => {
  const listFeatured = jest.spyOn(homeSectionsApi, 'listFeatured');
  const latestProducts = jest.spyOn(publicVeterinaryOfficeProductsApi, 'searchAll');

  beforeEach(() => {
    resetRouterMock();
    // Both types come back (e.g. an older server) — each page must keep only its own.
    listFeatured.mockReset().mockResolvedValue([clinic, office]);
    latestProducts.mockReset().mockResolvedValue(emptyPage as never);
    jest.spyOn(homeSectionsApi, 'list').mockResolvedValue([]);
    jest.spyOn(organizationsApi, 'discover').mockResolvedValue(emptyPage as never);
    jest.spyOn(inquiryApi, 'listMine').mockResolvedValue(emptyPage as never);
  });
  afterAll(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ session: null });
  });

  it('Pet Owner home: "العيادات المميزة" with clinics only', async () => {
    renderWithProviders(<HomeScreen />);
    expect(await screen.findByText('العيادات المميزة')).toBeOnTheScreen();
    expect(listFeatured).toHaveBeenCalledWith('PET_OWNER_HOME');
    expect(screen.getAllByText('عيادة الشفاء').length).toBeGreaterThan(0);
    expect(screen.queryByText('شركة النهرين البيطرية')).toBeNull();
  });

  it('Veterinarian home: "المكاتب والشركات البيطرية المميزة" with offices / companies only', async () => {
    seedApprovedVet();
    renderWithProviders(<VeterinarianHomeScreen />);
    expect(await screen.findByText('المكاتب والشركات البيطرية المميزة')).toBeOnTheScreen();
    expect(listFeatured).toHaveBeenCalledWith('VETERINARIAN_HOME');
    expect(screen.getAllByText('شركة النهرين البيطرية').length).toBeGreaterThan(0);
    expect(screen.queryByText('عيادة الشفاء')).toBeNull();
  });

  it('Veterinarian home: the office-products section is hidden and not even fetched', async () => {
    seedApprovedVet();
    renderWithProviders(<VeterinarianHomeScreen />);
    await screen.findByText('المكاتب والشركات البيطرية المميزة');
    expect(screen.queryByText('منتجات المكاتب والشركات البيطرية')).toBeNull();
    await waitFor(() => expect(latestProducts).not.toHaveBeenCalled());
  });
});
