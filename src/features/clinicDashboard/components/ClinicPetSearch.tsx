import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { IconButton } from '@/components/actions';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { Row } from '@/components/layout';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { AnimalCard } from '@/features/animals/components/AnimalCard';
import { AnimalCodeScannerModal } from '@/features/animals/components/AnimalCodeScannerModal';
import {
  useClinicPetLookup,
  useClinicPetLookupQuery,
  useOrganizationAnimalSearch,
} from '@/features/animals/hooks';
import { petCodeFromInput } from '@/features/pets/petCode';
import { useDebouncedValue } from '@/hooks';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';

/**
 * Clinic Dashboard pet search + open-by-ID. Typing searches ONLY this clinic's
 * own pets (those it has records for — server-side, debounced). A short pet ID
 * / scanned QR opens ANY registered pet via the lookup route: nothing is
 * linked, and the clinic sees only what it records itself. A typed ID that is
 * not one of this clinic's pets resolves straight to the pet card (tap → pet
 * file); an unknown / inaccessible code is one neutral "not found" state.
 */
export function ClinicPetSearch({
  organizationId,
  canOpen,
}: {
  organizationId: string;
  /** Operational clinic (active, not expired) — opening by ID is allowed. */
  canOpen: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation('clinicDashboard');
  const [term, setTerm] = useState('');
  const [scanning, setScanning] = useState(false);
  const trimmed = term.trim();
  const active = trimmed.length > 0;
  // Debounced here (not in the hook) so the query only ever runs for a settled,
  // non-empty term — never an unfiltered "newest patients" page as "results".
  const settled = useDebouncedValue(trimmed);
  const pending = settled !== trimmed;
  const search = useOrganizationAnimalSearch(organizationId, settled, {
    enabled: active && settled.length > 0,
    debounce: false,
  });
  const lookup = useClinicPetLookup(organizationId);
  const items = pending ? [] : (search.data?.items ?? []);
  const code = petCodeFromInput(trimmed);
  const busy = pending || (search.isFetching && !search.isError);
  // A settled ID the clinic's own pets don't match → read it by ID right away.
  // Read-only: nothing is linked, so the pet never becomes "a clinic pet" here.
  const byId = useClinicPetLookupQuery(organizationId, code, {
    enabled: canOpen && !busy && search.isSuccess && items.length === 0,
  });
  const byIdUnavailable =
    byId.error instanceof ApiError && (byId.error.status === 404 || byId.error.status === 403);

  const open = (animalId: string) =>
    router.push(Routes.organizationAnimalDetail(organizationId, animalId) as never);

  const clear = () => {
    setTerm('');
    lookup.reset();
  };

  // A scanned QR opens the pet file directly; a failed scan falls back to the
  // typed-ID state (card / not found) for the scanned value.
  const openScanned = (value: string) =>
    lookup.mutate(
      { code: value },
      {
        onSuccess: (pet) => {
          clear();
          open(pet.animalId);
        },
        onError: () => setTerm(value),
      },
    );

  return (
    <View style={{ rowGap: theme.spacing.md }}>
      <Row gap="sm" align="center">
        <View style={{ flex: 1 }}>
          <SearchInput
            value={term}
            onChangeText={setTerm}
            onClear={clear}
            placeholder={t('search.placeholder')}
            accessibilityLabel={t('search.placeholder')}
          />
        </View>
        {canOpen ? (
          <IconButton
            icon="qr-code-outline"
            variant="filled"
            accessibilityLabel={t('search.scan')}
            onPress={() => setScanning(true)}
          />
        ) : null}
      </Row>

      {!active ? (
        lookup.isPending ? (
          <Loading label={t('search.searching')} />
        ) : (
          <Caption color="textMuted">{t('search.hint')}</Caption>
        )
      ) : (
        <View style={{ rowGap: theme.spacing.sm }}>
          <Row justify="space-between" align="center">
            <Text variant="bodyStrong">
              {search.isSuccess && !busy
                ? t('search.resultsCount', { count: items.length + (byId.data ? 1 : 0) })
                : t('search.results')}
            </Text>
            <Text variant="label" color="primary" onPress={clear}>
              {t('search.clear')}
            </Text>
          </Row>

          {search.isError ? (
            <ErrorState error={search.error} onRetry={() => void search.refetch()} />
          ) : busy && items.length === 0 ? (
            <Loading label={t('search.searching')} />
          ) : items.length > 0 ? (
            items.map((p) => (
              <AnimalCard key={p.animalId} pet={p} onPress={() => open(p.animalId)} />
            ))
          ) : code && canOpen ? (
            byId.data ? (
              <AnimalCard
                pet={{
                  animalId: byId.data.animalId,
                  publicCode: byId.data.publicCode,
                  animal: {
                    name: byId.data.name,
                    species: byId.data.species,
                    breed: byId.data.breed,
                    photoUrl: byId.data.photoUrl,
                  },
                }}
                onPress={() => open(byId.data.animalId)}
              />
            ) : byIdUnavailable ? (
              <EmptyState icon="help-circle-outline" title={t('search.notFound')} />
            ) : byId.isError ? (
              <ErrorState error={byId.error} onRetry={() => void byId.refetch()} />
            ) : (
              <Loading label={t('search.searching')} />
            )
          ) : (
            <EmptyState
              icon="search-outline"
              title={t('search.noResults')}
              message={t('search.noResultsHint')}
            />
          )}
        </View>
      )}

      <AnimalCodeScannerModal
        visible={scanning}
        onClose={() => setScanning(false)}
        onScanned={(scanned) => {
          setScanning(false);
          openScanned(petCodeFromInput(scanned) ?? scanned.trim());
        }}
      />
    </View>
  );
}
