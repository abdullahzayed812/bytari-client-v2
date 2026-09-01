import { renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import { petsApi } from '../api';
import OwnershipHistoryScreen from '../screens/OwnershipHistoryScreen';
import type { OwnershipRecord } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const history = jest.spyOn(petsApi, 'ownershipHistory');

beforeEach(() => {
  resetRouterMock();
  setSearchParams({ petId: 'p1' });
  history.mockReset();
});
afterAll(() => jest.restoreAllMocks());

const rec = (over: Partial<OwnershipRecord>): OwnershipRecord => ({
  id: 'o1',
  animalId: 'p1',
  ownerUserId: 'u1',
  owner: { id: 'u1', firstName: 'سارة', lastName: 'خالد' },
  startedAt: '2026-01-01T00:00:00.000Z',
  endedAt: null,
  isCurrent: true,
  transferredBy: null,
  transferReason: null,
  ...over,
});

describe('OwnershipHistoryScreen (§8)', () => {
  it('renders the owner chain with the current badge and transfer reason', async () => {
    history.mockResolvedValue([
      rec({
        id: 'o0',
        owner: { id: 'u0', firstName: 'أحمد', lastName: 'علي' },
        endedAt: '2026-02-01T00:00:00.000Z',
        isCurrent: false,
      }),
      rec({
        id: 'o1',
        transferredBy: 'u0',
        transferReason: 'انتقال رعاية',
      }),
    ]);
    renderWithProviders(<OwnershipHistoryScreen />);
    await waitFor(() => expect(screen.getByText('سارة خالد')).toBeOnTheScreen());
    expect(screen.getByText('أحمد علي')).toBeOnTheScreen();
    expect(screen.getByText('المالك الحالي')).toBeOnTheScreen();
    expect(screen.getByText('انتقال رعاية')).toBeOnTheScreen();
  });

  it('a 403 shows a neutral not-available state (no raw error)', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    history.mockRejectedValue(new ApiError({ code: 'FORBIDDEN', message: 'secret', status: 403 }));
    renderWithProviders(<OwnershipHistoryScreen />);
    await waitFor(() => expect(screen.getByText('غير متاح')).toBeOnTheScreen());
    expect(screen.queryByText('secret')).toBeNull();
  });
});
