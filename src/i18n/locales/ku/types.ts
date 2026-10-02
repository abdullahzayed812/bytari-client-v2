import type { TranslationResources } from '../ar';

/** Same shape as the Arabic resources, every key optional (untranslated → Arabic fallback). */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends string ? string : T[K] extends number ? number : DeepPartial<T[K]>;
};

/** One Kurdish (Sorani) namespace, checked against the Arabic namespace's keys. */
export type KuNamespace<N extends keyof TranslationResources> = DeepPartial<
  TranslationResources[N]
>;
