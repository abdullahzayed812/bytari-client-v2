import common from './common';
import errors from './errors';
import nav from './nav';
import showcase from './showcase';

export const ar = { common, nav, errors, showcase } as const;
export type TranslationResources = typeof ar;
