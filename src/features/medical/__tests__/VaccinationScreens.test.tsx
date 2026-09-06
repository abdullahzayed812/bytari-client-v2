import { useAuthStore } from '@/features/auth/store';
import { organizationsApi } from '@/features/organizations';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { vaccinationsApi } from '../api';
import VaccinationDetailScreen from '../screens/VaccinationDetailScreen';
import VaccinationFormScreen from '../screens/VaccinationFormScreen';
import VaccinationsScreen from '../screens/VaccinationsScreen';
import type { Vaccination } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const getOrg = jest.spyOn(organizationsApi, 'get');
const listClinic = jest.spyOn(vaccinationsApi, 'listForClinic');
const listOwner = jest.spyOn(vaccinationsApi, 'listForOwner');
const detail = jest.spyOn(vaccinationsApi, 'getForClinic');
const del = jest.spyOn(vaccinationsApi, 'remove');
const create = jest.spyOn(vaccinationsApi, 'create');

beforeEach(() => {
  resetRouterMock();
  getOrg.mockReset().mockResolvedValue({ id: 'o1', type: 'CLINIC', myRole: 'OWNER' } as never);
  [listClinic, listOwner, detail, del, create].forEach((s) => s.mockReset());
  useAuthStore.setState({ session: null });
});
afterAll(() => {
  jest.restoreAllMocks();
  useAuthStore.setState({ session: null });
});

function seedVet() {
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

const vax = (over: Partial<Vaccination> = {}): Vaccination => ({
  id: 'v1',
  animalId: 'a1',
  organizationId: 'o1',
  recordedByUserId: 'u1',
  vaccineName: 'لقاح داء الكلب',
  administeredOn: '2026-01-02',
  nextDueOn: '2027-01-02',
  notes: null,
  createdAt: '2026-01-02T10:00:00.000Z',
  updatedAt: '2026-01-02T10:00:00.000Z',
  ...over,
});

describe('VaccinationsScreen', () => {
  it('CLINIC: lists scoped to org + animal, add CTA navigates to create', async () => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1' });
    seedVet();
    listClinic.mockResolvedValue({
      items: [vax()],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<VaccinationsScreen />);
    await waitFor(() => expect(screen.getByText('لقاح داء الكلب')).toBeOnTheScreen());
    expect(listClinic).toHaveBeenCalledWith('o1', 'a1', 1, 20);
    fireEvent.press(screen.getAllByLabelText('إضافة تطعيم')[0]!);
    expect(routerMock.push).toHaveBeenCalledWith(
      '/(app)/organizations/o1/animals/a1/vaccinations/create',
    );
  });

  it('OWNER: read-only via owner endpoint, no add button', async () => {
    setSearchParams({ petId: 'a1' });
    listOwner.mockResolvedValue({
      items: [vax()],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<VaccinationsScreen />);
    await waitFor(() => expect(screen.getByText('لقاح داء الكلب')).toBeOnTheScreen());
    expect(listOwner).toHaveBeenCalledWith('a1', 1, 20);
    expect(screen.queryByLabelText('إضافة تطعيم')).toBeNull();
  });

  it('empty state', async () => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1' });
    seedVet();
    listClinic.mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    renderWithProviders(<VaccinationsScreen />);
    await waitFor(() =>
      expect(screen.getByText('لا توجد تطعيمات مسجلة لهذا الحيوان')).toBeOnTheScreen(),
    );
  });
});

describe('VaccinationDetailScreen', () => {
  it('CLINIC own record: delete confirms then calls the API and returns to the list', async () => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1', vaccinationId: 'v1' });
    seedVet();
    detail.mockResolvedValue(vax());
    del.mockResolvedValue({ deleted: true });
    renderWithProviders(<VaccinationDetailScreen />);
    await waitFor(() => expect(screen.getByText('حذف التطعيم')).toBeOnTheScreen());

    fireEvent.press(screen.getByText('حذف التطعيم'));
    await waitFor(() =>
      expect(screen.getByText(/هل أنت متأكد من حذف هذا التطعيم/)).toBeOnTheScreen(),
    );
    const confirms = screen.getAllByText('حذف التطعيم');
    fireEvent.press(confirms[confirms.length - 1]!);
    await waitFor(() => expect(del).toHaveBeenCalledWith('o1', 'a1', 'v1'));
  });

  it('404 → plain not-found state', async () => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1', vaccinationId: 'x' });
    seedVet();
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    detail.mockRejectedValue(new ApiError({ code: 'NOT_FOUND', message: 's', status: 404 }));
    renderWithProviders(<VaccinationDetailScreen />);
    await waitFor(() => expect(screen.getByText('التطعيم غير موجود')).toBeOnTheScreen());
  });
});

describe('VaccinationFormScreen', () => {
  beforeEach(() => setSearchParams({ organizationId: 'o1', animalId: 'a1' }));

  it('requires a vaccine name and administered date', async () => {
    renderWithProviders(<VaccinationFormScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'حفظ التطعيم' }));
    await waitFor(() => expect(screen.getByText('اسم اللقاح مطلوب.')).toBeOnTheScreen());
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a next-due date earlier than the administered date', async () => {
    renderWithProviders(<VaccinationFormScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('مثال: لقاح داء الكلب'), 'Rabies');
    const dates = screen.getAllByPlaceholderText('YYYY-MM-DD');
    fireEvent.changeText(dates[0]!, '2026-02-10');
    fireEvent.changeText(dates[1]!, '2026-02-01');
    fireEvent.press(screen.getByRole('button', { name: 'حفظ التطعيم' }));
    await waitFor(() =>
      expect(
        screen.getByText('موعد الجرعة القادمة لا يمكن أن يسبق تاريخ الإعطاء.'),
      ).toBeOnTheScreen(),
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('creates a vaccination with the route animal id', async () => {
    create.mockResolvedValueOnce(vax());
    renderWithProviders(<VaccinationFormScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('مثال: لقاح داء الكلب'), 'Rabies');
    const dates = screen.getAllByPlaceholderText('YYYY-MM-DD');
    fireEvent.changeText(dates[0]!, '2026-01-02');
    fireEvent.press(screen.getByRole('button', { name: 'حفظ التطعيم' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        'o1',
        'a1',
        expect.objectContaining({ vaccineName: 'Rabies', administeredOn: '2026-01-02' }),
      ),
    );
  });
});
