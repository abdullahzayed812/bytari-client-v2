import { View } from 'react-native';

import { Card } from '@/components/content';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { useSyndicateServices } from '../hooks';
import { findService } from '../serviceTiles';
import type { SyndicateServiceKey } from '../types';

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
