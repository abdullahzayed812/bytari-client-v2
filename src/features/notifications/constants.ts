import type { TFunction } from 'i18next';

import type { IconName } from '@/components/content';
import { DEFAULT_LANGUAGE } from '@/constants/config';
import { Routes } from '@/constants/routes';

import { isNotificationType, type AppNotification, type NotificationType } from './types';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Per-type presentation. `icon` is an Ionicons name; `tone` maps to a `Badge`
 * tone. Copy is backend-rendered (`title` / `body`) and re-localized by
 * `localizedNotificationText` — only the visual affordance lives here.
 */
export const NOTIFICATION_TYPE_META: Record<NotificationType, { icon: IconName; tone: Tone }> = {
  ACCOUNT_STATUS_CHANGED: { icon: 'person-circle-outline', tone: 'warning' },
  VETERINARIAN_APPLICATION_SUBMITTED: { icon: 'shield-outline', tone: 'info' },
  VETERINARIAN_APPROVED: { icon: 'shield-checkmark-outline', tone: 'success' },
  VETERINARIAN_REJECTED: { icon: 'shield-outline', tone: 'danger' },
  ORGANIZATION_SUBMITTED: { icon: 'business-outline', tone: 'info' },
  ORGANIZATION_APPROVED: { icon: 'business-outline', tone: 'success' },
  ORGANIZATION_REJECTED: { icon: 'business-outline', tone: 'danger' },
  ORGANIZATION_SUSPENDED: { icon: 'business-outline', tone: 'danger' },
  ORGANIZATION_ACTIVATED: { icon: 'business-outline', tone: 'success' },
  ORGANIZATION_DEACTIVATED: { icon: 'business-outline', tone: 'danger' },
  ORGANIZATION_MEMBER_ADDED: { icon: 'people-outline', tone: 'info' },
  ORGANIZATION_MEMBER_REMOVED: { icon: 'people-outline', tone: 'neutral' },
  ORGANIZATION_ROLE_CHANGED: { icon: 'people-outline', tone: 'info' },
  ORGANIZATION_SUPERVISOR_ASSIGNED: { icon: 'shield-checkmark-outline', tone: 'info' },
  SUBSCRIPTION_UPDATED: { icon: 'card-outline', tone: 'info' },
  SUBSCRIPTION_EXPIRING: { icon: 'time-outline', tone: 'warning' },
  SUBSCRIPTION_EXPIRED: { icon: 'alert-circle-outline', tone: 'danger' },
  SUBSCRIPTION_RENEWAL_REQUESTED: { icon: 'card-outline', tone: 'info' },
  SUBSCRIPTION_RENEWAL_APPROVED: { icon: 'card-outline', tone: 'success' },
  SUBSCRIPTION_RENEWAL_REJECTED: { icon: 'card-outline', tone: 'danger' },
  FARM_MEMBER_JOINED: { icon: 'people-outline', tone: 'info' },
  FARM_APPOINTMENT_CREATED: { icon: 'calendar-outline', tone: 'info' },
  TRADER_APPLICATION_SUBMITTED: { icon: 'storefront-outline', tone: 'info' },
  TRADER_APPROVED: { icon: 'storefront-outline', tone: 'success' },
  TRADER_REJECTED: { icon: 'storefront-outline', tone: 'danger' },
  TRADER_SUSPENDED: { icon: 'storefront-outline', tone: 'danger' },
  TRADER_REACTIVATED: { icon: 'storefront-outline', tone: 'success' },
  SYSTEM_SUPERVISOR_ASSIGNED: { icon: 'shield-checkmark-outline', tone: 'info' },
  CHAT_MESSAGE_RECEIVED: { icon: 'chatbubble-ellipses-outline', tone: 'primary' },
  CONSULTATION_CREATED: { icon: 'chatbubbles-outline', tone: 'info' },
  CONSULTATION_MESSAGE_RECEIVED: { icon: 'chatbubbles-outline', tone: 'primary' },
  CONSULTATION_CLOSED: { icon: 'chatbubbles-outline', tone: 'neutral' },
  INQUIRY_CREATED: { icon: 'help-buoy-outline', tone: 'info' },
  INQUIRY_MESSAGE_RECEIVED: { icon: 'help-buoy-outline', tone: 'primary' },
  INQUIRY_CLOSED: { icon: 'help-buoy-outline', tone: 'neutral' },
  SUPPORT_CREATED: { icon: 'mail-outline', tone: 'info' },
  SUPPORT_MESSAGE_RECEIVED: { icon: 'mail-outline', tone: 'primary' },
  SUPPORT_CLOSED: { icon: 'mail-outline', tone: 'neutral' },
  VET_SERVICE_LISTING_SUBMITTED: { icon: 'medkit-outline', tone: 'info' },
  VET_SERVICE_LISTING_APPROVED: { icon: 'medkit-outline', tone: 'success' },
  VET_SERVICE_LISTING_REJECTED: { icon: 'medkit-outline', tone: 'danger' },
  VET_SERVICE_REQUEST_SUBMITTED: { icon: 'medkit-outline', tone: 'info' },
  VET_SERVICE_REQUEST_APPROVED: { icon: 'medkit-outline', tone: 'success' },
  VET_SERVICE_REQUEST_REJECTED: { icon: 'medkit-outline', tone: 'danger' },
  VET_SERVICE_OFFER_RECEIVED: { icon: 'pricetag-outline', tone: 'primary' },
  VET_SERVICE_OFFER_ACCEPTED: { icon: 'pricetag-outline', tone: 'success' },
  VET_SERVICE_OFFER_REJECTED: { icon: 'pricetag-outline', tone: 'neutral' },
  VET_SERVICE_LISTING_REQUEST_RECEIVED: { icon: 'medkit-outline', tone: 'primary' },
  VET_SERVICE_LISTING_REQUEST_ACCEPTED: { icon: 'medkit-outline', tone: 'success' },
  VET_SERVICE_LISTING_REQUEST_REJECTED: { icon: 'medkit-outline', tone: 'neutral' },
  VET_SERVICE_DEAL_COMPLETED: { icon: 'checkmark-done-outline', tone: 'success' },
  VET_COURSE_SUBMITTED: { icon: 'school-outline', tone: 'info' },
  VET_COURSE_APPROVED: { icon: 'school-outline', tone: 'success' },
  VET_COURSE_REJECTED: { icon: 'school-outline', tone: 'danger' },
  VET_COURSE_REGISTRATION_CONFIRMED: { icon: 'school-outline', tone: 'success' },
  VET_COURSE_REGISTRATION_RECEIVED: { icon: 'school-outline', tone: 'primary' },
  VET_COURSE_CAPACITY_REACHED: { icon: 'school-outline', tone: 'warning' },
  VET_COURSE_CANCELLED: { icon: 'school-outline', tone: 'danger' },
  VET_JOB_OFFER_SUBMITTED: { icon: 'briefcase-outline', tone: 'info' },
  VET_JOB_OFFER_APPROVED: { icon: 'briefcase-outline', tone: 'success' },
  VET_JOB_OFFER_REJECTED: { icon: 'briefcase-outline', tone: 'danger' },
  VET_JOB_SEEKER_PROFILE_SUBMITTED: { icon: 'id-card-outline', tone: 'info' },
  VET_JOB_SEEKER_PROFILE_APPROVED: { icon: 'id-card-outline', tone: 'success' },
  VET_JOB_SEEKER_PROFILE_REJECTED: { icon: 'id-card-outline', tone: 'danger' },
  VET_JOB_APPLICATION_RECEIVED: { icon: 'briefcase-outline', tone: 'primary' },
  VET_JOB_APPLICATION_ACCEPTED: { icon: 'briefcase-outline', tone: 'success' },
  VET_JOB_APPLICATION_REJECTED: { icon: 'briefcase-outline', tone: 'neutral' },
  STORE_ORDER_PLACED: { icon: 'cart-outline', tone: 'primary' },
  STORE_ORDER_STATUS_CHANGED: { icon: 'cart-outline', tone: 'info' },
  SYNDICATE_ANNOUNCEMENT_PUBLISHED: { icon: 'megaphone-outline', tone: 'primary' },
  SYNDICATE_SUBMISSION_CREATED: { icon: 'document-text-outline', tone: 'info' },
  SYNDICATE_SUBMISSION_RESPONDED: { icon: 'document-text-outline', tone: 'success' },
  CONTENT_PUBLISHED: { icon: 'library-outline', tone: 'info' },
  PUBLICATION_SUBMITTED: { icon: 'paw-outline', tone: 'info' },
  PUBLICATION_APPROVED: { icon: 'paw-outline', tone: 'success' },
  PUBLICATION_REJECTED: { icon: 'paw-outline', tone: 'danger' },
  PUBLICATION_ADOPTION_REQUESTED: { icon: 'heart-outline', tone: 'primary' },
  PUBLICATION_MATING_REQUESTED: { icon: 'paw-outline', tone: 'primary' },
  PUBLICATION_SIGHTING_REPORTED: { icon: 'eye-outline', tone: 'warning' },
  TRANSFER_REQUEST_RECEIVED: { icon: 'swap-horizontal-outline', tone: 'primary' },
  TRANSFER_REQUEST_ACCEPTED: { icon: 'swap-horizontal-outline', tone: 'success' },
  TRANSFER_REQUEST_REJECTED: { icon: 'swap-horizontal-outline', tone: 'neutral' },
  CLINIC_APPOINTMENT_REQUESTED: { icon: 'calendar-outline', tone: 'primary' },
  CLINIC_APPOINTMENT_CONFIRMED: { icon: 'calendar-outline', tone: 'success' },
  CLINIC_APPOINTMENT_REJECTED: { icon: 'calendar-outline', tone: 'danger' },
  CLINIC_APPOINTMENT_RESCHEDULE_PROPOSED: { icon: 'calendar-outline', tone: 'warning' },
  CLINIC_APPOINTMENT_CANCELLED: { icon: 'calendar-outline', tone: 'neutral' },
  CLINIC_APPOINTMENT_COMPLETED: { icon: 'calendar-outline', tone: 'success' },
  ADMIN_ANNOUNCEMENT: { icon: 'megaphone-outline', tone: 'warning' },
  ORGANIZATION_BROADCAST: { icon: 'megaphone-outline', tone: 'primary' },
};

const FALLBACK_META = { icon: 'notifications-outline' as IconName, tone: 'neutral' as const };

export function notificationMeta(type: string) {
  return NOTIFICATION_TYPE_META[type as NotificationType] ?? FALLBACK_META;
}

/**
 * Types whose title/body are written by a person (admin announcement,
 * organization broadcast) — always shown verbatim, never re-localized.
 */
export const AUTHOR_TEXT_TYPES: ReadonlySet<string> = new Set([
  'ADMIN_ANNOUNCEMENT',
  'ORGANIZATION_BROADCAST',
]);

/**
 * Title/body to display. The backend stores the default-language (Arabic)
 * text, which is shown as-is under Arabic — it stays authoritative even if the
 * server copy changes before the app ships an update. Under any other
 * language, system-generated types re-render from `notifications:types.<TYPE>`
 * (falling back to the stored text); author-written types never change.
 */
export function localizedNotificationText(
  n: Pick<AppNotification, 'type' | 'title' | 'body'>,
  t: TFunction<'notifications'>,
  language: string,
): { title: string; body: string } {
  if (
    language.startsWith(DEFAULT_LANGUAGE) ||
    AUTHOR_TEXT_TYPES.has(n.type) ||
    !isNotificationType(n.type)
  ) {
    return { title: n.title, body: n.body };
  }
  return {
    title: t(`types.${n.type}.title`, { defaultValue: n.title }),
    body: t(`types.${n.type}.body`, { defaultValue: n.body }),
  };
}

/** `data` values the backend attaches are strings; read one safely. */
function pick(data: Record<string, unknown>, key: string): string | undefined {
  const v = data[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

const PUBLICATION_KIND: Record<string, 'adoption' | 'mating' | 'lost'> = {
  ADOPTION: 'adoption',
  MATING: 'mating',
  LOST: 'lost',
};

/**
 * Resolve a notification to an in-app destination, or `null` when there is no
 * screen for it (the caller then just opens / stays on the inbox). Only
 * destinations that exist in this build are returned — the destination
 * screen re-authorises its own data fetch (§27), so a stale / foreign id just
 * lands on that screen's error state.
 *
 * Works for both the REST DTO (`entityType` / `entityId` columns) and an FCM
 * push `data` payload (only `{ type, <entity>Id…, notificationId }`) — routing
 * is driven by `type` + the ids in `data`, with `entityId` as a fallback.
 */
export function notificationHref(
  n: Pick<AppNotification, 'type' | 'entityType' | 'entityId' | 'data'>,
): string | null {
  return hrefByType(n) ?? hrefByEntity(n);
}

/**
 * Fallback by entity family — covers a type this build does not know yet (a
 * newer server) as long as its entity kind has a screen.
 */
function hrefByEntity(n: Pick<AppNotification, 'entityType' | 'entityId' | 'data'>): string | null {
  const d = n.data ?? {};
  const eid = n.entityId ?? undefined;
  switch (n.entityType) {
    case 'CONSULTATION': {
      const id = eid ?? pick(d, 'consultationId');
      return id ? Routes.supportThread('consultations', id) : Routes.support('consultations');
    }
    case 'INQUIRY': {
      const id = eid ?? pick(d, 'inquiryId');
      return id ? Routes.supportThread('inquiries', id) : Routes.support('inquiries');
    }
    case 'SUPPORT': {
      const id = eid ?? pick(d, 'supportId');
      return id ? Routes.supportThread('support-messages', id) : Routes.support('support-messages');
    }
    case 'ORGANIZATION': {
      const id = eid ?? pick(d, 'organizationId');
      return id ? Routes.organizationDetail(id) : Routes.organizations;
    }
    case 'VETERINARIAN':
    case 'VETERINARIAN_APPLICATION':
      return Routes.veterinarian;
    case 'CONVERSATION': {
      const id = eid ?? pick(d, 'conversationId');
      return id ? Routes.chatThread(id) : Routes.chat;
    }
    case 'VET_COURSE':
      return eid ? Routes.vetCourse(eid) : Routes.vetCourses;
    default:
      return null;
  }
}

function hrefByType(
  n: Pick<AppNotification, 'type' | 'entityType' | 'entityId' | 'data'>,
): string | null {
  const d = n.data ?? {};
  const id = (key: string): string | undefined => pick(d, key) ?? n.entityId ?? undefined;
  const orgId = pick(d, 'organizationId');
  const isFarm = pick(d, 'organizationType') === 'FARM';

  switch (n.type as NotificationType) {
    // --- account / veterinarian ---
    case 'ACCOUNT_STATUS_CHANGED':
      return Routes.account;
    case 'VETERINARIAN_APPLICATION_SUBMITTED':
      return Routes.adminVetApplications;
    case 'VETERINARIAN_APPROVED':
    case 'VETERINARIAN_REJECTED':
      return Routes.veterinarian;

    // --- organizations / subscriptions (review side → Management) ---
    case 'ORGANIZATION_SUBMITTED':
    case 'SUBSCRIPTION_RENEWAL_REQUESTED':
      if (!orgId) return Routes.adminOrganizations;
      return isFarm ? Routes.adminFarm(orgId) : Routes.adminOrganization(orgId);
    case 'SUBSCRIPTION_EXPIRING':
    case 'SUBSCRIPTION_EXPIRED':
      if (!orgId) return Routes.organizations;
      return isFarm
        ? Routes.farmSubscriptionRenewal(orgId)
        : Routes.organizationSubscriptionRenewal(orgId);
    case 'ORGANIZATION_APPROVED':
    case 'ORGANIZATION_REJECTED':
    case 'ORGANIZATION_SUSPENDED':
    case 'ORGANIZATION_ACTIVATED':
    case 'ORGANIZATION_DEACTIVATED':
    case 'ORGANIZATION_MEMBER_ADDED':
    case 'ORGANIZATION_MEMBER_REMOVED':
    case 'ORGANIZATION_ROLE_CHANGED':
    case 'ORGANIZATION_SUPERVISOR_ASSIGNED':
    case 'SUBSCRIPTION_UPDATED':
    case 'SUBSCRIPTION_RENEWAL_APPROVED':
    case 'SUBSCRIPTION_RENEWAL_REJECTED':
    case 'FARM_MEMBER_JOINED':
    case 'FARM_APPOINTMENT_CREATED': {
      const oid = orgId ?? (n.entityType === 'ORGANIZATION' ? n.entityId : null);
      return oid ? Routes.organizationDetail(oid) : Routes.organizations;
    }
    case 'ORGANIZATION_BROADCAST':
      return orgId ? Routes.organizationDiscoverDetail(orgId) : null;
    case 'SYSTEM_SUPERVISOR_ASSIGNED':
      return Routes.managementHome;

    // --- traders ---
    case 'TRADER_APPLICATION_SUBMITTED':
      return Routes.adminTraderApplications;
    case 'TRADER_APPROVED':
    case 'TRADER_REJECTED':
    case 'TRADER_SUSPENDED':
    case 'TRADER_REACTIVATED':
      return Routes.marketHub;

    // --- chat / threads ---
    case 'CHAT_MESSAGE_RECEIVED': {
      const cid = id('conversationId');
      return cid ? Routes.chatThread(cid) : Routes.chat;
    }
    case 'CONSULTATION_CREATED':
    case 'CONSULTATION_MESSAGE_RECEIVED':
    case 'CONSULTATION_CLOSED': {
      const tid = id('consultationId');
      return tid ? Routes.supportThread('consultations', tid) : Routes.support('consultations');
    }
    case 'INQUIRY_CREATED':
    case 'INQUIRY_MESSAGE_RECEIVED':
    case 'INQUIRY_CLOSED': {
      const tid = id('inquiryId');
      return tid ? Routes.supportThread('inquiries', tid) : Routes.support('inquiries');
    }
    case 'SUPPORT_CREATED':
    case 'SUPPORT_MESSAGE_RECEIVED':
    case 'SUPPORT_CLOSED': {
      const tid = id('supportId');
      return tid
        ? Routes.supportThread('support-messages', tid)
        : Routes.support('support-messages');
    }

    // --- veterinary services ---
    case 'VET_SERVICE_LISTING_SUBMITTED':
      return Routes.adminVetServiceListings;
    case 'VET_SERVICE_REQUEST_SUBMITTED':
      return Routes.adminVetServiceRequests;
    case 'VET_SERVICE_LISTING_APPROVED':
    case 'VET_SERVICE_LISTING_REJECTED': {
      const lid = id('entityId');
      return lid ? Routes.vetServiceListing(lid) : Routes.vetServiceMy;
    }
    case 'VET_SERVICE_REQUEST_APPROVED':
    case 'VET_SERVICE_REQUEST_REJECTED': {
      const rid = id('entityId');
      return rid ? Routes.vetServiceRequest(rid) : Routes.vetServiceMy;
    }
    case 'VET_SERVICE_OFFER_ACCEPTED':
    case 'VET_SERVICE_LISTING_REQUEST_ACCEPTED': {
      const cid = pick(d, 'conversationId');
      if (cid) return Routes.vetServiceDeal(cid);
      const eid = id('entityId');
      const kind = n.type === 'VET_SERVICE_OFFER_ACCEPTED' ? 'offer' : 'listing-request';
      return eid ? Routes.vetServiceEngagement(kind, eid) : Routes.vetServiceMy;
    }
    case 'VET_SERVICE_OFFER_RECEIVED':
    case 'VET_SERVICE_OFFER_REJECTED': {
      const eid = id('entityId');
      return eid ? Routes.vetServiceEngagement('offer', eid) : Routes.vetServiceMy;
    }
    case 'VET_SERVICE_LISTING_REQUEST_RECEIVED':
    case 'VET_SERVICE_LISTING_REQUEST_REJECTED': {
      const eid = id('entityId');
      return eid ? Routes.vetServiceEngagement('listing-request', eid) : Routes.vetServiceMy;
    }
    case 'VET_SERVICE_DEAL_COMPLETED':
      return Routes.vetServiceMy;

    // --- courses & seminars ---
    case 'VET_COURSE_SUBMITTED':
      return Routes.adminVetCourses;
    case 'VET_COURSE_APPROVED':
    case 'VET_COURSE_REJECTED':
    case 'VET_COURSE_REGISTRATION_CONFIRMED':
    case 'VET_COURSE_REGISTRATION_RECEIVED':
    case 'VET_COURSE_CAPACITY_REACHED':
    case 'VET_COURSE_CANCELLED': {
      const cid = id('entityId');
      return cid ? Routes.vetCourse(cid) : Routes.vetCourseMy;
    }

    // --- jobs ---
    case 'VET_JOB_OFFER_SUBMITTED':
      return Routes.adminVetJobOffers;
    case 'VET_JOB_SEEKER_PROFILE_SUBMITTED':
      return Routes.adminVetJobSeekers;
    case 'VET_JOB_OFFER_APPROVED':
    case 'VET_JOB_OFFER_REJECTED': {
      const oid = id('offerId');
      return oid ? Routes.vetJobOffer(oid) : Routes.vetJobMy;
    }
    case 'VET_JOB_APPLICATION_RECEIVED': {
      const oid = pick(d, 'jobOfferId');
      return oid ? Routes.vetJobOfferApplicants(oid) : Routes.vetJobMy;
    }
    case 'VET_JOB_APPLICATION_ACCEPTED': {
      const cid = pick(d, 'conversationId');
      return cid ? Routes.chatThread(cid) : Routes.vetJobMy;
    }
    case 'VET_JOB_SEEKER_PROFILE_APPROVED':
    case 'VET_JOB_SEEKER_PROFILE_REJECTED':
    case 'VET_JOB_APPLICATION_REJECTED':
      return Routes.vetJobMy;

    // --- platform stores ---
    case 'STORE_ORDER_PLACED': {
      const oid = id('orderId');
      const pet = pick(d, 'store') === 'PET_OWNER_STORE';
      if (!oid) return pet ? Routes.adminPetStoreOrders : Routes.adminVetStoreOrders;
      return pet ? Routes.adminPetStoreOrder(oid) : Routes.adminVetStoreOrder(oid);
    }
    case 'STORE_ORDER_STATUS_CHANGED': {
      const oid = id('orderId');
      const pet = pick(d, 'store') === 'PET_OWNER_STORE';
      if (!oid) return pet ? Routes.petOwnerStoreOrders : Routes.veterinarianStoreOrders;
      return pet ? Routes.petOwnerStoreOrder(oid) : Routes.veterinarianStoreOrder(oid);
    }

    // --- syndicates ---
    case 'SYNDICATE_ANNOUNCEMENT_PUBLISHED': {
      const aid = id('announcementId');
      return aid ? Routes.syndicateAnnouncementDetails(aid) : Routes.syndicates;
    }
    case 'SYNDICATE_SUBMISSION_CREATED':
      return orgId ? Routes.syndicateSubmissions(orgId) : Routes.syndicates;
    case 'SYNDICATE_SUBMISSION_RESPONDED':
      return Routes.syndicateMy;

    // --- animal publications / transfers ---
    case 'PUBLICATION_SUBMITTED':
      return Routes.adminAnimalPublications;
    case 'PUBLICATION_APPROVED':
    case 'PUBLICATION_REJECTED':
    case 'PUBLICATION_ADOPTION_REQUESTED':
    case 'PUBLICATION_MATING_REQUESTED':
    case 'PUBLICATION_SIGHTING_REPORTED': {
      const pid = id('publicationId');
      const kind =
        PUBLICATION_KIND[pick(d, 'kind') ?? ''] ??
        (n.type === 'PUBLICATION_MATING_REQUESTED'
          ? 'mating'
          : n.type === 'PUBLICATION_SIGHTING_REPORTED'
            ? 'lost'
            : n.type === 'PUBLICATION_ADOPTION_REQUESTED'
              ? 'adoption'
              : null);
      if (!pid || !kind) return Routes.pets;
      return Routes.publicationDetail(kind, pid);
    }
    case 'TRANSFER_REQUEST_RECEIVED':
    case 'TRANSFER_REQUEST_ACCEPTED':
    case 'TRANSFER_REQUEST_REJECTED':
      return Routes.petTransferRequests;

    // --- clinic appointments (either side — `audience` disambiguates) ---
    case 'CLINIC_APPOINTMENT_REQUESTED':
    case 'CLINIC_APPOINTMENT_CONFIRMED':
    case 'CLINIC_APPOINTMENT_REJECTED':
    case 'CLINIC_APPOINTMENT_RESCHEDULE_PROPOSED':
    case 'CLINIC_APPOINTMENT_CANCELLED':
    case 'CLINIC_APPOINTMENT_COMPLETED': {
      const clinicSide =
        pick(d, 'audience') === 'CLINIC' || n.type === 'CLINIC_APPOINTMENT_REQUESTED';
      if (clinicSide) return orgId ? Routes.organizationDetail(orgId) : Routes.organizations;
      const aid = id('appointmentId');
      return aid ? Routes.petOwnerAppointment(aid) : Routes.petOwnerAppointments;
    }

    case 'CONTENT_PUBLISHED':
    case 'ADMIN_ANNOUNCEMENT':
    default:
      return null;
  }
}
