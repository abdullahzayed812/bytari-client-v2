import * as Clipboard from 'expo-clipboard';

import { useAuthStore } from '@/features/auth/store';
import { clinicCareApi, vaccinationsApi } from '@/features/medical/api';
import { notificationsApi } from '@/features/notifications';
import { petsApi } from '@/features/pets';
import PetDetailsScreen from '@/features/pets/screens/PetDetailsScreen';
import type { Pet } from '@/features/pets/types';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn().mockResolvedValue(true) }));

const owner = {
  id: 'owner1',
  email: 'o@x.c',
  firstName: 'س',
  lastName: 'ع',
  phone: null,
  status: 'ACTIVE' as const,
  veterinarianStatus: 'NOT_APPLIED' as const,
  traderStatus: 'NOT_REGISTERED' as const,
  createdAt: '',
  updatedAt: '',
};

const pet = (over: Partial<Pet> = {}): Pet => ({
  id: 'p1',
  publicCode: 'K7M4QXR',
  name: 'كوت',
  species: 'DOG',
  breed: 'هجين',
  sex: 'FEMALE',
  dateOfBirth: '2022-12-15',
  color: 'أصفر',
  weightKg: 2,
  isNeutered: false,
  notes: null,
  status: 'ACTIVE',
  createdBy: 'owner1',
  currentOwnerUserId: 'owner1',
  createdAt: '',
  updatedAt: '',
  ...over,
});

describe('PetDetailsScreen — reference layout', () => {
  const get = jest.spyOn(petsApi, 'get');
  const deactivate = jest.spyOn(petsApi, 'deactivate');
  const vaccinations = jest.spyOn(vaccinationsApi, 'listForOwner');
  const reminders = jest.spyOn(clinicCareApi, 'listOwnerReminders');

  beforeEach(() => {
    resetRouterMock();
    setSearchParams({ petId: 'p1' });
    useAuthStore.setState({
      user: owner,
      session: {
        user: owner,
        roles: ['PET_OWNER'],
        permissions: [],
        isAdmin: false,
        supervisorDomains: [],
        veterinarian: { status: 'NOT_APPLIED', approved: false },
        trader: { status: 'NOT_REGISTERED', approved: false },
      },
    } as never);
    jest.spyOn(notificationsApi, 'petUnseen').mockResolvedValue({ vaccinations: 0, reminders: 0 });
    jest.spyOn(notificationsApi, 'markPetSectionSeen').mockResolvedValue({ updated: 0 });
    get.mockReset().mockResolvedValue(pet());
    deactivate.mockReset().mockResolvedValue(pet({ status: 'DEACTIVATED' }));
    vaccinations.mockReset().mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    } as never);
    reminders.mockReset().mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    } as never);
    (Clipboard.setStringAsync as jest.Mock).mockClear();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ session: null, user: null });
  });

  it('renders header, stats, ID card, tabs and general info', async () => {
    renderWithProviders(<PetDetailsScreen />);
    await waitFor(() => expect(screen.getByText('كوت')).toBeOnTheScreen());
    expect(screen.getByText('كلب - هجين')).toBeOnTheScreen();
    for (const label of ['العمر', 'الجنس', 'الوزن', 'معلومات عامة', 'اللون', 'التعقيم']) {
      expect(screen.getByText(label)).toBeOnTheScreen();
    }
    expect(screen.getByText('2 كجم')).toBeOnTheScreen();
    expect(screen.getByText('أصفر')).toBeOnTheScreen();
    expect(screen.getByText('2022/12/15')).toBeOnTheScreen();
    for (const tab of ['معلومات', 'التطعيمات', 'التذكيرات', 'العيادات']) {
      expect(screen.getByRole('tab', { name: tab })).toBeOnTheScreen();
    }
    for (const action of ['إبلاغ عن فقدان', 'عرض للتبني', 'عرض للتزاوج', 'تحويل الملكية']) {
      expect(screen.getByRole('button', { name: action })).toBeOnTheScreen();
    }
    fireEvent.press(screen.getByRole('button', { name: 'عرض للتزاوج' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pets/p1/publish/mating');
  });

  it('copies the ID and opens the QR modal', async () => {
    renderWithProviders(<PetDetailsScreen />);
    await waitFor(() => expect(screen.getByText('كوت')).toBeOnTheScreen());

    fireEvent.press(screen.getByRole('button', { name: 'نسخ المعرف' }));
    await waitFor(() => expect(Clipboard.setStringAsync).toHaveBeenCalledWith('K7M4QXR'));
    expect(await screen.findByText('تم نسخ المعرف بنجاح')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'عرض رمز الاستجابة السريعة' }));
    expect(await screen.findByText('رمز الاستجابة السريعة للتعريف')).toBeOnTheScreen();
  });

  it('delete asks for confirmation, then deactivates and returns to the list', async () => {
    renderWithProviders(<PetDetailsScreen />);
    await waitFor(() => expect(screen.getByText('كوت')).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('button', { name: 'حذف' }));
    expect(await screen.findByText('حذف الحيوان')).toBeOnTheScreen();
    const confirm = screen.getAllByRole('button', { name: 'حذف' }).at(-1)!;
    fireEvent.press(confirm);
    await waitFor(() => expect(deactivate).toHaveBeenCalledWith('p1'));
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/(app)/pets'));
  });

  it('tabs render their content inline', async () => {
    renderWithProviders(<PetDetailsScreen />);
    await waitFor(() => expect(screen.getByText('كوت')).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('tab', { name: 'التطعيمات' }));
    await waitFor(() => expect(vaccinations).toHaveBeenCalled());
    expect(screen.queryByText('معلومات عامة')).toBeNull();
    fireEvent.press(screen.getByRole('tab', { name: 'التذكيرات' }));
    await waitFor(() => expect(reminders).toHaveBeenCalled());
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it('a non-owner sees no ID card, delete or quick actions — only the info tab', async () => {
    get.mockResolvedValue(pet({ currentOwnerUserId: 'someone-else' }));
    renderWithProviders(<PetDetailsScreen />);
    await waitFor(() => expect(screen.getByText('كوت')).toBeOnTheScreen());
    expect(screen.queryByRole('button', { name: 'نسخ المعرف' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'حذف' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'عرض للتبني' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'التطعيمات' })).toBeNull();
  });
});
