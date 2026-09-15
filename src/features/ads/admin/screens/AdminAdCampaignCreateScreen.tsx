import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Chip } from '@/components/content';
import { Alert, useToast } from '@/components/feedback';
import { Input } from '@/components/forms';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Label } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import type { AdPlacement, AdType } from '../../types';
import { useAdminAdCampaignMutations } from '../hooks';

const AD_TYPES: AdType[] = ['BANNER', 'CAROUSEL'];

/** Route `/(app)/admin/ads/[placement]/create` — new campaign for one placement. */
export default function AdminAdCampaignCreateScreen() {
  const theme = useTheme();
  const { t } = useTranslation('ads');
  const toast = useToast();
  const { placement } = useLocalSearchParams<{ placement: AdPlacement }>();
  const { create } = useAdminAdCampaignMutations();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<AdType>('BANNER');
  const [sortOrder, setSortOrder] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);

  const onSubmit = (): void => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError(t('admin.create.errors.titleRequired'));
      return;
    }
    setTitleError(null);
    create.mutate(
      {
        placement: placement as AdPlacement,
        type,
        title: trimmed,
        sortOrder: sortOrder.trim() ? Number(sortOrder) : undefined,
      },
      {
        onSuccess: (campaign) => {
          toast.show({ tone: 'success', message: t('admin.create.success') });
          router.replace(Routes.adminAdCampaign(placement as AdPlacement, campaign.id));
        },
        onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
      },
    );
  };

  return (
    <ScrollScreen>
      <AppHeader title={t('admin.create.title')} showBack />

      <Section spacing="lg">
        <Input
          label={t('admin.create.fieldTitle')}
          placeholder={t('admin.create.titlePlaceholder')}
          value={title}
          onChangeText={setTitle}
          error={titleError ?? undefined}
        />
      </Section>

      <Section spacing="lg">
        <Label>{t('admin.create.fieldType')}</Label>
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
          {AD_TYPES.map((v) => (
            <Chip key={v} label={t(`admin.campaignType.${v}`)} selected={type === v} onPress={() => setType(v)} />
          ))}
        </View>
      </Section>

      <Section spacing="lg">
        <Input
          label={t('admin.create.fieldSortOrder')}
          placeholder={t('admin.create.sortOrderPlaceholder')}
          value={sortOrder}
          onChangeText={setSortOrder}
          keyboardType="number-pad"
        />
      </Section>

      {create.isError ? <Alert tone="danger" message={apiErrorMessage(create.error)} /> : null}

      <Section spacing="giant">
        <Button
          label={t('admin.create.submit')}
          fullWidth
          loading={create.isPending}
          disabled={create.isPending}
          onPress={onSubmit}
        />
      </Section>
    </ScrollScreen>
  );
}
