import { buildJoinFarmSchema, farmErrorMessage } from '@/features/farmShared';
import { i18n } from '@/i18n';
import { ApiError } from '@/services/api';

import { buildPoultryFlockSchema } from '../validation/schemas';

const t = i18n.getFixedT('ar', 'farm');

describe('buildJoinFarmSchema', () => {
  const schema = buildJoinFarmSchema(t);

  it('rejects a code shorter than 4 chars', () => {
    expect(schema.safeParse({ joinCode: 'ab' }).success).toBe(false);
  });

  it('upper-cases the code (backend does too)', () => {
    const r = schema.safeParse({ joinCode: 'farm-abcd12' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.joinCode).toBe('FARM-ABCD12');
  });
});

describe('buildPoultryFlockSchema — mirrors the backend', () => {
  const schema = buildPoultryFlockSchema(t);
  const valid = {
    name: 'North',
    birdType: 'CHICKEN' as const,
    birdCount: '500',
    arrivalDate: '2026-01-02',
    targetPricePerKg: '2.5',
    notes: '',
  };

  it('accepts a valid flock', () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it('requires a valid sale price (the estimated-profit input) unless the viewer cannot see financials', () => {
    expect(schema.safeParse({ ...valid, targetPricePerKg: '' }).success).toBe(false);
    expect(schema.safeParse({ ...valid, targetPricePerKg: 'abc' }).success).toBe(false);
    expect(schema.safeParse({ ...valid, targetPricePerKg: '1.234' }).success).toBe(false);
    const noPrice = buildPoultryFlockSchema(t, { requirePrice: false });
    expect(noPrice.safeParse({ ...valid, targetPricePerKg: '' }).success).toBe(true);
  });

  it('requires name / bird count / arrival date', () => {
    expect(schema.safeParse({ ...valid, name: '' }).success).toBe(false);
    expect(schema.safeParse({ ...valid, birdCount: '' }).success).toBe(false);
    expect(schema.safeParse({ ...valid, arrivalDate: '' }).success).toBe(false);
  });

  it('rejects a non-numeric or over-cap bird count', () => {
    expect(schema.safeParse({ ...valid, birdCount: 'abc' }).success).toBe(false);
    expect(schema.safeParse({ ...valid, birdCount: '999999999999' }).success).toBe(false);
  });

  it('rejects a future or malformed arrival date', () => {
    expect(schema.safeParse({ ...valid, arrivalDate: '2999-01-01' }).success).toBe(false);
    expect(schema.safeParse({ ...valid, arrivalDate: '02-01-2026' }).success).toBe(false);
  });
});

describe('farmErrorMessage', () => {
  it('maps INVALID_JOIN_CODE, farm-not-active, not-approved-vet and flock-closed', () => {
    expect(
      farmErrorMessage(
        new ApiError({ code: 'INVALID_JOIN_CODE' as never, message: 'x', status: 404 }),
        t,
      ),
    ).toBe(t('join.errors.invalidCode'));
    expect(
      farmErrorMessage(
        new ApiError({ code: 'ORGANIZATION_NOT_ACTIVE' as never, message: 'x', status: 409 }),
        t,
      ),
    ).toBe(t('join.errors.farmNotActive'));
    expect(
      farmErrorMessage(
        new ApiError({
          code: 'VETERINARIAN_APPROVAL_REQUIRED' as never,
          message: 'x',
          status: 403,
        }),
        t,
      ),
    ).toBe(t('join.errors.notApprovedVet'));
    expect(
      farmErrorMessage(
        new ApiError({ code: 'POULTRY_FLOCK_NOT_ACTIVE' as never, message: 'x', status: 409 }),
        t,
      ),
    ).toBe(t('poultry.errors.flockClosed'));
  });

  it('falls back to the generic mapper for anything else (never raw text)', () => {
    const msg = farmErrorMessage(
      new ApiError({ code: 'INTERNAL_ERROR', message: 'db exploded', status: 500 }),
      t,
    );
    expect(msg).not.toContain('db exploded');
  });
});
