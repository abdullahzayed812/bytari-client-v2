import { birdStats } from '../birdStats';
import type { PoultryFlock } from '../types';

const flock = (over: Partial<PoultryFlock>): PoultryFlock => ({
  id: 'f',
  organizationId: 'o',
  name: 'Batch',
  birdType: 'CHICKEN',
  birdCount: 1000,
  arrivalDate: '2026-01-01',
  status: 'ACTIVE',
  notes: null,
  batchNumber: 1,
  initialBirdCount: 1000,
  totalMortality: 0,
  currentBirdCount: 1000,
  averageWeightGrams: null,
  targetPricePerKg: null,
  expectedSaleDate: null,
  createdByUserId: null,
  closedAt: null,
  createdAt: '',
  updatedAt: '',
  ...over,
});

describe('birdStats — farm card bird statistics', () => {
  it('uses the REMAINING birds (after recorded deaths), not the count entered at registration', () => {
    const s = birdStats([flock({ birdCount: 1000, totalMortality: 120, currentBirdCount: 880 })]);
    expect(s).toEqual({ total: 880, chicken: 880, turkey: 0, duck: 0, other: 0 });
  });

  it('counts ACTIVE batches only — a closed (sold) batch adds nothing', () => {
    const s = birdStats([
      flock({ id: 'a', birdType: 'TURKEY', currentBirdCount: 300 }),
      flock({ id: 'b', birdType: 'DUCK', currentBirdCount: 50 }),
      flock({ id: 'c', birdType: 'QUAIL', currentBirdCount: 20 }),
      flock({ id: 'd', status: 'CLOSED', currentBirdCount: 9000 }),
    ]);
    expect(s).toEqual({ total: 370, chicken: 0, turkey: 300, duck: 50, other: 20 });
  });
});
