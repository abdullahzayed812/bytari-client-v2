import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Routes } from '@/constants/routes';
// Deep import (not the barrel) — keeps medical ↔ animals acyclic.
import { ClinicAnimalPicker } from '@/features/animals/components/ClinicAnimalPicker';

/**
 * Route `/clinic-dashboard/[organizationId]/full-exam` — legacy
 * `clinic-full-exam` opened from the dashboard (no animal yet): pick one of the
 * clinic's animals, then continue in the full-exam record form.
 */
export default function FullExamEntryScreen() {
  const { t } = useTranslation('medical');
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  return (
    <SafeAreaScreen>
      <AppHeader title={t('records.addTitleFullExam')} showBack />
      <ClinicAnimalPicker
        organizationId={orgId}
        placeholder={t('quickReview.searchAnimal')}
        emptyTitle={t('quickReview.noAnimals')}
        onPick={(g) => {
          // Not `replace`: the form lives in the organizations stack, so a
          // cross-stack replace swaps out the whole Clinic Dashboard stack and
          // every later back skips straight to My Organizations. Pop this
          // picker, then push the form on top of the dashboard.
          router.back();
          router.push({
            pathname: Routes.orgAnimalMedicalRecordCreate(orgId, g.animalId) as never,
            params: { type: 'FULL_EXAM' },
          });
        }}
      />
    </SafeAreaScreen>
  );
}
