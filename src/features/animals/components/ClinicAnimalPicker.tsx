import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { useTheme } from '@/theme';

import { useOrganizationAnimalSearch } from '../hooks';
import type { OrganizationAnimalGrant } from '../types';

import { AnimalCard } from './AnimalCard';

/**
 * Legacy "اختر الحيوان" step (quick review / full exam / clinic appointment):
 * search ONLY among animals this clinic holds ACTIVE access to — by name,
 * breed, species, owner name, or the exact animal id.
 */
export function ClinicAnimalPicker({
  organizationId,
  onPick,
  placeholder,
  emptyTitle,
}: {
  organizationId: string;
  onPick: (grant: OrganizationAnimalGrant) => void;
  placeholder: string;
  emptyTitle: string;
}) {
  const theme = useTheme();
  const { t } = useTranslation('orgAnimals');
  const [term, setTerm] = useState('');
  const q = useOrganizationAnimalSearch(organizationId, term);
  const items = q.data?.items ?? [];

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: theme.screenPadding, paddingBottom: theme.spacing.sm }}>
        <SearchInput
          value={term}
          onChangeText={setTerm}
          onClear={() => setTerm('')}
          placeholder={placeholder}
          accessibilityLabel={placeholder}
        />
      </View>
      {q.isLoading ? (
        <Loading />
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(g) => g.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.sm,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <EmptyState
              icon="paw-outline"
              title={term.trim() ? t('list.noFilterMatch') : emptyTitle}
            />
          }
          renderItem={({ item }) => <AnimalCard grant={item} onPress={() => onPick(item)} />}
        />
      )}
    </View>
  );
}
