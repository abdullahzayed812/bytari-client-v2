import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { IconButton } from '@/components/actions';
import { Routes } from '@/constants/routes';

/** "تواصل معنا" icon of the signed-out screens → the Contact Us page (`/(auth)/contact`). */
export function ContactUsButton() {
  const { t } = useTranslation('contact');
  return (
    <IconButton
      testID="contact-us-button"
      icon="headset-outline"
      variant="soft"
      color="primary"
      accessibilityLabel={t('title')}
      onPress={() => router.push(Routes.authContact)}
    />
  );
}
