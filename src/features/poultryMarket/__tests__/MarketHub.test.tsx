import { useWindowDimensions } from 'react-native';

import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { poultryMarketApi } from '../api';
import PoultryMarketHubScreen from '../screens/PoultryMarketHubScreen';
import PoultryMarketScreen from '../screens/PoultryMarketScreen';
import type { MarketAccess } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
// The ad slot and the trial card fetch their own data — stub them to markers.
jest.mock('@/features/ads', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    Advertisement: ({ placement }: { placement: string }) => <Text>{`ad:${placement}`}</Text>,
  };
});
jest.mock('@/features/subscriptions', () => ({ SubscriptionTrialCard: () => null }));
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: jest.fn(() => ({ width: 400, height: 800, scale: 2, fontScale: 1 })),
}));

const merchant = (over: Partial<MarketAccess['merchant']> = {}): MarketAccess['merchant'] => ({
  status: 'NOT_REGISTERED',
  eligible: false,
  reason: 'NOT_REGISTERED',
  subscriptionStatus: null,
  subscriptionEndDate: null,
  renewalRequestedAt: null,
  ...over,
});
const eligibleMerchant = merchant({
  status: 'APPROVED',
  eligible: true,
  reason: 'ELIGIBLE',
  subscriptionStatus: 'ACTIVE',
  subscriptionEndDate: '2099-01-01',
});
const farm = (
  over: Partial<MarketAccess['farms'][number]> = {},
): MarketAccess['farms'][number] => ({
  organizationId: 'f1',
  name: 'حقل النور',
  status: 'ACTIVE',
  eligible: true,
  reason: 'ELIGIBLE',
  subscriptionStatus: 'ACTIVE',
  subscriptionEndDate: '2099-01-01',
  ...over,
});
function access(m: MarketAccess['merchant'], farms: MarketAccess['farms'] = []): MarketAccess {
  const farmOk = farms.some((f) => f.eligible);
  const ok = m.eligible || farmOk;
  return {
    hasAccess: ok,
    staff: false,
    merchant: m,
    farms,
    sections: { markets: ok, sell: ok, poultryFarm: farmOk },
  };
}
const mockAccess = (a: MarketAccess) =>
  jest.spyOn(poultryMarketApi.access, 'get').mockResolvedValue(a);

beforeEach(() => {
  resetRouterMock();
  (useWindowDimensions as jest.Mock).mockReturnValue({
    width: 400,
    height: 800,
    scale: 2,
    fontScale: 1,
  });
});
afterEach(() => jest.restoreAllMocks());

describe('Markets & Exchanges — no eligible account (initial access screen)', () => {
  it('offers both account types and opens the EXISTING registration / farm-creation flows', async () => {
    mockAccess(access(merchant()));
    renderWithProviders(<PoultryMarketHubScreen />);

    expect(await screen.findByText('إضافة حقل دواجن')).toBeOnTheScreen();
    expect(screen.getByText('حساب تاجر')).toBeOnTheScreen();
    expect(screen.getByText('معلومة مهمة')).toBeOnTheScreen();
    expect(screen.getByText('جميع ميزات حساب التاجر')).toBeOnTheScreen();
    expect(screen.getByText('نشر الإعلانات وعروض البيع')).toBeOnTheScreen();
    // No market content and no ad before access.
    expect(screen.queryByText('ad:TRADER_REGISTRATION')).toBeNull();
    expect(screen.queryByText('إعلانات البيض اليومية')).toBeNull();

    fireEvent.press(screen.getByText('إنشاء حقل دواجن'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/poultry/create');
    fireEvent.press(screen.getByText('تسجيل كتاجر'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/poultry/trader-register');
  });

  it('a pending merchant sees why (no duplicate registration CTA)', async () => {
    mockAccess(access(merchant({ status: 'PENDING', reason: 'PENDING_APPROVAL' })));
    renderWithProviders(<PoultryMarketHubScreen />);
    expect(
      await screen.findByText(
        'طلب تسجيلك كتاجر قيد المراجعة — سيُفعَّل الدخول بعد موافقة الإدارة.',
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByText('تسجيل كتاجر')).toBeNull();
  });

  it('an expired farm explains the denial and links to the existing farm renewal', async () => {
    mockAccess(
      access(merchant(), [
        farm({
          eligible: false,
          reason: 'SUBSCRIPTION_EXPIRED',
          subscriptionStatus: 'EXPIRED',
          subscriptionEndDate: '2025-12-31',
        }),
      ]),
    );
    renderWithProviders(<PoultryMarketHubScreen />);
    expect(await screen.findByText(/انتهى اشتراك حقل «حقل النور»/)).toBeOnTheScreen();
    fireEvent.press(screen.getByText('تجديد اشتراك الحقل'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/poultry/f1/subscription-renewal');
  });

  it('an expired merchant gets the renewal request (existing endpoint)', async () => {
    mockAccess(
      access(
        merchant({
          status: 'APPROVED',
          reason: 'SUBSCRIPTION_EXPIRED',
          subscriptionStatus: 'EXPIRED',
          subscriptionEndDate: '2025-12-31',
        }),
      ),
    );
    const renew = jest
      .spyOn(poultryMarketApi.traders, 'requestRenewal')
      .mockResolvedValue({} as never);
    renderWithProviders(<PoultryMarketHubScreen />);
    expect(await screen.findByText(/انتهت فترة تفعيل حسابك كتاجر في/)).toBeOnTheScreen();
    fireEvent.press(screen.getByText('طلب تجديد التفعيل'));
    await screen.findByText(/انتهت فترة تفعيل حسابك كتاجر في/);
    expect(renew).toHaveBeenCalled();
  });

  it('places the two account cards side by side, and stacks them on a narrow phone', async () => {
    mockAccess(access(merchant()));
    const { unmount } = renderWithProviders(<PoultryMarketHubScreen />);
    expect(await screen.findByTestId('market-access-cards')).toHaveStyle({ flexDirection: 'row' });
    unmount();

    (useWindowDimensions as jest.Mock).mockReturnValue({
      width: 320,
      height: 640,
      scale: 2,
      fontScale: 1,
    });
    renderWithProviders(<PoultryMarketHubScreen />);
    expect(await screen.findByTestId('market-access-cards')).toHaveStyle({
      flexDirection: 'column',
    });
  });
});

describe('Markets & Exchanges — with access', () => {
  it('an eligible merchant: the ad, "add a poultry farm" under it, the markets grid and statistics', async () => {
    mockAccess(access(eligibleMerchant));
    renderWithProviders(<PoultryMarketHubScreen />);

    expect(await screen.findByText('ad:TRADER_REGISTRATION')).toBeOnTheScreen();
    expect(screen.getByTestId('market-add-farm-entry')).toBeOnTheScreen();
    expect(screen.queryByTestId('market-farm-entry')).toBeNull();
    for (const title of [
      'سوق الدواجن',
      'سوق البيض',
      'بورصة الدواجن',
      'بورصة البيض',
      'إحصائية الدواجن',
    ]) {
      expect(screen.getByText(title)).toBeOnTheScreen();
    }
    fireEvent.press(screen.getByText('سوق البيض'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/poultry/egg-market');
    fireEvent.press(screen.getByText('بورصة الدواجن'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/poultry/exchange-rates');
    fireEvent.press(screen.getByText('إحصائية الدواجن'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/poultry/statistics');
  });

  it('a poultry farm owner (no merchant account) gets the markets AND their farm card', async () => {
    mockAccess(access(merchant(), [farm()]));
    renderWithProviders(<PoultryMarketHubScreen />);
    expect(await screen.findByTestId('market-farm-entry')).toBeOnTheScreen();
    expect(screen.getByText('حقل النور')).toBeOnTheScreen();
    expect(screen.getByText('سوق الدواجن')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('حقل النور'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/poultry/f1');
  });

  it('both accounts, merchant expired: access through the farm only — one farm card, a merchant notice', async () => {
    mockAccess(
      access(
        merchant({
          status: 'APPROVED',
          reason: 'SUBSCRIPTION_EXPIRED',
          subscriptionStatus: 'EXPIRED',
          subscriptionEndDate: '2025-12-31',
        }),
        [farm()],
      ),
    );
    renderWithProviders(<PoultryMarketHubScreen />);
    expect(await screen.findAllByTestId('market-farm-entry')).toHaveLength(1);
    expect(screen.queryByTestId('market-add-farm-entry')).toBeNull();
    expect(screen.getByText(/انتهت فترة تفعيل حسابك كتاجر في/)).toBeOnTheScreen();
    expect(screen.getByText('سوق البيض')).toBeOnTheScreen();
  });

  it('two eligible farms open the farms list instead of one farm', async () => {
    mockAccess(
      access(eligibleMerchant, [farm(), farm({ organizationId: 'f2', name: 'حقل الأمل' })]),
    );
    renderWithProviders(<PoultryMarketHubScreen />);
    fireEvent.press(await screen.findByText('حقول الدواجن'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/poultry');
  });
});

describe('a market screen reached directly without access', () => {
  it('shows why and links back to the hub instead of the market content', async () => {
    mockAccess(access(merchant()));
    renderWithProviders(<PoultryMarketScreen />);
    expect(await screen.findByText('لا يمكنك الدخول إلى السوق حالياً')).toBeOnTheScreen();
    expect(
      screen.getByText('يتطلب هذا القسم حساب تاجر مفعّلاً أو حقل دواجن باشتراك مفعّل.'),
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByText('الذهاب إلى السوق وبورصات الدواجن'));
    expect(routerMock.replace).toHaveBeenCalledWith('/(app)/poultry/market-hub');
  });
});
