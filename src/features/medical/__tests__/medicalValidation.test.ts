import { i18n } from '@/i18n';
import { ApiError } from '@/services/api';

import {
  buildMedicalRecordSchema,
  buildVaccinationSchema,
  medicalErrorMessage,
} from '../validation/schemas';

const t = i18n.getFixedT('ar', 'medical');

describe('buildMedicalRecordSchema — mirrors the backend', () => {
  const schema = buildMedicalRecordSchema(t);

  it('rejects an entry with no reason / diagnosis / treatment / notes', () => {
    const r = schema.safeParse({
      visitDate: '',
      reason: '',
      diagnosis: '',
      treatment: '',
      notes: '',
    });
    expect(r.success).toBe(false);
  });

  it('accepts an entry with just a diagnosis', () => {
    const r = schema.safeParse({ diagnosis: 'Otitis' });
    expect(r.success).toBe(true);
  });

  it('rejects a future visitDate and a malformed date', () => {
    expect(schema.safeParse({ diagnosis: 'x', visitDate: '2999-01-01' }).success).toBe(false);
    expect(schema.safeParse({ diagnosis: 'x', visitDate: '01-01-2026' }).success).toBe(false);
  });

  it('accepts a valid past visitDate', () => {
    expect(schema.safeParse({ diagnosis: 'x', visitDate: '2026-01-02' }).success).toBe(true);
  });
});

describe('buildVaccinationSchema — mirrors the backend', () => {
  const schema = buildVaccinationSchema(t);

  it('requires vaccineName and administeredOn', () => {
    expect(schema.safeParse({ vaccineName: '', administeredOn: '' }).success).toBe(false);
    expect(schema.safeParse({ vaccineName: 'Rabies', administeredOn: '' }).success).toBe(false);
  });

  it('rejects a future administeredOn', () => {
    expect(schema.safeParse({ vaccineName: 'Rabies', administeredOn: '2999-01-01' }).success).toBe(
      false,
    );
  });

  it('rejects nextDueOn earlier than administeredOn', () => {
    const r = schema.safeParse({
      vaccineName: 'Rabies',
      administeredOn: '2026-02-10',
      nextDueOn: '2026-02-01',
    });
    expect(r.success).toBe(false);
  });

  it('accepts a future nextDueOn on/after administeredOn', () => {
    const r = schema.safeParse({
      vaccineName: 'Rabies',
      administeredOn: '2026-02-10',
      nextDueOn: '2027-02-10',
    });
    expect(r.success).toBe(true);
  });
});

describe('medicalErrorMessage', () => {
  it('maps ANIMAL_NOT_ACTIVE / 409 to the archived-animal message', () => {
    const msg = medicalErrorMessage(
      new ApiError({ code: 'ANIMAL_NOT_ACTIVE' as never, message: 'raw', status: 409 }),
      t,
    );
    expect(msg).toBe(t('errors.animalNotActive'));
  });

  it('maps a 404 on a write path to the "not found or other clinic" message', () => {
    const msg = medicalErrorMessage(
      new ApiError({ code: 'NOT_FOUND', message: 'raw', status: 404 }),
      t,
    );
    expect(msg).toBe(t('errors.notFoundOrOtherClinic'));
  });

  it('falls back to the generic mapper for anything else (never raw text)', () => {
    const msg = medicalErrorMessage(
      new ApiError({ code: 'INTERNAL_ERROR', message: 'db exploded', status: 500 }),
      t,
    );
    expect(msg).not.toContain('db exploded');
  });
});
