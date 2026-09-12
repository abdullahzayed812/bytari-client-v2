import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Alert, useToast } from '@/components/feedback';
import { FormField, Select, SegmentedControl } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { useCreateSyndicateAdmin, useMainSyndicates } from '@/features/syndicates';
import { IRAQ_GOVERNORATES } from '@/features/vetServices';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

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

/** Pre-filled so a test submission needs no typing — every field stays editable. */
const EMPTY: FormValues = {
  name: 'نقابة الأطباء البيطريين العراقية',
  description: 'النقابة الرسمية للأطباء البيطريين في العراق',
  governorate: 'بغداد',
  address: 'بغداد - الكرادة - ساحة الأندلس',
  phone: '+964780123456',
  email: 'info@ivds.iq',
  website: 'https://www.ivds.iq',
  headOfficerName: 'د. محمد علي الجبالي',
  headOfficerTitle: 'نقيب الأطباء البيطريين العراقيين',
  termStartYear: '2022',
  termEndYear: '2026',
};

type Tab = 'MAIN' | 'BRANCH';

/** `/admin/syndicates/new` — ADMIN only (`syndicate.admin.create`). */
export default function AdminCreateSyndicateScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const toast = useToast();
  const create = useCreateSyndicateAdmin();
  const mains = useMainSyndicates();
  const [tab, setTab] = useState<Tab>('MAIN');
  const [parentOrganizationId, setParentOrganizationId] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(2, t('admin.errors.name')),
        description: z.string().trim(),
        governorate: z.string().trim(),
        address: z.string().trim(),
        phone: z.string().trim(),
        email: z.string().trim().email().or(z.literal('')),
        website: z.string().trim(),
        headOfficerName: z.string().trim(),
        headOfficerTitle: z.string().trim(),
        termStartYear: z.string().trim(),
        termEndYear: z.string().trim(),
      }),
    [t],
  );
  const { control, handleSubmit, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  const onChangeTab = (next: Tab): void => {
    setTab(next);
    if (next === 'BRANCH') {
      setValue('name', 'فرع النقابة - البصرة');
      setValue('governorate', 'البصرة');
      setParentOrganizationId((prev) => prev ?? mains.syndicates[0]?.id ?? null);
    } else {
      setValue('name', EMPTY.name);
      setValue('governorate', EMPTY.governorate);
    }
  };

  const onSubmit = (values: FormValues): void => {
    if (tab === 'BRANCH' && !parentOrganizationId) {
      toast.show({ message: t('admin.errors.parent'), tone: 'danger' });
      return;
    }
    create.mutate(
      {
        parentOrganizationId: tab === 'BRANCH' ? parentOrganizationId : undefined,
        name: values.name,
        description: values.description || undefined,
        governorate: values.governorate || undefined,
        address: values.address || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        website: values.website || undefined,
        headOfficerName: values.headOfficerName || undefined,
        headOfficerTitle: values.headOfficerTitle || undefined,
        termStartYear: values.termStartYear ? Number(values.termStartYear) : undefined,
        termEndYear: values.termEndYear ? Number(values.termEndYear) : undefined,
      },
      {
        onSuccess: () => {
          toast.show({ message: t('admin.created'), tone: 'success' });
          router.back();
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <SafeAreaScreen>
      <AppHeader title={t('admin.createTitle')} showBack />
      <ScrollView contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.md }} keyboardShouldPersistTaps="handled">
        <SegmentedControl<Tab>
          value={tab}
          onChange={onChangeTab}
          options={[
            { value: 'MAIN', label: t('admin.createMainTab') },
            { value: 'BRANCH', label: t('admin.createBranchTab') },
          ]}
        />

        {tab === 'BRANCH' ? (
          <Select<string>
            label={t('admin.parentSyndicate')}
            placeholder={t('admin.parentSyndicatePlaceholder')}
            value={parentOrganizationId}
            options={mains.syndicates.map((s) => ({ value: s.id, label: s.name }))}
            onChange={setParentOrganizationId}
          />
        ) : null}

        <FormField control={control} name="name" label={t('admin.name')} placeholder={t('admin.namePlaceholder')} />
        <FormField
          control={control}
          name="description"
          label={t('admin.description')}
          placeholder={t('admin.descriptionPlaceholder')}
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
        <FormField control={control} name="phone" label={t('admin.phone')} keyboardType="phone-pad" />
        <FormField control={control} name="email" label={t('admin.email')} keyboardType="email-address" autoCapitalize="none" />
        <FormField control={control} name="website" label={t('admin.website')} autoCapitalize="none" />
        <FormField control={control} name="headOfficerName" label={t('admin.headOfficerName')} />
        <FormField control={control} name="headOfficerTitle" label={t('admin.headOfficerTitle')} />
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
          <FormField control={control} name="termStartYear" label={t('admin.termStartYear')} keyboardType="number-pad" />
          <FormField control={control} name="termEndYear" label={t('admin.termEndYear')} keyboardType="number-pad" />
        </View>

        {create.isError ? <Alert tone="danger" message={apiErrorMessage(create.error)} /> : null}
      </ScrollView>

      <View style={{ padding: theme.screenPadding }}>
        <Button
          label={create.isPending ? t('admin.submitting') : t('admin.submit')}
          fullWidth
          loading={create.isPending}
          disabled={create.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </SafeAreaScreen>
  );
}
