import { TextInput } from 'react-native';

import { useAuthStore } from '@/features/auth/store';
import { act, fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { poultryMarketApi } from '../api';
import CreateHatcheryOfferScreen from '../screens/CreateHatcheryOfferScreen';
import HatcheryMarketScreen from '../screens/HatcheryMarketScreen';
import HatcheryOfferDetailScreen from '../screens/HatcheryOfferDetailScreen';
import type { HatcheryOffer, MarketAccess } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
jest.mock('@/features/ads', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    Advertisement: ({ placement }: { placement: string }) => <Text>{`ad:${placement}`}</Text>,
  };
});
jest.mock('@/features/subscriptions', () => ({ SubscriptionTrialCard: () => null }));

const ACCESS: MarketAccess = {
  hasAccess: true,
  staff: false,
  merchant: {
    status: 'APPROVED',
    eligible: true,
    reason: 'ELIGIBLE',
    subscriptionStatus: 'ACTIVE',
    subscriptionEndDate: '2099-01-01',
    renewalRequestedAt: null,
  },
  farms: [],
  sections: { markets: true, sell: true, poultryFarm: false },
};

const OFFER: HatcheryOffer = {
  id: 'h1',
  traderUserId: 'seller-1',
  chickType: 'BROILER',
  breed: 'Ross 308',
  chickAgeDays: 1,
  productionDate: '2026-11-05',
  quantity: 5000,
  pricePerChick: '650.00',
  governorate: 'نينوى',
  district: 'الموصل',
  phone: '+9647701234567',
  whatsapp: null,
  notes: null,
  imageUrls: [],
  status: 'ACTIVE',
  moderationStatus: 'APPROVED',
  rejectionReason: null,
  createdAt: '2026-11-05T08:00:00.000Z',
  updatedAt: '2026-11-05T08:00:00.000Z',
};

const page = (items: HatcheryOffer[]) => ({
  items,
  meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 },
});

beforeEach(() => {
  resetRouterMock();
  useAuthStore.setState({ session: null });
  jest.spyOn(poultryMarketApi.access, 'get').mockResolvedValue(ACCESS);
});
afterEach(() => jest.restoreAllMocks());

describe('عروض المفاقس — hatchery offers', () => {
  it('lists approved offers like the egg market: own ad slot, chick type + breed, age, production day, price', async () => {
    const list = jest
      .spyOn(poultryMarketApi.hatcheryOffers, 'list')
      .mockResolvedValue(page([OFFER]));
    renderWithProviders(<HatcheryMarketScreen />);

    expect(await screen.findByText('أفراخ لاحم - Ross 308')).toBeOnTheScreen();
    expect(screen.getByText('ad:HATCHERY_MARKET')).toBeOnTheScreen();
    expect(screen.getByText('عمر الأفراخ: 1 يوم')).toBeOnTheScreen();
    expect(screen.getByText('يوم الإنتاج: 2026-11-5')).toBeOnTheScreen();
    expect(screen.getByText('سعر الفرخ: 650.00 د.ع')).toBeOnTheScreen();
    expect(screen.getByText('نينوى - الموصل')).toBeOnTheScreen();

    // chick-type filter goes to the server
    fireEvent.press(screen.getByText('أفراخ بياض'));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ chickType: 'LAYER' })),
    );

    fireEvent.press(screen.getByLabelText('إضافة عرض بيع'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/poultry/hatchery-market/create');
  });

  it('"my offers" shows the Admin review state of each request', async () => {
    jest.spyOn(poultryMarketApi.hatcheryOffers, 'list').mockResolvedValue(page([]));
    jest.spyOn(poultryMarketApi.hatcheryOffers, 'listMine').mockResolvedValue(
      page([
        { ...OFFER, id: 'p', moderationStatus: 'PENDING' },
        { ...OFFER, id: 'r', moderationStatus: 'REJECTED', rejectionReason: 'صور غير واضحة' },
      ]),
    );
    renderWithProviders(<HatcheryMarketScreen />);
    fireEvent.press(await screen.findByText('عروضي'));
    expect(await screen.findByText('قيد المراجعة لدى الإدارة')).toBeOnTheScreen();
    expect(screen.getByText('مرفوض — صور غير واضحة')).toBeOnTheScreen();
  });

  it('submits a new offer as a request for Admin review (normalized date, optional fields omitted)', async () => {
    const create = jest
      .spyOn(poultryMarketApi.hatcheryOffers, 'create')
      .mockResolvedValue({ ...OFFER, moderationStatus: 'PENDING' });
    renderWithProviders(<CreateHatcheryOfferScreen />);

    expect(
      await screen.findByText(
        'يُرسل العرض إلى الإدارة للمراجعة، ويظهر في عروض المفاقس بعد الموافقة عليه.',
      ),
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByText('أفراخ بياض'));
    // Inputs in render order: breed, age, production day, quantity, price, district, phone, whatsapp, notes.
    const inputs = screen.UNSAFE_getAllByType(TextInput);
    fireEvent.changeText(inputs[0]!, 'Lohmann Brown');
    fireEvent.changeText(inputs[1]!, '3');
    fireEvent.changeText(inputs[2]!, '2026-11-4');
    fireEvent.changeText(inputs[6]!, '07701234567');
    fireEvent.press(screen.getByRole('button', { name: 'المحافظة' }));
    fireEvent.press(screen.getByText('بغداد'));

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'إرسال العرض للمراجعة' }));
    });

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0]![0]).toEqual({
      chickType: 'LAYER',
      breed: 'Lohmann Brown',
      chickAgeDays: 3,
      productionDate: '2026-11-04',
      quantity: undefined,
      pricePerChick: undefined,
      governorate: 'بغداد',
      district: undefined,
      phone: '07701234567',
      whatsapp: undefined,
      notes: undefined,
      galleryKeys: [],
    });
    expect(routerMock.back).toHaveBeenCalled();
  });

  it('blocks an impossible production day before calling the API', async () => {
    const create = jest.spyOn(poultryMarketApi.hatcheryOffers, 'create');
    renderWithProviders(<CreateHatcheryOfferScreen />);
    await screen.findByText('إرسال العرض للمراجعة');
    const inputs = screen.UNSAFE_getAllByType(TextInput);
    fireEvent.changeText(inputs[2]!, '2026-2-30');
    fireEvent.changeText(inputs[6]!, '07701234567');
    fireEvent.press(screen.getByRole('button', { name: 'المحافظة' }));
    fireEvent.press(screen.getByText('بغداد'));
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'إرسال العرض للمراجعة' }));
    });
    expect(await screen.findByText('تاريخ غير صالح — استخدم الصيغة 2026-11-5')).toBeOnTheScreen();
    expect(create).not.toHaveBeenCalled();
  });

  it('detail shows the hatchery fields and contact actions', async () => {
    setSearchParams({ offerId: 'h1' });
    jest.spyOn(poultryMarketApi.hatcheryOffers, 'get').mockResolvedValue(OFFER);
    renderWithProviders(<HatcheryOfferDetailScreen />);
    expect(await screen.findByText('Ross 308')).toBeOnTheScreen();
    expect(screen.getByText('1 يوم')).toBeOnTheScreen();
    expect(screen.getByText('2026-11-5')).toBeOnTheScreen();
    expect(screen.getByText('5000')).toBeOnTheScreen();
    expect(screen.getByText('650.00 د.ع')).toBeOnTheScreen();
    expect(screen.getByText('اتصال')).toBeOnTheScreen();
  });
});
