import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { BottomTabBar } from '@/components/navigation';
import { useAppMode } from '@/hooks';

/**
 * The shared five-destination shell from the reference design. The custom
 * `BottomTabBar` (raised circular Home) is final.
 *
 * Order in the bar (RTL): Account · Animals · [Home] · Store/More · Categories.
 *
 * One slot's title is mode-aware, never its icon:
 *  - "more"     → Pet Owners Store (owner) / Veterinarian Store (vet) — both
 *                 a store now, so the title is always `tabs.store` — see
 *                 `StoreTabScreen`
 *  - "services" → "كل الأقسام" category grid (owner) / Services hub (vet) — see `CategoriesTabScreen`
 */
export default function TabsLayout() {
  const { t } = useTranslation('nav');
  const { isVeterinarianMode } = useAppMode();

  return (
    <Tabs tabBar={(props) => <BottomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="account" options={{ title: t('tabs.account') }} />
      <Tabs.Screen name="animals" options={{ title: t('tabs.animals') }} />
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="more" options={{ title: t('tabs.store') }} />
      <Tabs.Screen
        name="services"
        options={{ title: isVeterinarianMode ? t('tabs.services') : t('tabs.categories') }}
      />
    </Tabs>
  );
}
