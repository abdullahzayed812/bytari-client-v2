import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Section } from '@/components/layout';
import { Label } from '@/components/typography';
import { governoratesForMarket } from '@/constants/governorates';

/**
 * The exchange-board governorate list (price entry screens): canonical order,
 * with the Kurdistan Region's four governorates under one "إقليم كوردستان"
 * group header. Each city still gets its own row / price.
 */
export function MarketGovernorateList({
  renderGovernorate,
}: {
  renderGovernorate: (governorate: string) => ReactNode;
}) {
  const { t } = useTranslation('poultryMarket');
  return (
    <>
      {governoratesForMarket().map((row) =>
        row.kind === 'governorate' ? (
          renderGovernorate(row.governorate)
        ) : (
          <View key="region-kurdistan">
            <Section spacing="lg">
              <Label>{t('exchangeRates.regionKurdistan')}</Label>
            </Section>
            {row.governorates.map((g) => renderGovernorate(g))}
          </View>
        ),
      )}
    </>
  );
}
