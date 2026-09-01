import { i18n } from '@/i18n';

import { buildPetSchema, toCreateInput } from '../validation/schemas';

const t = i18n.getFixedT('ar', 'pets') as unknown as Parameters<typeof buildPetSchema>[0];
const schema = buildPetSchema(t);

const base = { name: 'Lulu', species: 'CAT' as const };

describe('pet form schema — mirrors the backend', () => {
  it('accepts the minimal valid pet (name + species only)', () => {
    expect(schema.safeParse(base).success).toBe(true);
  });

  it('requires a name', () => {
    expect(schema.safeParse({ ...base, name: '   ' }).success).toBe(false);
  });

  it('requires a valid species', () => {
    expect(schema.safeParse({ name: 'Lulu', species: 'DRAGON' }).success).toBe(false);
  });

  it('accepts an empty optional breed / notes / dateOfBirth', () => {
    const r = schema.safeParse({ ...base, breed: '', notes: '', dateOfBirth: '' });
    expect(r.success).toBe(true);
  });

  it('rejects a badly formatted date of birth', () => {
    expect(schema.safeParse({ ...base, dateOfBirth: '2020/01/01' }).success).toBe(false);
  });

  it('rejects a future date of birth', () => {
    const future = new Date(Date.now() + 31_536_000_000).toISOString().slice(0, 10);
    expect(schema.safeParse({ ...base, dateOfBirth: future }).success).toBe(false);
  });

  it('rejects notes longer than 2000 chars', () => {
    expect(schema.safeParse({ ...base, notes: 'x'.repeat(2001) }).success).toBe(false);
  });

  it('toCreateInput drops blank optionals so they are omitted from the request', () => {
    const input = toCreateInput({
      name: '  Lulu  ',
      species: 'CAT',
      sex: undefined,
      breed: '',
      dateOfBirth: '',
      notes: '',
    });
    expect(input).toEqual({
      name: 'Lulu',
      species: 'CAT',
      sex: undefined,
      breed: undefined,
      dateOfBirth: undefined,
      notes: undefined,
    });
  });
});
