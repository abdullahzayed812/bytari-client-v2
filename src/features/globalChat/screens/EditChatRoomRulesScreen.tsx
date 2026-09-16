import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert, Loading, useToast } from '@/components/feedback';
import { Input } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { useChatRoom, useUpdateChatRoomRules } from '../hooks';

/**
 * Route `/(app)/global-chat/[organizationId]/rules-edit` — edit a room's
 * rules text (`chat_room.rules.manage`, checked server-side; reached from the
 * room details screen for an owner/moderator and from the admin organization
 * detail screen for an admin).
 */
export default function EditChatRoomRulesScreen() {
  const theme = useTheme();
  const { t } = useTranslation('globalChat');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const room = useChatRoom(orgId);
  const update = useUpdateChatRoomRules(orgId);
  const [rules, setRules] = useState('');
  const seeded = useRef(false);

  useEffect(() => {
    if (!seeded.current && room.data) {
      seeded.current = true;
      setRules(room.data.rules ?? '');
    }
  }, [room.data]);

  const onSave = (): void => {
    update.mutate(rules.trim() || null, {
      onSuccess: () => {
        toast.show({ tone: 'success', message: t('details.rulesSaved') });
        router.back();
      },
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  if (room.isLoading) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('details.editRulesTitle')} showBack />
        <Loading fill />
      </SafeAreaScreen>
    );
  }

  return (
    <SafeAreaScreen>
      <AppHeader title={t('details.editRulesTitle')} showBack />
      <View style={{ flex: 1, padding: theme.screenPadding, rowGap: theme.spacing.md }}>
        {update.isError ? <Alert tone="danger" message={apiErrorMessage(update.error)} /> : null}
        <Input
          value={rules}
          onChangeText={setRules}
          placeholder={t('details.editRulesPlaceholder')}
          multiline
          numberOfLines={8}
          maxLength={4000}
        />
        <Button
          label={update.isPending ? t('details.saving') : t('details.save')}
          fullWidth
          loading={update.isPending}
          disabled={update.isPending}
          onPress={onSave}
        />
      </View>
    </SafeAreaScreen>
  );
}
