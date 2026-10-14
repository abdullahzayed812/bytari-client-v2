import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Alert, useToast } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { LocalImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { useCreateChatRoomAdmin } from '@/features/globalChat';
// Deep import — the existing org logo upload (CHAT_ROOM's image uses the same endpoints).
import { uploadOrganizationLogo } from '@/features/organizations/lib/registrationUploads';
import { apiErrorMessage } from '@/lib/apiError';
import type { LocalFile } from '@/services/files/types';
import { useTheme } from '@/theme';

interface FormValues {
  name: string;
  description: string;
  rules: string;
}

/**
 * `/admin/chat-rooms/new` — ADMIN only (`chat_room.admin.create`). The optional
 * room image is staged locally and uploaded right after the room exists, via
 * the room's existing logo endpoints (replace / remove later in "تعديل الغرفة").
 */
export default function AdminCreateChatRoomScreen() {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const toast = useToast();
  const create = useCreateChatRoomAdmin();
  const [image, setImage] = useState<LocalFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(2, t('chatRoom.errors.name')),
        description: z.string().trim(),
        rules: z.string().trim(),
      }),
    [t],
  );
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', rules: '' },
    mode: 'onTouched',
  });

  const onSubmit = (values: FormValues): void => {
    create.mutate(
      {
        name: values.name,
        description: values.description || undefined,
        rules: values.rules || undefined,
      },
      {
        onSuccess: async (room) => {
          if (image) {
            setUploading(true);
            try {
              await uploadOrganizationLogo(room.id, image);
            } catch {
              toast.show({ message: t('chatRoom.imageUploadFailed'), tone: 'warning' });
            } finally {
              setUploading(false);
            }
          }
          toast.show({ message: t('chatRoom.created'), tone: 'success' });
          router.back();
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <SafeAreaScreen>
      <AppHeader title={t('chatRoom.createTitle')} showBack />
      <ScrollView
        contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', rowGap: theme.spacing.xs }}>
          <LocalImageUploader
            value={image}
            onChange={setImage}
            shape="square"
            size={96}
            label={t('chatRoom.image')}
            icon="chatbubbles-outline"
            edit={{ aspects: ['1:1'], defaultAspect: '1:1', defaultMaxDimension: 1280 }}
            disabled={create.isPending || uploading}
          />
          <Caption center>{t('chatRoom.imageHint')}</Caption>
        </View>
        <FormField
          control={control}
          name="name"
          label={t('chatRoom.name')}
          placeholder={t('chatRoom.namePlaceholder')}
        />
        <FormField
          control={control}
          name="description"
          label={t('chatRoom.description')}
          placeholder={t('chatRoom.descriptionPlaceholder')}
          multiline
          numberOfLines={3}
        />
        <FormField
          control={control}
          name="rules"
          label={t('chatRoom.rules')}
          placeholder={t('chatRoom.rulesPlaceholder')}
          multiline
          numberOfLines={4}
        />

        {create.isError ? <Alert tone="danger" message={apiErrorMessage(create.error)} /> : null}
      </ScrollView>

      <View style={{ padding: theme.screenPadding }}>
        <Button
          label={create.isPending || uploading ? t('chatRoom.submitting') : t('chatRoom.submit')}
          fullWidth
          loading={create.isPending || uploading}
          disabled={create.isPending || uploading}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </SafeAreaScreen>
  );
}
