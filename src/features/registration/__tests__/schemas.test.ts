import { i18n, initI18n } from '@/i18n';

import { buildPetOwnerSchema, buildVeterinarianSchema } from '../validation/schemas';

beforeAll(() => initI18n('ar'));

const t = i18n.getFixedT('ar', 'registration');

const BASE = {
  firstName: 'ريم',
  lastName: 'أحمد',
  email: 'reem@example.com',
  phone: '+9647701234567',
  password: '1234567890',
  confirmPassword: '1234567890',
  country: 'IQ',
  governorate: 'بغداد',
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

  it('requires a phone number', () => {
    expect(schema.safeParse({ ...BASE, phone: '' }).success).toBe(false);
    expect(schema.safeParse({ ...BASE, phone: 'abc' }).success).toBe(false);
  });

  it('requires a governorate', () => {
    expect(schema.safeParse({ ...BASE, governorate: '' }).success).toBe(false);
  });

  it('checks the governorate against the selected country list (Iraq)', () => {
    expect(schema.safeParse({ ...BASE, governorate: 'الرياض' }).success).toBe(false);
    expect(schema.safeParse({ ...BASE, governorate: 'البصرة' }).success).toBe(true);
  });

  it('accepts free-text governorate for a country without a fixed list', () => {
    expect(schema.safeParse({ ...BASE, country: 'SA', governorate: 'الرياض' }).success).toBe(
      true,
    );
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

  it('specialization is optional', () => {
    const withIt = schema.safeParse({
      ...BASE,
      subType: 'VETERINARIAN',
      licenseOrId: doc,
      specialization: 'جراحة',
    });
    expect(withIt.success).toBe(true);
    const tooLong = schema.safeParse({
      ...BASE,
      subType: 'VETERINARIAN',
      licenseOrId: doc,
      specialization: 'x'.repeat(151),
    });
    expect(tooLong.success).toBe(false);
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
