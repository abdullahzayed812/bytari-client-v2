import { organizationAnimalsApi } from '@/features/animals/api';
import type { OrganizationAnimalGrant } from '@/features/animals/types';
import { ApiError } from '@/services/api';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { ClinicPetSearch, animalIdFromCode } from '../components';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
// The camera is replaced by a button that "scans" a fixed code.
let mockScannedCode = '';
jest.mock('@/features/animals/components/AnimalCodeScannerModal', () => ({
  AnimalCodeScannerModal: ({
    visible,
    onScanned,
  }: {
    visible: boolean;
    onScanned: (c: string) => void;
  }) => {
    const { Pressable, Text } = require('react-native');
    return visible ? (
      <Pressable accessibilityRole="button" onPress={() => onScanned(mockScannedCode)}>
        <Text>FAKE SCAN</Text>
      </Pressable>
    ) : null;
  },
}));

const MILO_ID = '1a2b3c4d-0000-4000-8000-000000000001';
const STRANGER_ID = '9f9f9f9f-0000-4000-8000-000000000009';

const milo: OrganizationAnimalGrant = {
  id: 'g1',
  animalId: MILO_ID,
  organizationId: 'c1',
  status: 'ACTIVE',
  grantedByUserId: 'u1',
  createdAt: '',
  animal: {
    name: 'ميلو',
    species: 'DOG',
    status: 'ACTIVE',
    breed: 'هاسكي',
    photoUrl: 'https://cdn.test/milo.jpg',
  },
  ownerName: 'زينب كريم',
};
const page = (items: OrganizationAnimalGrant[]) => ({
  items,
  meta: { page: 1, pageSize: 50, total: items.length, totalPages: 1 },
});

describe('ClinicPetSearch', () => {
  const list = jest.spyOn(organizationAnimalsApi, 'list');
  const grant = jest.spyOn(organizationAnimalsApi, 'grant');
  beforeEach(() => {
    resetRouterMock();
    list.mockReset();
    grant.mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  const type = (text: string) =>
    fireEvent.changeText(screen.getByLabelText(/رقم المعرف أو اسم الحيوان/), text);

  it('idle → hint only, no request', () => {
    renderWithProviders(<ClinicPetSearch organizationId="c1" canLink />);
    expect(screen.getByText(/امسح رمز QR من ملف الحيوان/)).toBeOnTheScreen();
    expect(list).not.toHaveBeenCalled();
  });

  it('results show photo, name, species/breed, owner and short id; tapping opens the clinic pet file', async () => {
    list.mockResolvedValue(page([milo]));
    renderWithProviders(<ClinicPetSearch organizationId="c1" canLink />);
    type('ميل');
    await waitFor(() => expect(screen.getByText('ميلو')).toBeOnTheScreen());
    expect(list).toHaveBeenLastCalledWith('c1', 1, 50, 'ميل');
    expect(screen.getByText('المالك: زينب كريم')).toBeOnTheScreen();
    expect(screen.getByText('#1a2b3c4d')).toBeOnTheScreen();
    expect(screen.getByText(/هاسكي/)).toBeOnTheScreen();
    expect(screen.getByText('1 نتيجة')).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText('فتح ملف ميلو'));
    expect(routerMock.push).toHaveBeenCalledWith(`/(app)/organizations/c1/animals/${MILO_ID}`);
  });

  it('no match → the empty "no results" state', async () => {
    list.mockResolvedValue(page([]));
    renderWithProviders(<ClinicPetSearch organizationId="c1" canLink />);
    type('غير موجود');
    await waitFor(() =>
      expect(screen.getByText('لم يتم العثور على نتائج مطابقة')).toBeOnTheScreen(),
    );
    expect(screen.queryByText('ربط الحيوان وفتح ملفه')).toBeNull();
  });

  it('a failed search → error state with retry', async () => {
    list.mockRejectedValue(new ApiError({ code: 'INTERNAL_ERROR', message: 'x', status: 500 }));
    renderWithProviders(<ClinicPetSearch organizationId="c1" canLink />);
    type('ميلو');
    await waitFor(() => expect(screen.getByText('إعادة المحاولة')).toBeOnTheScreen(), {
      timeout: 15_000,
    });
  }, 20_000);

  it('scanning a patient’s QR opens its file directly', async () => {
    list.mockResolvedValue(page([milo]));
    mockScannedCode = `bytari://pets/${MILO_ID.toUpperCase()}`;
    renderWithProviders(<ClinicPetSearch organizationId="c1" canLink />);
    fireEvent.press(screen.getByLabelText('مسح الباركود'));
    fireEvent.press(screen.getByText('FAKE SCAN'));
    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledWith(`/(app)/organizations/c1/animals/${MILO_ID}`),
    );
    expect(list).toHaveBeenLastCalledWith('c1', 1, 50, MILO_ID);
  });

  it('a scanned pet that is not a patient → neutral "not accessible"; a manager can link & open', async () => {
    list.mockResolvedValue(page([]));
    grant.mockResolvedValue({} as never);
    mockScannedCode = STRANGER_ID;
    renderWithProviders(<ClinicPetSearch organizationId="c1" canLink />);
    fireEvent.press(screen.getByLabelText('مسح الباركود'));
    fireEvent.press(screen.getByText('FAKE SCAN'));
    await waitFor(() =>
      expect(screen.getByText('الحيوان غير موجود أو لا يمكن الوصول إليه')).toBeOnTheScreen(),
    );
    expect(routerMock.push).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('ربط الحيوان وفتح ملفه'));
    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledWith(
        `/(app)/organizations/c1/animals/${STRANGER_ID}`,
      ),
    );
    expect(grant).toHaveBeenCalledWith('c1', { animalId: STRANGER_ID });
  });

  it('without manage permission the not-accessible state has no link action; a refused link stays put', async () => {
    list.mockResolvedValue(page([]));
    renderWithProviders(<ClinicPetSearch organizationId="c1" canLink={false} />);
    type(STRANGER_ID);
    await waitFor(() =>
      expect(screen.getByText('الحيوان غير موجود أو لا يمكن الوصول إليه')).toBeOnTheScreen(),
    );
    expect(screen.queryByText('ربط الحيوان وفتح ملفه')).toBeNull();
  });

  it('a link the backend refuses (e.g. a listing subject → 404) shows a neutral error and does not navigate', async () => {
    list.mockResolvedValue(page([]));
    grant.mockRejectedValue(new ApiError({ code: 'NOT_FOUND', message: 'x', status: 404 }));
    renderWithProviders(<ClinicPetSearch organizationId="c1" canLink />);
    type(STRANGER_ID);
    await waitFor(() => expect(screen.getByText('ربط الحيوان وفتح ملفه')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('ربط الحيوان وفتح ملفه'));
    await waitFor(() => expect(screen.getByText(/تعذّر ربط هذا الحيوان/)).toBeOnTheScreen());
    expect(routerMock.push).not.toHaveBeenCalled();
  });
});

describe('animalIdFromCode', () => {
  it('extracts a UUID from a raw id or a link; otherwise returns the trimmed text', () => {
    expect(animalIdFromCode(MILO_ID)).toBe(MILO_ID);
    expect(animalIdFromCode(`https://x.test/p/${MILO_ID.toUpperCase()}?a=1`)).toBe(MILO_ID);
    expect(animalIdFromCode('  1234567890123 ')).toBe('1234567890123');
  });
});
