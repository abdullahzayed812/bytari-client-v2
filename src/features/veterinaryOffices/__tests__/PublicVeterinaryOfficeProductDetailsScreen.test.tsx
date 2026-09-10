import { organizationsApi } from '@/features/organizations';
import type { PublicOrganizationDetail } from '@/features/organizations';
import type { VeterinaryOfficeProduct } from '../types';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import { publicVeterinaryOfficeProductsApi } from '../api';
import PublicVeterinaryOfficeProductDetailsScreen from '../screens/PublicVeterinaryOfficeProductDetailsScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const office: PublicOrganizationDetail = {
  id: 'o1',
  type: 'VETERINARY_OFFICE',
  name: 'مكتب الرحمة البيطري',
  description: null,
  address: null,
  latitude: null,
  longitude: null,
  phone: '0770 123 4567',
  logoUrl: null,
  workingHours: null,
  services: [],
  email: null,
  whatsapp: '0770 123 4567',
  instagramUrl: null,
  facebookUrl: null,
  tiktokUrl: null,
  galleryUrls: [],
  distanceKm: null,
  rating: null,
  reviewsCount: 0,
  createdAt: '',
  veterinarians: [],
  engagement: { isFollowing: false, followersCount: 0, rating: null, reviewsCount: 0 },
};

const product: VeterinaryOfficeProduct = {
  id: 'p1',
  organizationId: 'o1',
  name: 'أنتي بيك',
  description: 'مضاد حيوي واسع المجال فعال ضد مجموعة كبيرة من البكتيريا.',
  productType: 'MEDICINE',
  price: '25000.00',
  stockQuantity: 30,
  status: 'ACTIVE',
  subtype: 'مضاد حيوي',
  weight: '100 جرام',
  usageInstructions: 'للأغنام، الأبقار، الدواجن',
  dosage: 'حسب إرشادات الطبيب البيطري',
  shelfLife: '24 شهر',
  manufacturer: 'C.Dapet',
  highlights: ['نتائج سريعة', 'فعالية عالية'],
  primaryImageUrl: null,
  images: [],
  createdByUserId: 'u1',
  createdAt: '',
  updatedAt: '',
};

describe('PublicVeterinaryOfficeProductDetailsScreen', () => {
  const getProduct = jest.spyOn(publicVeterinaryOfficeProductsApi, 'get');
  const getPublicOrg = jest.spyOn(organizationsApi, 'getPublic');

  beforeEach(() => {
    resetRouterMock();
    getProduct.mockReset();
    getPublicOrg.mockReset().mockResolvedValue(office);
    setSearchParams({ officeId: 'o1', productId: 'p1' });
  });
  afterAll(() => jest.restoreAllMocks());

  it('renders the product: name, price, description, detail fields and highlights', async () => {
    getProduct.mockResolvedValue(product);
    renderWithProviders(<PublicVeterinaryOfficeProductDetailsScreen />);
    await waitFor(() => expect(screen.getByText('أنتي بيك')).toBeOnTheScreen());
    expect(screen.getByText('25,000 د.ع')).toBeOnTheScreen();
    expect(
      screen.getByText('مضاد حيوي واسع المجال فعال ضد مجموعة كبيرة من البكتيريا.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('مضاد حيوي')).toBeOnTheScreen();
    expect(screen.getByText('100 جرام')).toBeOnTheScreen();
    expect(screen.getByText('C.Dapet')).toBeOnTheScreen();
    expect(screen.getByText('نتائج سريعة')).toBeOnTheScreen();
  });

  it('a non-existent / INACTIVE product shows the not-found state', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    getProduct.mockRejectedValue(
      new ApiError({ code: 'NOT_FOUND', message: 'not found', status: 404 }),
    );
    renderWithProviders(<PublicVeterinaryOfficeProductDetailsScreen />);
    await waitFor(() =>
      expect(screen.getByText('هذا المنتج غير متاح حالياً.')).toBeOnTheScreen(),
    );
  });

  it('shows contact-the-office actions from the office’s own profile', async () => {
    getProduct.mockResolvedValue(product);
    renderWithProviders(<PublicVeterinaryOfficeProductDetailsScreen />);
    await waitFor(() => expect(screen.getByText('أنتي بيك')).toBeOnTheScreen());
    await waitFor(() => expect(screen.getByText('تواصل مع المكتب')).toBeOnTheScreen());
    expect(screen.getByText('اتصال')).toBeOnTheScreen();
    expect(screen.getByText('تواصل واتساب')).toBeOnTheScreen();
  });

  it('the favorite heart shows a coming-soon toast (no product-favorites backend yet)', async () => {
    getProduct.mockResolvedValue(product);
    renderWithProviders(<PublicVeterinaryOfficeProductDetailsScreen />);
    await waitFor(() => expect(screen.getByText('أنتي بيك')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('إعجاب بالمنتج'));
    await waitFor(() => expect(screen.getByText('هذه الميزة ستتوفر قريباً.')).toBeOnTheScreen());
  });
});
