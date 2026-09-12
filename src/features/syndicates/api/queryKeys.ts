import type { MySubmissionListFilter, SubmissionListFilter, SyndicateBrowseFilter } from '../types';

/** One `all` prefix invalidates the whole Syndicates feature after any mutation. */
export const syndicateKeys = {
  all: ['syndicates'] as const,

  syndicates: () => [...syndicateKeys.all, 'syndicate'] as const,
  mainList: (f: SyndicateBrowseFilter) => [...syndicateKeys.syndicates(), 'main', f] as const,
  branchList: (organizationId: string, f: SyndicateBrowseFilter) =>
    [...syndicateKeys.syndicates(), 'branches', organizationId, f] as const,
  syndicate: (organizationId: string) => [...syndicateKeys.syndicates(), 'detail', organizationId] as const,
  myAccess: (organizationId: string) => [...syndicateKeys.syndicates(), 'my-access', organizationId] as const,

  announcements: () => [...syndicateKeys.all, 'announcements'] as const,
  announcementList: (organizationId: string) =>
    [...syndicateKeys.announcements(), 'for-syndicate', organizationId] as const,
  announcement: (id: string) => [...syndicateKeys.announcements(), 'detail', id] as const,

  submissions: () => [...syndicateKeys.all, 'submissions'] as const,
  submissionList: (organizationId: string, f: SubmissionListFilter) =>
    [...syndicateKeys.submissions(), 'for-syndicate', organizationId, f] as const,
  submission: (organizationId: string, id: string) =>
    [...syndicateKeys.submissions(), 'detail', organizationId, id] as const,
  mySubmissions: (f: MySubmissionListFilter) => [...syndicateKeys.submissions(), 'mine', f] as const,
  mySubmission: (id: string) => [...syndicateKeys.submissions(), 'mine', 'detail', id] as const,
};
