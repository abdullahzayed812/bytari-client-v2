/**
 * Centralised route hrefs for Expo Router. Import these instead of writing path
 * string literals in components, so a route move is one edit. Kept deep-link
 * compatible (§30) — every value is a resolvable absolute path.
 */
export const Routes = {
  authWelcome: '/(auth)/welcome',
  authSignIn: '/(auth)/sign-in',
  authAccountType: '/(auth)/account-type',
  authRegister: '/(auth)/register',
  authRegisterVeterinarian: '/(auth)/register-veterinarian',
  authRegisterSuccess: '/(auth)/register-success',

  home: '/(app)/(tabs)',
  account: '/(app)/(tabs)/account',
  animals: '/(app)/(tabs)/animals',
  services: '/(app)/(tabs)/services',
  more: '/(app)/(tabs)/more',

  // Pets (Mobile Phase 3)
  pets: '/(app)/pets',
  /** Pet Owner discovery landing — banner + own-pet profiles + community entry cards. */
  petsLanding: '/(app)/pets/landing',
  petsCreate: '/(app)/pets/create',
  petDetail: (petId: string) => `/(app)/pets/${petId}` as const,
  petEdit: (petId: string) => `/(app)/pets/${petId}/edit` as const,

  // Animal ownership (Mobile Phase 12)
  petOwnership: (petId: string) => `/(app)/pets/${petId}/ownership` as const,
  /**
   * "My" transfer requests (sent/received) — the request/acceptance workflow
   * is the only way to transfer ownership. Navigate with a `petId` param
   * (`router.push({ pathname: Routes.petTransferRequests, params: { petId } })`)
   * to open straight into "propose a transfer" for that pet, preselected.
   */
  petTransferRequests: '/(app)/pets/transfer-requests',

  // Pet Owner medical history — read-only (Mobile Phase 6)
  petMedicalRecords: (petId: string) => `/(app)/pets/${petId}/medical-records` as const,
  petMedicalRecord: (petId: string, recordId: string) =>
    `/(app)/pets/${petId}/medical-records/${recordId}` as const,
  petVaccinations: (petId: string) => `/(app)/pets/${petId}/vaccinations` as const,
  petVaccination: (petId: string, vaccinationId: string) =>
    `/(app)/pets/${petId}/vaccinations/${vaccinationId}` as const,
  petMedicalHistory: (petId: string) => `/(app)/pets/${petId}/medical-history` as const,

  // Animal community — Adoption / Mating / Lost (Mobile Phase 8)
  publications: (kind: 'adoption' | 'mating' | 'lost') => `/(app)/publications/${kind}` as const,
  publicationsCreate: (kind: 'adoption' | 'mating' | 'lost') =>
    `/(app)/publications/${kind}/create` as const,
  publicationDetail: (kind: 'adoption' | 'mating' | 'lost', publicationId: string) =>
    `/(app)/publications/${kind}/${publicationId}` as const,
  petPublish: (petId: string, kind: 'adoption' | 'mating' | 'lost') =>
    `/(app)/pets/${petId}/publish/${kind}` as const,
  petPublication: (petId: string, publicationId: string) =>
    `/(app)/pets/${petId}/publications/${publicationId}` as const,

  // Content & Knowledge (Mobile Phase 11)
  contentHome: '/(app)/content',
  contentType: (type: 'articles' | 'books' | 'magazines') => `/(app)/content/${type}` as const,
  contentItem: (contentId: string) => `/(app)/content/item/${contentId}` as const,
  contentFile: (contentId: string, fileId: string) =>
    `/(app)/content/item/${contentId}/files/${fileId}` as const,

  // Veterinary Magazine — Veterinarian Home → "المجلة البيطرية" (type=MAGAZINE)
  veterinaryMagazineHome: '/(app)/veterinary-magazine',
  veterinaryMagazineArticle: (articleId: string) =>
    `/(app)/veterinary-magazine/${articleId}` as const,
  veterinaryMagazineCategory: (categoryId: string) =>
    `/(app)/veterinary-magazine/category/${categoryId}` as const,
  veterinaryMagazineSection: (mode: 'latest' | 'mostRead' | 'saved') =>
    `/(app)/veterinary-magazine/section/${mode}` as const,

  // Veterinary Books — Veterinarian Home → "الكتب البيطرية" (type=BOOK)
  veterinaryBooksHome: '/(app)/veterinary-books',
  veterinaryBooksDetail: (bookId: string) => `/(app)/veterinary-books/${bookId}` as const,
  veterinaryBooksCategory: (categoryId: string) =>
    `/(app)/veterinary-books/category/${categoryId}` as const,
  veterinaryBooksSection: (mode: 'all' | 'mostRead' | 'favorites') =>
    `/(app)/veterinary-books/section/${mode}` as const,

  // Veterinary content admin (Veterinarian interface — approved-vet CONTENT
  // supervisor or ADMIN, mirrors `/admin/content*`)
  adminVeterinaryContent: (type: 'MAGAZINE' | 'BOOK') =>
    `/(app)/admin/veterinary-content/${type}` as const,
  adminVeterinaryContentCreate: (type: 'MAGAZINE' | 'BOOK') =>
    `/(app)/admin/veterinary-content/${type}/create` as const,
  adminVeterinaryContentDetail: (type: 'MAGAZINE' | 'BOOK', contentId: string) =>
    `/(app)/admin/veterinary-content/${type}/${contentId}` as const,
  adminVeterinaryContentEdit: (type: 'MAGAZINE' | 'BOOK', contentId: string) =>
    `/(app)/admin/veterinary-content/${type}/${contentId}/edit` as const,
  adminVeterinaryContentCategories: '/(app)/admin/veterinary-content/categories',

  // Tips — أفضل النصائح (structured care advice from the content module)
  tips: '/(app)/tips',
  tip: (tipId: string) => `/(app)/tips/${tipId}` as const,

  // News — آخر الأخبار (general news items from the content module)
  news: '/(app)/news',
  newsDetail: (newsId: string) => `/(app)/news/${newsId}` as const,

  // Poultry Farms (Home → "الدواجن والطيور")
  poultryFarms: '/(app)/poultry',
  poultryFarmCreate: '/(app)/poultry/create',
  /**
   * "See all" of the caller's farms of one species group — paginated list.
   * Push with `{ pathname: Routes.myFarms, params: { species: 'POULTRY' | 'SHEEP_CATTLE' } }`.
   */
  myFarms: '/(app)/farms',
  /** Market hub — gates to trader registration, or the 5 market/bourse/statistics entries. */
  marketHub: '/(app)/poultry/market-hub',
  poultryMarket: '/(app)/poultry/market',
  poultryMarketCreate: '/(app)/poultry/market/create',
  poultryMarketOffer: (offerId: string) => `/(app)/poultry/market/${offerId}` as const,
  eggMarket: '/(app)/poultry/egg-market',
  eggMarketCreate: '/(app)/poultry/egg-market/create',
  eggMarketOffer: (offerId: string) => `/(app)/poultry/egg-market/${offerId}` as const,
  traderRegister: '/(app)/poultry/trader-register',
  poultryExchangeRates: '/(app)/poultry/exchange-rates',
  poultryExchangeRatesEntry: '/(app)/poultry/exchange-rates/entry',
  eggExchangeRates: '/(app)/poultry/egg-exchange-rates',
  eggExchangeRatesEntry: '/(app)/poultry/egg-exchange-rates/entry',
  marketStatistics: '/(app)/poultry/statistics',
  poultryFarmDetail: (organizationId: string) => `/(app)/poultry/${organizationId}` as const,
  /** Farm Settings — Info / Staff / Vets tabs (owner/admin only). */
  farmSettings: (organizationId: string) => `/(app)/poultry/${organizationId}/settings` as const,
  /** Farm Details management sub-pages (screens delivered with their own screenshots). */
  poultryFarmSection: (
    organizationId: string,
    section: 'treatments' | 'cases' | 'appointments' | 'expenses' | 'daily' | 'weekly',
  ) => `/(app)/poultry/${organizationId}/sections/${section}` as const,
  /** One item's read-only detail view within a farm management section. */
  poultryFarmSectionItem: (
    organizationId: string,
    section: 'treatments' | 'cases' | 'appointments' | 'expenses',
    itemId: string,
  ) => `/(app)/poultry/${organizationId}/sections/${section}/${itemId}` as const,
  /** Farm owner requests a subscription renewal once EXPIRED. */
  farmSubscriptionRenewal: (organizationId: string) =>
    `/(app)/poultry/${organizationId}/subscription-renewal` as const,

  // Sheep Farms & Cattle Farms (Home → "الأغنام والأبقار")
  sheepCattleFarms: '/(app)/livestock',
  sheepFarmCreate: '/(app)/livestock/sheep/create',
  cattleFarmCreate: '/(app)/livestock/cattle/create',
  sheepFarmDetail: (organizationId: string) => `/(app)/livestock/sheep/${organizationId}` as const,
  cattleFarmDetail: (organizationId: string) => `/(app)/livestock/cattle/${organizationId}` as const,
  sheepBatches: (organizationId: string) => `/(app)/livestock/sheep/${organizationId}/batches` as const,
  sheepBatchCreate: (organizationId: string) => `/(app)/livestock/sheep/${organizationId}/batches/create` as const,
  sheepBatchDetail: (organizationId: string, batchId: string) =>
    `/(app)/livestock/sheep/${organizationId}/batches/${batchId}` as const,
  sheepBatchEdit: (organizationId: string, batchId: string) =>
    `/(app)/livestock/sheep/${organizationId}/batches/${batchId}/edit` as const,
  cattleBatches: (organizationId: string) => `/(app)/livestock/cattle/${organizationId}/batches` as const,
  cattleBatchCreate: (organizationId: string) => `/(app)/livestock/cattle/${organizationId}/batches/create` as const,
  cattleBatchDetail: (organizationId: string, batchId: string) =>
    `/(app)/livestock/cattle/${organizationId}/batches/${batchId}` as const,
  cattleBatchEdit: (organizationId: string, batchId: string) =>
    `/(app)/livestock/cattle/${organizationId}/batches/${batchId}/edit` as const,
  sheepFarmSection: (
    organizationId: string,
    section: 'treatments' | 'cases' | 'appointments' | 'expenses' | 'daily' | 'weekly',
  ) => `/(app)/livestock/sheep/${organizationId}/sections/${section}` as const,
  cattleFarmSection: (
    organizationId: string,
    section: 'treatments' | 'cases' | 'appointments' | 'expenses' | 'daily' | 'weekly',
  ) => `/(app)/livestock/cattle/${organizationId}/sections/${section}` as const,

  // Pet Owners Store — consumer storefront (3rd bottom tab in Pet Owner mode)
  petOwnerStore: '/(app)/pet-owner-store',
  petOwnerStoreProducts: '/(app)/pet-owner-store/products',
  petOwnerStoreProduct: (productId: string) =>
    `/(app)/pet-owner-store/products/${productId}` as const,
  petOwnerStoreCart: '/(app)/pet-owner-store/cart',
  petOwnerStoreCheckout: '/(app)/pet-owner-store/checkout',
  petOwnerStoreOrders: '/(app)/pet-owner-store/orders',
  petOwnerStoreOrder: (orderId: string) => `/(app)/pet-owner-store/orders/${orderId}` as const,

  // Veterinarian Store — consumer storefront (3rd bottom tab in Veterinarian mode)
  veterinarianStore: '/(app)/veterinarian-store',
  veterinarianStoreProducts: '/(app)/veterinarian-store/products',
  veterinarianStoreProduct: (productId: string) =>
    `/(app)/veterinarian-store/products/${productId}` as const,
  veterinarianStoreCart: '/(app)/veterinarian-store/cart',
  veterinarianStoreCheckout: '/(app)/veterinarian-store/checkout',
  veterinarianStoreOrders: '/(app)/veterinarian-store/orders',
  veterinarianStoreOrder: (orderId: string) =>
    `/(app)/veterinarian-store/orders/${orderId}` as const,

  // Notifications inbox (Mobile Phase 15)
  notifications: '/(app)/notifications',

  // Clinic appointments — Pet Owner ↔ Clinic booking ("حجز موعد")
  /** The authenticated Pet Owner's appointment list. */
  petOwnerAppointments: '/(app)/clinic-appointments',
  petOwnerAppointment: (appointmentId: string) =>
    `/(app)/clinic-appointments/${appointmentId}` as const,
  /** Booking screen, opened from a Clinic Details screen. */
  clinicBookAppointment: (organizationId: string) =>
    `/(app)/clinic-appointments/book/${organizationId}` as const,

  // Chat — Pet Owner ↔ Clinic / Farm Owner ↔ member (Final Completion phase)
  chat: '/(app)/chat',
  chatThread: (conversationId: string) => `/(app)/chat/${conversationId}` as const,

  // Consultations & Inquiries + Support Messages ("تواصل معنا") (Mobile Phase 13)
  support: (kind: 'consultations' | 'inquiries' | 'support-messages') =>
    `/(app)/support/${kind}` as const,
  supportCreate: (kind: 'consultations' | 'inquiries' | 'support-messages') =>
    `/(app)/support/${kind}/create` as const,
  supportManage: (kind: 'consultations' | 'inquiries' | 'support-messages') =>
    `/(app)/support/${kind}/manage` as const,
  supportThread: (
    kind: 'consultations' | 'inquiries' | 'support-messages',
    threadId: string,
  ) => `/(app)/support/${kind}/${threadId}` as const,

  // Settings & Contact ("الإعدادات" / "تواصل معنا")
  settings: '/(app)/settings',
  settingsAbout: '/(app)/settings/about',
  contact: '/(app)/contact',

  // Veterinary Services marketplace ("الخدمات")
  vetServices: '/(app)/vet-services',
  vetServiceListings: '/(app)/vet-services/listings',
  vetServiceListing: (listingId: string) =>
    `/(app)/vet-services/listings/${listingId}` as const,
  vetServiceListingNew: '/(app)/vet-services/listings/new',
  vetServiceListingRequest: (listingId: string) =>
    `/(app)/vet-services/listings/${listingId}/request` as const,
  vetServiceRequests: '/(app)/vet-services/requests',
  vetServiceRequest: (requestId: string) =>
    `/(app)/vet-services/requests/${requestId}` as const,
  vetServiceRequestNew: '/(app)/vet-services/requests/new',
  vetServiceOfferNew: (requestId: string) =>
    `/(app)/vet-services/requests/${requestId}/offer` as const,
  vetServiceMy: '/(app)/vet-services/my',
  vetServiceDeal: (conversationId: string) =>
    `/(app)/vet-services/deals/${conversationId}` as const,
  vetServiceEngagement: (kind: 'offer' | 'listing-request', engagementId: string) =>
    `/(app)/vet-services/engagements/${kind}/${engagementId}` as const,

  // Veterinarian Jobs / Careers ("الوظائف البيطرية")
  vetJobs: '/(app)/vet-jobs',
  vetJobOffers: '/(app)/vet-jobs/offers',
  vetJobOffer: (offerId: string) => `/(app)/vet-jobs/offers/${offerId}` as const,
  vetJobOfferNew: '/(app)/vet-jobs/offers/new',
  vetJobOfferEdit: (offerId: string) => `/(app)/vet-jobs/offers/${offerId}/edit` as const,
  vetJobOfferApply: (offerId: string) => `/(app)/vet-jobs/offers/${offerId}/apply` as const,
  vetJobOfferApplicants: (offerId: string) =>
    `/(app)/vet-jobs/offers/${offerId}/applicants` as const,
  vetJobSeekers: '/(app)/vet-jobs/seekers',
  vetJobSeeker: (seekerId: string) => `/(app)/vet-jobs/seekers/${seekerId}` as const,
  vetJobSeekerProfileNew: '/(app)/vet-jobs/seekers/new',
  vetJobSeekerProfileEdit: '/(app)/vet-jobs/seekers/mine/edit',
  vetJobMy: '/(app)/vet-jobs/my',

  // Veterinarian Courses & Seminars ("الدورات والندوات")
  vetCourses: '/(app)/vet-courses',
  vetCourse: (courseId: string) => `/(app)/vet-courses/${courseId}` as const,
  vetCourseNew: '/(app)/vet-courses/new',
  vetCourseEdit: (courseId: string) => `/(app)/vet-courses/${courseId}/edit` as const,
  vetCourseRegister: (courseId: string) => `/(app)/vet-courses/${courseId}/register` as const,
  vetCourseMy: '/(app)/vet-courses/my',

  // Veterinary Syndicates / Unions ("نقابة الأطباء البيطريين")
  syndicates: '/(app)/syndicates',
  syndicateMain: (organizationId: string) => `/(app)/syndicates/${organizationId}` as const,
  syndicateBranches: (organizationId: string) => `/(app)/syndicates/${organizationId}/branches` as const,
  syndicateAnnouncements: (organizationId: string) =>
    `/(app)/syndicates/${organizationId}/announcements` as const,
  syndicateAnnouncementNew: (organizationId: string) =>
    `/(app)/syndicates/${organizationId}/announcements/new` as const,
  syndicateAnnouncementDetails: (id: string) => `/(app)/syndicates/announcements/${id}` as const,
  syndicateInquiry: (organizationId: string) => `/(app)/syndicates/${organizationId}/inquiry` as const,
  syndicateSubmissions: (organizationId: string) =>
    `/(app)/syndicates/${organizationId}/submissions` as const,
  syndicateMy: '/(app)/syndicates/my',
  syndicateIdRequirements: '/(app)/syndicates/id-requirements',
  syndicateOfficeLicenses: '/(app)/syndicates/office-licenses',
  syndicateLegalSupport: '/(app)/syndicates/legal-support',

  // Veterinarian & Organizations (Mobile Phase 4)
  veterinarian: '/(app)/veterinarian',
  veterinarianApply: '/(app)/veterinarian/apply',
  veterinarianJoinFarm: '/(app)/veterinarian/join-farm',
  organizations: '/(app)/organizations',
  organizationsCreate: '/(app)/organizations/create',
  organizationsDiscover: '/(app)/organizations/discover',
  organizationDiscoverDetail: (organizationId: string) =>
    `/(app)/organizations/discover/${organizationId}` as const,
  // Veterinary Offices — public browse (Veterinarian Home → "المكاتب البيطرية").
  veterinaryOffices: '/(app)/veterinary-offices',
  veterinaryOfficeDetail: (officeId: string) => `/(app)/veterinary-offices/${officeId}` as const,
  veterinaryOfficeProducts: (officeId: string) =>
    `/(app)/veterinary-offices/${officeId}/products` as const,
  veterinaryOfficeProductDetail: (officeId: string, productId: string) =>
    `/(app)/veterinary-offices/${officeId}/products/${productId}` as const,
  organizationDetail: (organizationId: string) => `/(app)/organizations/${organizationId}` as const,
  organizationEdit: (organizationId: string) =>
    `/(app)/organizations/${organizationId}/edit` as const,
  organizationMembers: (organizationId: string) =>
    `/(app)/organizations/${organizationId}/members` as const,
  organizationMembersAdd: (organizationId: string) =>
    `/(app)/organizations/${organizationId}/members/add` as const,
  organizationSupervisors: (organizationId: string) =>
    `/(app)/organizations/${organizationId}/supervisors` as const,
  organizationSupervisorsAssign: (organizationId: string) =>
    `/(app)/organizations/${organizationId}/supervisors/assign` as const,

  // Organization Animals (Mobile Phase 5)
  organizationAnimals: (organizationId: string) =>
    `/(app)/organizations/${organizationId}/animals` as const,
  organizationAnimalsGrant: (organizationId: string) =>
    `/(app)/organizations/${organizationId}/animals/grant` as const,
  organizationAnimalDetail: (organizationId: string, animalId: string) =>
    `/(app)/organizations/${organizationId}/animals/${animalId}` as const,

  // Organization operations — Farm poultry (Mobile Phase 7)
  organizationPoultry: (organizationId: string) =>
    `/(app)/organizations/${organizationId}/poultry` as const,
  organizationPoultryCreate: (organizationId: string) =>
    `/(app)/organizations/${organizationId}/poultry/create` as const,
  organizationPoultryFlock: (organizationId: string, flockId: string) =>
    `/(app)/organizations/${organizationId}/poultry/${flockId}` as const,
  organizationPoultryFlockEdit: (organizationId: string, flockId: string) =>
    `/(app)/organizations/${organizationId}/poultry/${flockId}/edit` as const,

  // Organization operations — Veterinary Store products (Mobile Phase 10)
  organizationStoreProducts: (organizationId: string) =>
    `/(app)/organizations/${organizationId}/store-products` as const,
  organizationStoreProductCreate: (organizationId: string) =>
    `/(app)/organizations/${organizationId}/store-products/create` as const,
  organizationStoreProduct: (organizationId: string, productId: string) =>
    `/(app)/organizations/${organizationId}/store-products/${productId}` as const,
  organizationStoreProductEdit: (organizationId: string, productId: string) =>
    `/(app)/organizations/${organizationId}/store-products/${productId}/edit` as const,

  // Organization operations — Veterinary Office products (own catalog, own table)
  organizationOfficeProducts: (organizationId: string) =>
    `/(app)/organizations/${organizationId}/office-products` as const,
  organizationOfficeProductCreate: (organizationId: string) =>
    `/(app)/organizations/${organizationId}/office-products/create` as const,
  organizationOfficeProduct: (organizationId: string, productId: string) =>
    `/(app)/organizations/${organizationId}/office-products/${productId}` as const,
  organizationOfficeProductEdit: (organizationId: string, productId: string) =>
    `/(app)/organizations/${organizationId}/office-products/${productId}/edit` as const,

  // Clinic veterinary care — Medical Records & Vaccinations (Mobile Phase 6)
  orgAnimalMedicalRecords: (organizationId: string, animalId: string) =>
    `/(app)/organizations/${organizationId}/animals/${animalId}/medical-records` as const,
  orgAnimalMedicalRecordCreate: (organizationId: string, animalId: string) =>
    `/(app)/organizations/${organizationId}/animals/${animalId}/medical-records/create` as const,
  orgAnimalMedicalRecord: (organizationId: string, animalId: string, recordId: string) =>
    `/(app)/organizations/${organizationId}/animals/${animalId}/medical-records/${recordId}` as const,
  orgAnimalMedicalRecordEdit: (organizationId: string, animalId: string, recordId: string) =>
    `/(app)/organizations/${organizationId}/animals/${animalId}/medical-records/${recordId}/edit` as const,
  orgAnimalVaccinations: (organizationId: string, animalId: string) =>
    `/(app)/organizations/${organizationId}/animals/${animalId}/vaccinations` as const,
  orgAnimalVaccinationCreate: (organizationId: string, animalId: string) =>
    `/(app)/organizations/${organizationId}/animals/${animalId}/vaccinations/create` as const,
  orgAnimalVaccination: (organizationId: string, animalId: string, vaccinationId: string) =>
    `/(app)/organizations/${organizationId}/animals/${animalId}/vaccinations/${vaccinationId}` as const,
  orgAnimalVaccinationEdit: (organizationId: string, animalId: string, vaccinationId: string) =>
    `/(app)/organizations/${organizationId}/animals/${animalId}/vaccinations/${vaccinationId}/edit` as const,
  orgAnimalMedicalHistory: (organizationId: string, animalId: string) =>
    `/(app)/organizations/${organizationId}/animals/${animalId}/medical-history` as const,

  managementHome: '/(app)/admin',
  /** @deprecated use {@link managementHome}. */
  adminHome: '/(app)/admin',

  // Management Centre — admin areas (Mobile Audit Phase P1)
  adminUsers: '/(app)/admin/users',
  adminUser: (userId: string) => `/(app)/admin/users/${userId}` as const,
  adminVetApplications: '/(app)/admin/veterinarians',
  adminOrganizations: '/(app)/admin/organizations',
  adminOrganization: (organizationId: string) =>
    `/(app)/admin/organizations/${organizationId}` as const,
  /** Poultry Farms management (approval, subscription, renewal requests). */
  adminFarms: '/(app)/admin/farms',
  adminFarm: (organizationId: string) => `/(app)/admin/farms/${organizationId}` as const,
  adminSupervisors: '/(app)/admin/supervisors',
  adminAuditLogs: '/(app)/admin/audit-logs',
  /** Lost / Adoption / Mating moderation queue (approve / reject requests). */
  adminAnimalPublications: '/(app)/admin/animal-publications',
  /** Oversight of user pets — list all, soft-delete. */
  adminAnimals: '/(app)/admin/animals',
  /** Veterinary Services listing moderation queue (approve / reject). */
  adminVetServiceListings: '/(app)/admin/vet-service-listings',
  /** Veterinary Services pet-owner request moderation queue (approve / reject). */
  adminVetServiceRequests: '/(app)/admin/vet-service-requests',
  /** Veterinarian Jobs — job offer moderation queue (approve / reject). */
  adminVetJobOffers: '/(app)/admin/vet-job-offers',
  /** Veterinarian Jobs — job-seeker profile moderation queue (approve / reject). */
  adminVetJobSeekers: '/(app)/admin/vet-job-seekers',
  /** Veterinarian Courses & Seminars — moderation queue (approve / reject / cancel). */
  adminVetCourses: '/(app)/admin/vet-courses',
  /** Veterinary Syndicates — create a main or subordinate syndicate (syndicate.admin.create). */
  adminCreateSyndicate: '/(app)/admin/syndicates/new',
  /** Trader registration applications (approve / reject / suspend) — one list screen, inline actions. */
  adminTraderApplications: '/(app)/admin/traders',
  /** Market offer moderation — one screen parametrized by kind (poultry | egg). */
  adminMarketOffers: (kind: 'poultry' | 'egg') => `/(app)/admin/market-offers/${kind}` as const,

  // Pet Owners Store — Admin management (Management Centre → Pet Store)
  adminPetStoreProducts: '/(app)/admin/pet-owner-store/products',
  adminPetStoreProductCreate: '/(app)/admin/pet-owner-store/products/create',
  adminPetStoreProduct: (productId: string) =>
    `/(app)/admin/pet-owner-store/products/${productId}` as const,
  adminPetStoreProductEdit: (productId: string) =>
    `/(app)/admin/pet-owner-store/products/${productId}/edit` as const,
  adminPetStoreCategories: '/(app)/admin/pet-owner-store/categories',
  adminPetStoreOrders: '/(app)/admin/pet-owner-store/orders',
  adminPetStoreOrder: (orderId: string) =>
    `/(app)/admin/pet-owner-store/orders/${orderId}` as const,

  // Veterinarian Store — Admin management (Management Centre → Veterinarian Store)
  adminVetStoreProducts: '/(app)/admin/veterinarian-store/products',
  adminVetStoreProductCreate: '/(app)/admin/veterinarian-store/products/create',
  adminVetStoreProduct: (productId: string) =>
    `/(app)/admin/veterinarian-store/products/${productId}` as const,
  adminVetStoreProductEdit: (productId: string) =>
    `/(app)/admin/veterinarian-store/products/${productId}/edit` as const,
  adminVetStoreCategories: '/(app)/admin/veterinarian-store/categories',
  adminVetStoreOrders: '/(app)/admin/veterinarian-store/orders',
  adminVetStoreOrder: (orderId: string) =>
    `/(app)/admin/veterinarian-store/orders/${orderId}` as const,

  showcase: '/(app)/showcase',
} as const;

export type RouteKey = keyof typeof Routes;
