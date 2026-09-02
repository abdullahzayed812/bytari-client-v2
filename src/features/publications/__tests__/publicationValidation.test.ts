import { i18n } from '@/i18n';
import { ApiError } from '@/services/api';

import {
  buildAnimalProfileSchema,
  buildListingSchema,
  listingValuesToInput,
  publicationErrorMessage,
} from '../validation/schemas';

const t = i18n.getFixedT('ar', 'publications');

const validLost = {
  contactName: 'Test Contact',
  contactPhone: '07701234567',
  lostDate: '2026-01-01',
  lostGovernorate: 'Baghdad',
  lostDistrict: 'Karrada',
};

const validAdoption = {
  note: 'Friendly and playful',
  contactName: 'Test Contact',
  contactPhone: '07701234567',
  city: 'Baghdad',
  healthStatus: 'GOOD',
  vaccinationStatus: 'COMPLETE',
  isSterilized: 'false',
};

describe('buildListingSchema — LOST requires when/where; ADOPTION/MATING require city + status', () => {
  it('LOST: accepts a fully valid body', () => {
    const schema = buildListingSchema(t, 'LOST');
    expect(schema.safeParse(validLost).success).toBe(true);
  });

  it('LOST: rejects a missing lostDate / governorate / district', () => {
    const schema = buildListingSchema(t, 'LOST');
    expect(schema.safeParse({ ...validLost, lostDate: undefined }).success).toBe(false);
    expect(schema.safeParse({ ...validLost, lostGovernorate: '' }).success).toBe(false);
    expect(schema.safeParse({ ...validLost, lostDistrict: '' }).success).toBe(false);
  });

  it('LOST: contact name / phone are required', () => {
    const schema = buildListingSchema(t, 'LOST');
    expect(schema.safeParse({ ...validLost, contactName: '' }).success).toBe(false);
    expect(schema.safeParse({ ...validLost, contactPhone: '' }).success).toBe(false);
  });

  it('ADOPTION: accepts a fully valid body', () => {
    const schema = buildListingSchema(t, 'ADOPTION');
    expect(schema.safeParse(validAdoption).success).toBe(true);
  });

  it('ADOPTION: requires note (description), city, health/vaccination status, sterilized', () => {
    const schema = buildListingSchema(t, 'ADOPTION');
    expect(schema.safeParse({ ...validAdoption, note: '' }).success).toBe(false);
    expect(schema.safeParse({ ...validAdoption, city: '' }).success).toBe(false);
    expect(schema.safeParse({ ...validAdoption, healthStatus: undefined }).success).toBe(false);
    expect(schema.safeParse({ ...validAdoption, isSterilized: undefined }).success).toBe(false);
  });

  it('MATING: accepts a body without note/isSterilized', () => {
    const schema = buildListingSchema(t, 'MATING');
    const { note: _note, isSterilized: _s, ...rest } = validAdoption;
    void _note;
    void _s;
    expect(schema.safeParse(rest).success).toBe(true);
  });
});

describe('buildAnimalProfileSchema', () => {
  it('requires species and sex', () => {
    const schema = buildAnimalProfileSchema(t);
    expect(schema.safeParse({ species: 'DOG', sex: 'MALE' }).success).toBe(true);
    expect(schema.safeParse({ species: '', sex: 'MALE' }).success).toBe(false);
    expect(schema.safeParse({ species: 'DOG', sex: '' }).success).toBe(false);
  });
});

describe('listingValuesToInput', () => {
  it('maps LOST form values to the exact CreatePublicationInput shape', () => {
    expect(listingValuesToInput('LOST', validLost)).toEqual({
      kind: 'LOST',
      note: undefined,
      contactName: 'Test Contact',
      contactPhone: '07701234567',
      lostDate: '2026-01-01',
      lostTime: undefined,
      lostGovernorate: 'Baghdad',
      lostDistrict: 'Karrada',
      lostLocationDetail: undefined,
      healthNotes: undefined,
    });
  });

  it('maps ADOPTION form values, converting isSterilized string to boolean', () => {
    const input = listingValuesToInput('ADOPTION', validAdoption);
    expect(input).toMatchObject({ kind: 'ADOPTION', isSterilized: false, city: 'Baghdad' });
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
