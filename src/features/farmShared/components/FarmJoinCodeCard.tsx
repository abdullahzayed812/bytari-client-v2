import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Card } from '@/components/content';
import { ConfirmationDialog, useToast } from '@/components/feedback';
import { QrCode } from '@/components/media';
import { Caption, Label, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { shareText } from '@/lib/share';
import { useTheme } from '@/theme';

import { farmQrPayload } from '../farmQr';
import { useFarmJoinCode, useRegenerateFarmJoinCode } from '../hooks';

interface Props {
  organizationId: string;
  organizationName: string;
}

/**
 * FARM join-code panel for the farm owner (§9). Shows the current Farm-ID,
 * lets the owner share it, and rotate it (the old code stops working). The
 * business rule is share-and-enter: a veterinarian who has the code joins with
 * no owner-approval step. Backend requires `organization.update` for both reads.
 */
export function FarmJoinCodeCard({ organizationId, organizationName }: Props) {
  const theme = useTheme();
  const { t } = useTranslation('farm');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const q = useFarmJoinCode(organizationId);
  const regenerate = useRegenerateFarmJoinCode(organizationId);
  const [confirmRotate, setConfirmRotate] = useState(false);

  const code = q.data?.joinCode ?? null;

  const share = () => {
    if (!code) return;
    void shareText(t('joinCode.shareMessage', { name: organizationName, code })).then((outcome) => {
      if (outcome === 'copied') toast.show({ message: tc('share.copied'), tone: 'success' });
      else if (outcome === 'unavailable')
        toast.show({ message: tc('share.unavailable'), tone: 'info' });
    });
  };

  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      <Label>{t('joinCode.label')}</Label>
      <Card variant="outlined" padding="md">
        {q.isLoading ? (
          <Caption>{t('joinCode.loading')}</Caption>
        ) : q.isError || !code ? (
          <Caption>{t('joinCode.unavailable')}</Caption>
        ) : (
          <View style={{ rowGap: theme.spacing.sm }}>
            <Text variant="heading" selectable>
              {code}
            </Text>
            <Caption>{t('joinCode.hint')}</Caption>
            <View style={{ alignItems: 'center', rowGap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
              <QrCode value={farmQrPayload(code)} size={180} accessibilityLabel={t('qr.a11y')} />
              <Caption center>{t('qr.hint')}</Caption>
            </View>
            <View
              style={{
                flexDirection: 'row',
                columnGap: theme.spacing.md,
                marginTop: theme.spacing.xs,
              }}
            >
              <Button
                label={t('joinCode.share')}
                variant="outline"
                size="sm"
                leftIcon="share-social-outline"
                onPress={share}
              />
              <TextButton
                label={t('joinCode.regenerate')}
                icon="refresh-outline"
                tone="danger"
                disabled={regenerate.isPending}
                onPress={() => setConfirmRotate(true)}
              />
            </View>
          </View>
        )}
      </Card>

      <ConfirmationDialog
        visible={confirmRotate}
        title={t('joinCode.regenerateConfirmTitle')}
        message={t('joinCode.regenerateConfirmBody')}
        confirmLabel={t('joinCode.regenerate')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={regenerate.isPending}
        onConfirm={() => {
          setConfirmRotate(false);
          regenerate.mutate(undefined, {
            onSuccess: () => toast.show({ tone: 'success', message: t('joinCode.regenerated') }),
            onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
          });
        }}
        onCancel={() => setConfirmRotate(false)}
      />
    </View>
  );
}
