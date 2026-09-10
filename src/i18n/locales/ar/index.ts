import admin from './admin';
import auth from './auth';
import chat from './chat';
import clinicAppointments from './clinicAppointments';
import common from './common';
import contact from './contact';
import content from './content';
import errors from './errors';
import farm from './farm';
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
import publications from './publications';
import registration from './registration';
import settings from './settings';
import sheepCattleFarm from './sheepCattleFarm';
import showcase from './showcase';
import store from './store';
import support from './support';
import tips from './tips';
import users from './users';
import veterinarian from './veterinarian';
import veterinaryOffices from './veterinaryOffices';
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
  store,
  content,
  tips,
  news,
  chat,
  clinicAppointments,
  contact,
  settings,
  users,
  support,
  notifications,
  showcase,
  registration,
  vetServices,
  veterinaryOffices,
} as const;
export type TranslationResources = typeof ar;
