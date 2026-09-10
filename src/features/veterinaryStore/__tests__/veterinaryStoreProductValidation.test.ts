import { i18n } from '@/i18n';
import { ApiError } from '@/services/api';

import {
  buildAdjustVeterinaryStoreStockSchema,
  buildVeterinaryStoreProductSchema,
  veterinaryStoreErrorMessage,
} from '../validation/schemas';

const t = i18n.getFixedT('ar', 'veterinaryStore');

describe('buildVeterinaryStoreProductSchema — mirrors the backend product rules', () => {
  const schema = buildVeterinaryStoreProductSchema(t);

  it('accepts a minimal product (name + type, no price / stock / description)', () => {
    expect(schema.safeParse({ name: 'مضاد حيوي', productType: 'MEDICINE' }).success).toBe(true);
    expect(
      schema.safeParse({
        name: 'x',
        productType: 'EQUIPMENT_SUPPLY',
        price: '',
        stockQuantity: '',
        description: '',
      }).success,
    ).toBe(true);
  });

  it('accepts a well-formed price and opening stock', () => {
    expect(
      schema.safeParse({ name: 'x', productType: 'MEDICINE', price: '120.50', stockQuantity: '30' })
        .success,
    ).toBe(true);
  });

  it('rejects a bad price pattern, a non-integer stock, an empty name and a bad type', () => {
    expect(schema.safeParse({ name: 'x', productType: 'MEDICINE', price: '12.999' }).success).toBe(
      false,
    );
    expect(schema.safeParse({ name: 'x', productType: 'MEDICINE', price: 'abc' }).success).toBe(
      false,
    );
    expect(
      schema.safeParse({ name: 'x', productType: 'MEDICINE', stockQuantity: '-3' }).success,
    ).toBe(false);
    expect(schema.safeParse({ name: '   ', productType: 'MEDICINE' }).success).toBe(false);
    expect(schema.safeParse({ name: 'x', productType: 'FOOD' }).success).toBe(false);
  });
});

describe('buildAdjustVeterinaryStoreStockSchema', () => {
  const schema = buildAdjustVeterinaryStoreStockSchema(t);

  it('accepts a positive or negative non-zero integer', () => {
    expect(schema.safeParse({ delta: '25' }).success).toBe(true);
    expect(schema.safeParse({ delta: '-12', reason: 'جرد' }).success).toBe(true);
  });

  it('rejects zero, a decimal and an empty value', () => {
    expect(schema.safeParse({ delta: '0' }).success).toBe(false);
    expect(schema.safeParse({ delta: '3.5' }).success).toBe(false);
    expect(schema.safeParse({ delta: '' }).success).toBe(false);
  });
});

describe('veterinaryStoreErrorMessage', () => {
  it('maps the known backend codes to safe Arabic copy', () => {
    expect(
      veterinaryStoreErrorMessage(
        new ApiError({
          code: 'ORGANIZATION_TYPE_NOT_SUPPORTED' as never,
          message: 'x',
          status: 400,
        }),
        t,
      ),
    ).toBe(t('errors.notStore'));
    expect(
      veterinaryStoreErrorMessage(
        new ApiError({ code: 'INSUFFICIENT_STOCK' as never, message: 'x', status: 409 }),
        t,
      ),
    ).toBe(t('stock.errors.belowZero'));
    expect(
      veterinaryStoreErrorMessage(new ApiError({ code: 'NOT_FOUND', message: 'x', status: 404 }), t),
    ).toBe(t('errors.notFound'));
    expect(
      veterinaryStoreErrorMessage(new ApiError({ code: 'PERMISSION_DENIED', message: 'x', status: 403 }), t),
    ).toBe(t('errors.forbidden'));
  });

  it('falls back to the generic mapper for anything else (never raw text)', () => {
    const msg = veterinaryStoreErrorMessage(
      new ApiError({ code: 'INTERNAL_ERROR', message: 'db exploded', status: 500 }),
      t,
    );
    expect(msg).not.toContain('db exploded');
  });
});
