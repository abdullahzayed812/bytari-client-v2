import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Card, Chip, Icon, type IconName } from '@/components/content';
import { Alert, EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { Input } from '@/components/forms';
import { Row, SafeAreaScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
// Deep import (not the barrel) — keeps medical ↔ animals acyclic.
import { ClinicAnimalPicker } from '@/features/animals/components/ClinicAnimalPicker';
import { useTheme } from '@/theme';
import { isValidIsoDate, normalizeIsoDate } from '@/utils';

import { addDaysIso, todayIso } from '../constants';
import { useCreateMedicalRecord, useCreateVaccination, useQuickReviewTemplates } from '../hooks';
import {
  QUICK_REVIEW_TEMPLATE_TYPES,
  type QuickReviewTemplate,
  type QuickReviewTemplateType,
} from '../types';
import { medicalErrorMessage } from '../validation/schemas';

const CATEGORY_ICON: Record<QuickReviewTemplateType, IconName> = {
  VACCINE: 'shield-checkmark-outline',
  TREATMENT: 'medical-outline',
  DIAGNOSIS: 'pulse-outline',
  GENERAL: 'heart-outline',
};
const PREVIEW_COUNT = 4;

type Step = 'pet' | 'select' | 'detail';

/**
 * Route `/clinic-dashboard/[organizationId]/quick-review[?animalId=]` — legacy
 * `clinic-quick-review`: pick the animal (unless given) → category + clinic
 * template → date / next due / notes → save. Exactly as the legacy rule, a
 * VACCINE / TREATMENT action becomes a vaccination (name = template name or the
 * notes, next due from the template interval); every other action becomes a
 * `QUICK_REVIEW` medical record (diagnosis / treatment from the template, else
 * the notes).
 */
export default function QuickReviewScreen() {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const toast = useToast();
  const params = useLocalSearchParams<{ organizationId: string; animalId?: string }>();
  const orgId = params.organizationId ?? '';
  const [animalId, setAnimalId] = useState<string | undefined>(params.animalId || undefined);
  const [step, setStep] = useState<Step>(params.animalId ? 'select' : 'pet');

  const templatesQ = useQuickReviewTemplates(orgId);
  const [category, setCategory] = useState<QuickReviewTemplateType | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [template, setTemplate] = useState<QuickReviewTemplate | null>(null);
  const [actionCategory, setActionCategory] = useState<QuickReviewTemplateType>('GENERAL');

  const [actionDate, setActionDate] = useState(todayIso());
  const [nextDue, setNextDue] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createRecord = useCreateMedicalRecord(orgId, animalId ?? '');
  const createVaccination = useCreateVaccination(orgId, animalId ?? '');
  const saving = createRecord.isPending || createVaccination.isPending;

  const templates = useMemo(
    () => (templatesQ.data ?? []).filter((tpl) => !category || tpl.templateType === category),
    [templatesQ.data, category],
  );
  const shown = showAll ? templates : templates.slice(0, PREVIEW_COUNT);

  const openTemplate = (tpl: QuickReviewTemplate | null) => {
    const cat = tpl?.templateType ?? category ?? 'GENERAL';
    setTemplate(tpl);
    setActionCategory(cat);
    setNotes(tpl?.defaultNotes ?? '');
    setNextDue(tpl?.intervalDays ? addDaysIso(actionDate, tpl.intervalDays) : '');
    setError(null);
    setStep('detail');
  };

  const doseLabel = (days: number | null | undefined): string | null => {
    if (!days) return null;
    if (days >= 365) return t('quickReview.yearly');
    if (days >= 180) return t('quickReview.halfYearly');
    return t('quickReview.everyDays', { count: days });
  };

  const onSaved = () => {
    toast.show({ tone: 'success', message: t('quickReview.saved') });
    router.back();
  };
  const onError = (e: unknown) => setError(medicalErrorMessage(e, t));

  const save = () => {
    setError(null);
    if (!animalId) return;
    const day = normalizeIsoDate(actionDate);
    if (!day || day > todayIso()) {
      setError(t('records.errors.dateFuture'));
      return;
    }
    const due = nextDue ? normalizeIsoDate(nextDue) : null;
    if (nextDue && (!due || due < day)) {
      setError(t('vaccinations.errors.dueBeforeAdministered'));
      return;
    }
    const isVaccineOrTreatment = actionCategory === 'VACCINE' || actionCategory === 'TREATMENT';
    if (isVaccineOrTreatment) {
      const name = template?.name || notes.trim();
      if (!name) {
        setError(t('quickReview.nameRequired'));
        return;
      }
      createVaccination.mutate(
        {
          vaccineName: name,
          administeredOn: actionDate,
          nextDueOn: nextDue || undefined,
          notes: notes.trim() || undefined,
          status: nextDue ? 'SCHEDULED' : 'COMPLETED',
        },
        { onSuccess: onSaved, onError },
      );
      return;
    }
    const diagnosis = template?.defaultDiagnosis ?? notes.trim();
    const treatment = (template?.defaultTreatment ?? notes.trim()) || '—';
    if (!diagnosis) {
      setError(t('quickReview.notesRequired'));
      return;
    }
    createRecord.mutate(
      {
        recordType: 'QUICK_REVIEW',
        visitDate: actionDate,
        diagnosis,
        treatment,
        notes: notes.trim() || undefined,
      },
      { onSuccess: onSaved, onError },
    );
  };

  const goBack = () => {
    if (step === 'detail') return setStep('select');
    if (step === 'select' && !params.animalId) return setStep('pet');
    router.back();
  };

  const title =
    step === 'pet'
      ? t('quickReview.pickAnimal')
      : step === 'detail'
        ? t('quickReview.detailTitle')
        : t('quickReview.title');

  return (
    <SafeAreaScreen>
      <AppHeader title={title} showBack onBack={goBack} />

      {step === 'pet' ? (
        <ClinicAnimalPicker
          organizationId={orgId}
          placeholder={t('quickReview.searchAnimal')}
          emptyTitle={t('quickReview.noAnimals')}
          onPick={(g) => {
            setAnimalId(g.animalId);
            setStep('select');
          }}
        />
      ) : step === 'select' ? (
        <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.huge }}>
          <Section spacing="md">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Row gap="sm">
                <Chip
                  label={t('quickReview.allCategories')}
                  selected={category === null}
                  onPress={() => setCategory(null)}
                />
                {QUICK_REVIEW_TEMPLATE_TYPES.map((c) => (
                  <Chip
                    key={c}
                    label={t(`quickReview.category.${c}`)}
                    icon={CATEGORY_ICON[c]}
                    selected={category === c}
                    onPress={() => setCategory(c)}
                  />
                ))}
              </Row>
            </ScrollView>
          </Section>

          <Section spacing="md">
            <Row justify="space-between" align="center">
              <Label>{t('quickReview.templates')}</Label>
              <TextButton
                label={t('quickReview.settingsCta')}
                icon="settings-outline"
                onPress={() => router.push(Routes.clinicQuickReviewSettings(orgId))}
              />
            </Row>
            {templatesQ.isLoading ? (
              <Loading />
            ) : templatesQ.isError ? (
              <ErrorState error={templatesQ.error} onRetry={() => void templatesQ.refetch()} />
            ) : templates.length === 0 ? (
              <EmptyState icon="albums-outline" title={t('quickReview.noTemplates')} />
            ) : (
              <View style={{ rowGap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
                {shown.map((tpl) => (
                  <Card
                    key={tpl.id}
                    variant="outlined"
                    padding="md"
                    onPress={() => openTemplate(tpl)}
                    accessibilityLabel={tpl.name}
                  >
                    <Row gap="md">
                      <Icon name={CATEGORY_ICON[tpl.templateType]} size="iconMd" color="primary" />
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyMedium">{tpl.name}</Text>
                        <Caption>
                          {[
                            t(`quickReview.category.${tpl.templateType}`),
                            doseLabel(tpl.intervalDays),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </Caption>
                      </View>
                      <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
                    </Row>
                  </Card>
                ))}
                {templates.length > PREVIEW_COUNT ? (
                  <TextButton
                    label={showAll ? t('quickReview.showLess') : t('quickReview.showAll')}
                    onPress={() => setShowAll((v) => !v)}
                  />
                ) : null}
              </View>
            )}
          </Section>

          <Section spacing="md">
            <Button
              label={t('quickReview.customAction')}
              variant="outline"
              leftIcon="create-outline"
              onPress={() => openTemplate(null)}
            />
          </Section>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.md }}
          keyboardShouldPersistTaps="handled"
        >
          {error ? <Alert tone="danger" message={error} /> : null}
          <Card variant="outlined" padding="md">
            <Row gap="md">
              <Icon name={CATEGORY_ICON[actionCategory]} size="iconMd" color="primary" />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">
                  {template?.name ?? t(`quickReview.category.${actionCategory}`)}
                </Text>
                {doseLabel(template?.intervalDays) ? (
                  <Caption>
                    {t('quickReview.fieldDose')}: {doseLabel(template?.intervalDays)}
                  </Caption>
                ) : null}
              </View>
            </Row>
          </Card>
          {!template ? (
            <Row gap="sm" wrap>
              {QUICK_REVIEW_TEMPLATE_TYPES.map((c) => (
                <Chip
                  key={c}
                  label={t(`quickReview.category.${c}`)}
                  selected={actionCategory === c}
                  onPress={() => setActionCategory(c)}
                />
              ))}
            </Row>
          ) : null}
          <Input
            label={t('quickReview.fieldDate')}
            value={actionDate}
            onChangeText={(v) => {
              setActionDate(v);
              if (template?.intervalDays && isValidIsoDate(v)) {
                setNextDue(addDaysIso(v, template.intervalDays));
              }
            }}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
          />
          {actionCategory === 'VACCINE' || actionCategory === 'TREATMENT' ? (
            <Input
              label={t('quickReview.fieldNextDue')}
              value={nextDue}
              onChangeText={setNextDue}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
            />
          ) : null}
          <Input
            label={t('quickReview.fieldNotes')}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('quickReview.notesPlaceholder')}
            multiline
            numberOfLines={3}
          />
          <Button
            label={t('quickReview.save')}
            fullWidth
            loading={saving}
            disabled={saving}
            onPress={save}
          />
        </ScrollView>
      )}
    </SafeAreaScreen>
  );
}
