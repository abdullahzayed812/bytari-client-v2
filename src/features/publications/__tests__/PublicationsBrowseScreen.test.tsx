import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { publicationsApi } from '../api';
import PublicationsBrowseScreen from '../screens/PublicationsBrowseScreen';
import type { MyPublication, PublicPublication } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const pub = (over: Partial<PublicPublication> = {}): PublicPublication => ({
  id: 'p1',
  kind: 'ADOPTION',
  note: 'قط أليف',
  extraNotes: null,
  publishedAt: '2026-02-01T10:00:00.000Z',
  contactName: 'صاحب الحيوان',
  contactPhone: '07701234567',
  city: 'الرياض',
  healthStatus: 'GOOD',
  vaccinationStatus: 'COMPLETE',
  isSterilized: false,
  lostDate: null,
  lostTime: null,
  lostGovernorate: null,
  lostDistrict: null,
  lostLocationDetail: null,
  healthNotes: null,
  animal: {
    id: 'a1',
    name: 'ميمي',
    species: 'CAT',
    breed: null,
    sex: 'FEMALE',
    dateOfBirth: null,
    color: null,
    distinguishingFeatures: null,
    ageEstimate: 'ONE_TO_3_YEARS',
    galleryUrls: [],
  },
  ...over,
});

describe("PublicationsBrowseScreen — grid list of ALL users' APPROVED listings for one kind", () => {
  const list = jest.spyOn(publicationsApi, 'listPublic');

  beforeEach(() => {
    resetRouterMock();
    list.mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  it('lists APPROVED adoption publications scoped by the [kind] slug', async () => {
    setSearchParams({ kind: 'adoption' });
    list.mockResolvedValue({
      items: [pub()],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<PublicationsBrowseScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    expect(list).toHaveBeenCalledWith(1, 20, { kind: 'ADOPTION' });
  });

  it('shows the kind-specific empty state', async () => {
    setSearchParams({ kind: 'lost' });
    list.mockResolvedValue({ items: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } });
    renderWithProviders(<PublicationsBrowseScreen />);
    await waitFor(() => expect(screen.getByText('لا توجد حيوانات مفقودة مسجلة')).toBeOnTheScreen());
  });

  it('a backend failure shows a safe error state (no raw message)', async () => {
    setSearchParams({ kind: 'mating' });
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    list.mockRejectedValue(
      new ApiError({ code: 'INTERNAL_ERROR', message: 'db boom', status: 500 }),
    );
    renderWithProviders(<PublicationsBrowseScreen />);
    await waitFor(() => expect(screen.queryByText('db boom')).toBeNull());
  });

  it('an unknown [kind] slug is handled gracefully', () => {
    setSearchParams({ kind: 'giraffe' });
    renderWithProviders(<PublicationsBrowseScreen />);
    expect(screen.getByText('نوع إعلان غير معروف')).toBeOnTheScreen();
    expect(list).not.toHaveBeenCalled();
  });

  it('tapping a card opens the public detail for that kind + id', async () => {
    setSearchParams({ kind: 'adoption' });
    list.mockResolvedValue({
      items: [pub()],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<PublicationsBrowseScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('button', { name: /ميمي/ }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/publications/adoption/p1');
  });

  it('the "+ إضافة حيوان" button opens the create-animal screen for that kind', async () => {
    setSearchParams({ kind: 'adoption' });
    list.mockResolvedValue({ items: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } });
    renderWithProviders(<PublicationsBrowseScreen />);
    await waitFor(() => expect(screen.getByText('لا توجد حيوانات متاحة للتبني')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('إضافة حيوان'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/publications/adoption/create');
  });
});

describe('PublicationsBrowseScreen — "My listings" scope', () => {
  // Spies created inside beforeEach — a sibling describe's `afterAll(restoreAllMocks)`
  // would otherwise detach spies created in this describe's body.
  let listMine: jest.SpyInstance;
  let remove: jest.SpyInstance;

  const myPub = (over: Partial<MyPublication> = {}): MyPublication => ({
    ...(pub() as PublicPublication),
    animalId: 'a1',
    status: 'PENDING',
    rejectionReason: null,
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z',
    ...over,
  });

  beforeEach(() => {
    resetRouterMock();
    jest.spyOn(publicationsApi, 'listPublic').mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    listMine = jest.spyOn(publicationsApi, 'listMine').mockResolvedValue({
      items: [myPub({ status: 'PENDING' })],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    remove = jest.spyOn(publicationsApi, 'remove').mockResolvedValue({ success: true });
  });
  afterAll(() => jest.restoreAllMocks());

  it('switching to "منشوراتي" calls listMine (server derives the owner) and shows the status', async () => {
    setSearchParams({ kind: 'adoption' });
    renderWithProviders(<PublicationsBrowseScreen />);

    fireEvent.press(screen.getByText('منشوراتي'));
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    expect(listMine).toHaveBeenCalledWith(1, 20, { kind: 'ADOPTION', status: undefined });
    expect(screen.getByText('قيد المراجعة')).toBeOnTheScreen();
  });

  it('tapping an own card opens the owner detail; the trash button deletes it', async () => {
    setSearchParams({ kind: 'adoption' });
    renderWithProviders(<PublicationsBrowseScreen />);
    fireEvent.press(screen.getByText('منشوراتي'));
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());

    fireEvent.press(screen.getByRole('button', { name: /ميمي/ }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pets/a1/publications/p1');

    fireEvent.press(screen.getByLabelText('حذف الإعلان'));
    fireEvent.press(screen.getByText('تأكيد الحذف'));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('p1'));
  });
});
