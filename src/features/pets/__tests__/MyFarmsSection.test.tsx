import { organizationsApi } from '@/features/organizations/api/organizationsApi';
import type { MyOrganization } from '@/features/organizations/types';
import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { MyFarmsSection } from '../components/MyFarmsSection';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const farm = (over: Partial<MyOrganization>): MyOrganization =>
  ({
    id: 'f1',
    type: 'FARM',
    name: 'مزرعة الأمل',
    status: 'ACTIVE',
    myRole: 'OWNER',
    farmSpecies: 'SHEEP',
    governorate: 'بغداد',
    ...over,
  }) as MyOrganization;

beforeEach(() => {
  resetRouterMock();
  jest.restoreAllMocks();
});

describe('MyFarmsSection — farms under My Pets', () => {
  it('lists only the account’s own farms (farm_section scope) and opens the right dashboard', async () => {
    const listMine = jest.spyOn(organizationsApi, 'listMine').mockResolvedValue({
      items: [
        farm({}),
        farm({ id: 'c1', type: 'CLINIC', name: 'عيادة' } as Partial<MyOrganization>),
      ],
      meta: { page: 1, pageSize: 50, total: 2, totalPages: 1 },
    });
    renderWithProviders(<MyFarmsSection />);

    expect(await screen.findByText('مزرعة الأمل')).toBeTruthy();
    expect(listMine).toHaveBeenCalledWith(1, 50, 'farm_section');
    // non-farm organizations never appear here
    expect(screen.queryByText('عيادة')).toBeNull();
    fireEvent.press(screen.getByText('مزرعة الأمل'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/livestock/sheep/f1');
  });

  it('shows an empty hint when no farm is linked', async () => {
    jest.spyOn(organizationsApi, 'listMine').mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 50, total: 0, totalPages: 0 },
    });
    renderWithProviders(<MyFarmsSection />);
    expect(await screen.findByText('لا توجد مزارع أو حقول مرتبطة بحسابك')).toBeTruthy();
  });
});
