import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Card } from '@/components/content';
import { Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { useMySyndicateAccess, useSyndicateServices } from '../hooks';
import { resolveServiceContent, type ContentServiceKey } from '../serviceContent';
import { findService } from '../serviceTiles';
import type { SyndicateServiceContent, SyndicateServiceKey } from '../types';

/**
 * The syndicate's own text for a service ("تعديل الخدمات"), shown at the top
 * of that service's page. Renders nothing when opened without a syndicate or
 * when the syndicate kept the built-in text.
 */
export function SyndicateServiceIntro({
  organizationId,
  serviceKey,
}: {
  organizationId: string | undefined;
  serviceKey: SyndicateServiceKey;
}) {
  const theme = useTheme();
  const services = useSyndicateServices(organizationId);
  const description = findService(services.data, serviceKey)?.description;
  if (!description) return null;
  return (
    <Card variant="outlined" padding="md">
      <View style={{ rowGap: theme.spacing.xs }}>
        <Text variant="body">{description}</Text>
      </View>
    </Card>
  );
}

/** The syndicate's edited title for a service, or `fallback`. */
export function useSyndicateServiceTitle(
  organizationId: string | undefined,
  serviceKey: SyndicateServiceKey,
  fallback: string,
): string {
  const services = useSyndicateServices(organizationId);
  return findService(services.data, serviceKey)?.title || fallback;
}

/**
 * The page content to render: the syndicate's edited document, else the
 * built-in one. `isLoading` while that syndicate's services load, so the
 * built-in text never flashes before the edited one.
 */
export function useSyndicateServiceContent(
  organizationId: string | undefined,
  serviceKey: ContentServiceKey,
): { content: SyndicateServiceContent; isLoading: boolean } {
  const { t } = useTranslation('syndicates');
  const services = useSyndicateServices(organizationId);
  return {
    content: resolveServiceContent(findService(services.data, serviceKey), serviceKey, t),
    isLoading: Boolean(organizationId) && services.isLoading,
  };
}

/**
 * Header action "تعديل محتوى الصفحة" — only for a viewer who may manage this
 * syndicate (`canManageProfile`, the same permission the server enforces).
 */
export function SyndicateServiceContentEditAction({
  organizationId,
  serviceKey,
}: {
  organizationId: string | undefined;
  serviceKey: ContentServiceKey;
}) {
  const { t } = useTranslation('syndicates');
  const access = useMySyndicateAccess(organizationId);
  if (!organizationId || !access.data?.canManageProfile) return null;
  return (
    <IconButton
      icon="create-outline"
      variant="soft"
      accessibilityLabel={t('serviceContent.edit')}
      onPress={() => router.push(Routes.syndicateServiceContentEdit(organizationId, serviceKey))}
    />
  );
}
