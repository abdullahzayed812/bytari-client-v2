import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card } from '@/components/content';
import { ErrorState, Loading, useToast } from '@/components/feedback';
import { Input } from '@/components/forms';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { isHttpUrl } from '@/utils';

import { useNotificationVideoLinks, useSaveNotificationVideoLink } from '../hooks';
import type { NotificationVideoLink } from '../types';

function VideoLinkRow({ link }: { link: NotificationVideoLink }) {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const toast = useToast();
  const save = useSaveNotificationVideoLink();
  const [value, setValue] = useState(link.url ?? '');
  const [error, setError] = useState<string | undefined>();

  // Re-sync after a refetch (e.g. another admin changed it).
  useEffect(() => setValue(link.url ?? ''), [link.url]);

  const trimmed = value.trim();
  const dirty = trimmed !== (link.url ?? '');

  const submit = (url: string | null): void => {
    if (url !== null && !isHttpUrl(url)) {
      setError(t('notificationVideos.errors.link'));
      return;
    }
    setError(undefined);
    save.mutate(
      { key: link.key, url },
      {
        onSuccess: () =>
          toast.show({
            message: t(url ? 'notificationVideos.saved' : 'notificationVideos.removed'),
            tone: 'success',
          }),
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <Card variant="outlined" padding="lg">
      <View style={{ rowGap: theme.spacing.md }}>
        <View style={{ rowGap: 2 }}>
          <Text variant="bodyMedium" weight="bold">
            {t(`notificationVideos.keys.${link.key}.title`)}
          </Text>
          <Caption>{t(`notificationVideos.keys.${link.key}.description`)}</Caption>
        </View>
        <Input
          value={value}
          onChangeText={(v) => {
            setValue(v);
            if (error) setError(undefined);
          }}
          placeholder="https://"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={1000}
          error={error}
          leftIcon="videocam-outline"
          accessibilityLabel={t(`notificationVideos.keys.${link.key}.title`)}
        />
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm, flexWrap: 'wrap' }}>
          <Button
            label={t('notificationVideos.save')}
            variant="primary"
            size="sm"
            disabled={!dirty || trimmed.length === 0}
            loading={save.isPending && save.variables?.url !== null}
            onPress={() => submit(trimmed)}
          />
          {link.url ? (
            <>
              <Button
                label={t('notificationVideos.preview')}
                variant="outline"
                size="sm"
                leftIcon="play-circle-outline"
                onPress={() => void Linking.openURL(link.url as string)}
              />
              <Button
                label={t('notificationVideos.remove')}
                variant="ghost"
                size="sm"
                leftIcon="trash-outline"
                loading={save.isPending && save.variables?.url === null}
                onPress={() => submit(null)}
              />
            </>
          ) : null}
        </View>
        {!link.url ? <Caption color="textMuted">{t('notificationVideos.notSet')}</Caption> : null}
      </View>
    </Card>
  );
}

/**
 * `/admin/notification-videos` — the video link shown on each acceptance
 * notification (pet owner registration, veterinarian approval, clinic /
 * office / poultry / sheep / cattle farm approval). Changes apply to already
 * delivered notifications too (the server resolves the link on read).
 */
export default function AdminNotificationVideosScreen() {
  const { t } = useTranslation('admin');
  const q = useNotificationVideoLinks();

  return (
    <ScrollScreen>
      <AppHeader title={t('dashboard.cards.notificationVideos.title')} showBack />
      <Section spacing="lg">
        <Caption>{t('notificationVideos.intro')}</Caption>
      </Section>
      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !q.data ? (
        <Section spacing="lg">
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </Section>
      ) : (
        q.data.map((link) => (
          <Section key={link.key} spacing="md">
            <VideoLinkRow link={link} />
          </Section>
        ))
      )}
    </ScrollScreen>
  );
}
