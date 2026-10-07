import type { TranslationResources } from '../ar';

import ads from './ads';
import auth from './auth';
import chat from './chat';
import clinicAppointments from './clinicAppointments';
import clinicDashboard from './clinicDashboard';
import common from './common';
import contact from './contact';
import content from './content';
import errors from './errors';
import farm from './farm';
import globalChat from './globalChat';
import home from './home';
import medical from './medical';
import nav from './nav';
import news from './news';
import notifications from './notifications';
import orgAnimals from './orgAnimals';
import organizations from './organizations';
import petOwnerStore from './petOwnerStore';
import pets from './pets';
import poultry from './poultry';
import poultryMarket from './poultryMarket';
import profile from './profile';
import publications from './publications';
import registration from './registration';
import settings from './settings';
import sheepCattleFarm from './sheepCattleFarm';
import showcase from './showcase';
import support from './support';
import syndicates from './syndicates';
import tips from './tips';
import type { DeepPartial } from './types';
import users from './users';
import vetCourses from './vetCourses';
import veterinarian from './veterinarian';
import veterinarianStore from './veterinarianStore';
import veterinaryBooks from './veterinaryBooks';
import veterinaryMagazine from './veterinaryMagazine';
import veterinaryOfficeDashboard from './veterinaryOfficeDashboard';
import veterinaryOffices from './veterinaryOffices';
import veterinaryStore from './veterinaryStore';
import vetJobs from './vetJobs';
import vetServices from './vetServices';

/**
 * Central Kurdish (Sorani) — `ku`. Same shape as the Arabic resources; any
 * string not listed here falls back to Arabic (`fallbackLng: { ku: ['ar'] }`).
 * Every user-facing namespace is translated; only the staff-only admin console
 * (`admin`, and the `admin.*` blocks of content / ads / stores / syndicates)
 * deliberately stays on the Arabic fallback. The registration Terms &
 * Conditions are served by the backend in their exact Arabic wording.
 * Text is RTL (Arabic script), like Arabic.
 */
export const ku: DeepPartial<TranslationResources> = {
  common,
  nav,
  errors,
  auth,
  home,
  tips,
  news,
  contact,
  settings,
  profile,
  users,
  showcase,
  registration,
  chat,
  clinicAppointments,
  clinicDashboard,
  content,
  globalChat,
  notifications,
  pets,
  publications,
  support,
  vetCourses,
  vetJobs,
  vetServices,
  veterinaryOffices,
  ads,
  farm,
  medical,
  orgAnimals,
  organizations,
  petOwnerStore,
  poultry,
  poultryMarket,
  sheepCattleFarm,
  syndicates,
  veterinarian,
  veterinarianStore,
  veterinaryBooks,
  veterinaryMagazine,
  veterinaryOfficeDashboard,
  veterinaryStore,
};
