import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';

import { Button, TextButton } from '@/components/actions';
import { Alert, EmptyState, Loading, useToast } from '@/components/feedback';
import { FormField, Select } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { ImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Label } from '@/components/typography';
import { IRAQ_GOVERNORATES } from '@/features/vetServices';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { useSyndicate, useSyndicateMediaProvider, useUpdateSyndicateProfile } from '../hooks';
import type { PublicSyndicate, UpdateSyndicateProfileInput } from '../types';

interface FormValues {
  name: string;
  description: string;
  governorate: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  headOfficerName: string;
  headOfficerTitle: string;
  termStartYear: string;
  termEndYear: string;
}

const orNull = (v: string): string | null => (v.trim() ? v.trim() : null);
const yearOrNull = (v: string): number | null => (v.trim() ? Number(v.trim()) : null);

function toValues(s: PublicSyndicate): FormValues {
  return {
    name: s.name,
    description: s.description ?? '',
    governorate: s.governorate ?? '',
    address: s.address ?? '',
    phone: s.phone ?? '',
    email: s.email ?? '',
    website: s.website ?? '',
    headOfficerName: s.headOfficerName ?? '',
    headOfficerTitle: s.headOfficerTitle ?? '',
    termStartYear: s.termStartYear ? String(s.termStartYear) : '',
    termEndYear: s.termEndYear ? String(s.termEndYear) : '',
  };
}

/**
 * Route `/(app)/syndicates/[organizationId]/edit` — "تعديل النقابة" for a
 * syndicate admin (`syndicate.profile.manage`, enforced by
 * `PATCH /syndicates/:id/profile`). Logo upload / replace / remove through the
 * existing syndicate media presign (kind `LOGO`); the server deletes the
 * replaced object after commit.
 */
export default function SyndicateEditScreen() {
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const q = useSyndicate(organizationId);
  const { t } = useTranslation('syndicates');

  if (q.isLoading) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('edit.title')} showBack />
        <Loading fill />
      </SafeAreaScreen>
    );
  }
  if (q.isError || !q.data) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('edit.title')} showBack />
        <EmptyState icon="people-outline" title={t('home.notFound')} />
      </SafeAreaScreen>
    );
  }
  return <EditForm syndicate={q.data} />;
}

function EditForm({ syndicate }: { syndicate: PublicSyndicate }) {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const toast = useToast();
  const update = useUpdateSyndicateProfile(syndicate.id);
  const logoProvider = useSyndicateMediaProvider('LOGO');
  const [logoKey, setLogoKey] = useState(0);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(2, t('admin.errors.name')),
        description: z.string(),
        governorate: z.string(),
        address: z.string(),
        phone: z.string(),
        email: z.string().trim().email().or(z.literal('')),
        website: z.string().trim().url().or(z.literal('')),
        headOfficerName: z.string(),
        headOfficerTitle: z.string(),
        termStartYear: z.string().regex(/^(\d{4})?$/),
        termEndYear: z.string().regex(/^(\d{4})?$/),
      }),
    [t],
  );
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toValues(syndicate),
    mode: 'onTouched',
  });

  const saveLogo = (logoStorageKey: string | null, message: string): void => {
    update.mutate(
      { logoStorageKey },
      {
        onSuccess: () => {
          setLogoKey((k) => k + 1);
          toast.show({ message, tone: 'success' });
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  const onSubmit = (v: FormValues): void => {
    const input: UpdateSyndicateProfileInput = {
      name: v.name.trim(),
      description: orNull(v.description),
      governorate: orNull(v.governorate),
      address: orNull(v.address),
      phone: orNull(v.phone),
      email: orNull(v.email),
      website: orNull(v.website),
      headOfficerName: orNull(v.headOfficerName),
      headOfficerTitle: orNull(v.headOfficerTitle),
      termStartYear: yearOrNull(v.termStartYear),
      termEndYear: yearOrNull(v.termEndYear),
    };
    update.mutate(input, {
      onSuccess: () => {
        toast.show({ message: t('edit.saved'), tone: 'success' });
        router.back();
      },
      onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
    });
  };

  return (
    <SafeAreaScreen>
      <AppHeader title={t('edit.title')} showBack />
      <ScrollView
        contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', rowGap: theme.spacing.xs }}>
          <Label>{t('edit.logo')}</Label>
          <ImageUploader
            key={logoKey}
            value={syndicate.logoUrl}
            provider={logoProvider}
            size={112}
            replaceable
            disabled={update.isPending}
            onRemove={() => saveLogo(null, t('edit.logoRemoved'))}
            onChange={(r) => {
              if (r) saveLogo(r.storageKey, t('edit.logoUpdated'));
            }}
          />
          {syndicate.logoUrl ? (
            <TextButton
              label={t('edit.logoRemove')}
              icon="trash-outline"
              tone="danger"
              disabled={update.isPending}
              onPress={() => saveLogo(null, t('edit.logoRemoved'))}
            />
          ) : null}
        </View>

        <FormField control={control} name="name" label={t('admin.name')} />
        <FormField
          control={control}
          name="description"
          label={t('admin.description')}
          multiline
          numberOfLines={3}
        />
        <Controller
          control={control}
          name="governorate"
          render={({ field: { value, onChange } }) => (
            <Select<string>
              label={t('admin.governorate')}
              placeholder={t('admin.governoratePlaceholder')}
              value={value || null}
              options={IRAQ_GOVERNORATES.map((g) => ({ value: g, label: g }))}
              onChange={(v) => onChange(v ?? '')}
            />
          )}
        />
        <FormField control={control} name="address" label={t('admin.address')} />
        <FormField
          control={control}
          name="phone"
          label={t('admin.phone')}
          keyboardType="phone-pad"
        />
        <FormField
          control={control}
          name="email"
          label={t('admin.email')}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FormField
          control={control}
          name="website"
          label={t('admin.website')}
          autoCapitalize="none"
        />
        <FormField control={control} name="headOfficerName" label={t('admin.headOfficerName')} />
        <FormField control={control} name="headOfficerTitle" label={t('admin.headOfficerTitle')} />
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
          <FormField
            control={control}
            name="termStartYear"
            label={t('admin.termStartYear')}
            keyboardType="number-pad"
          />
          <FormField
            control={control}
            name="termEndYear"
            label={t('admin.termEndYear')}
            keyboardType="number-pad"
          />
        </View>
        {update.isError ? <Alert tone="danger" message={apiErrorMessage(update.error)} /> : null}
      </ScrollView>
      <View style={{ padding: theme.screenPadding }}>
        <Button
          label={update.isPending ? t('edit.saving') : t('edit.save')}
          fullWidth
          loading={update.isPending}
          disabled={update.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </SafeAreaScreen>
  );
}
