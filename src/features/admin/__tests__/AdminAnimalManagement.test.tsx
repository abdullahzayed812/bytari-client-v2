import { renderWithProviders, screen, waitFor, fireEvent } from '@/test-utils/render';
import { resetRouterMock } from '@/test-utils/routerMock';

import { adminPublicationsApi } from '@/features/publications';

import { adminApi } from '../api';
import AdminAnimalPublicationsScreen from '../screens/AdminAnimalPublicationsScreen';
import AdminAnimalsScreen from '../screens/AdminAnimalsScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const PENDING_PUB = {
  id: 'pub1',
  animalId: 'a1',
  kind: 'ADOPTION' as const,
  status: 'PENDING' as const,
  note: 'قط أليف',
  createdByUserId: 'u1',
  reviewedByUserId: null,
  reviewedAt: null,
  rejectionReason: null,
  contactName: 'أحمد',
  contactPhone: '0555',
  city: 'الرياض',
  extraNotes: null,
  healthStatus: null,
  vaccinationStatus: null,
  isSterilized: null,
  lostDate: null,
  lostTime: null,
  lostGovernorate: null,
  lostDistrict: null,
  lostLocationDetail: null,
  healthNotes: null,
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
};

/** The same request as it really arrives from `/admin/animal-publications` — with the joined animal. */
const PENDING_PUB_WITH_PHOTOS = {
  ...PENDING_PUB,
  animal: {
    id: 'a1',
    name: 'مشمش',
    species: 'CAT',
    breed: null,
    sex: 'FEMALE',
    dateOfBirth: null,
    color: null,
    distinguishingFeatures: null,
    ageEstimate: null,
    galleryUrls: ['https://cdn.example/r2/pet-1.jpg', 'https://cdn.example/r2/pet-2.jpg'],
  },
};

const ANIMAL = {
  id: 'an1',
  name: 'ريكس',
  species: 'DOG',
  breed: 'لابرادور',
  sex: 'MALE',
  status: 'ACTIVE' as const,
  currentOwnerUserId: 'u1',
  ownerName: 'أحمد محمد',
  galleryUrls: [],
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
};

// Spies are (re)created in beforeEach so a sibling describe's
// `restoreAllMocks` never detaches them.
let listPub: jest.SpyInstance;
let approve: jest.SpyInstance;
let reject: jest.SpyInstance;
let listAnimals: jest.SpyInstance;
let deleteAnimal: jest.SpyInstance;

beforeEach(() => {
  resetRouterMock();
  listPub = jest.spyOn(adminPublicationsApi, 'list').mockResolvedValue({
    items: [PENDING_PUB],
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  });
  approve = jest.spyOn(adminPublicationsApi, 'approve').mockResolvedValue({
    ...PENDING_PUB,
    status: 'APPROVED',
  });
  reject = jest.spyOn(adminPublicationsApi, 'reject').mockResolvedValue({
    ...PENDING_PUB,
    status: 'REJECTED',
  });
  listAnimals = jest.spyOn(adminApi, 'listAnimals').mockResolvedValue({
    items: [ANIMAL],
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  });
  deleteAnimal = jest
    .spyOn(adminApi, 'deleteAnimal')
    .mockResolvedValue({ id: 'an1', status: 'DEACTIVATED' });
});
afterEach(() => jest.restoreAllMocks());

describe('AdminAnimalPublicationsScreen — moderation queue', () => {
  it('lists PENDING requests by default and approves one', async () => {
    renderWithProviders(<AdminAnimalPublicationsScreen />);
    await waitFor(() => expect(screen.getByText('أحمد')).toBeTruthy());
    expect(listPub).toHaveBeenCalledWith(1, 20, { kind: undefined, status: 'PENDING' });

    fireEvent.press(screen.getByText('موافقة'));
    fireEvent.press(screen.getByText('تأكيد الموافقة'));
    await waitFor(() => expect(approve).toHaveBeenCalledWith('pub1'));
  });

  it('rejects a request with a required reason', async () => {
    renderWithProviders(<AdminAnimalPublicationsScreen />);
    await waitFor(() => expect(screen.getByText('أحمد')).toBeTruthy());

    fireEvent.press(screen.getByText('رفض'));
    fireEvent.changeText(screen.getByPlaceholderText('اكتب سبب الرفض…'), 'بيانات ناقصة');
    fireEvent.press(screen.getByText('تأكيد الرفض'));
    await waitFor(() => expect(reject).toHaveBeenCalledWith('pub1', 'بيانات ناقصة'));
  });

  it('shows the animal photos on the row and in the details modal, and opens the viewer', async () => {
    listPub.mockResolvedValue({
      items: [PENDING_PUB_WITH_PHOTOS],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<AdminAnimalPublicationsScreen />);
    // the row subtitle prefers the animal's name once the join is present
    await waitFor(() => expect(screen.getByText('مشمش')).toBeTruthy());

    // row thumbnail opens the shared full-screen viewer
    fireEvent.press(screen.getByLabelText('صور الحيوان'));
    await waitFor(() => expect(screen.getByLabelText('Close')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Close'));

    // the details modal lists every photo as its own tappable thumbnail
    fireEvent.press(screen.getByText('مشمش'));
    await waitFor(() => expect(screen.getByLabelText('1/2')).toBeTruthy());
    expect(screen.getByLabelText('2/2')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('2/2'));
    await waitFor(() => expect(screen.getByText('2 / 2')).toBeTruthy());
  });

  it('shows the no-photos copy when the listed animal has no gallery', async () => {
    renderWithProviders(<AdminAnimalPublicationsScreen />);
    await waitFor(() => expect(screen.getByText('أحمد')).toBeTruthy());
    fireEvent.press(screen.getByText('أحمد'));
    await waitFor(() => expect(screen.getByText('لا توجد صور مرفقة')).toBeTruthy());
  });

  it('opens a details modal from a row with the full request fields', async () => {
    renderWithProviders(<AdminAnimalPublicationsScreen />);
    await waitFor(() => expect(screen.getByText('أحمد')).toBeTruthy());

    fireEvent.press(screen.getByText('أحمد'));
    // contact phone + city are modal-only — never shown on the row
    await waitFor(() => expect(screen.getByText('0555')).toBeTruthy());
    expect(screen.getByText('الرياض')).toBeTruthy();
  });
});

describe('AdminAnimalsScreen — user pets oversight', () => {
  it('lists every user’s animals with the owner name and soft-deletes one', async () => {
    renderWithProviders(<AdminAnimalsScreen />);
    await waitFor(() => expect(screen.getByText('ريكس')).toBeTruthy());
    expect(screen.getByText(/أحمد محمد/)).toBeTruthy();

    fireEvent.press(screen.getByText('حذف'));
    fireEvent.press(screen.getByText('تأكيد الحذف'));
    await waitFor(() => expect(deleteAnimal).toHaveBeenCalledWith('an1'));
    expect(listAnimals).toHaveBeenCalled();
  });

  it('opens a details modal from a row showing species, owner and photo state', async () => {
    renderWithProviders(<AdminAnimalsScreen />);
    await waitFor(() => expect(screen.getByText('ريكس')).toBeTruthy());

    fireEvent.press(screen.getByText('ريكس'));
    // gallery-empty copy only renders inside the modal
    await waitFor(() => expect(screen.getByText('لا توجد صور')).toBeTruthy());
    expect(screen.getByText('لابرادور')).toBeTruthy();
  });
});
