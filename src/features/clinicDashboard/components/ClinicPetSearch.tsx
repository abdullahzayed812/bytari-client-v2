import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, IconButton } from '@/components/actions';
import { Alert, EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { Row } from '@/components/layout';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { AnimalCard } from '@/features/animals/components/AnimalCard';
import { AnimalCodeScannerModal } from '@/features/animals/components/AnimalCodeScannerModal';
import { useClinicPetLookup, useOrganizationAnimalSearch } from '@/features/animals/hooks';
import { petCodeFromInput } from '@/features/pets/petCode';
import { useDebouncedValue } from '@/hooks';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';

/**
 * Clinic Dashboard pet search + open-by-ID. Typing searches ONLY this clinic's
 * own pets (those it has records for — server-side, debounced). A short pet ID
 * / scanned QR opens ANY registered pet via the lookup route: nothing is
 * linked, and the clinic sees only what it records itself. An unknown code is
 * one neutral "not found" state.
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
  const lookupNotFound = lookup.error instanceof ApiError && lookup.error.status === 404;

  const open = (animalId: string) =>
    router.push(Routes.organizationAnimalDetail(organizationId, animalId) as never);

  const clear = () => {
    setTerm('');
    lookup.reset();
  };

  const openByCode = (value: string) =>
    lookup.mutate(
      { code: value },
      {
        onSuccess: (pet) => {
          clear();
          open(pet.animalId);
        },
      },
    );

  return (
    <View style={{ rowGap: theme.spacing.md }}>
      <Row gap="sm" align="center">
        <View style={{ flex: 1 }}>
          <SearchInput
            value={term}
            onChangeText={(v) => {
              setTerm(v);
              lookup.reset();
            }}
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
        <Caption color="textMuted">{t('search.hint')}</Caption>
      ) : (
        <View style={{ rowGap: theme.spacing.sm }}>
          <Row justify="space-between" align="center">
            <Text variant="bodyStrong">
              {search.isSuccess && !busy
                ? t('search.resultsCount', { count: items.length })
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
            <>
              {lookupNotFound ? (
                <EmptyState
                  icon="help-circle-outline"
                  title={t('search.notFoundTitle')}
                  message={t('search.notFoundBody')}
                />
              ) : (
                <Caption color="textMuted">{t('search.openByIdHint')}</Caption>
              )}
              {lookup.isError && !lookupNotFound ? (
                <Alert tone="danger" message={t('search.openFailed')} />
              ) : null}
              <Button
                label={t('search.openById')}
                variant="outline"
                leftIcon="folder-open-outline"
                loading={lookup.isPending}
                onPress={() => openByCode(trimmed)}
              />
            </>
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
          const value = petCodeFromInput(scanned) ?? scanned.trim();
          setTerm(value);
          openByCode(value);
        }}
      />
    </View>
  );
}
