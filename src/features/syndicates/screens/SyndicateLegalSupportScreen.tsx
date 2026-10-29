import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { Button } from '@/components/actions';
import { Card } from '@/components/content';
import { Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { openPhone } from '@/utils';

import {
  SyndicateServiceContentEditAction,
  SyndicateServiceContentView,
  SyndicateServiceIntro,
  useSyndicateServiceContent,
  useSyndicateServiceTitle,
} from '../components';

/** Contact number shown on the reference "الدعم القانوني" screen. */
const LEGAL_UNIT_PHONE = '+9642001234503';

/**
 * Route `/(app)/syndicates/legal-support` — "الدعم القانوني". Opened from a syndicate
 * (`?organizationId=`) → that syndicate's edited title / text / page content
 * ("تعديل الخدمات" / "تعديل محتوى الصفحة"); otherwise the built-in content.
 */
export default function SyndicateLegalSupportScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const { organizationId } = useLocalSearchParams<{ organizationId?: string }>();
  const title = useSyndicateServiceTitle(organizationId, 'LEGAL_SUPPORT', t('legalSupport.title'));
  const page = useSyndicateServiceContent(organizationId, 'LEGAL_SUPPORT');

  return (
    <SafeAreaScreen>
      <AppHeader
        title={title}
        showBack
        right={
          <SyndicateServiceContentEditAction
            organizationId={organizationId}
            serviceKey="LEGAL_SUPPORT"
          />
        }
      />
      {page.isLoading ? (
        <Loading fill />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: theme.screenPadding,
            rowGap: theme.spacing.lg,
            paddingBottom: theme.spacing.huge,
          }}
        >
          <SyndicateServiceIntro organizationId={organizationId} serviceKey="LEGAL_SUPPORT" />
          <SyndicateServiceContentView content={page.content} />

          <Card variant="outlined" padding="md" style={{ rowGap: theme.spacing.sm }}>
            <Text variant="bodyStrong">{t('legalSupport.contactTitle')}</Text>
            <Button
              label={t('legalSupport.callUs')}
              leftIcon="call-outline"
              onPress={() => void openPhone(LEGAL_UNIT_PHONE)}
            />
          </Card>
        </ScrollView>
      )}
    </SafeAreaScreen>
  );
}
