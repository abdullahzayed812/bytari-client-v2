/**
 * "الإعدادات" — the Pet Owner settings menu. A single list screen matching the
 * reference: language + notifications + app appearance are wired to real
 * mechanisms (i18n prefs / `/notifications/preferences` / theme store);
 * privacy & change-password surface a "coming soon" toast (no backend yet);
 * help opens the Contact page; about opens a small info screen; sign out uses
 * the auth logout flow.
 */
export { PetOwnerSettingsScreen, AboutScreen } from './screens';
