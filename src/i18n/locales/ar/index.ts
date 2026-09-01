import admin from './admin';
import auth from './auth';
import chat from './chat';
import common from './common';
import content from './content';
import errors from './errors';
import farm from './farm';
import medical from './medical';
import nav from './nav';
import notifications from './notifications';
import orgAnimals from './orgAnimals';
import organizations from './organizations';
import pets from './pets';
import publications from './publications';
import registration from './registration';
import showcase from './showcase';
import store from './store';
import support from './support';
import users from './users';
import veterinarian from './veterinarian';

export const ar = {
  common,
  nav,
  errors,
  auth,
  admin,
  pets,
  veterinarian,
  organizations,
  orgAnimals,
  medical,
  farm,
  publications,
  store,
  content,
  chat,
  users,
  support,
  notifications,
  showcase,
  registration,
} as const;
export type TranslationResources = typeof ar;
