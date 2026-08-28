import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Icon } from '@/components/content/Icon';
import { Text } from '@/components/typography';
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
 * Renders a user-safe error message. Backend/internal details (stack traces,
 * SQL, 500 bodies) are deliberately not surfaced — only the friendly `message`
 * from the API envelope or a generic fallback, plus the `requestId` for support.
 */
function friendlyMessage(error: unknown): { message: string; requestId?: string } {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return { message: 'Unable to reach the server. Check your connection and try again.' };
    }
    if (error.status >= 500) {
      return {
        message: 'The server had a problem completing your request. Please try again shortly.',
        requestId: error.requestId,
      };
    }
    return { message: error.message, requestId: error.requestId };
  }
  return { message: 'Something went wrong. Please try again.' };
}

export function ErrorState({ error, title, onRetry, retryLabel = 'Retry' }: ErrorStateProps) {
  const theme = useTheme();
  const { message, requestId } = friendlyMessage(error);

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
        {title ?? 'Something went wrong'}
      </Text>
      <Text variant="body" color="textMuted" center>
        {message}
      </Text>
      {requestId ? (
        <Text variant="overline" color="textMuted">
          Ref: {requestId}
        </Text>
      ) : null}
      {onRetry ? (
        <View style={{ marginTop: theme.spacing.sm }}>
          <Button label={retryLabel} leftIcon="refresh" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}
