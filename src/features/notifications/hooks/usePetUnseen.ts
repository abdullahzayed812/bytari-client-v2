import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { notificationKeys, notificationsApi } from '../api';
import type { PetCareSection, PetUnseenCounts } from '../types';

const NONE: PetUnseenCounts = { vaccinations: 0, reminders: 0 };

/**
 * Pet Details "new information" badges — the caller's OWN unread clinic
 * pet-care notifications for the pet, per section (not record totals).
 * Refreshed by the notification realtime events + read mutations.
 */
export function usePetUnseenCounts(animalId: string | undefined, enabled = true): PetUnseenCounts {
  const q = useQuery({
    queryKey: notificationKeys.petUnseen(animalId ?? ''),
    queryFn: () => notificationsApi.petUnseen(animalId as string),
    enabled: enabled && !!animalId,
  });
  return q.data ?? NONE;
}

/**
 * Opening a Pet Details section marks only THAT section's notifications read
 * (once per mount), then refreshes the badges, the inbox and the unread count.
 */
export function useMarkPetSectionSeen(
  animalId: string | undefined,
  section: PetCareSection,
  enabled = true,
): void {
  const qc = useQueryClient();
  const sent = useRef(false);
  const { mutate } = useMutation({
    mutationKey: ['notifications', 'pet-section-seen', section],
    mutationFn: (id: string) => notificationsApi.markPetSectionSeen(id, section),
    onSuccess: (res, id) => {
      void qc.invalidateQueries({ queryKey: notificationKeys.petUnseen(id) });
      if (res.updated > 0) {
        void qc.invalidateQueries({ queryKey: notificationKeys.lists() });
        void qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      }
    },
  });
  useEffect(() => {
    if (!enabled || !animalId || sent.current) return;
    sent.current = true;
    mutate(animalId);
  }, [animalId, enabled, mutate]);
}
