import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Chip } from '@/components/content';
import { Input, Switch } from '@/components/forms';
import { BottomSheet } from '@/components/overlays';
import { Label } from '@/components/typography';
import type {
  AdminUpdatePublicationInput,
  AnimalPublication,
  HealthStatus,
  VaccinationStatus,
} from '@/features/publications';
import { useTheme } from '@/theme';

const HEALTH: HealthStatus[] = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'];
const VACCINATION: VaccinationStatus[] = ['COMPLETE', 'PARTIAL', 'NONE'];

type TextKey =
  | 'contactName'
  | 'contactPhone'
  | 'note'
  | 'extraNotes'
  | 'city'
  | 'lostDate'
  | 'lostTime'
  | 'lostGovernorate'
  | 'lostDistrict'
  | 'lostLocationDetail'
  | 'healthNotes';

/** Same per-kind field set as the server's `EDITABLE_FIELDS_BY_KIND`. */
const TEXT_FIELDS: Record<AnimalPublication['kind'], TextKey[]> = {
  LOST: [
    'contactName',
    'contactPhone',
    'note',
    'lostDate',
    'lostTime',
    'lostGovernorate',
    'lostDistrict',
    'lostLocationDetail',
    'healthNotes',
  ],
  ADOPTION: ['contactName', 'contactPhone', 'city', 'note', 'extraNotes'],
  MATING: ['contactName', 'contactPhone', 'city', 'note', 'extraNotes'],
};
const MULTILINE: TextKey[] = ['note', 'extraNotes', 'lostLocationDetail', 'healthNotes'];
/** Optional columns an admin may clear (sent as `null`). */
const NULLABLE: TextKey[] = ['extraNotes', 'lostTime', 'lostLocationDetail', 'healthNotes'];

export interface AdminPublicationEditSheetProps {
  publication: AnimalPublication | null;
  submitting: boolean;
  onClose: () => void;
  /** Receives only the changed fields — `PATCH /admin/animal-publications/:id`. */
  onSubmit: (changes: AdminUpdatePublicationInput) => void;
}

/** Moderator edit of a Lost / Adoption / Mating listing's fields (kind-aware). */
export function AdminPublicationEditSheet({
  publication,
  submitting,
  onClose,
  onSubmit,
}: AdminPublicationEditSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const { t: tpub } = useTranslation('publications');
  const [text, setText] = useState<Partial<Record<TextKey, string>>>({});
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [vaccination, setVaccination] = useState<VaccinationStatus | null>(null);
  const [sterilized, setSterilized] = useState(false);

  useEffect(() => {
    if (!publication) return;
    const next: Partial<Record<TextKey, string>> = {};
    for (const k of TEXT_FIELDS[publication.kind]) next[k] = publication[k] ?? '';
    setText(next);
    setHealth(publication.healthStatus);
    setVaccination(publication.vaccinationStatus);
    setSterilized(publication.isSterilized ?? false);
  }, [publication]);

  if (!publication) return null;
  const kind = publication.kind;

  const submit = () => {
    const changes: AdminUpdatePublicationInput = {};
    for (const k of TEXT_FIELDS[kind]) {
      const value = (text[k] ?? '').trim();
      const before = publication[k] ?? '';
      if (value === before) continue;
      if (value === '' && NULLABLE.includes(k)) {
        (changes as Record<string, unknown>)[k] = null;
      } else {
        (changes as Record<string, unknown>)[k] = value;
      }
    }
    if (kind !== 'LOST') {
      if (health && health !== publication.healthStatus) changes.healthStatus = health;
      if (vaccination && vaccination !== publication.vaccinationStatus) {
        changes.vaccinationStatus = vaccination;
      }
    }
    if (kind === 'ADOPTION' && sterilized !== (publication.isSterilized ?? false)) {
      changes.isSterilized = sterilized;
    }
    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }
    onSubmit(changes);
  };

  return (
    <BottomSheet visible onClose={onClose} title={t('animalPublications.edit.title')}>
      <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ rowGap: theme.spacing.sm }}>
        {TEXT_FIELDS[kind].map((k) => (
          <Input
            key={k}
            label={t(`animalPublications.details.${k}`)}
            value={text[k] ?? ''}
            onChangeText={(v) => setText((prev) => ({ ...prev, [k]: v }))}
            multiline={MULTILINE.includes(k)}
            keyboardType={k === 'contactPhone' ? 'phone-pad' : 'default'}
            placeholder={k === 'lostDate' ? 'YYYY-MM-DD' : k === 'lostTime' ? 'HH:MM' : undefined}
          />
        ))}

        {kind !== 'LOST' ? (
          <>
            <Label>{t('animalPublications.details.healthStatus')}</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
              {HEALTH.map((h) => (
                <Chip
                  key={h}
                  label={tpub(`healthStatus.${h}`)}
                  selected={health === h}
                  onPress={() => setHealth(h)}
                />
              ))}
            </View>
            <Label>{t('animalPublications.details.vaccinationStatus')}</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
              {VACCINATION.map((v) => (
                <Chip
                  key={v}
                  label={tpub(`vaccinationStatus.${v}`)}
                  selected={vaccination === v}
                  onPress={() => setVaccination(v)}
                />
              ))}
            </View>
          </>
        ) : null}

        {kind === 'ADOPTION' ? (
          <Switch
            label={t('animalPublications.details.isSterilized')}
            value={sterilized}
            onValueChange={setSterilized}
          />
        ) : null}
      </ScrollView>

      <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Button
            label={t('animalPublications.edit.save')}
            loading={submitting}
            disabled={submitting}
            onPress={submit}
            fullWidth
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={t('common.cancel')}
            variant="outline"
            disabled={submitting}
            onPress={onClose}
            fullWidth
          />
        </View>
      </View>
    </BottomSheet>
  );
}
