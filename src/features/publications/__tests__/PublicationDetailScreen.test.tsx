import { chatApi } from '@/features/chat';
import { renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import { publicationsApi } from '../api';
import PublicationDetailScreen from '../screens/PublicationDetailScreen';
import type { AnimalPublication, PublicPublication } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const getPublic = jest.spyOn(publicationsApi, 'getPublic');
const getForAnimal = jest.spyOn(publicationsApi, 'getForAnimal');

beforeEach(() => {
  resetRouterMock();
  getPublic.mockReset();
  getForAnimal.mockReset();
});
afterAll(() => jest.restoreAllMocks());

const publicPub: PublicPublication = {
  id: 'p1',
  kind: 'ADOPTION',
  note: 'قط أليف ومدرّب',
  extraNotes: null,
  publishedAt: '2026-02-01T10:00:00.000Z',
  contactName: 'صاحب الحيوان',
  contactPhone: '07701234567',
  city: 'الرياض',
  healthStatus: 'GOOD',
  vaccinationStatus: 'COMPLETE',
  isSterilized: true,
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
    breed: 'شيرازي',
    sex: 'FEMALE',
    dateOfBirth: null,
    color: 'أبيض',
    distinguishingFeatures: null,
    ageEstimate: 'ONE_TO_3_YEARS',
    galleryUrls: [],
  },
};

const ownerPub = (over: Partial<AnimalPublication> = {}): AnimalPublication => ({
  id: 'p1',
  animalId: 'a1',
  kind: 'LOST',
  status: 'PENDING',
  note: 'قرب الحديقة',
  createdByUserId: 'u1',
  reviewedByUserId: null,
  reviewedAt: null,
  rejectionReason: null,
  contactName: 'صاحب الحيوان',
  contactPhone: '07701234567',
  city: null,
  extraNotes: null,
  healthStatus: null,
  vaccinationStatus: null,
  isSterilized: null,
  lostDate: '2026-01-01',
  lostTime: null,
  lostGovernorate: 'بغداد',
  lostDistrict: 'الكرادة',
  lostLocationDetail: null,
  healthNotes: null,
  createdAt: '2026-02-01T10:00:00.000Z',
  updatedAt: '2026-02-01T10:00:00.000Z',
  ...over,
});

describe('PublicationDetailScreen — PUBLIC view', () => {
  it('shows the animal info + note + real contact details (explicit per-listing, not account PII)', async () => {
    setSearchParams({ kind: 'adoption', publicationId: 'p1' });
    getPublic.mockResolvedValue(publicPub);
    renderWithProviders(<PublicationDetailScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    expect(getForAnimal).not.toHaveBeenCalled();
    expect(screen.getByText('قط أليف ومدرّب')).toBeOnTheScreen();
    expect(screen.getByText('صاحب الحيوان')).toBeOnTheScreen();
    expect(screen.getByText('07701234567')).toBeOnTheScreen();
    // the public view never renders an approval status
    expect(screen.queryByText('قيد المراجعة')).toBeNull();
    expect(screen.queryByText('تمت الموافقة')).toBeNull();
  });

  it('shows the ADOPTION request action, not the LOST sighting-report action', async () => {
    setSearchParams({ kind: 'adoption', publicationId: 'p1' });
    getPublic.mockResolvedValue(publicPub);
    renderWithProviders(<PublicationDetailScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    expect(screen.getByText('طلب التبني')).toBeOnTheScreen();
    expect(screen.queryByText('ابلاغ عن مشاهدة')).toBeNull();
  });

  it('a non-APPROVED / unknown id → plain not-found state (no leak)', async () => {
    setSearchParams({ kind: 'adoption', publicationId: 'x' });
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    getPublic.mockRejectedValue(
      new ApiError({ code: 'NOT_FOUND', message: 'secret', status: 404 }),
    );
    renderWithProviders(<PublicationDetailScreen />);
    await waitFor(() => expect(screen.getByText('الإعلان غير متاح')).toBeOnTheScreen());
    expect(screen.queryByText('secret')).toBeNull();
  });
});

describe('PublicationDetailScreen — OWNER view ("My Listings", from PetDetailsScreen)', () => {
  it('shows the approval status and, for a REJECTED listing, the reason', async () => {
    setSearchParams({ petId: 'a1', publicationId: 'p1' });
    getForAnimal.mockResolvedValue(
      ownerPub({ status: 'REJECTED', rejectionReason: 'الصور غير واضحة' }),
    );
    renderWithProviders(<PublicationDetailScreen />);
    await waitFor(() => expect(screen.getByText('مرفوض')).toBeOnTheScreen());
    expect(getPublic).not.toHaveBeenCalled();
    expect(screen.getByText('سبب الرفض')).toBeOnTheScreen();
    expect(screen.getByText('الصور غير واضحة')).toBeOnTheScreen();
  });

  it('a PENDING listing shows the "under review" line and no rejection block', async () => {
    setSearchParams({ petId: 'a1', publicationId: 'p1' });
    getForAnimal.mockResolvedValue(ownerPub({ status: 'PENDING' }));
    renderWithProviders(<PublicationDetailScreen />);
    await waitFor(() =>
      expect(
        screen.getByText('إعلانك قيد المراجعة ولن يظهر للمستخدمين حتى تتم الموافقة عليه.'),
      ).toBeOnTheScreen(),
    );
    expect(screen.queryByText('سبب الرفض')).toBeNull();
  });
});

describe('PublicationDetailScreen — interactions ("طلب" / "ابلاغ عن مشاهدة")', () => {
  it('shows the "ابلاغ عن مشاهدة" action for a LOST listing, not the request action', async () => {
    const lostPub: PublicPublication = {
      ...publicPub,
      kind: 'LOST',
      city: null,
      healthStatus: null,
      vaccinationStatus: null,
      isSterilized: null,
      lostDate: '2026-01-01',
      lostGovernorate: 'بغداد',
      lostDistrict: 'الكرادة',
    };
    setSearchParams({ kind: 'lost', publicationId: 'p1' });
    getPublic.mockResolvedValue(lostPub);
    renderWithProviders(<PublicationDetailScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    expect(screen.getByText('ابلاغ عن مشاهدة')).toBeOnTheScreen();
    expect(screen.queryByText('طلب التبني')).toBeNull();
  });
});

// Kept from the pre-Phase-8-extension suite: chat is unrelated to publications
// (there is no P2P chat here — "contact owner" is a plain `tel:` action), this
// spy just proves the screen never imports/uses it.
describe('no coupling to chat', () => {
  it('chatApi.start is never called from the detail screen', async () => {
    const start = jest.spyOn(chatApi, 'start');
    setSearchParams({ kind: 'adoption', publicationId: 'p1' });
    getPublic.mockResolvedValue(publicPub);
    renderWithProviders(<PublicationDetailScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    expect(start).not.toHaveBeenCalled();
    start.mockRestore();
  });
});
