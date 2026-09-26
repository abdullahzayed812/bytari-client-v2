/**
 * DEVELOPMENT ONLY — pre-fills the personal-info fields on the registration
 * forms so testing doesn't require retyping the same values every time.
 * Never includes image/document fields (avatar, license, student ID) — those
 * need a real uploaded file and can't be faked here.
 *
 * Gender (and the matching name) is picked at random on each screen mount so
 * repeated test runs exercise both options, not always the same one.
 *
 * `__DEV__` is statically replaced with `false` in release builds, so this
 * whole module is dead-code-eliminated and never ships.
 */

const DEV_PASSWORD = 'DevPassword123!';

const DEV_NAMES = {
  FEMALE: { firstName: 'ريم', lastName: 'أحمد' },
  MALE: { firstName: 'خالد', lastName: 'العتيبي' },
} as const;

/** A fresh email per screen mount so repeated test registrations don't collide. */
function devEmail(prefix: string): string {
  return `${prefix}.${Date.now()}@example.test`;
}

function randomGender(): 'MALE' | 'FEMALE' {
  return Math.random() < 0.5 ? 'MALE' : 'FEMALE';
}

export interface DevPersonalDefaults {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  country: string;
  governorate: string;
  gender: 'MALE' | 'FEMALE';
  terms: true;
}

function devPersonalDefaults(emailPrefix: string): DevPersonalDefaults {
  const gender = randomGender();
  return {
    ...DEV_NAMES[gender],
    email: devEmail(emailPrefix),
    phone: '+9647701234567',
    password: DEV_PASSWORD,
    confirmPassword: DEV_PASSWORD,
    country: 'IQ',
    governorate: 'بغداد',
    gender,
    terms: true,
  };
}

export function devPetOwnerDefaults(): DevPersonalDefaults {
  return devPersonalDefaults('dev.owner');
}

export function devVeterinarianDefaults(): DevPersonalDefaults {
  return devPersonalDefaults('dev.vet');
}
