import { i18n } from '@/i18n';
import { ApiError } from '@/services/api';

import { buildPublicationSchema, publicationErrorMessage } from '../validation/schemas';

const t = i18n.getFixedT('ar', 'publications');

describe('buildPublicationSchema — the backend model has only an optional note', () => {
  const schema = buildPublicationSchema(t);

  it('accepts an empty note', () => {
    expect(schema.safeParse({ note: '' }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(true);
  });

  it('accepts a normal note', () => {
    expect(schema.safeParse({ note: 'friendly, house-trained' }).success).toBe(true);
  });

  it('rejects a note over 2000 characters', () => {
    expect(schema.safeParse({ note: 'x'.repeat(2001) }).success).toBe(false);
  });
});

describe('publicationErrorMessage', () => {
  it('maps ANIMAL_NOT_ACTIVE / PUBLICATION_ALREADY_OPEN / not-your-animal', () => {
    expect(
      publicationErrorMessage(
        new ApiError({ code: 'ANIMAL_NOT_ACTIVE' as never, message: 'x', status: 409 }),
        t,
      ),
    ).toBe(t('errors.animalNotActive'));
    expect(
      publicationErrorMessage(
        new ApiError({ code: 'PUBLICATION_ALREADY_OPEN' as never, message: 'x', status: 409 }),
        t,
      ),
    ).toBe(t('errors.alreadyOpen'));
    expect(
      publicationErrorMessage(new ApiError({ code: 'NOT_FOUND', message: 'x', status: 404 }), t),
    ).toBe(t('errors.notYourAnimal'));
    expect(
      publicationErrorMessage(
        new ApiError({ code: 'PERMISSION_DENIED', message: 'x', status: 403 }),
        t,
      ),
    ).toBe(t('errors.notYourAnimal'));
  });

  it('falls back to the generic mapper for anything else (never raw text)', () => {
    const msg = publicationErrorMessage(
      new ApiError({ code: 'INTERNAL_ERROR', message: 'db exploded', status: 500 }),
      t,
    );
    expect(msg).not.toContain('db exploded');
  });
});
