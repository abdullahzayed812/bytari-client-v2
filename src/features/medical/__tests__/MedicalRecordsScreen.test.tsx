import { useAuthStore } from '@/features/auth/store';
import { organizationsApi } from '@/features/organizations';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { medicalRecordsApi } from '../api';
import MedicalRecordsScreen from '../screens/MedicalRecordsScreen';
import type { MedicalRecord } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const getOrg = jest.spyOn(organizationsApi, 'get');
const listClinic = jest.spyOn(medicalRecordsApi, 'listForClinic');
const listOwner = jest.spyOn(medicalRecordsApi, 'listForOwner');

beforeEach(() => {
  resetRouterMock();
  getOrg.mockReset().mockResolvedValue({ id: 'o1', type: 'CLINIC', myRole: 'OWNER' } as never);
  listClinic.mockReset();
  listOwner.mockReset();
  useAuthStore.setState({ session: null });
});
afterAll(() => {
  jest.restoreAllMocks();
  useAuthStore.setState({ session: null });
});

function seedVetSession() {
  useAuthStore.setState({
    session: {
      user: {
        id: 'u1',
        email: 'v@x.c',
        firstName: 'ريم',
        lastName: 'أحمد',
        phone: null,
        status: 'ACTIVE',
        veterinarianStatus: 'APPROVED',
        traderStatus: 'NOT_REGISTERED' as const,
        createdAt: '',
        updatedAt: '',
      },
      roles: ['PET_OWNER', 'VETERINARIAN'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
      veterinarian: { status: 'APPROVED', approved: true },
      trader: { status: 'NOT_REGISTERED', approved: false },
    },
  });
}

const rec = (over: Partial<MedicalRecord> = {}): MedicalRecord => ({
  id: 'r1',
  animalId: 'a1',
  organizationId: 'o1',
  recordedByUserId: 'u1',
  visitDate: '2026-02-01',
  reason: null,
  diagnosis: 'التهاب الأذن',
  treatment: null,
  notes: null,
  createdAt: '2026-02-01T10:00:00.000Z',
  updatedAt: '2026-02-01T10:00:00.000Z',
  ...over,
});

describe('MedicalRecordsScreen — CLINIC context (§5, §17, §26)', () => {
  beforeEach(() => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1' });
    seedVetSession();
  });

  it('lists records scoped to the route organizationId + animalId', async () => {
    listClinic.mockResolvedValue({
      items: [rec()],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<MedicalRecordsScreen />);
    await waitFor(() => expect(screen.getByText(/التهاب الأذن/)).toBeOnTheScreen());
    expect(listClinic).toHaveBeenCalledWith('o1', 'a1', 1, 20);
  });

  it('empty state + add CTA navigates to the create route', async () => {
    listClinic.mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    renderWithProviders(<MedicalRecordsScreen />);
    await waitFor(() =>
      expect(screen.getByText('لا توجد سجلات طبية لهذا الحيوان')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getAllByLabelText('إضافة سجل')[0]!);
    expect(routerMock.push).toHaveBeenCalledWith(
      '/(app)/organizations/o1/animals/a1/medical-records/create',
    );
  });

  it('a 403 surfaces the safe forbidden message (no raw text)', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    listClinic.mockRejectedValue(
      new ApiError({ code: 'FORBIDDEN', message: 'secret', status: 403 }),
    );
    renderWithProviders(<MedicalRecordsScreen />);
    await waitFor(() =>
      expect(screen.getByText('لا تملك صلاحية تنفيذ هذا الإجراء.')).toBeOnTheScreen(),
    );
    expect(screen.queryByText('secret')).toBeNull();
  });
});

describe('MedicalRecordsScreen — OWNER context (§16 read-only)', () => {
  beforeEach(() => setSearchParams({ petId: 'a1' }));

  it('reads via the owner endpoint and shows NO add button', async () => {
    listOwner.mockResolvedValue({
      items: [rec()],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<MedicalRecordsScreen />);
    await waitFor(() => expect(screen.getByText(/التهاب الأذن/)).toBeOnTheScreen());
    expect(listOwner).toHaveBeenCalledWith('a1', 1, 20);
    expect(screen.queryByLabelText('إضافة سجل')).toBeNull();
  });

  it('owner empty state has no create action', async () => {
    listOwner.mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    renderWithProviders(<MedicalRecordsScreen />);
    await waitFor(() =>
      expect(screen.getByText('لا توجد سجلات طبية لهذا الحيوان')).toBeOnTheScreen(),
    );
    expect(screen.queryByText('إضافة سجل')).toBeNull();
  });
});
