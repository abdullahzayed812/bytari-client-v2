/**
 * Registration / onboarding feature — Splash → Welcome → Account Type →
 * Pet Owner / Veterinarian registration → Registration Success. Long
 * single-scroll forms (not wizards), reusing the `auth` feature's mutations
 * and error-mapping so screens never talk to the store or the API directly.
 */
export {
  WelcomeScreen,
  AccountTypeScreen,
  PetOwnerRegisterScreen,
  VeterinarianRegisterScreen,
  VerifyEmailScreen,
  RegistrationSuccessScreen,
} from './screens';
export {
  AccountTypeCard,
  GenderRadioGroup,
  CountrySelect,
  DocumentUploadTile,
  SocialLoginButtons,
} from './components';
export {
  uploadRegistrationAvatar,
  uploadRegistrationDocument,
  type UploadedVeterinarianDocument,
  useSubmitVeterinarianApplication,
} from './hooks';
export { profileApi, type ProfileApi } from './api/profileApi';
export {
  buildPetOwnerSchema,
  buildVeterinarianSchema,
  type PetOwnerFormValues,
  type VeterinarianFormValues,
  type RegistrationTFn,
} from './validation/schemas';
export { COUNTRIES } from './data/countries';
export type { DocumentRef, CountryOption, RegistrationOutcome } from './types';
