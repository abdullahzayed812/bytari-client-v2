import { apiClient } from '@/services/api';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { publicVeterinaryOfficeProductsApi } from '../browse/api';
import OfficeProductSearchScreen from '../browse/screens/OfficeProductSearchScreen';
import type { OfficeProductSearchHit } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
jest.mock('@/hooks', () => ({
  ...jest.requireActual('@/hooks'),
  useDebouncedValue: <T,>(v: T) => v,
}));

const hit = (id: string, officeId: string, officeName: string, name: string) =>
  ({
    product: {
      id,
      organizationId: officeId,
      name,
      productType: 'MEDICINE',
      brand: 'Bayer',
      price: '1000.00',
      primaryImageUrl: null,
    },
    office: { id: officeId, name: officeName, logoUrl: null, address: 'بغداد', phone: null },
  }) as unknown as OfficeProductSearchHit;

describe('publicVeterinaryOfficeProductsApi.searchAll', () => {
  it('GET /office-products/search with search / type / paging', async () => {
    const envelope = jest.spyOn(apiClient, 'requestEnvelope').mockResolvedValueOnce({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    await publicVeterinaryOfficeProductsApi.searchAll({
      page: 1,
      pageSize: 20,
      search: 'أموكس',
      productType: 'MEDICINE',
    });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/office-products/search',
      params: { page: 1, pageSize: 20, search: 'أموكس', type: 'MEDICINE' },
    });
  });
});

describe('OfficeProductSearchScreen', () => {
  beforeEach(() => {
    resetRouterMock();
    jest.restoreAllMocks();
  });

  it('does not query until there is a term, then lists products with their office', async () => {
    const spy = jest.spyOn(publicVeterinaryOfficeProductsApi, 'searchAll').mockResolvedValue({
      items: [
        hit('p1', 'o1', 'مكتب الرافدين', 'أموكسيسيلين 500'),
        hit('p2', 'o2', 'مكتب دجلة', 'Amoxicillin Vet'),
      ],
      meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
    renderWithProviders(<OfficeProductSearchScreen />);
    expect(spy).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText('اسم المنتج، الماركة، بلد المنشأ...'), 'أموكس');
    expect(await screen.findByText('أموكسيسيلين 500')).toBeTruthy();
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'أموكس', page: 1 }));
    expect(screen.getByText('مكتب الرافدين')).toBeTruthy();
    expect(screen.getByText('مكتب دجلة')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('فتح المنتج أموكسيسيلين 500 من مكتب الرافدين'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/veterinary-offices/o1/products/p1');
    fireEvent.press(screen.getByLabelText('فتح صفحة مكتب دجلة'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/veterinary-offices/o2');
  });

  it('shows the empty state when nothing matches', async () => {
    jest.spyOn(publicVeterinaryOfficeProductsApi, 'searchAll').mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    renderWithProviders(<OfficeProductSearchScreen />);
    fireEvent.changeText(screen.getByLabelText('اسم المنتج، الماركة، بلد المنشأ...'), 'zzz');
    await waitFor(() => expect(screen.getByText('لا توجد منتجات مطابقة')).toBeTruthy());
  });
});
