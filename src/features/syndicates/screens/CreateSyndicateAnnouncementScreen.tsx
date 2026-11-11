import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Chip } from '@/components/content';
import { Alert, EmptyState, Loading, useToast } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { ImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Label } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { isHttpUrl, normalizeLink } from '@/utils';

import {
  useCreateSyndicateAnnouncement,
  useMySyndicateAccess,
  useSyndicateAnnouncement,
  useSyndicateMediaProvider,
  useUpdateSyndicateAnnouncement,
} from '../hooks';
import {
  SYNDICATE_ANNOUNCEMENT_TYPES,
  type SyndicateAnnouncement,
  type SyndicateAnnouncementType,
} from '../types';

interface FormValues {
  type: SyndicateAnnouncementType;
  title: string;
  body: string;
  linkUrl: string;
}

/**
 * Route `/(app)/syndicates/[organizationId]/announcements/new` — "إضافة إعلان",
 * and `/(app)/syndicates/[organizationId]/announcements/[announcementId]/edit` —
 * "تعديل الإعلان". Offered to the ADMIN (any syndicate) or a holder of
 * `syndicate.announcement.manage` for THIS syndicate; the server re-checks
 * every write (and 404s an announcement of another syndicate).
 */
export default function CreateSyndicateAnnouncementScreen() {
  const { t } = useTranslation('syndicates');
  const { organizationId, announcementId } = useLocalSearchParams<{
    organizationId: string;
    announcementId?: string;
  }>();
  const existing = useSyndicateAnnouncement(announcementId);
  const access = useMySyndicateAccess(announcementId ? organizationId : undefined);

  if (!announcementId) return <AnnouncementForm organizationId={organizationId} />;

  const ready = existing.data && access.data;
  const allowed =
    ready &&
    existing.data!.organizationId === organizationId &&
    access.data!.canManageAnnouncements;

  return existing.isLoading || access.isLoading ? (
    <SafeAreaScreen>
      <AppHeader title={t('announcements.editAnnouncement')} showBack />
      <Loading fill />
    </SafeAreaScreen>
  ) : allowed ? (
    <AnnouncementForm organizationId={organizationId} existing={existing.data!} />
  ) : (
    <SafeAreaScreen>
      <AppHeader title={t('announcements.editAnnouncement')} showBack />
      <EmptyState icon="megaphone-outline" title={t('announcements.notFound')} />
    </SafeAreaScreen>
  );
}

function AnnouncementForm({
  organizationId,
  existing,
}: {
  organizationId: string;
  existing?: SyndicateAnnouncement;
}) {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const toast = useToast();
  const create = useCreateSyndicateAnnouncement(organizationId);
  const update = useUpdateSyndicateAnnouncement(organizationId);
  const mutation = existing ? update : create;
  const imageProvider = useSyndicateMediaProvider('ANNOUNCEMENT_IMAGE');
  // `undefined` = image untouched (edit keeps the current one); `null` = removed.
  const [imageStorageKey, setImageStorageKey] = useState<string | null | undefined>(
    existing ? undefined : null,
  );

  const schema = useMemo(
    () =>
      z.object({
        type: z.enum(SYNDICATE_ANNOUNCEMENT_TYPES),
        title: z.string().trim().min(3, t('announcements.form.errors.title')),
        body: z.string().trim().min(3, t('announcements.form.errors.body')),
        linkUrl: z
          .string()
          .trim()
          .max(1000)
          .refine((v) => v.length === 0 || isHttpUrl(v), t('announcements.form.errors.link')),
      }),
    [t],
  );
  const { control, handleSubmit, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? {
          type: existing.type,
          title: existing.title,
          body: existing.body,
          linkUrl: existing.linkUrl ?? '',
        }
      : {
          // Text fields start empty; `type` keeps the base "إعلان" category
          // because the type selector always needs one chip selected.
          type: 'ANNOUNCEMENT',
          title: '',
          body: '',
          linkUrl: '',
        },
    mode: 'onTouched',
  });

  const onSubmit = (values: FormValues): void => {
    const input = {
      ...values,
      linkUrl: normalizeLink(values.linkUrl),
      ...(imageStorageKey !== undefined ? { imageStorageKey } : {}),
    };
    const handlers = {
      onSuccess: () => {
        toast.show({
          message: t(existing ? 'announcements.form.saved' : 'announcements.form.created'),
          tone: 'success',
        });
        router.back();
      },
      onError: (e: unknown) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
    };
    if (existing) update.mutate({ id: existing.id, input }, handlers);
    else create.mutate(input, handlers);
  };

  const submitLabel = mutation.isPending
    ? t('announcements.form.submitting')
    : existing
      ? t('announcements.form.save')
      : t('announcements.form.submit');

  return (
    <SafeAreaScreen>
      <AppHeader
        title={existing ? t('announcements.editAnnouncement') : t('announcements.addAnnouncement')}
        showBack
      />
      <ScrollView
        contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ rowGap: theme.spacing.xs }}>
          <Label>{t('announcements.form.type')}</Label>
          <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
            {SYNDICATE_ANNOUNCEMENT_TYPES.map((v) => (
              <Chip
                key={v}
                label={t(`type.${v}`)}
                selected={watch('type') === v}
                onPress={() => setValue('type', v, { shouldValidate: true })}
              />
            ))}
          </View>
        </View>

        <FormField
          control={control}
          name="title"
          label={t('announcements.form.title')}
          placeholder={t('announcements.form.titlePlaceholder')}
        />
        <FormField
          control={control}
          name="body"
          label={t('announcements.form.body')}
          placeholder={t('announcements.form.bodyPlaceholder')}
          multiline
          numberOfLines={5}
        />
        <FormField
          control={control}
          name="linkUrl"
          label={t('announcements.form.link')}
          placeholder="https://"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          hint={t('announcements.form.linkHint')}
        />

        <View style={{ rowGap: theme.spacing.xs }}>
          <Label>{t('announcements.form.image')}</Label>
          <ImageUploader
            value={imageStorageKey === null ? null : (existing?.imageUrl ?? null)}
            provider={imageProvider}
            shape="square"
            size={140}
            onChange={(r) => setImageStorageKey(r?.storageKey ?? null)}
          />
          <Caption>{t('announcements.form.imageHint')}</Caption>
        </View>

        {mutation.isError ? (
          <Alert tone="danger" message={apiErrorMessage(mutation.error)} />
        ) : null}
      </ScrollView>

      <View style={{ padding: theme.screenPadding }}>
        <Button
          label={submitLabel}
          fullWidth
          loading={mutation.isPending}
          disabled={mutation.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </SafeAreaScreen>
  );
}
