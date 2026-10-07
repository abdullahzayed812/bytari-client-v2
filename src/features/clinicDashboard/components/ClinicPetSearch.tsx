import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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
import {
  useGrantOrganizationAnimalAccess,
  useOrganizationAnimalSearch,
} from '@/features/animals/hooks';
import { useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

const UUID_IN_TEXT = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const UUID_ONLY = new RegExp(`^${UUID_IN_TEXT.source}$`, 'i');

/**
 * A scanned code is normally the pet's id (the Pet Details QR), possibly inside
 * a link — pull the UUID out; anything else is searched as plain text.
 */
export function animalIdFromCode(code: string): string {
  return code.match(UUID_IN_TEXT)?.[0].toLowerCase() ?? code.trim();
}

/**
 * Clinic Dashboard owned-pet search + QR / ID lookup. Searches ONLY this
 * clinic's own patients (server-side, debounced, paginated, permission-checked;
 * listing subjects are never returned). A scanned / typed id that is not one of
 * them shows one neutral "not found or not accessible" state — nothing about
 * the pet or its owner is revealed. Staff who may manage access can link the
 * pet (`POST animal-access`, which re-checks it is a registered, owned pet)
 * and go straight to its file.
 */
export function ClinicPetSearch({
  organizationId,
  canLink,
}: {
  organizationId: string;
  /** `animal.veterinary.access.manage` on an operational clinic. */
  canLink: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation('clinicDashboard');
  const [term, setTerm] = useState('');
  const [scanning, setScanning] = useState(false);
  /** Set by a scan: open the pet directly once the lookup confirms access. */
  const [scannedId, setScannedId] = useState<string | null>(null);
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
  const grant = useGrantOrganizationAnimalAccess(organizationId);
  const items = pending ? [] : (search.data?.items ?? []);
  const isId = UUID_ONLY.test(trimmed);
  const busy = pending || (search.isFetching && !search.isError);

  const open = (animalId: string) =>
    router.push(Routes.organizationAnimalDetail(organizationId, animalId) as never);

  const clear = () => {
    setTerm('');
    setScannedId(null);
    grant.reset();
  };

  // Scan → accessible patient → straight into its file.
  useEffect(() => {
    if (!scannedId || busy || !search.isSuccess) return;
    const hit = items.find((g) => g.animalId === scannedId);
    if (hit) {
      setScannedId(null);
      open(hit.animalId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannedId, busy, search.isSuccess, items]);

  const linkAndOpen = () =>
    grant.mutate(
      { animalId: trimmed },
      {
        onSuccess: () => {
          clear();
          open(trimmed);
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
              setScannedId(null);
              grant.reset();
            }}
            onClear={clear}
            placeholder={t('search.placeholder')}
            accessibilityLabel={t('search.placeholder')}
          />
        </View>
        <IconButton
          icon="qr-code-outline"
          variant="filled"
          accessibilityLabel={t('search.scan')}
          onPress={() => setScanning(true)}
        />
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
            items.map((g) => <AnimalCard key={g.id} grant={g} onPress={() => open(g.animalId)} />)
          ) : isId ? (
            <>
              <EmptyState
                icon="lock-closed-outline"
                title={t('search.inaccessibleTitle')}
                message={t(canLink ? 'search.inaccessibleLinkBody' : 'search.inaccessibleBody')}
              />
              {grant.isError ? <Alert tone="danger" message={t('search.linkFailed')} /> : null}
              {canLink ? (
                <Button
                  label={t('search.linkAndOpen')}
                  variant="outline"
                  leftIcon="link-outline"
                  loading={grant.isPending}
                  onPress={linkAndOpen}
                />
              ) : null}
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
        onScanned={(code) => {
          setScanning(false);
          const id = animalIdFromCode(code);
          setTerm(id);
          grant.reset();
          setScannedId(UUID_ONLY.test(id) ? id : null);
        }}
      />
    </View>
  );
}
