import { organizationsApi } from '@/features/organizations';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { productsApi } from '../api';
import ProductFormScreen from '../screens/ProductFormScreen';
import type { Product } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const getOrg = jest.spyOn(organizationsApi, 'get');
const detail = jest.spyOn(productsApi, 'get');
const create = jest.spyOn(productsApi, 'create');
const update = jest.spyOn(productsApi, 'update');

beforeEach(() => {
  resetRouterMock();
  getOrg
    .mockReset()
    .mockResolvedValue({ id: 'o1', type: 'VETERINARY_STORE', myRole: 'OWNER' } as never);
  [detail, create, update].forEach((s) => s.mockReset());
  setSearchParams({ organizationId: 'o1' });
});
afterAll(() => jest.restoreAllMocks());

const product = (over: Partial<Product> = {}): Product => ({
  id: 'p1',
  organizationId: 'o1',
  organizationType: 'VETERINARY_STORE',
  name: 'مضاد حيوي',
  description: null,
  productType: 'MEDICINE',
  price: '120.00',
  stockQuantity: 40,
  status: 'ACTIVE',
  primaryImageUrl: null,
  images: [],
  subtype: null,
  weight: null,
  usageInstructions: null,
  dosage: null,
  shelfLife: null,
  manufacturer: null,
  highlights: [],
  createdByUserId: 'u1',
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
  ...over,
});

describe('ProductFormScreen (§8, §11, §36)', () => {
  it('blocks submit until the name + type are valid', async () => {
    renderWithProviders(<ProductFormScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'حفظ المنتج' }));
    await waitFor(() => expect(screen.getByText('اسم المنتج مطلوب.')).toBeOnTheScreen());
    expect(create).not.toHaveBeenCalled();
  });

  it('creates a product with the opening stock and price for the route store', async () => {
    create.mockResolvedValueOnce(product());
    renderWithProviders(<ProductFormScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('مثال: مضاد حيوي بيطري 100 مل'), 'مضاد حيوي');
    fireEvent.changeText(screen.getByPlaceholderText('مثال: 120.00'), '120.00');
    fireEvent.changeText(screen.getByPlaceholderText('0'), '40');
    fireEvent.press(screen.getByRole('button', { name: 'حفظ المنتج' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        'o1',
        expect.objectContaining({
          name: 'مضاد حيوي',
          productType: 'MEDICINE',
          price: '120.00',
          stockQuantity: 40,
        }),
      ),
    );
    await waitFor(() => expect(routerMock.back).toHaveBeenCalled());
  });

  it('omits price / stock when left blank (optional fields → undefined on create)', async () => {
    create.mockResolvedValueOnce(product({ price: null }));
    renderWithProviders(<ProductFormScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('مثال: مضاد حيوي بيطري 100 مل'), 'شاش طبي');
    fireEvent.press(screen.getByRole('button', { name: 'حفظ المنتج' }));
    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith(
      'o1',
      expect.objectContaining({ price: undefined, stockQuantity: undefined }),
    );
  });

  it('edit mode prefills the product and PATCHes it; a cleared price becomes null', async () => {
    setSearchParams({ organizationId: 'o1', productId: 'p1' });
    detail.mockResolvedValue(product());
    update.mockResolvedValueOnce(product());
    renderWithProviders(<ProductFormScreen />);
    await waitFor(() => expect(screen.getByDisplayValue('مضاد حيوي')).toBeOnTheScreen());
    expect(screen.getByDisplayValue('120.00')).toBeOnTheScreen();
    // no opening-stock field in edit mode
    expect(screen.queryByText('المخزون الافتتاحي')).toBeNull();

    fireEvent.changeText(screen.getByDisplayValue('120.00'), '');
    fireEvent.press(screen.getByRole('button', { name: 'حفظ التغييرات' }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        'o1',
        'p1',
        expect.objectContaining({ name: 'مضاد حيوي', price: null }),
      ),
    );
  });

  it('guards against a duplicate submit while the request is pending', async () => {
    let resolve!: (p: Product) => void;
    create.mockReturnValueOnce(new Promise<Product>((r) => (resolve = r)));
    renderWithProviders(<ProductFormScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('مثال: مضاد حيوي بيطري 100 مل'), 'كمامة');
    const btn = screen.getByRole('button', { name: 'حفظ المنتج' });
    fireEvent.press(btn);
    fireEvent.press(btn);
    fireEvent.press(btn);
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    resolve(product());
  });

  it('maps a 400 ORGANIZATION_TYPE_NOT_SUPPORTED to the "stores only" message (raw hidden)', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    create.mockRejectedValueOnce(
      new ApiError({
        code: 'ORGANIZATION_TYPE_NOT_SUPPORTED' as never,
        message: 'raw',
        status: 400,
      }),
    );
    renderWithProviders(<ProductFormScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('مثال: مضاد حيوي بيطري 100 مل'), 'x');
    fireEvent.press(screen.getByRole('button', { name: 'حفظ المنتج' }));
    await waitFor(() =>
      expect(screen.getByText('إدارة المنتجات متاحة للمتاجر والمكاتب البيطرية فقط.')).toBeOnTheScreen(),
    );
    expect(screen.queryByText('raw')).toBeNull();
  });
});
