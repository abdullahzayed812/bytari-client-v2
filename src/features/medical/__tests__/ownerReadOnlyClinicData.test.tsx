import { renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import { clinicCareApi } from '../api';
import RemindersScreen from '../screens/RemindersScreen';
import type { AnimalReminder } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const reminder: AnimalReminder = {
  id: 'r1',
  animalId: 'p1',
  organizationId: 'clinicA',
  recordedByUserId: 'vet1',
  title: 'فحص دوري',
  description: null,
  reminderDate: '2099-01-01',
  reminderType: 'CHECKUP',
  isCompleted: false,
  completedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('Owner view of clinic-created reminders', () => {
  const listOwner = jest.spyOn(clinicCareApi, 'listOwnerReminders');
  beforeEach(() => {
    resetRouterMock();
    listOwner.mockReset().mockResolvedValue({
      items: [reminder],
      meta: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
    });
    setSearchParams({ petId: 'p1' });
  });
  afterAll(() => jest.restoreAllMocks());

  it('shows the reminder read-only — no delete / edit / complete actions, no add button', async () => {
    renderWithProviders(<RemindersScreen />);
    await waitFor(() => expect(screen.getByText('فحص دوري')).toBeOnTheScreen());
    expect(listOwner).toHaveBeenCalledWith('p1', 1, expect.any(Number));
    expect(screen.queryByText('حذف التذكير')).toBeNull();
    expect(screen.queryByText('تعديل السجل')).toBeNull();
    expect(screen.queryByLabelText('إضافة تذكير')).toBeNull();
    expect(clinicCareApi).not.toHaveProperty('deleteOwnerReminder');
  });
});
