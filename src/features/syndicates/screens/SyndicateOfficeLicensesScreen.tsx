import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { useTheme } from '@/theme';

import {
  SyndicateServiceContentEditAction,
  SyndicateServiceContentView,
  SyndicateServiceIntro,
  useSyndicateServiceContent,
  useSyndicateServiceTitle,
} from '../components';

/**
 * Route `/(app)/syndicates/office-licenses` — "إجازات المكاتب والعيادات". Opened from a syndicate
 * (`?organizationId=`) → that syndicate's edited title / text / page content
 * ("تعديل الخدمات" / "تعديل محتوى الصفحة"); otherwise the built-in content.
 */
export default function SyndicateOfficeLicensesScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const { organizationId } = useLocalSearchParams<{ organizationId?: string }>();
  const title = useSyndicateServiceTitle(
    organizationId,
    'OFFICE_LICENSES',
    t('officeLicenses.title'),
  );
  const page = useSyndicateServiceContent(organizationId, 'OFFICE_LICENSES');

  return (
    <SafeAreaScreen>
      <AppHeader
        title={title}
        showBack
        right={
          <SyndicateServiceContentEditAction
            organizationId={organizationId}
            serviceKey="OFFICE_LICENSES"
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
          <SyndicateServiceIntro organizationId={organizationId} serviceKey="OFFICE_LICENSES" />
          <SyndicateServiceContentView content={page.content} />
        </ScrollView>
      )}
    </SafeAreaScreen>
  );
}
