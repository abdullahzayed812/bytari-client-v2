import { organizationsApi } from '@/features/organizations';
import type { PublicOrganizationDetail } from '@/features/organizations';
import type { VeterinaryOfficeProduct } from '../types';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { publicVeterinaryOfficeProductsApi } from '../browse/api';
import VeterinaryOfficeDetailsScreen from '../browse/screens/VeterinaryOfficeDetailsScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const office: PublicOrganizationDetail = {
  id: 'o1',
  type: 'VETERINARY_OFFICE',
  name: 'مكتب الرحمة البيطري',
  description: 'مكتب بيطري يقدم خدمات متكاملة لدعم الأطباء والمربين وأصحاب الحيوانات.',
  address: 'بغداد - الكرادة، شارع 14 رمضان',
  latitude: 33.3,
  longitude: 44.4,
  phone: '0770 123 4567',
  logoUrl: null,
  workingHours: 'يومياً 8:00 ص - 8:00 م',
  services: [],
  email: null,
  whatsapp: '0770 123 4567',
  instagramUrl: null,
  facebookUrl: null,
  tiktokUrl: null,
  galleryUrls: [],
  distanceKm: null,
  rating: 4.8,
  reviewsCount: 128,
  createdAt: '',
  veterinarians: [],
  engagement: {
    isFollowing: false,
    followersCount: 1245,
    isLiked: false,
    likesCount: 12,
    rating: 4.8,
    reviewsCount: 128,
  },
};

const product = (over: Partial<VeterinaryOfficeProduct> = {}): VeterinaryOfficeProduct => ({
  id: 'p1',
  organizationId: 'o1',
  name: 'أنتي بيك',
  description: 'مضاد حيوي واسع المجال',
  productType: 'MEDICINE',
  price: '25000.00',
  stockQuantity: 10,
  status: 'ACTIVE',
  isHidden: false,
  subtype: null,
  weight: null,
  usageInstructions: null,
  dosage: null,
  shelfLife: null,
  manufacturer: null,
  highlights: [],
  primaryImageUrl: null,
  images: [],
  createdByUserId: 'u1',
  createdAt: '',
  updatedAt: '',
  ...over,
});

describe('VeterinaryOfficeDetailsScreen', () => {
  const getPublic = jest.spyOn(organizationsApi, 'getPublic');
  const follow = jest.spyOn(organizationsApi, 'follow');
  const like = jest.spyOn(organizationsApi, 'like');
  const listProducts = jest.spyOn(publicVeterinaryOfficeProductsApi, 'list');

  beforeEach(() => {
    resetRouterMock();
    getPublic.mockReset();
    follow.mockReset();
    like.mockReset();
    listProducts.mockReset().mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 6, total: 0, totalPages: 1 },
    });
    setSearchParams({ officeId: 'o1' });
  });
  afterAll(() => jest.restoreAllMocks());

  it('renders the office profile: name, rating, address, phone, working hours', async () => {
    getPublic.mockResolvedValue(office);
    renderWithProviders(<VeterinaryOfficeDetailsScreen />);
    await waitFor(() => expect(screen.getByText('مكتب الرحمة البيطري')).toBeOnTheScreen());
    expect(screen.getAllByText('بغداد - الكرادة، شارع 14 رمضان').length).toBeGreaterThan(0);
    expect(screen.getByText('يومياً 8:00 ص - 8:00 م')).toBeOnTheScreen();
    expect(screen.getAllByText('4.8').length).toBeGreaterThan(0);
  });

  it('a non-ACTIVE / non-existent office shows the not-found state', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    getPublic.mockRejectedValue(
      new ApiError({ code: 'NOT_FOUND', message: 'not found', status: 404 }),
    );
    renderWithProviders(<VeterinaryOfficeDetailsScreen />);
    await waitFor(() => expect(screen.getByText('هذا المكتب غير متاح حالياً.')).toBeOnTheScreen());
  });

  it('shows a product preview and navigates to the full catalog', async () => {
    getPublic.mockResolvedValue(office);
    listProducts.mockResolvedValue({
      items: [product()],
      meta: { page: 1, pageSize: 6, total: 3, totalPages: 1 },
    });
    renderWithProviders(<VeterinaryOfficeDetailsScreen />);
    await waitFor(() => expect(screen.getByText('أنتي بيك')).toBeOnTheScreen());
    expect(screen.getByText('المنتجات (3)')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('عرض جميع المنتجات'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/veterinary-offices/o1/products');
  });

  it('pressing a preview product navigates to its details screen', async () => {
    getPublic.mockResolvedValue(office);
    listProducts.mockResolvedValue({
      items: [product()],
      meta: { page: 1, pageSize: 6, total: 1, totalPages: 1 },
    });
    renderWithProviders(<VeterinaryOfficeDetailsScreen />);
    await waitFor(() => expect(screen.getByText('أنتي بيك')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('أنتي بيك'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/veterinary-offices/o1/products/p1');
  });

  it('pressing إعجاب likes the office (a like, not a follow) and shows the like count', async () => {
    getPublic.mockResolvedValue(office);
    like.mockResolvedValue({ success: true });
    renderWithProviders(<VeterinaryOfficeDetailsScreen />);
    await waitFor(() => expect(screen.getByText('مكتب الرحمة البيطري')).toBeOnTheScreen());
    expect(screen.getByText('12')).toBeOnTheScreen();
    expect(screen.queryByText('1245')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'إعجاب' }));
    await waitFor(() => expect(like).toHaveBeenCalledWith('o1'));
    expect(follow).not.toHaveBeenCalled();
  });

  it('the متابعة chip follows the office', async () => {
    getPublic.mockResolvedValue(office);
    follow.mockResolvedValue({ success: true });
    renderWithProviders(<VeterinaryOfficeDetailsScreen />);
    await waitFor(() => expect(screen.getByText('مكتب الرحمة البيطري')).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('button', { name: 'متابعة' }));
    await waitFor(() => expect(follow).toHaveBeenCalledWith('o1'));
  });
});
