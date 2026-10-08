import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert } from '@/components/feedback';
import { Input } from '@/components/forms';
import { Routes } from '@/constants/routes';
import { OrgFormLayout } from '@/features/organizations';
import { petCodeFromInput } from '@/features/pets/petCode';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';

import { AnimalCodeScannerModal } from '../components/AnimalCodeScannerModal';
import { useClinicPetLookup } from '../hooks';

/**
 * Route `/organizations/[organizationId]/animals/open` — open a pet by the
 * owner's short public ID (typed / dictated) or by scanning its QR. This only
 * READS the pet (`GET …/clinic-pets/lookup`) — nothing is linked. The pet
 * joins this clinic's Recent / All Pets once the clinic records something.
 */
export default function OpenClinicPetScreen() {
  const theme = useTheme();
  const { t } = useTranslation('orgAnimals');
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';
  const lookup = useClinicPetLookup(orgId);
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [scanning, setScanning] = useState(false);

  const submit = (raw: string) => {
    const code = petCodeFromInput(raw);
    if (!code) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    lookup.mutate(
      { code },
      { onSuccess: (pet) => router.replace(Routes.organizationAnimalDetail(orgId, pet.animalId)) },
    );
  };

  const notFound = lookup.error instanceof ApiError && lookup.error.status === 404;

  return (
    <OrgFormLayout title={t('open.title')}>
      {notFound ? <Alert tone="danger" message={t('open.notFound')} /> : null}
      {lookup.isError && !notFound ? (
        <Alert tone="danger" message={apiErrorMessage(lookup.error)} />
      ) : null}

      <Input
        label={t('open.codeLabel')}
        placeholder={t('open.codePlaceholder')}
        value={value}
        onChangeText={(v) => {
          setValue(v);
          setInvalid(false);
          lookup.reset();
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={40}
        error={invalid ? t('open.invalid') : undefined}
        hint={t('open.hint')}
        onSubmitEditing={() => submit(value)}
      />

      <View style={{ marginTop: theme.spacing.sm, rowGap: theme.spacing.sm }}>
        <Button
          label={t('open.cta')}
          fullWidth
          loading={lookup.isPending}
          disabled={lookup.isPending || value.trim().length === 0}
          onPress={() => submit(value)}
        />
        <Button
          label={t('open.scan')}
          variant="outline"
          leftIcon="qr-code-outline"
          fullWidth
          disabled={lookup.isPending}
          onPress={() => setScanning(true)}
        />
      </View>

      <AnimalCodeScannerModal
        visible={scanning}
        onClose={() => setScanning(false)}
        onScanned={(scanned) => {
          setScanning(false);
          setValue(scanned);
          submit(scanned);
        }}
      />
    </OrgFormLayout>
  );
}
