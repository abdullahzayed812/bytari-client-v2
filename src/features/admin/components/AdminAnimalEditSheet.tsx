import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Input, Select } from '@/components/forms';
import { BottomSheet } from '@/components/overlays';
import { PET_SEXES, PET_SPECIES, type PetSex, type PetSpecies } from '@/features/pets/types';
import { useTheme } from '@/theme';
import { isValidIsoDate } from '@/utils';

import type { AdminAnimal, AdminUpdateAnimalInput } from '../types';

/**
 * Admin / ANIMAL-supervisor edit of a registered pet PROFILE
 * (`PATCH /admin/animals/:id`, `animal.update`). Same field allow-list as the
 * owner's own edit. Deliberately profile-only: the animal's Adoption / Mating
 * / Lost listings are a separate domain and are never changed from here.
 */
export function AdminAnimalEditSheet({
  animal,
  loading,
  onSave,
  onClose,
}: {
  animal: AdminAnimal | null;
  loading?: boolean;
  onSave: (patch: AdminUpdateAnimalInput) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation('admin');
  const { t: tp } = useTranslation('pets');
  const theme = useTheme();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies | null>(null);
  const [sex, setSex] = useState<PetSex | null>(null);
  const [breed, setBreed] = useState('');
  const [color, setColor] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [features, setFeatures] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!animal) return;
    setName(animal.name);
    setSpecies(animal.species as PetSpecies);
    setSex(animal.sex as PetSex);
    setBreed(animal.breed ?? '');
    setColor(animal.color ?? '');
    setDateOfBirth(animal.dateOfBirth ?? '');
    setFeatures(animal.distinguishingFeatures ?? '');
    setNotes(animal.notes ?? '');
  }, [animal]);

  const dobError =
    dateOfBirth.trim() !== '' && !isValidIsoDate(dateOfBirth)
      ? t('adminAnimals.edit.dateError')
      : undefined;
  const valid = name.trim().length > 0 && !dobError;
  const orNull = (v: string) => (v.trim() === '' ? null : v.trim());

  return (
    <BottomSheet visible={animal !== null} onClose={onClose} title={t('adminAnimals.edit.title')}>
      <ScrollView
        contentContainerStyle={{ rowGap: theme.spacing.md, paddingBottom: theme.spacing.lg }}
      >
        <Input label={t('adminAnimals.edit.name')} value={name} onChangeText={setName} />
        <Select<PetSpecies>
          label={t('adminAnimals.details.species')}
          value={species}
          options={PET_SPECIES.map((s) => ({ value: s, label: tp(`species.${s}`) }))}
          onChange={setSpecies}
        />
        <Select<PetSex>
          label={t('adminAnimals.details.sex')}
          value={sex}
          options={PET_SEXES.map((s) => ({ value: s, label: tp(`sex.${s}`) }))}
          onChange={setSex}
        />
        <Input label={t('adminAnimals.details.breed')} value={breed} onChangeText={setBreed} />
        <Input label={t('adminAnimals.details.color')} value={color} onChangeText={setColor} />
        <Input
          label={t('adminAnimals.details.dateOfBirth')}
          placeholder="2024-01-31"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          error={dobError}
          keyboardType="numbers-and-punctuation"
          autoCorrect={false}
        />
        <Input
          label={t('adminAnimals.details.distinguishingFeatures')}
          value={features}
          onChangeText={setFeatures}
          multiline
        />
        <Input
          label={t('adminAnimals.details.notes')}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t('common.cancel')}
              variant="ghost"
              fullWidth
              disabled={loading}
              onPress={onClose}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t('adminAnimals.edit.save')}
              fullWidth
              loading={loading}
              disabled={!valid || loading}
              onPress={() =>
                onSave({
                  name: name.trim(),
                  ...(species ? { species } : {}),
                  ...(sex ? { sex } : {}),
                  breed: orNull(breed),
                  color: orNull(color),
                  dateOfBirth: orNull(dateOfBirth),
                  distinguishingFeatures: orNull(features),
                  notes: orNull(notes),
                })
              }
            />
          </View>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
