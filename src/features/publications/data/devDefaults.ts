/**
 * DEVELOPMENT ONLY — pre-fills the "Add Lost / Adoption / Mating Animal"
 * forms so testing doesn't require retyping the same values every time.
 * `__DEV__` is statically replaced with `false` in release builds, so this
 * whole module is dead-code-eliminated and never ships.
 */

function isoDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/** Listing-only fields, shared by every kind (`PublicationForm` — existing pet). */
export function devPublicationListingDefaults() {
  return {
    note: 'الحيوان بحالة صحية جيدة ويبحث عن منزل/شريك مناسب',
    extraNotes: 'يمكن التواصل عبر الهاتف لمزيد من التفاصيل',
    contactName: 'محمد العبيدي',
    contactPhone: '07709876543',
    city: 'بغداد',
    lostDate: isoDaysAgo(1),
    lostTime: '14:30',
    lostGovernorate: 'بغداد',
    lostDistrict: 'الكرادة',
    lostLocationDetail: 'قرب حديقة الزوراء',
    healthNotes: 'الحيوان يبدو بصحة جيدة، لا توجد إصابات ظاهرة',
  };
}

/** Full profile + listing fields (`CreatePublicationScreen` — brand-new animal). */
export function devNewAnimalPublicationDefaults() {
  return {
    species: 'DOG',
    breed: 'جيرمن شيبرد',
    name: 'لوسي',
    sex: 'FEMALE',
    color: 'بني وأسود',
    ageEstimate: 'ONE_TO_3_YEARS',
    distinguishingFeatures: 'بقعة بيضاء صغيرة عند الأذن اليمنى',
    ...devPublicationListingDefaults(),
    healthStatus: 'GOOD',
    vaccinationStatus: 'COMPLETE',
    isSterilized: 'false',
  };
}
