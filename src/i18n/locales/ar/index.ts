import admin from './admin';
import ads from './ads';
import auth from './auth';
import chat from './chat';
import clinicAppointments from './clinicAppointments';
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

export const ar = {
  common,
  nav,
  errors,
  auth,
  admin,
  pets,
  poultry,
  petOwnerStore,
  home,
  veterinarian,
  organizations,
  orgAnimals,
  medical,
  farm,
  poultryMarket,
  sheepCattleFarm,
  publications,
  veterinaryStore,
  content,
  tips,
  news,
  chat,
  clinicAppointments,
  contact,
  settings,
  profile,
  users,
  support,
  notifications,
  showcase,
  registration,
  vetServices,
  veterinaryOffices,
  veterinaryOfficeDashboard,
  veterinaryMagazine,
  veterinaryBooks,
  veterinarianStore,
  vetJobs,
  vetCourses,
  syndicates,
  ads,
  globalChat,
} as const;
export type TranslationResources = typeof ar;
