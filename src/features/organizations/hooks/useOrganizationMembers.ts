import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AppConfig } from '@/constants/config';

import { orgKeys, organizationsApi } from '../api';
import type { MembershipStatus, OrganizationMember, OrgRoleKey, Paginated } from '../types';

export interface UseOrganizationMembersParams {
  status?: MembershipStatus;
  roleKey?: OrgRoleKey;
  pageSize?: number;
  enabled?: boolean;
}

/**
 * Paginated member list for one organization. Requires `member.read` server-side
 * — a caller without it never reaches this screen, and a direct hit 403s.
 */
export function useOrganizationMembers(
  organizationId: string | undefined,
  params: UseOrganizationMembersParams = {},
) {
  const pageSize = params.pageSize ?? AppConfig.defaultPageSize;
  const filter = { status: params.status, roleKey: params.roleKey, pageSize };

  const query = useInfiniteQuery<
    Paginated<OrganizationMember>,
    unknown,
    InfiniteData<Paginated<OrganizationMember>>,
    ReturnType<typeof orgKeys.memberList>,
    number
  >({
    queryKey: orgKeys.memberList(organizationId ?? 'unknown', filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      organizationsApi.listMembers(organizationId as string, {
        page: pageParam,
        pageSize,
        status: params.status,
        roleKey: params.roleKey,
      }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: Boolean(organizationId) && (params.enabled ?? true),
    staleTime: 15_000,
  });

  const members = useMemo<OrganizationMember[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return { ...query, members, total };
}
