import { TextInput } from 'react-native';

import type { FarmAppointment } from '@/features/farm/types';
import { initI18n } from '@/i18n';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import { farmOpsApi } from '../api';
import FarmAppointmentsScreen from '../screens/FarmAppointmentsScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
jest.mock('@/lib/env', () => ({ ...jest.requireActual('@/lib/env'), devDataEnabled: false }));

const appointment: FarmAppointment = {
  id: 'ap1',
  organizationId: 'farm1',
  poultryFlockId: null,
  title: 'تحصين نيوكاسل',
  description: null,
  category: 'VACCINATION',
  scheduledFor: '2027-03-10',
  status: 'UPCOMING',
  assignedVeterinarianUserId: 'v1',
  assignedVeterinarian: { id: 'v1', firstName: 'سارة', lastName: 'علي' },
  createdByUserId: 'u1',
  createdAt: '2026-10-14T10:00:00.000Z',
  updatedAt: '2026-10-14T10:00:00.000Z',
};

beforeAll(() => initI18n('ar'));
beforeEach(() => {
  resetRouterMock();
  setSearchParams({ organizationId: 'farm1' });
  jest.spyOn(farmOpsApi, 'listAppointments').mockResolvedValue({
    items: [appointment],
    meta: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
  });
  jest.spyOn(farmOpsApi, 'listAssignableVeterinarians').mockResolvedValue([
    { id: 'v1', firstName: 'سارة', lastName: 'علي' },
    { id: 'v2', firstName: 'أحمد', lastName: 'حسن' },
  ]);
});
afterEach(() => jest.restoreAllMocks());

describe('Farm appointments — responsible veterinarian', () => {
  it('the list shows who is responsible', async () => {
    renderWithProviders(<FarmAppointmentsScreen />);
    expect(await screen.findByText('الطبيب المسؤول: سارة علي')).toBeOnTheScreen();
  });

  it('the add form assigns the picked veterinarian (sent as assignedVeterinarianUserId)', async () => {
    const create = jest.spyOn(farmOpsApi, 'createAppointment').mockResolvedValue(appointment);
    renderWithProviders(<FarmAppointmentsScreen />);
    fireEvent.press(await screen.findByRole('button', { name: 'إضافة موعد' }));
    // First field of the dialog is the title; the date field shows the format placeholder.
    fireEvent.changeText(screen.UNSAFE_getAllByType(TextInput)[0]!, 'زيارة');
    fireEvent.changeText(screen.getByPlaceholderText('2026-9-1'), '2027-03-10');

    fireEvent.press(screen.getByRole('button', { name: 'الطبيب البيطري المسؤول' }));
    fireEvent.press(await screen.findByText('أحمد حسن'));
    fireEvent.press(screen.getByRole('button', { name: 'حفظ' }));

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith(
      'farm1',
      expect.objectContaining({
        title: 'زيارة',
        scheduledFor: '2027-03-10',
        assignedVeterinarianUserId: 'v2',
      }),
    );
  });
});
