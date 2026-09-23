import { i18n, initI18n } from '@/i18n';

import { buildPetOwnerSchema, buildVeterinarianSchema } from '../validation/schemas';

beforeAll(() => initI18n('ar'));

const t = i18n.getFixedT('ar', 'registration');

const BASE = {
  firstName: 'ريم',
  lastName: 'أحمد',
  email: 'reem@example.com',
  phone: '',
  password: '1234567890',
  confirmPassword: '1234567890',
  country: 'SA',
  gender: 'FEMALE' as const,
  terms: true,
};

describe('buildPetOwnerSchema', () => {
  const schema = buildPetOwnerSchema(t);

  it('accepts a fully valid pet-owner submission', () => {
    expect(schema.safeParse(BASE).success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = schema.safeParse({ ...BASE, confirmPassword: 'different1' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing gender', () => {
    const result = schema.safeParse({ ...BASE, gender: undefined });
    expect(result.success).toBe(false);
  });

  it('rejects unchecked terms', () => {
    const result = schema.safeParse({ ...BASE, terms: false });
    expect(result.success).toBe(false);
  });

  it('rejects a country code that is not 2 letters', () => {
    const result = schema.safeParse({ ...BASE, country: 'SAU' });
    expect(result.success).toBe(false);
  });
});

describe('buildVeterinarianSchema', () => {
  const schema = buildVeterinarianSchema(t);
  const doc = { uri: 'file:///f.jpg', name: 'f.jpg', mimeType: 'image/jpeg' };

  it('requires licenseOrId for subType VETERINARIAN', () => {
    const result = schema.safeParse({ ...BASE, subType: 'VETERINARIAN' });
    expect(result.success).toBe(false);
  });

  it('accepts VETERINARIAN with a license document', () => {
    const result = schema.safeParse({ ...BASE, subType: 'VETERINARIAN', licenseOrId: doc });
    expect(result.success).toBe(true);
  });

  it('requires BOTH student-id sides for subType STUDENT', () => {
    const onlyFront = schema.safeParse({
      ...BASE,
      subType: 'STUDENT',
      studentIdFront: doc,
    });
    expect(onlyFront.success).toBe(false);

    const both = schema.safeParse({
      ...BASE,
      subType: 'STUDENT',
      studentIdFront: doc,
      studentIdBack: doc,
    });
    expect(both.success).toBe(true);
  });
});
