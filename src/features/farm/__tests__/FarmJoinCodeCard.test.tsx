import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';

import { farmApi } from '../api';
import { FarmJoinCodeCard } from '../components';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

describe('FarmJoinCodeCard (§9 — owner shares / rotates the Farm-ID)', () => {
  const getCode = jest.spyOn(farmApi, 'getJoinCode');
  const regen = jest.spyOn(farmApi, 'regenerateJoinCode');

  beforeEach(() => {
    getCode.mockReset();
    regen.mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  it('renders the current join code', async () => {
    getCode.mockResolvedValue({ joinCode: 'FARM-8F3K9Q' });
    renderWithProviders(<FarmJoinCodeCard organizationId="o1" organizationName="مزرعة" />);
    await waitFor(() => expect(screen.getByText('FARM-8F3K9Q')).toBeOnTheScreen());
  });

  it('shows an "unavailable" state when the code cannot be read (403/404)', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    getCode.mockRejectedValue(new ApiError({ code: 'FORBIDDEN', message: 'x', status: 403 }));
    renderWithProviders(<FarmJoinCodeCard organizationId="o1" organizationName="مزرعة" />);
    await waitFor(() => expect(screen.getByText('رمز الانضمام غير متاح.')).toBeOnTheScreen());
  });

  it('rotating the code confirms then calls the backend', async () => {
    getCode.mockResolvedValue({ joinCode: 'FARM-8F3K9Q' });
    regen.mockResolvedValue({ joinCode: 'FARM-NEW999' });
    renderWithProviders(<FarmJoinCodeCard organizationId="o1" organizationName="مزرعة" />);
    await waitFor(() => expect(screen.getByText('FARM-8F3K9Q')).toBeOnTheScreen());

    fireEvent.press(screen.getByText('تغيير الرمز'));
    await waitFor(() =>
      expect(screen.getByText(/سيتوقف الرمز الحالي عن العمل فوراً/)).toBeOnTheScreen(),
    );
    const confirms = screen.getAllByText('تغيير الرمز');
    fireEvent.press(confirms[confirms.length - 1]!);
    await waitFor(() => expect(regen).toHaveBeenCalledWith('o1'));
    await waitFor(() => expect(screen.getByText('FARM-NEW999')).toBeOnTheScreen());
  });
});
