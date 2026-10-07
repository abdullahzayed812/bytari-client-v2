import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, IconButton } from '@/components/actions';
import { Chip } from '@/components/content';
import { Alert } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { Row } from '@/components/layout';
import { Label, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import {
  MEDICAL_RECORD_SEVERITIES,
  type MedicalRecordInput,
  type MedicalRecordSeverity,
  type MedicalRecordType,
} from '../types';
import { buildMedicalRecordSchema, type MedicalRecordFormValues } from '../validation/schemas';

import { MedicalAttachmentsEditor, type MedicalAttachmentsValue } from './MedicalAttachmentsEditor';

export interface MedicalRecordFormProps {
  mode: 'create' | 'edit';
  /** Which legacy entry flow this is — decides the visible sections + rules. */
  recordType: MedicalRecordType;
  organizationId: string;
  animalId: string;
  defaultValues?: Partial<MedicalRecordFormValues>;
  defaultAttachments?: MedicalAttachmentsValue;
  /** Edit of an existing draft — keeps "save as draft" available. */
  isDraft?: boolean;
  submitting: boolean;
  formError?: string | null;
  serverFields?: Record<string, string>;
  onSubmit: (body: MedicalRecordInput, options: { isDraft: boolean }) => void;
}

const EMPTY: MedicalRecordFormValues = {
  visitDate: '',
  reason: '',
  diagnosis: '',
  symptoms: '',
  severity: '',
  treatment: '',
  instructions: '',
  labNotes: '',
  notes: '',
  medications: [],
};

const NO_ATTACHMENTS: MedicalAttachmentsValue = { prescription: null, attachments: [] };

/**
 * Shared add / edit medical-record form — the v2 home of the legacy entry
 * flows: full exam ("فحص كامل": diagnosis · symptoms · severity · treatment +
 * medications + instructions · lab · files · notes · save as draft), lab result
 * ("إضافة نتيجة تحليل"), file ("إضافة ملف") and the generic / quick-review edit.
 * RHF + zod mirror the backend; per-flow required fields mirror the legacy app.
 */
export function MedicalRecordForm({
  mode,
  recordType,
  organizationId,
  animalId,
  defaultValues,
  defaultAttachments = NO_ATTACHMENTS,
  isDraft = false,
  submitting,
  formError,
  serverFields = {},
  onSubmit,
}: MedicalRecordFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const schema = useMemo(() => buildMedicalRecordSchema(t), [t]);
  const [attachments, setAttachments] = useState<MedicalAttachmentsValue>(defaultAttachments);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { control, handleSubmit, setError, getValues, watch, setValue } =
    useForm<MedicalRecordFormValues>({
      resolver: zodResolver(schema),
      defaultValues: { ...EMPTY, ...defaultValues },
      mode: 'onTouched',
    });
  const meds = useFieldArray({ control, name: 'medications' });
  const severity = watch('severity');

  const isLab = recordType === 'LAB';
  const isFile = recordType === 'FILE';
  const isQuick = recordType === 'QUICK_REVIEW';
  const isFull = recordType === 'FULL_EXAM' || recordType === 'GENERAL';
  const canDraft = recordType === 'FULL_EXAM' && (mode === 'create' || isDraft);

  const toBody = (values: MedicalRecordFormValues, draft: boolean): MedicalRecordInput => {
    const clean = (s?: string) => (s?.trim() ? s.trim() : null);
    // Legacy full exam folded medications + instructions into the treatment text.
    const medLines = (values.medications ?? [])
      .filter((m) => m.name.trim())
      .map((m) =>
        [m.name.trim(), m.dosage?.trim(), m.duration?.trim()].filter(Boolean).join(' - '),
      );
    const treatment =
      [values.treatment?.trim(), medLines.join('\n'), values.instructions?.trim()]
        .filter(Boolean)
        .join('\n') || null;
    const body: MedicalRecordInput = {
      visitDate: values.visitDate?.trim() || undefined,
      reason: clean(values.reason),
      diagnosis: clean(values.diagnosis),
      treatment,
      notes: clean(values.notes),
      symptoms: clean(values.symptoms),
      severity: (values.severity || null) as MedicalRecordSeverity | null,
      labNotes: clean(values.labNotes),
      recordType,
      isDraft: draft,
      prescriptionKey: attachments.prescription?.key ?? null,
      attachmentKeys: attachments.attachments.map((a) => a.key),
    };
    if (mode === 'create') {
      // Create: omit empty fields instead of sending nulls.
      for (const k of Object.keys(body) as (keyof MedicalRecordInput)[]) {
        if (body[k] === null) delete body[k];
      }
    }
    return body;
  };

  /** Legacy per-flow required fields (the zod schema only mirrors backend types/lengths). */
  const passesFlowRules = (values: MedicalRecordFormValues, draft: boolean): boolean => {
    setLocalError(null);
    const has = (s?: string) => Boolean(s?.trim());
    if (isLab && !has(values.labNotes)) {
      setError('labNotes', { message: t('records.errorsExtra.labRequired') });
      return false;
    }
    if (isFile && !attachments.prescription && attachments.attachments.length === 0) {
      setLocalError(t('records.errorsExtra.fileRequired'));
      return false;
    }
    if (recordType === 'GENERAL') {
      const anything =
        [
          values.reason,
          values.diagnosis,
          values.treatment,
          values.notes,
          values.symptoms,
          values.labNotes,
        ].some(has) ||
        (values.medications ?? []).some((m) => has(m.name)) ||
        Boolean(attachments.prescription) ||
        attachments.attachments.length > 0;
      if (!anything) {
        setError('reason', { message: t('records.errors.atLeastOne') });
        return false;
      }
    }
    if (recordType === 'FULL_EXAM' || isQuick) {
      if (!has(values.diagnosis)) {
        setError('diagnosis', { message: t('records.errorsExtra.diagnosisRequired') });
        return false;
      }
      const hasMeds = (values.medications ?? []).some((m) => has(m.name));
      if (!draft && !has(values.treatment) && !hasMeds) {
        setError('treatment', { message: t('records.errorsExtra.treatmentRequired') });
        return false;
      }
    }
    return true;
  };

  const submit = (draft: boolean) =>
    handleSubmit((values) => {
      if (!passesFlowRules(values, draft)) return;
      onSubmit(toBody(values, draft), { isDraft: draft });
    });

  const saveDraft = () => {
    // A draft only needs a diagnosis (legacy rule) — skip the full resolver.
    const values = getValues();
    if (!passesFlowRules(values, true)) return;
    onSubmit(toBody(values, true), { isDraft: true });
  };

  const busy = submitting || uploading;

  return (
    <>
      {formError ? <Alert tone="danger" message={formError} /> : null}
      {localError ? <Alert tone="danger" message={localError} /> : null}

      <FormField
        control={control}
        name="visitDate"
        label={t('records.fieldVisitDate')}
        placeholder="YYYY-MM-DD"
        hint={t('records.visitDateHint')}
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        serverError={serverFields.visitDate}
      />

      {/* --- التشخيص ------------------------------------------------ */}
      {isFull || isQuick || isFile ? (
        <SectionTitle label={isFile ? t('records.sectionFiles') : t('records.sectionDiagnosis')} />
      ) : null}
      {isFull ? (
        <FormField
          control={control}
          name="reason"
          label={t('records.fieldReason')}
          placeholder={t('records.reasonPlaceholder')}
          multiline
          numberOfLines={2}
          serverError={serverFields.reason}
        />
      ) : null}
      {isFull || isQuick || isFile ? (
        <FormField
          control={control}
          name="diagnosis"
          label={isFile ? t('records.fieldFileDescription') : t('records.fieldDiagnosis')}
          placeholder={
            isFile ? t('records.fileDescriptionPlaceholder') : t('records.diagnosisPlaceholder')
          }
          multiline
          numberOfLines={3}
          serverError={serverFields.diagnosis}
        />
      ) : null}
      {isFull ? (
        <>
          <FormField
            control={control}
            name="symptoms"
            label={t('records.fieldSymptoms')}
            placeholder={t('records.symptomsPlaceholder')}
            multiline
            numberOfLines={2}
            serverError={serverFields.symptoms}
          />
          <View style={{ rowGap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
            <Label>{t('records.fieldSeverity')}</Label>
            <Row gap="sm" wrap>
              {MEDICAL_RECORD_SEVERITIES.map((s) => (
                <Chip
                  key={s}
                  label={t(`records.severity.${s}`)}
                  selected={severity === s}
                  onPress={() => setValue('severity', severity === s ? '' : s)}
                />
              ))}
            </Row>
          </View>
        </>
      ) : null}

      {/* --- العلاج -------------------------------------------------- */}
      {isFull || isQuick ? (
        <>
          <SectionTitle label={t('records.sectionTreatment')} />
          <FormField
            control={control}
            name="treatment"
            label={t('records.fieldTreatment')}
            placeholder={t('records.treatmentPlaceholder')}
            multiline
            numberOfLines={3}
            serverError={serverFields.treatment}
          />
        </>
      ) : null}
      {isFull ? (
        <View style={{ rowGap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
          <Label>{t('records.medicationsTitle')}</Label>
          {meds.fields.map((field, index) => (
            <View
              key={field.id}
              style={{
                padding: theme.spacing.sm,
                borderRadius: theme.radius.lg,
                borderWidth: theme.sizes.hairline,
                borderColor: theme.colors.border,
              }}
            >
              <Row justify="space-between" align="center">
                <Text variant="label">{`${index + 1}`}</Text>
                <IconButton
                  icon="close"
                  size="sm"
                  accessibilityLabel={t('records.removeMedication')}
                  onPress={() => meds.remove(index)}
                />
              </Row>
              <FormField
                control={control}
                name={`medications.${index}.name`}
                label={t('records.medName')}
                placeholder={t('records.medName')}
              />
              <Row gap="sm">
                <View style={{ flex: 1 }}>
                  <FormField
                    control={control}
                    name={`medications.${index}.dosage`}
                    label={t('records.medDosage')}
                    placeholder={t('records.medDosage')}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField
                    control={control}
                    name={`medications.${index}.duration`}
                    label={t('records.medDuration')}
                    placeholder={t('records.medDuration')}
                  />
                </View>
              </Row>
            </View>
          ))}
          <Button
            label={t('records.addMedication')}
            variant="outline"
            size="sm"
            leftIcon="add"
            onPress={() => meds.append({ name: '', dosage: '', duration: '' })}
          />
          <FormField
            control={control}
            name="instructions"
            label={t('records.fieldInstructions')}
            placeholder={t('records.instructionsPlaceholder')}
            multiline
            numberOfLines={2}
          />
        </View>
      ) : null}

      {/* --- التحاليل ----------------------------------------------- */}
      {isFull || isLab ? (
        <>
          <SectionTitle label={t('records.sectionLab')} />
          <FormField
            control={control}
            name="labNotes"
            label={t('records.fieldLabNotes')}
            placeholder={t('records.labNotesPlaceholder')}
            multiline
            numberOfLines={4}
            serverError={serverFields.labNotes}
          />
        </>
      ) : null}

      {/* --- الملفات ------------------------------------------------ */}
      {isFull || isFile ? (
        <>
          {isFull ? <SectionTitle label={t('records.sectionFiles')} /> : null}
          <View style={{ marginBottom: theme.spacing.md }}>
            <MedicalAttachmentsEditor
              organizationId={organizationId}
              animalId={animalId}
              value={attachments}
              onChange={setAttachments}
              onBusyChange={setUploading}
            />
          </View>
        </>
      ) : null}

      {/* --- الملاحظات ---------------------------------------------- */}
      {isFile ? null : (
        <>
          <SectionTitle label={t('records.sectionNotes')} />
          <FormField
            control={control}
            name="notes"
            label={t('records.fieldNotes')}
            placeholder={t('records.notesPlaceholder')}
            multiline
            numberOfLines={3}
            serverError={serverFields.notes}
          />
        </>
      )}

      <View style={{ marginTop: theme.spacing.sm, rowGap: theme.spacing.sm }}>
        <Button
          label={mode === 'create' ? t('records.submitCreate') : t('records.submitSave')}
          fullWidth
          loading={submitting}
          disabled={busy}
          onPress={submit(false)}
          accessibilityLabel={
            mode === 'create' ? t('records.submitCreate') : t('records.submitSave')
          }
        />
        {canDraft ? (
          <Button
            label={t('records.saveDraft')}
            variant="outline"
            fullWidth
            disabled={busy}
            onPress={saveDraft}
          />
        ) : null}
      </View>
    </>
  );
}

function SectionTitle({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <Text
      variant="bodyStrong"
      color="primary"
      style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.xs }}
    >
      {label}
    </Text>
  );
}
