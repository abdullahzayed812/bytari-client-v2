import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { publicationsApi } from '../api';
import { AnimalCard, PublicationOwnerPanel } from '../components';
import type { AnimalPublication, PublicPublication } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const pub = (over: Partial<PublicPublication> = {}): PublicPublication =>
  ({
    id: 'p1',
    kind: 'ADOPTION',
    note: null,
    extraNotes: null,
    publishedAt: '2026-02-01T10:00:00.000Z',
    contactName: 'x',
    contactPhone: '07701234567',
    city: 'بغداد',
    healthStatus: 'GOOD',
    vaccinationStatus: 'COMPLETE',
    isSterilized: false,
    lostDate: null,
    lostTime: null,
    lostGovernorate: null,
    lostDistrict: null,
    lostLocationDetail: null,
    healthNotes: null,
    resolution: null,
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
  }) as PublicPublication;

describe('AnimalCard — completed listings', () => {
  it.each([
    ['ADOPTION', 'ADOPTED', 'تم التبني'],
    ['MATING', 'MATED', 'تم التزاوج'],
    ['LOST', 'FOUND', 'تم العثور عليه'],
  ] as const)('%s → %s shows the status and is not pressable', (kind, resolution, label) => {
    const onPress = jest.fn();
    renderWithProviders(
      <AnimalCard
        publication={pub({ kind, resolution })}
        kind={kind}
        width={160}
        onPress={onPress}
      />,
    );
    expect(screen.getByText(label)).toBeTruthy();
    fireEvent.press(screen.getByText('ميمي'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('an available listing still opens', () => {
    const onPress = jest.fn();
    renderWithProviders(
      <AnimalCard publication={pub()} kind="ADOPTION" width={160} onPress={onPress} />,
    );
    fireEvent.press(screen.getByText('ميمي'));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('PublicationOwnerPanel — owner controls', () => {
  beforeEach(() => {
    jest.spyOn(publicationsApi, 'listInteractions').mockResolvedValue([]);
  });
  afterAll(() => jest.restoreAllMocks());

  it.each([
    ['ADOPTION', 'تم التبني'],
    ['MATING', 'تم التزاوج'],
    ['LOST', 'تم العثور عليه'],
  ] as const)('%s offers only its completion action (no close / delete)', (kind, action) => {
    const publication = {
      id: 'p1',
      animalId: 'a1',
      kind,
      status: 'APPROVED',
      resolution: null,
    } as AnimalPublication;
    renderWithProviders(<PublicationOwnerPanel publication={publication} />);
    expect(screen.getAllByText(action).length).toBeGreaterThan(0);
    expect(screen.queryByText('إغلاق الإعلان')).toBeNull();
    expect(screen.queryByText('حذف')).toBeNull();
  });
});
