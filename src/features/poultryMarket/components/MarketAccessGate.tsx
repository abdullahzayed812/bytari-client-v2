import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Routes } from '@/constants/routes';

import { useMarketAccess } from '../hooks/useMarketAccess';
import type { MarketAccess } from '../types';

/** Why the user is out: the most specific account state, mirroring the backend's 403 code. */
function deniedMessageKey(
  a: MarketAccess,
): 'access.denied.merchantExpired' | 'access.denied.farmExpired' | 'access.denied.account' {
  if (a.merchant.reason === 'SUBSCRIPTION_EXPIRED') return 'access.denied.merchantExpired';
  if (
    a.farms.some(
      (f) => f.reason === 'SUBSCRIPTION_EXPIRED' || f.reason === 'SUBSCRIPTION_NOT_STARTED',
    )
  ) {
    return 'access.denied.farmExpired';
  }
  return 'access.denied.account';
}

/**
 * Wraps a Markets & Exchanges screen reached directly (deep link, back stack,
 * notification) — renders it only while the server says the section is open,
 * otherwise explains why and links to the hub (registration / renewal). The
 * API refuses the same requests regardless; this only replaces a raw 403.
 */
export function MarketAccessGate({
  title,
  need = 'markets',
  children,
}: {
  title: string;
  need?: 'markets' | 'sell';
  children: ReactNode;
}) {
  const { t } = useTranslation('poultryMarket');
  const access = useMarketAccess();

  if (access.isPending) {
    return (
      <ScrollScreen>
        <AppHeader title={title} showBack />
        <Loading fill />
      </ScrollScreen>
    );
  }
  if (access.isError || !access.data) {
    return (
      <ScrollScreen>
        <AppHeader title={title} showBack />
        <Section spacing="xl">
          <ErrorState error={access.error} onRetry={() => void access.refetch()} />
        </Section>
      </ScrollScreen>
    );
  }
  if (!access.data.sections[need]) {
    return (
      <ScrollScreen>
        <AppHeader title={title} showBack />
        <Section spacing="xl">
          <EmptyState
            icon="lock-closed-outline"
            title={t('access.denied.title')}
            message={t(deniedMessageKey(access.data))}
            actionLabel={t('access.denied.openCta')}
            onAction={() => router.replace(Routes.marketHub)}
          />
        </Section>
      </ScrollScreen>
    );
  }
  return <>{children}</>;
}
