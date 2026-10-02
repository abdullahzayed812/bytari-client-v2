import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Loading } from '@/components/feedback';
import { Checkbox } from '@/components/forms';
import { Modal } from '@/components/overlays';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { useOrganizationTerms } from '../hooks/useOrganizationTerms';
import type { OrganizationTerms, OrganizationTermsKey } from '../types';

export interface RegistrationTermsFieldProps {
  /** Only the APPLICABLE terms set is ever shown (clinic / office / poultry / sheep / cattle). */
  termsKey: OrganizationTermsKey;
  checked: boolean;
  onChange: (accepted: boolean) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * The registration Terms & Conditions acceptance: the exact supplied wording
 * (fetched from the backend — never paraphrased or re-typed in the app) in a
 * readable modal, and a checkbox the user must tick before submitting. The
 * checkbox stays disabled until the text has loaded, so nobody accepts terms
 * they could not open. The backend refuses the registration without it.
 */
export function RegistrationTermsField({
  termsKey,
  checked,
  onChange,
  error,
  disabled,
}: RegistrationTermsFieldProps) {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const terms = useOrganizationTerms(termsKey);
  const [open, setOpen] = useState(false);

  return (
    <View style={{ rowGap: theme.spacing.xs }}>
      <Checkbox
        label={t('terms.acceptLabel', { title: terms.data?.title ?? t('terms.fallbackTitle') })}
        description={terms.isError ? t('terms.loadError') : undefined}
        checked={checked}
        disabled={disabled || !terms.data}
        onChange={(next) => onChange(next)}
      />
      <TextButton
        label={t('terms.readCta')}
        icon="document-text-outline"
        onPress={() => setOpen(true)}
        disabled={!terms.data && !terms.isError}
      />
      {error ? <Caption color="danger">{error}</Caption> : null}

      <Modal
        visible={open}
        onClose={() => setOpen(false)}
        title={terms.data?.title ?? t('terms.fallbackTitle')}
      >
        {terms.isLoading ? (
          <Loading />
        ) : terms.data ? (
          <TermsBody terms={terms.data} />
        ) : (
          <Caption color="danger">{t('terms.loadError')}</Caption>
        )}
        <Button
          label={checked ? t('terms.close') : t('terms.acceptAndClose')}
          fullWidth
          disabled={!terms.data}
          onPress={() => {
            if (terms.data && !checked) onChange(true);
            setOpen(false);
          }}
        />
      </Modal>
    </View>
  );
}

/** Intro + numbered clauses, exactly as served. */
export function TermsBody({ terms }: { terms: OrganizationTerms }) {
  const theme = useTheme();
  return (
    <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ rowGap: theme.spacing.sm }}>
      <Text variant="bodyMedium">{terms.intro}</Text>
      {terms.clauses.map((clause, i) => (
        <View key={i} style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
          <Text variant="bodyMedium" weight="bold">{`${i + 1}.`}</Text>
          <Text variant="body" style={{ flex: 1 }}>
            {clause}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
