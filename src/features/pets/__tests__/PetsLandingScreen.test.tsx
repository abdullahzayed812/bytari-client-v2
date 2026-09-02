import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { adsApi } from '@/features/ads';

import { petsApi } from '../api';
import PetsLandingScreen from '../screens/PetsLandingScreen';
import type { Pet } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const pet = (id: string, name: string): Pet => ({
  id,
  name,
  species: 'CAT',
  breed: 'شيرازي',
  sex: 'FEMALE',
  dateOfBirth: '2024-01-01',
  notes: null,
  status: 'ACTIVE',
  createdBy: 'u1',
  currentOwnerUserId: 'u1',
  createdAt: '',
  updatedAt: '',
});

describe('PetsLandingScreen', () => {
  const list = jest.spyOn(petsApi, 'list');
  const ads = jest.spyOn(adsApi, 'list');

  beforeEach(() => {
    resetRouterMock();
    list.mockReset();
    ads.mockReset().mockResolvedValue([]);
  });
  afterAll(() => jest.restoreAllMocks());

  it('renders the profiles section and the four discovery cards', async () => {
    list.mockResolvedValue({
      items: [pet('p1', 'لولا')],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    });
    renderWithProviders(<PetsLandingScreen />);

    await waitFor(() => expect(screen.getByText('لولا')).toBeOnTheScreen());
    expect(screen.getByText('ملفاتي للحيوانات الأليفة')).toBeOnTheScreen();
    expect(screen.getByText('أفضل النصائح')).toBeOnTheScreen();
    expect(screen.getByText('حيوانات للتبني')).toBeOnTheScreen();
    expect(screen.getByText('حيوانات للتزاوج')).toBeOnTheScreen();
    expect(screen.getByText('حيوانات مفقودة')).toBeOnTheScreen();
  });

  it('navigates from a pet card to its detail screen', async () => {
    list.mockResolvedValue({
      items: [pet('p1', 'لولا')],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    });
    renderWithProviders(<PetsLandingScreen />);
    await waitFor(() => expect(screen.getByText('لولا')).toBeOnTheScreen());

    fireEvent.press(screen.getByRole('button', { name: 'فتح ملف لولا' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pets/p1');
  });

  it('"عرض الكل" opens MyPetsScreen', async () => {
    list.mockResolvedValue({
      items: [pet('p1', 'لولا')],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    });
    renderWithProviders(<PetsLandingScreen />);
    await waitFor(() => expect(screen.getByText('لولا')).toBeOnTheScreen());

    fireEvent.press(screen.getByRole('button', { name: 'عرض الكل' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pets');
  });

  it('routes each discovery card to its existing browser', async () => {
    list.mockResolvedValue({ items: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 1 } });
    renderWithProviders(<PetsLandingScreen />);
    await waitFor(() => expect(screen.getByText('حيوانات للتبني')).toBeOnTheScreen());

    fireEvent.press(screen.getByRole('button', { name: 'فتح أفضل النصائح' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/tips');

    fireEvent.press(screen.getByRole('button', { name: 'فتح حيوانات للتبني' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/publications/adoption');

    fireEvent.press(screen.getByRole('button', { name: 'فتح حيوانات للتزاوج' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/publications/mating');

    fireEvent.press(screen.getByRole('button', { name: 'فتح حيوانات مفقودة' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/publications/lost');
  });

  it('shows the empty state with an Add-pet CTA when the owner has no pets', async () => {
    list.mockResolvedValue({ items: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 1 } });
    renderWithProviders(<PetsLandingScreen />);

    await waitFor(() => expect(screen.getByText('لم تُضِف أي حيوان بعد')).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('button', { name: 'إضافة حيوان' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pets/create');
  });

  it('the header "الرئيسية" affordance goes back', async () => {
    list.mockResolvedValue({ items: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 1 } });
    renderWithProviders(<PetsLandingScreen />);
    await waitFor(() => expect(screen.getByText('لم تُضِف أي حيوان بعد')).toBeOnTheScreen());

    fireEvent.press(screen.getByRole('button', { name: 'العودة إلى الرئيسية' }));
    expect(routerMock.back).toHaveBeenCalled();
  });

  it('renders an error state with a retry action', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    list.mockRejectedValue(new ApiError({ code: 'INTERNAL_ERROR', message: 'x', status: 500 }));
    renderWithProviders(<PetsLandingScreen />);

    await waitFor(() =>
      expect(screen.getByText('حدثت مشكلة في الخادم. يرجى المحاولة بعد قليل.')).toBeOnTheScreen(),
    );
    expect(screen.getByRole('button', { name: 'إعادة المحاولة' })).toBeOnTheScreen();
  });
});
