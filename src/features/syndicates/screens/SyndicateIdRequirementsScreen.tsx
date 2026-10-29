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
 * Route `/(app)/syndicates/id-requirements` — "إصدار / تجديد هوية نقابية". Opened from a syndicate
 * (`?organizationId=`) → that syndicate's edited title / text / page content
 * ("تعديل الخدمات" / "تعديل محتوى الصفحة"); otherwise the built-in content.
 */
export default function SyndicateIdRequirementsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const { organizationId } = useLocalSearchParams<{ organizationId?: string }>();
  const title = useSyndicateServiceTitle(organizationId, 'ID_CARD', t('idRequirements.title'));
  const page = useSyndicateServiceContent(organizationId, 'ID_CARD');

  return (
    <SafeAreaScreen>
      <AppHeader
        title={title}
        showBack
        right={
          <SyndicateServiceContentEditAction organizationId={organizationId} serviceKey="ID_CARD" />
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
          <SyndicateServiceIntro organizationId={organizationId} serviceKey="ID_CARD" />
          <SyndicateServiceContentView content={page.content} />
        </ScrollView>
      )}
    </SafeAreaScreen>
  );
}
