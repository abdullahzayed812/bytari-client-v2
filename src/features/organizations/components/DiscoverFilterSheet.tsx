import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Chip } from '@/components/content';
import { Input, Select, type SelectOption } from '@/components/forms';
import { BottomSheet } from '@/components/overlays';
import { Label } from '@/components/typography';
import { useTheme } from '@/theme';

import { COUNTRIES_AR } from '../data/countries';
import type { DiscoverFilters, DiscoverSort } from '../types';

const ANY = '';
const RATING_OPTIONS = [0, 3, 4, 5] as const;

/** Brand / country-of-origin values offered as chips (veterinary offices only). */
export interface DiscoverProductFacets {
  brands: string[];
  countries: string[];
}

export interface DiscoverFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: DiscoverFilters;
  sort: DiscoverSort;
  /** Applied together — the list re-queries the backend with these params. */
  onApply: (filters: DiscoverFilters, sort: DiscoverSort) => void;
  /**
   * When given, adds "العلامة التجارية" / "بلد المنشأ" chip sections that keep
   * only organizations selling a matching product (`productBrand` /
   * `productCountry`).
   */
  productFacets?: DiscoverProductFacets;
}

/**
 * "تصفية" sheet for the clinic / veterinary-office discover lists. Every
 * criterion is sent to `GET /organizations/discover` and applied by the
 * backend (country, minimum average rating, service, top-rated ordering).
 */
export function DiscoverFilterSheet({
  visible,
  onClose,
  filters,
  sort,
  onApply,
  productFacets,
}: DiscoverFilterSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const [country, setCountry] = useState(filters.country ?? ANY);
  const [minRating, setMinRating] = useState(filters.minRating ?? 0);
  const [service, setService] = useState(filters.service ?? '');
  const [topRated, setTopRated] = useState(sort === 'top_rated');
  const [productBrand, setProductBrand] = useState(filters.productBrand);
  const [productCountry, setProductCountry] = useState(filters.productCountry);

  // Organization profiles store the country as the Arabic name picked at
  // registration (`COUNTRIES_AR`), so the filter uses the same values.
  // Re-seed the draft from the applied state every time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    setCountry(filters.country ?? ANY);
    setMinRating(filters.minRating ?? 0);
    setService(filters.service ?? '');
    setTopRated(sort === 'top_rated');
    setProductBrand(filters.productBrand);
    setProductCountry(filters.productCountry);
  }, [visible, filters, sort]);

  const countryOptions = useMemo<SelectOption<string>[]>(
    () => [
      { value: ANY, label: t('discover.filters.anyCountry') },
      ...COUNTRIES_AR.map((c) => ({ value: c, label: c })),
    ],
    [t],
  );

  const apply = () => {
    const trimmed = service.trim();
    onApply(
      {
        country: country || undefined,
        minRating: minRating > 0 ? minRating : undefined,
        service: trimmed || undefined,
        productBrand: productFacets ? productBrand : undefined,
        productCountry: productFacets ? productCountry : undefined,
      },
      topRated ? 'top_rated' : sort === 'top_rated' ? 'default' : sort,
    );
    onClose();
  };

  const reset = () => {
    onApply({}, sort === 'top_rated' ? 'default' : sort);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('discover.filters.title')}>
      <View style={{ rowGap: theme.spacing.lg, paddingBottom: theme.spacing.lg }}>
        <View style={{ rowGap: theme.spacing.xs }}>
          <Label>{t('discover.filters.sortLabel')}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            <Chip
              label={t('discover.filters.sortNewest')}
              selected={!topRated}
              onPress={() => setTopRated(false)}
            />
            <Chip
              label={t('discover.filters.sortTopRated')}
              selected={topRated}
              onPress={() => setTopRated(true)}
            />
          </View>
        </View>

        <Select<string>
          label={t('discover.filters.country')}
          value={country}
          options={countryOptions}
          onChange={setCountry}
        />

        <View style={{ rowGap: theme.spacing.xs }}>
          <Label>{t('discover.filters.minRating')}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            {RATING_OPTIONS.map((r) => (
              <Chip
                key={r}
                icon={r > 0 ? 'star' : undefined}
                label={
                  r > 0
                    ? t('discover.filters.ratingAtLeast', { rating: r })
                    : t('discover.filters.anyRating')
                }
                selected={minRating === r}
                onPress={() => setMinRating(r)}
              />
            ))}
          </View>
        </View>

        <Input
          label={t('discover.filters.service')}
          placeholder={t('discover.filters.servicePlaceholder')}
          value={service}
          onChangeText={setService}
          maxLength={100}
        />

        {productFacets
          ? (
              [
                ['productBrand', productFacets.brands, productBrand, setProductBrand],
                ['productCountry', productFacets.countries, productCountry, setProductCountry],
              ] as const
            ).map(([key, values, current, set]) =>
              values.length === 0 ? null : (
                <View key={key} style={{ rowGap: theme.spacing.xs }}>
                  <Label>{t(`discover.filters.${key}`)}</Label>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                    {values.map((v) => {
                      const selected = current?.toLowerCase() === v.toLowerCase();
                      return (
                        <Chip
                          key={v}
                          label={v}
                          selected={selected}
                          onPress={() => set(selected ? undefined : v)}
                        />
                      );
                    })}
                  </View>
                </View>
              ),
            )
          : null}

        <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button label={t('discover.filters.apply')} fullWidth onPress={apply} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t('discover.filters.reset')}
              variant="secondary"
              fullWidth
              onPress={reset}
            />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

/** How many criteria are active — drives the filter button's highlighted state. */
export function activeFilterCount(filters: DiscoverFilters, sort: DiscoverSort): number {
  return (
    (filters.country ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    (filters.service ? 1 : 0) +
    (filters.productBrand ? 1 : 0) +
    (filters.productCountry ? 1 : 0) +
    (sort === 'top_rated' ? 1 : 0)
  );
}
