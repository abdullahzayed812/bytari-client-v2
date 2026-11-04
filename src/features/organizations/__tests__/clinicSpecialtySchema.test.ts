import type { TFunction } from 'i18next';

import { buildEditOrganizationSchema, buildRegistrationSchema } from '../validation/schemas';

const t = ((key: string) => key) as unknown as TFunction<'organizations'>;

const base = {
  name: 'عيادة الرفق',
  address: 'بغداد',
  country: 'العراق',
  phone: '07701234567',
  licenseNumber: 'LIC-1',
};

describe('clinic specialty validation', () => {
  it('registration: required for a clinic', () => {
    const clinic = buildRegistrationSchema(t, { phoneRequired: true, specialtyRequired: true });
    const missing = clinic.safeParse({ ...base, specialty: '  ' });
    expect(missing.success).toBe(false);
    expect(JSON.stringify(missing.error?.issues)).toContain(
      'registration.errors.specialtyRequired',
    );
    expect(clinic.safeParse({ ...base, specialty: 'حيوانات أليفة' }).success).toBe(true);
  });

  it('registration: optional for an office', () => {
    const office = buildRegistrationSchema(t, { phoneRequired: false });
    expect(office.safeParse(base).success).toBe(true);
  });

  it('edit: a clinic cannot clear its specialty', () => {
    const edit = buildEditOrganizationSchema(t, { specialtyRequired: true });
    expect(edit.safeParse({ name: 'عيادة', specialty: '' }).success).toBe(false);
    expect(edit.safeParse({ name: 'عيادة', specialty: 'دواجن' }).success).toBe(true);
  });
});
