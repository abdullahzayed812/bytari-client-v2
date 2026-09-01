import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Icon } from '@/components/content/Icon';
import { Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';

export interface ErrorStateProps {
  /** An `ApiError`, a plain `Error`, or anything thrown. Internal detail is never shown. */
  error?: unknown;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Renders a user-safe, localised (Arabic) error message. Backend/internal
 * details (stack traces, SQL, 500 bodies, raw messages) are never surfaced —
 * only the mapped message from `apiErrorMessage`, plus the `requestId` for
 * support.
 */
export function ErrorState({ error, title, onRetry, retryLabel }: ErrorStateProps) {
  const theme = useTheme();
  const { t } = useTranslation('errors');

  const message = apiErrorMessage(error);
  const requestId = error instanceof ApiError ? error.requestId : undefined;

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xxxl,
        rowGap: theme.spacing.md,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.dangerSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="alert-circle-outline" size="iconXl" color="danger" />
      </View>
      <Text variant="title" weight="medium" center>
        {title ?? t('title')}
      </Text>
      <Text variant="body" color="textMuted" center>
        {message}
      </Text>
      {requestId ? (
        <Text variant="overline" color="textMuted">
          {t('ref')}: {requestId}
        </Text>
      ) : null}
      {onRetry ? (
        <View style={{ marginTop: theme.spacing.sm }}>
          <Button label={retryLabel ?? t('retry')} leftIcon="refresh" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}
