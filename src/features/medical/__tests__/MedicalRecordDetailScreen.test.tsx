import { useAuthStore } from '@/features/auth/store';
import { organizationsApi } from '@/features/organizations';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { medicalRecordsApi } from '../api';
import MedicalRecordDetailScreen from '../screens/MedicalRecordDetailScreen';
import type { MedicalRecord } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function seed() {
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

const orgDetail = { id: 'o1', type: 'CLINIC', myRole: 'OWNER' } as const;

const rec = (over: Partial<MedicalRecord> = {}): MedicalRecord => ({
  id: 'r1',
  animalId: 'a1',
  organizationId: 'o1',
  recordedByUserId: 'u1',
  visitDate: '2026-02-01',
  reason: 'فحص',
  diagnosis: 'التهاب الأذن',
  treatment: 'قطرات',
  notes: null,
  createdAt: '2026-02-01T10:00:00.000Z',
  updatedAt: '2026-02-01T10:00:00.000Z',
  ...over,
});

describe('MedicalRecordDetailScreen (§6, §10, §18)', () => {
  const get = jest.spyOn(organizationsApi, 'get');
  const detail = jest.spyOn(medicalRecordsApi, 'getForClinic');
  const detailOwner = jest.spyOn(medicalRecordsApi, 'getForOwner');
  const del = jest.spyOn(medicalRecordsApi, 'remove');

  beforeEach(() => {
    resetRouterMock();
    get.mockReset().mockResolvedValue(orgDetail as never);
    detail.mockReset();
    detailOwner.mockReset();
    del.mockReset();
    seed();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ session: null });
  });

  it('CLINIC: an own-clinic record shows edit + delete; delete confirms then calls the API', async () => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1', recordId: 'r1' });
    detail.mockResolvedValue(rec());
    del.mockResolvedValue({ deleted: true });
    renderWithProviders(<MedicalRecordDetailScreen />);
    await waitFor(() => expect(screen.getByText(/التهاب الأذن/)).toBeOnTheScreen());
    expect(detail).toHaveBeenCalledWith('o1', 'a1', 'r1');

    fireEvent.press(screen.getByText('حذف السجل'));
    await waitFor(() =>
      expect(screen.getByText(/هل أنت متأكد من حذف هذا السجل الطبي/)).toBeOnTheScreen(),
    );
    const confirms = screen.getAllByText('حذف السجل');
    fireEvent.press(confirms[confirms.length - 1]!);

    await waitFor(() => expect(del).toHaveBeenCalledWith('o1', 'a1', 'r1'));
    await waitFor(() =>
      expect(routerMock.replace).toHaveBeenCalledWith(
        '/(app)/organizations/o1/animals/a1/medical-records',
      ),
    );
  });

  it('CLINIC: another clinic’s record hides edit/delete and shows a note', async () => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1', recordId: 'r1' });
    detail.mockResolvedValue(rec({ organizationId: 'other-clinic' }));
    renderWithProviders(<MedicalRecordDetailScreen />);
    await waitFor(() => expect(screen.getByText(/التهاب الأذن/)).toBeOnTheScreen());
    expect(screen.queryByText('حذف السجل')).toBeNull();
    expect(screen.getByText('سجّلته عيادة أخرى؛ يمكنك عرضه فقط.')).toBeOnTheScreen();
  });

  it('OWNER: read-only — no edit/delete, reads via the owner endpoint', async () => {
    setSearchParams({ petId: 'a1', recordId: 'r1' });
    useAuthStore.setState({ session: null });
    detailOwner.mockResolvedValue(rec());
    renderWithProviders(<MedicalRecordDetailScreen />);
    await waitFor(() => expect(screen.getByText(/التهاب الأذن/)).toBeOnTheScreen());
    expect(detailOwner).toHaveBeenCalledWith('a1', 'r1');
    expect(screen.queryByText('حذف السجل')).toBeNull();
    expect(screen.queryByText('تعديل السجل')).toBeNull();
  });

  it('a 404 renders a plain not-found state (no authorization detail)', async () => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1', recordId: 'missing' });
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    detail.mockRejectedValue(new ApiError({ code: 'NOT_FOUND', message: 'secret', status: 404 }));
    renderWithProviders(<MedicalRecordDetailScreen />);
    await waitFor(() => expect(screen.getByText('السجل غير موجود')).toBeOnTheScreen());
    expect(screen.queryByText('secret')).toBeNull();
  });
});
