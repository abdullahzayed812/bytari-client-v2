import { useAuthStore } from '@/features/auth/store';
import { apiClient } from '@/services/api';
import { useAppModeStore } from '@/store/appModeStore';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { searchApi } from '../api/searchApi';
import GlobalSearchScreen, { searchHitHref } from '../screens/GlobalSearchScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

beforeEach(() => {
  resetRouterMock();
  jest.restoreAllMocks();
});

describe('searchApi', () => {
  it('calls GET /search with q, the interface, comma-joined types and limit', async () => {
    const get = jest.spyOn(apiClient, 'get').mockResolvedValue({ query: 'لقاح', groups: [] });
    await searchApi.search('لقاح', { interface: 'VETERINARIAN', types: ['BOOK'], limit: 3 });
    expect(get).toHaveBeenCalledWith('/search', {
      q: 'لقاح',
      interface: 'VETERINARIAN',
      types: 'BOOK',
      limit: 3,
    });
  });

  it('defaults to the Pet Owner interface', async () => {
    const get = jest.spyOn(apiClient, 'get').mockResolvedValue({ query: 'لقاح', groups: [] });
    await searchApi.search('لقاح');
    expect(get).toHaveBeenCalledWith('/search', {
      q: 'لقاح',
      interface: 'PET_OWNER',
      types: undefined,
      limit: undefined,
    });
  });
});

describe('searchHitHref', () => {
  it('routes each result type to its existing detail screen', () => {
    const hit = { id: 'x1', title: 't', subtitle: null, imageUrl: null };
    expect(searchHitHref({ ...hit, type: 'CLINIC' })).toBe('/(app)/organizations/discover/x1');
    expect(searchHitHref({ ...hit, type: 'VETERINARY_OFFICE' })).toBe(
      '/(app)/veterinary-offices/x1',
    );
    expect(searchHitHref({ ...hit, type: 'FARM', meta: { farmSpecies: 'SHEEP' } })).toBe(
      '/(app)/livestock/sheep/x1',
    );
    expect(searchHitHref({ ...hit, type: 'BOOK' })).toBe('/(app)/veterinary-books/x1');
    // An office product opens the product inside the office selling it.
    expect(
      searchHitHref({ ...hit, type: 'OFFICE_PRODUCT', meta: { officeId: 'o1', officeName: 'م' } }),
    ).toBe('/(app)/veterinary-offices/o1/products/x1');
  });
});

describe('GlobalSearchScreen', () => {
  it('stays idle below two characters, then shows grouped backend results', async () => {
    const search = jest.spyOn(searchApi, 'search').mockResolvedValue({
      query: 'لقاح',
      groups: [
        {
          type: 'PET_STORE_PRODUCT',
          total: 1,
          items: [
            {
              type: 'PET_STORE_PRODUCT',
              id: 'p1',
              title: 'لقاح القطط',
              subtitle: null,
              imageUrl: null,
            },
          ],
        },
      ],
    });
    renderWithProviders(<GlobalSearchScreen />);
    const input = screen.getByLabelText('ابحث عن منتج، عيادة، مزرعة، خدمة، خبر أو نصيحة…');
    fireEvent.changeText(input, 'ل');
    expect(search).not.toHaveBeenCalled();

    fireEvent.changeText(input, 'لقاح');
    expect(await screen.findByText('لقاح القطط')).toBeOnTheScreen();
    // owner mode (default) → the Pet Owner interface is requested
    expect(search).toHaveBeenCalledWith('لقاح', { interface: 'PET_OWNER', types: undefined });
    expect(screen.getByText('متجر أصحاب الحيوانات')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('لقاح القطط'));
    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledWith('/(app)/pet-owner-store/products/p1'),
    );
  });
});

describe('GlobalSearchScreen — Veterinary Office products (veterinarian interface)', () => {
  function asApprovedVet() {
    const user = {
      id: 'v1',
      email: 'v@x.c',
      firstName: 'ط',
      lastName: 'ب',
      phone: null,
      status: 'ACTIVE' as const,
      veterinarianStatus: 'APPROVED' as const,
      traderStatus: 'NOT_REGISTERED' as const,
      createdAt: '',
      updatedAt: '',
    };
    useAuthStore.setState({
      user,
      status: 'authenticated',
      session: {
        user,
        roles: ['PET_OWNER'],
        permissions: [],
        isAdmin: false,
        supervisorDomains: [],
        veterinarian: { status: 'APPROVED', approved: true },
        trader: { status: 'NOT_REGISTERED', approved: false },
      },
    });
    useAppModeStore.setState({ activeMode: 'veterinarian' });
  }
  afterEach(() => {
    useAppModeStore.setState({ activeMode: 'owner' });
    useAuthStore.setState({ session: null, user: null, status: 'unauthenticated' });
  });

  it('shows office products with the office selling each, and opens the product', async () => {
    asApprovedVet();
    const search = jest.spyOn(searchApi, 'search').mockResolvedValue({
      query: 'كوكسيديا',
      groups: [
        {
          type: 'OFFICE_PRODUCT',
          total: 1,
          items: [
            {
              type: 'OFFICE_PRODUCT',
              id: 'p1',
              title: 'مضاد كوكسيديا',
              subtitle: 'مكتب الرافدين',
              imageUrl: null,
              meta: { officeId: 'o1', officeName: 'مكتب الرافدين' },
            },
          ],
        },
      ],
    });
    renderWithProviders(<GlobalSearchScreen />);
    fireEvent.changeText(
      screen.getByLabelText('ابحث عن كتاب، مجلة، منتج، مكتب أو شركة، خدمة، دورة أو وظيفة…'),
      'كوكسيديا',
    );
    expect(await screen.findByText('مضاد كوكسيديا')).toBeOnTheScreen();
    expect(screen.getByText('مكتب الرافدين')).toBeOnTheScreen();
    expect(screen.getByText('منتجات المكاتب أو الشركات')).toBeOnTheScreen();
    expect(search).toHaveBeenCalledWith('كوكسيديا', {
      interface: 'VETERINARIAN',
      types: undefined,
    });
    fireEvent.press(screen.getByText('مضاد كوكسيديا'));
    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledWith('/(app)/veterinary-offices/o1/products/p1'),
    );
  });

  it('hosts the "search products in all offices" button, seeded with the typed text', async () => {
    asApprovedVet();
    jest.spyOn(searchApi, 'search').mockResolvedValue({ query: 'لقاح', groups: [] });
    renderWithProviders(<GlobalSearchScreen />);
    fireEvent.changeText(
      screen.getByLabelText('ابحث عن كتاب، مجلة، منتج، مكتب أو شركة، خدمة، دورة أو وظيفة…'),
      'لقاح',
    );
    fireEvent.press(screen.getByText('ابحث عن منتج في كل المكاتب أو الشركات'));
    expect(routerMock.push).toHaveBeenCalledWith({
      pathname: '/(app)/veterinary-offices/products-search',
      params: { q: 'لقاح' },
    });
  });

  it('the Pet Owner interface has no office product search button', () => {
    renderWithProviders(<GlobalSearchScreen />);
    expect(screen.queryByText('ابحث عن منتج في كل المكاتب أو الشركات')).toBeNull();
  });
});
