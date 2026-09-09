import type { BadgeTone, IconName } from '@/components/content';
import type { SupervisorDomain } from '@/features/auth';

import type { MessageSource, ThreadKind, ThreadKindSlug, ThreadStatus } from './types';

/**
 * Per-kind wiring. The two kinds share every screen/hook/component; only these
 * values differ (route slug, icon, backend permission keys, supervisor domain).
 */
export interface ThreadKindMeta {
  slug: ThreadKindSlug;
  /** Plural route slug ⇄ the singular used by the realtime room / event names. */
  singular: 'consultation' | 'inquiry' | 'support';
  icon: IconName;
  /** Only APPROVED vets may create an inquiry (backend `createEligibility`). */
  createRequiresApprovedVet: boolean;
  adminReadPerm: string;
  respondPerm: string;
  closePerm: string;
  supervisorDomain: Extract<SupervisorDomain, 'CONSULTATION' | 'INQUIRY' | 'SUPPORT'>;
}

export const SUPPORT_KIND_META: Record<ThreadKind, ThreadKindMeta> = {
  CONSULTATION: {
    slug: 'consultations',
    singular: 'consultation',
    icon: 'chatbubbles-outline',
    createRequiresApprovedVet: false,
    adminReadPerm: 'consultation.admin.read',
    respondPerm: 'consultation.respond',
    closePerm: 'consultation.close',
    supervisorDomain: 'CONSULTATION',
  },
  INQUIRY: {
    slug: 'inquiries',
    singular: 'inquiry',
    icon: 'help-buoy-outline',
    createRequiresApprovedVet: true,
    adminReadPerm: 'inquiry.admin.read',
    respondPerm: 'inquiry.respond',
    closePerm: 'inquiry.close',
    supervisorDomain: 'INQUIRY',
  },
  SUPPORT: {
    slug: 'support-messages',
    singular: 'support',
    icon: 'headset-outline',
    createRequiresApprovedVet: false,
    adminReadPerm: 'support.admin.read',
    respondPerm: 'support.respond',
    closePerm: 'support.close',
    supervisorDomain: 'SUPPORT',
  },
};

export const THREAD_KIND_ORDER: readonly ThreadKind[] = ['CONSULTATION', 'INQUIRY', 'SUPPORT'];

const SLUG_TO_KIND: Record<ThreadKindSlug, ThreadKind> = {
  consultations: 'CONSULTATION',
  inquiries: 'INQUIRY',
  'support-messages': 'SUPPORT',
};

export function kindFromSlug(slug: string | undefined): ThreadKind | undefined {
  if (!slug) return undefined;
  return SLUG_TO_KIND[slug as ThreadKindSlug];
}
export function kindSlug(kind: ThreadKind): ThreadKindSlug {
  return SUPPORT_KIND_META[kind].slug;
}

/** Realtime room string for one thread — `consultation:<id>` / `inquiry:<id>`. */
export function threadRoom(kind: ThreadKind, threadId: string): string {
  return `${SUPPORT_KIND_META[kind].singular}:${threadId}`;
}

export const THREAD_STATUS_TONE: Record<ThreadStatus, BadgeTone> = {
  OPEN: 'success',
  CLOSED: 'neutral',
};

/** Message source → bubble alignment + accent. `USER` is the current user's own side. */
export const MESSAGE_SOURCE_META: Record<
  MessageSource,
  { align: 'start' | 'end' | 'center'; tone: BadgeTone; icon: IconName }
> = {
  USER: { align: 'end', tone: 'primary', icon: 'person-outline' },
  SUPERVISOR: { align: 'start', tone: 'info', icon: 'shield-checkmark-outline' },
  ADMIN: { align: 'start', tone: 'info', icon: 'shield-checkmark-outline' },
  AI: { align: 'start', tone: 'warning', icon: 'sparkles-outline' },
  SYSTEM: { align: 'center', tone: 'neutral', icon: 'information-circle-outline' },
};
