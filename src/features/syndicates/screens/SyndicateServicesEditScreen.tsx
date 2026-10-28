import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Icon } from '@/components/content';
import { Alert, EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { Input, Switch } from '@/components/forms';
import { Row, SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { useMySyndicateAccess, useSyndicateServices, useUpdateSyndicateService } from '../hooks';
import { serviceTileFor } from '../serviceTiles';
import type { SyndicateServiceItem } from '../types';

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 4000;

/**
 * Route `/(app)/syndicates/[organizationId]/services` — "تعديل الخدمات":
 * every service of the syndicate with its editable fields (title,
 * description, visibility). Each save PATCHes that service in place (same
 * id, never a new row) and the list is reloaded from the server. Editing is
 * `syndicate.profile.manage` (server-enforced; the screen is reached from
 * "تعديل النقابة", which needs the same permission).
 */
export default function SyndicateServicesEditScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const access = useMySyndicateAccess(organizationId);
  const q = useSyndicateServices(organizationId);

  return (
    <SafeAreaScreen>
      <AppHeader title={t('services.title')} showBack />
      {q.isLoading || access.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : !access.data?.canManageProfile ? (
        <EmptyState icon="lock-closed-outline" title={t('home.notFound')} />
      ) : !q.data?.length ? (
        <EmptyState icon="grid-outline" title={t('services.empty')} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.md }}
          keyboardShouldPersistTaps="handled"
        >
          <Alert tone="info" message={t('services.hint')} />
          {q.data.map((service) => (
            <ServiceEditor
              // Re-mount after a save so the fields show the server's values.
              key={`${service.id}-${service.updatedAt}`}
              organizationId={organizationId as string}
              service={service}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaScreen>
  );
}

function ServiceEditor({
  organizationId,
  service,
}: {
  organizationId: string;
  service: SyndicateServiceItem;
}) {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const toast = useToast();
  const update = useUpdateSyndicateService(organizationId);
  const tile = serviceTileFor(service.serviceKey);
  const defaultTitle = tile ? t(tile.labelKey as never) : service.serviceKey;

  const [title, setTitle] = useState(service.title ?? '');
  const [description, setDescription] = useState(service.description ?? '');
  const [isEnabled, setIsEnabled] = useState(service.isEnabled);

  const titleError = title.trim().length > TITLE_MAX ? t('services.errors.title') : undefined;
  const descriptionError =
    description.trim().length > DESCRIPTION_MAX ? t('services.errors.description') : undefined;
  const dirty =
    title.trim() !== (service.title ?? '') ||
    description.trim() !== (service.description ?? '') ||
    isEnabled !== service.isEnabled;

  const onSave = (): void => {
    update.mutate(
      {
        serviceId: service.id,
        // Blank → null on the server = the built-in text.
        input: { title: title.trim(), description: description.trim(), isEnabled },
      },
      {
        onSuccess: () => toast.show({ message: t('services.saved'), tone: 'success' }),
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <Card variant="outlined" padding="md">
      <View style={{ rowGap: theme.spacing.md }}>
        <Row gap="sm" align="center">
          {tile ? <Icon name={tile.icon} size="iconMd" color="primary" /> : null}
          <Text variant="bodyStrong" style={{ flex: 1 }}>
            {service.title || defaultTitle}
          </Text>
          {!service.isEnabled ? <Caption color="textMuted">{t('services.hidden')}</Caption> : null}
        </Row>
        <Input
          label={t('services.titleLabel')}
          placeholder={defaultTitle}
          value={title}
          onChangeText={setTitle}
          error={titleError}
        />
        <Input
          label={t('services.descriptionLabel')}
          placeholder={t('services.descriptionPlaceholder')}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          error={descriptionError}
        />
        <Switch value={isEnabled} onValueChange={setIsEnabled} label={t('services.enabledLabel')} />
        <Button
          label={update.isPending ? t('services.saving') : t('services.save')}
          accessibilityLabel={`${t('services.save')} — ${defaultTitle}`}
          loading={update.isPending}
          disabled={!dirty || update.isPending || Boolean(titleError || descriptionError)}
          onPress={onSave}
        />
      </View>
    </Card>
  );
}
