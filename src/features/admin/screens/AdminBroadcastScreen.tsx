import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Alert, useToast } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';

import { FilterChips } from '../components';
import { useSendBroadcast } from '../hooks';
import type { BroadcastTarget } from '../types';

interface FormValues {
  title: string;
  body: string;
}

type TargetKind = 'ALL' | 'PET_OWNER' | 'VETERINARIAN';

function toTarget(kind: TargetKind): BroadcastTarget {
  return kind === 'ALL' ? { kind: 'ALL' } : { kind: 'ROLE', roleKey: kind };
}

/** `/admin/broadcast` — the dashboard's "إرسال رسالة" card (`POST /admin/notifications`). */
export default function AdminBroadcastScreen() {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const send = useSendBroadcast();
  const [target, setTarget] = useState<TargetKind>('ALL');

  const schema = useMemo(
    () =>
      z.object({
        title: z.string().trim().min(1, t('broadcast.errors.title')).max(100),
        body: z.string().trim().min(1, t('broadcast.errors.body')).max(1000),
      }),
    [t],
  );
  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', body: '' },
    mode: 'onTouched',
  });

  const onSubmit = (values: FormValues): void => {
    send.mutate(
      { target: toTarget(target), title: values.title.trim(), body: values.body.trim() },
      {
        onSuccess: (result) => {
          toast.show({
            message: t('broadcast.sent', { count: result.recipientCount }),
            tone: 'success',
          });
          reset();
          router.back();
        },
        onError: (error) => toast.show({ message: apiErrorMessage(error), tone: 'danger' }),
      },
    );
  };

  return (
    <ScrollScreen>
      <AppHeader title={t('dashboard.cards.broadcasts.title')} showBack />

      <Section spacing="lg">
        <Caption>{t('broadcast.intro')}</Caption>
      </Section>

      <Section spacing="lg">
        <FilterChips<TargetKind>
          value={target}
          onChange={(v) => setTarget(v ?? 'ALL')}
          options={[
            { value: 'ALL', label: t('broadcast.target.all') },
            { value: 'PET_OWNER', label: t('broadcast.target.petOwners') },
            { value: 'VETERINARIAN', label: t('broadcast.target.veterinarians') },
          ]}
        />
      </Section>

      <Section spacing="lg">
        <FormField
          control={control}
          name="title"
          label={t('broadcast.form.titleLabel')}
          placeholder={t('broadcast.form.titlePlaceholder')}
          maxLength={100}
        />
      </Section>

      <Section spacing="lg">
        <FormField
          control={control}
          name="body"
          label={t('broadcast.form.bodyLabel')}
          placeholder={t('broadcast.form.bodyPlaceholder')}
          multiline
          numberOfLines={6}
          maxLength={1000}
        />
      </Section>

      {send.isError ? <Alert tone="danger" message={apiErrorMessage(send.error)} /> : null}

      <Section spacing="giant">
        <Button
          label={t('broadcast.form.submit')}
          fullWidth
          loading={send.isPending}
          disabled={send.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </Section>
    </ScrollScreen>
  );
}
