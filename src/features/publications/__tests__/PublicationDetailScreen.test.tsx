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
  publishedAt: '2026-02-01T10:00:00.000Z',
  animal: { id: 'a1', name: 'ميمي', species: 'CAT', breed: 'شيرازي' },
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
  createdAt: '2026-02-01T10:00:00.000Z',
  updatedAt: '2026-02-01T10:00:00.000Z',
  ...over,
});

describe('PublicationDetailScreen — PUBLIC view (§5, §23)', () => {
  it('shows the animal info + note, and states that contact details are not shared', async () => {
    setSearchParams({ kind: 'adoption', publicationId: 'p1' });
    getPublic.mockResolvedValue(publicPub);
    renderWithProviders(<PublicationDetailScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    expect(getForAnimal).not.toHaveBeenCalled();
    expect(screen.getByText('قط أليف ومدرّب')).toBeOnTheScreen();
    expect(screen.getByText('معلومات التواصل غير متاحة')).toBeOnTheScreen();
    // the public view never renders an approval status
    expect(screen.queryByText('قيد المراجعة')).toBeNull();
    expect(screen.queryByText('تمت الموافقة')).toBeNull();
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

describe('PublicationDetailScreen — OWNER view (§8, §21, §23)', () => {
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
