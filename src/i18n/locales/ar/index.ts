import admin from './admin';
import auth from './auth';
import chat from './chat';
import common from './common';
import content from './content';
import errors from './errors';
import farm from './farm';
import home from './home';
import medical from './medical';
import nav from './nav';
import notifications from './notifications';
import orgAnimals from './orgAnimals';
import organizations from './organizations';
import pets from './pets';
import poultry from './poultry';
import publications from './publications';
import registration from './registration';
import showcase from './showcase';
import store from './store';
import support from './support';
import tips from './tips';
import users from './users';
import veterinarian from './veterinarian';

export const ar = {
  common,
  nav,
  errors,
  auth,
  admin,
  pets,
  poultry,
  home,
  veterinarian,
  organizations,
  orgAnimals,
  medical,
  farm,
  publications,
  store,
  content,
  tips,
  chat,
  users,
  support,
  notifications,
  showcase,
  registration,
} as const;
export type TranslationResources = typeof ar;
