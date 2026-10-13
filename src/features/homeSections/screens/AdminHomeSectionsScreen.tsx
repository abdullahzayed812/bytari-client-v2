import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Card } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { ImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import {
  useAdminHomeSections,
  useHomeSectionImagePresignProvider,
  useRemoveHomeSectionImage,
} from '../hooks';
import {
  HOME_SECTION_IMAGE_SIZE,
  type HomeSectionImage,
  type HomeSectionKey,
  type HomeSectionPage,
} from '../types';

const PAGES: HomeSectionPage[] = ['PET_OWNER_HOME', 'VETERINARIAN_HOME'];

/**
 * Route `/(app)/admin/home-sections` — "صور أقسام الصفحة الرئيسية". One row per
 * EXISTING bottom section card of the Pet Owner / Veterinarian home pages:
 * upload / replace (crop editor → presigned R2 upload) or remove its image.
 * Without an image the card keeps its built-in icon. Titles are the cards'
 * own titles — this screen never creates or renames sections.
 * `home_section.manage` (ADMIN) is enforced by the backend on every call.
 */
export default function AdminHomeSectionsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const sections = useAdminHomeSections();

  return (
    <SafeAreaScreen>
      <AppHeader title={t('homeSections.title')} showBack />
      {sections.isLoading ? (
        <Loading fill />
      ) : sections.isError ? (
        <ErrorState error={sections.error} onRetry={() => void sections.refetch()} />
      ) : (sections.data ?? []).length === 0 ? (
        <EmptyState icon="images-outline" title={t('homeSections.title')} />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: theme.screenPadding,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.lg,
          }}
        >
          <Caption>{t('homeSections.hint')}</Caption>
          {PAGES.map((page) => (
            <View key={page} style={{ rowGap: theme.spacing.sm }}>
              <Label>{t(`homeSections.pages.${page}`)}</Label>
              {(sections.data ?? [])
                .filter((s) => s.page === page)
                .map((s) => (
                  <HomeSectionRow key={s.key} section={s} />
                ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaScreen>
  );
}

function HomeSectionRow({ section }: { section: HomeSectionImage }) {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const toast = useToast();
  const title = useSectionTitle(section.key);
  const provider = useHomeSectionImagePresignProvider(section.key);
  const remove = useRemoveHomeSectionImage();

  return (
    <Card variant="outlined" padding="md">
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
        <ImageUploader
          value={section.imageUrl}
          provider={provider}
          shape="square"
          size={64}
          replaceable
          // Square, fixed-size export — the home cards render it in a square tile.
          edit={{ outputSize: HOME_SECTION_IMAGE_SIZE }}
          // A picked/replaced image is persisted by the provider's own
          // `finalizeUpload`; only the uploader's local "remove" (null) needs
          // the server call.
          onChange={(result) => {
            if (result !== null) return;
            remove.mutate(section.key, {
              onSuccess: () => toast.show({ tone: 'success', message: t('homeSections.removed') }),
              onError: (e) => toast.show({ tone: 'danger', message: apiErrorMessage(e) }),
            });
          }}
        />
        <View style={{ flex: 1, rowGap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {title}
          </Text>
          <Caption numberOfLines={2}>
            {section.imageUrl ? t('homeSections.hasImage') : t('homeSections.noImage')}
          </Caption>
        </View>
      </View>
    </Card>
  );
}

/** The card's own title, from the home page that shows it. */
function useSectionTitle(key: HomeSectionKey): string {
  const { t: th } = useTranslation('home');
  const { t: tv } = useTranslation('veterinarian');
  switch (key) {
    case 'PET_OWNER_PETS':
      return th('categories.pets.title');
    case 'PET_OWNER_LIVESTOCK':
      return th('categories.livestock.title');
    case 'PET_OWNER_POULTRY':
      return th('categories.poultry.title');
    case 'VET_CHAT':
      return tv('home.chat.title');
    case 'VET_SERVICES':
      return tv('home.services.title');
    case 'VET_MAGAZINE':
      return tv('home.magazine.title');
    case 'VET_BOOKS':
      return tv('home.books.title');
  }
}
