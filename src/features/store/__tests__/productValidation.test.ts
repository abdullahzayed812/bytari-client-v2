import { i18n } from '@/i18n';
import { ApiError } from '@/services/api';

import {
  buildAdjustStockSchema,
  buildProductSchema,
  storeErrorMessage,
} from '../validation/schemas';

const t = i18n.getFixedT('ar', 'store');

describe('buildProductSchema — mirrors the backend product rules', () => {
  const schema = buildProductSchema(t);

  it('accepts a minimal product (name + type, no price / stock / description)', () => {
    expect(schema.safeParse({ name: 'مضاد حيوي', productType: 'MEDICINE' }).success).toBe(true);
    expect(
      schema.safeParse({
        name: 'x',
        productType: 'SUPPLY',
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

describe('buildAdjustStockSchema', () => {
  const schema = buildAdjustStockSchema(t);

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

describe('storeErrorMessage', () => {
  it('maps the known backend codes to safe Arabic copy', () => {
    expect(
      storeErrorMessage(
        new ApiError({
          code: 'ORGANIZATION_TYPE_NOT_SUPPORTED' as never,
          message: 'x',
          status: 400,
        }),
        t,
      ),
    ).toBe(t('errors.notStore'));
    expect(
      storeErrorMessage(
        new ApiError({ code: 'INSUFFICIENT_STOCK' as never, message: 'x', status: 409 }),
        t,
      ),
    ).toBe(t('stock.errors.belowZero'));
    expect(
      storeErrorMessage(new ApiError({ code: 'NOT_FOUND', message: 'x', status: 404 }), t),
    ).toBe(t('errors.notFound'));
    expect(
      storeErrorMessage(new ApiError({ code: 'PERMISSION_DENIED', message: 'x', status: 403 }), t),
    ).toBe(t('errors.forbidden'));
  });

  it('falls back to the generic mapper for anything else (never raw text)', () => {
    const msg = storeErrorMessage(
      new ApiError({ code: 'INTERNAL_ERROR', message: 'db exploded', status: 500 }),
      t,
    );
    expect(msg).not.toContain('db exploded');
  });
});
