import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { BottomTabBar } from '@/components/navigation';

/**
 * The shared five-destination shell from the reference design. Destination
 * screens are placeholders in Phase 1; the shell + custom `BottomTabBar`
 * (raised circular Home) are final.
 *
 * Order in the bar (RTL): Account · Animals · [Home] · More · Services.
 */
export default function TabsLayout() {
  const { t } = useTranslation('nav');

  return (
    <Tabs tabBar={(props) => <BottomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="account" options={{ title: t('tabs.account') }} />
      <Tabs.Screen name="animals" options={{ title: t('tabs.animals') }} />
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="more" options={{ title: t('tabs.more') }} />
      <Tabs.Screen name="services" options={{ title: t('tabs.services') }} />
    </Tabs>
  );
}
