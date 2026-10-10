import { organizationAnimalsApi } from '@/features/animals/api';
import type { ClinicPet } from '@/features/animals/types';
import { petCodeFromInput } from '@/features/pets/petCode';
import { ApiError } from '@/services/api';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { ClinicPetSearch } from '../components';

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

const milo: ClinicPet = {
  animalId: MILO_ID,
  publicCode: 'K7M4QXR',
  firstActivityAt: '2026-01-01T00:00:00.000Z',
  lastActivityAt: '2026-01-02T00:00:00.000Z',
  animal: {
    name: 'ميلو',
    species: 'DOG',
    status: 'ACTIVE',
    breed: 'هاسكي',
    photoUrl: 'https://cdn.test/milo.jpg',
  },
  ownerName: 'زينب كريم',
};
const page = (items: ClinicPet[]) => ({
  items,
  meta: { page: 1, pageSize: 50, total: items.length, totalPages: 1 },
});
const lookupHit = (animalId: string) => ({
  animalId,
  publicCode: 'P9Q2RST',
  name: 'غريب',
  species: 'CAT',
  breed: null,
  photoUrl: null,
  workedWith: false,
});

describe('ClinicPetSearch', () => {
  const list = jest.spyOn(organizationAnimalsApi, 'list');
  const lookup = jest.spyOn(organizationAnimalsApi, 'lookup');
  beforeEach(() => {
    resetRouterMock();
    list.mockReset();
    lookup.mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  const type = (text: string) =>
    fireEvent.changeText(screen.getByLabelText(/رقم المعرف أو اسم الحيوان/), text);

  it('idle → hint only, no request', () => {
    renderWithProviders(<ClinicPetSearch organizationId="c1" canOpen />);
    expect(screen.getByText(/امسح رمز QR/)).toBeOnTheScreen();
    expect(list).not.toHaveBeenCalled();
  });

  it('results show photo, name, species/breed, owner and the SHORT pet ID; tapping opens the clinic pet file', async () => {
    list.mockResolvedValue(page([milo]));
    renderWithProviders(<ClinicPetSearch organizationId="c1" canOpen />);
    type('ميل');
    await waitFor(() => expect(screen.getByText('ميلو')).toBeOnTheScreen());
    expect(list).toHaveBeenLastCalledWith('c1', 1, 50, 'ميل');
    expect(screen.getByText('المالك: زينب كريم')).toBeOnTheScreen();
    expect(screen.getByText('#K7M-4QXR')).toBeOnTheScreen();
    expect(screen.queryByText(/1a2b3c4d/)).toBeNull(); // never the internal id
    expect(screen.getByText(/هاسكي/)).toBeOnTheScreen();
    expect(screen.getByText('1 نتيجة')).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText('فتح ملف ميلو'));
    expect(routerMock.push).toHaveBeenCalledWith(`/(app)/organizations/c1/animals/${MILO_ID}`);
  });

  it('free text with no match → the empty "no results" state (no open-by-ID action)', async () => {
    list.mockResolvedValue(page([]));
    renderWithProviders(<ClinicPetSearch organizationId="c1" canOpen />);
    type('غير موجود');
    await waitFor(() =>
      expect(screen.getByText('لم يتم العثور على نتائج مطابقة')).toBeOnTheScreen(),
    );
    expect(screen.queryByText('فتح ملف الحيوان')).toBeNull();
    expect(lookup).not.toHaveBeenCalled();
  });

  it('a failed search → error state with retry', async () => {
    list.mockRejectedValue(new ApiError({ code: 'INTERNAL_ERROR', message: 'x', status: 500 }));
    renderWithProviders(<ClinicPetSearch organizationId="c1" canOpen />);
    type('ميلو');
    await waitFor(() => expect(screen.getByText('إعادة المحاولة')).toBeOnTheScreen(), {
      timeout: 15_000,
    });
  }, 20_000);

  it('scanning a QR (new short code or legacy UUID link) looks the pet up and opens it — no link step', async () => {
    lookup.mockResolvedValue(lookupHit(STRANGER_ID));
    list.mockResolvedValue(page([]));
    mockScannedCode = 'p9q-2rst';
    renderWithProviders(<ClinicPetSearch organizationId="c1" canOpen />);
    fireEvent.press(screen.getByLabelText('مسح الباركود'));
    fireEvent.press(screen.getByText('FAKE SCAN'));
    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledWith(
        `/(app)/organizations/c1/animals/${STRANGER_ID}`,
      ),
    );
    expect(lookup).toHaveBeenCalledWith('c1', 'P9Q2RST');

    resetRouterMock();
    mockScannedCode = `bytari://pets/${MILO_ID.toUpperCase()}`;
    lookup.mockResolvedValue(lookupHit(MILO_ID));
    fireEvent.press(screen.getByLabelText('مسح الباركود'));
    fireEvent.press(screen.getByText('FAKE SCAN'));
    await waitFor(() => expect(lookup).toHaveBeenLastCalledWith('c1', MILO_ID));
  });

  it('a typed short ID that is not one of the clinic’s pets shows its card immediately — no "open pet file" step', async () => {
    list.mockResolvedValue(page([]));
    lookup.mockResolvedValue(lookupHit(STRANGER_ID));
    renderWithProviders(<ClinicPetSearch organizationId="c1" canOpen />);
    type('P9Q-2RST');
    await waitFor(() => expect(screen.getByText('غريب')).toBeOnTheScreen());
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledWith('c1', 'P9Q2RST');
    expect(screen.getByText('#P9Q-2RST')).toBeOnTheScreen();
    expect(screen.queryByText('فتح ملف الحيوان')).toBeNull();
    expect(screen.queryByText(/ليس ضمن حيوانات العيادة/)).toBeNull();
    expect(routerMock.push).not.toHaveBeenCalled(); // shown, not auto-opened
    fireEvent.press(screen.getByLabelText('فتح ملف غريب'));
    expect(routerMock.push).toHaveBeenCalledWith(`/(app)/organizations/c1/animals/${STRANGER_ID}`);
  });

  it('a typed ID that IS one of the clinic’s pets uses the clinic row, without a lookup', async () => {
    list.mockResolvedValue(page([milo]));
    renderWithProviders(<ClinicPetSearch organizationId="c1" canOpen />);
    type('K7M-4QXR');
    await waitFor(() => expect(screen.getByText('ميلو')).toBeOnTheScreen());
    expect(lookup).not.toHaveBeenCalled();
  });

  it('an unknown / inaccessible code → the "دي" state, no navigation', async () => {
    list.mockResolvedValue(page([]));
    lookup.mockRejectedValue(new ApiError({ code: 'NOT_FOUND', message: 'x', status: 404 }));
    renderWithProviders(<ClinicPetSearch organizationId="c1" canOpen />);
    type('ZZZZZZZ');
    await waitFor(() => expect(screen.getByText('دي')).toBeOnTheScreen());
    expect(lookup).toHaveBeenCalledTimes(1); // 404 is final, never retried
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it('a network failure on the ID lookup → error state with retry (not the not-found state)', async () => {
    list.mockResolvedValue(page([]));
    lookup.mockRejectedValue(new ApiError({ code: 'NETWORK_ERROR', message: 'x', status: 0 }));
    renderWithProviders(<ClinicPetSearch organizationId="c1" canOpen />);
    type('ZZZZZZZ');
    await waitFor(() => expect(screen.getByText('إعادة المحاولة')).toBeOnTheScreen(), {
      timeout: 15_000,
    });
    expect(screen.queryByText('دي')).toBeNull();
    lookup.mockResolvedValue(lookupHit(STRANGER_ID));
    fireEvent.press(screen.getByText('إعادة المحاولة'));
    await waitFor(() => expect(screen.getByText('غريب')).toBeOnTheScreen());
  }, 20_000);

  it('a non-operational clinic cannot open by ID or scan', async () => {
    list.mockResolvedValue(page([]));
    renderWithProviders(<ClinicPetSearch organizationId="c1" canOpen={false} />);
    expect(screen.queryByLabelText('مسح الباركود')).toBeNull();
    type('P9Q-2RST');
    await waitFor(() =>
      expect(screen.getByText('لم يتم العثور على نتائج مطابقة')).toBeOnTheScreen(),
    );
    expect(lookup).not.toHaveBeenCalled();
  });
});

describe('petCodeFromInput', () => {
  it('normalises short codes, extracts UUIDs from links, and rejects free text', () => {
    expect(petCodeFromInput('k7m-4qxr')).toBe('K7M4QXR');
    expect(petCodeFromInput(' K7M 4QXR ')).toBe('K7M4QXR');
    expect(petCodeFromInput('https://bytari.app/pets/K7M4QXR')).toBe('K7M4QXR');
    expect(petCodeFromInput(MILO_ID)).toBe(MILO_ID);
    expect(petCodeFromInput(`https://x.test/p/${MILO_ID.toUpperCase()}?a=1`)).toBe(MILO_ID);
    expect(petCodeFromInput('ميلو')).toBeNull();
    expect(petCodeFromInput('K7M4QX0')).toBeNull(); // 0 is not in the alphabet
  });
});
