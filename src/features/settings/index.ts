/**
 * "الإعدادات" — one settings menu shared by the Pet Owner and Veterinarian
 * interfaces. Language + notifications + app appearance are wired to real
 * mechanisms (i18n prefs / `/notifications/preferences` / theme store);
 * "الخصوصية والأمان" (sign out everywhere + what others can see) and
 * "تغيير كلمة المرور" (`POST /auth/change-password`) are real screens; help
 * opens the Contact page; about opens a small info screen; sign out uses the
 * auth logout flow.
 */
export {
  PetOwnerSettingsScreen,
  AboutScreen,
  PrivacySecurityScreen,
  ChangePasswordScreen,
} from './screens';
