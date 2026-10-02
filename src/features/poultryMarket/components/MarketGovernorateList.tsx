import type { ReactNode } from 'react';

import { governoratesForMarket } from '@/constants/governorates';

/**
 * The exchange-board governorate list (price entry screens): canonical order,
 * with the Kurdistan Region as ONE "إقليم كوردستان" row — one price for all
 * four of its governorates.
 */
export function MarketGovernorateList({
  renderGovernorate,
}: {
  renderGovernorate: (governorate: string) => ReactNode;
}) {
  return <>{governoratesForMarket().map((row) => renderGovernorate(row.governorate))}</>;
}
