import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FlatList, ScrollView, View } from 'react-native';

import { Button, IconButton } from '@/components/actions';
import { Card, Chip, Icon } from '@/components/content';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Loading,
  useToast,
} from '@/components/feedback';
import { FormField } from '@/components/forms';
import { Row, SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { BottomSheet } from '@/components/overlays';
import { Caption, Label, Text } from '@/components/typography';
// Deep import (not the barrel) — keeps medical ↔ clinicDashboard acyclic.
import { useClinicPermissions } from '@/features/clinicDashboard/hooks';
import { useTheme } from '@/theme';

import {
  useDeleteQuickReviewTemplate,
  useQuickReviewTemplates,
  useSaveQuickReviewTemplate,
} from '../hooks';
import { QUICK_REVIEW_TEMPLATE_TYPES, type QuickReviewTemplate } from '../types';
import {
  buildTemplateSchema,
  medicalErrorMessage,
  type TemplateFormValues,
} from '../validation/schemas';

/**
 * Route `/clinic-dashboard/[organizationId]/quick-review-settings` — legacy
 * "إعدادات المراجعة السريعة": the clinic's quick-review templates (name,
 * category, default diagnosis / treatment / notes, next-due interval). Managing
 * needs `organization.update` (owner by default); everyone who can review sees
 * the list read-only. The backend enforces both.
 */
export default function QuickReviewSettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';
  const perms = useClinicPermissions(orgId);
  const canManage = perms?.canEditOrganization ?? false;

  const q = useQuickReviewTemplates(orgId);
  const save = useSaveQuickReviewTemplate(orgId);
  const del = useDeleteQuickReviewTemplate(orgId);
  const [editing, setEditing] = useState<QuickReviewTemplate | 'new' | null>(null);
  const [deleting, setDeleting] = useState<QuickReviewTemplate | null>(null);

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('templates.title')}
        showBack
        right={
          canManage ? (
            <IconButton
              icon="add"
              variant="soft"
              accessibilityLabel={t('templates.addCta')}
              onPress={() => setEditing('new')}
            />
          ) : undefined
        }
      />
      {perms && !canManage ? (
        <Caption style={{ paddingHorizontal: theme.screenPadding }}>
          {t('templates.readOnly')}
        </Caption>
      ) : null}

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.data ?? []}
          keyExtractor={(tpl) => tpl.id}
          contentContainerStyle={{
            padding: theme.screenPadding,
            rowGap: theme.spacing.sm,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <EmptyState
              icon="albums-outline"
              title={t('templates.empty')}
              message={t('templates.emptyHint')}
              actionLabel={canManage ? t('templates.addCta') : undefined}
              onAction={canManage ? () => setEditing('new') : undefined}
            />
          }
          renderItem={({ item }) => (
            <Card variant="outlined" padding="md">
              <Row gap="md" align="flex-start">
                <Icon name="albums-outline" size="iconMd" color="primary" />
                <View style={{ flex: 1, rowGap: 2 }}>
                  <Text variant="bodyStrong">{item.name}</Text>
                  <Caption>
                    {t(`quickReview.category.${item.templateType}`)}
                    {item.intervalDays
                      ? ` · ${t('quickReview.everyDays', { count: item.intervalDays })}`
                      : ''}
                  </Caption>
                  {item.defaultDiagnosis ? (
                    <Caption numberOfLines={1}>
                      {t('templates.fieldDiagnosis')}: {item.defaultDiagnosis}
                    </Caption>
                  ) : null}
                  {item.defaultTreatment ? (
                    <Caption numberOfLines={1}>
                      {t('templates.fieldTreatment')}: {item.defaultTreatment}
                    </Caption>
                  ) : null}
                  {item.defaultNotes ? (
                    <Caption numberOfLines={1}>
                      {t('templates.fieldNotes')}: {item.defaultNotes}
                    </Caption>
                  ) : null}
                </View>
                {canManage ? (
                  <Row gap="xs">
                    <IconButton
                      icon="create-outline"
                      size="sm"
                      accessibilityLabel={t('templates.editTitle')}
                      onPress={() => setEditing(item)}
                    />
                    <IconButton
                      icon="trash-outline"
                      size="sm"
                      accessibilityLabel={t('templates.delete')}
                      onPress={() => setDeleting(item)}
                    />
                  </Row>
                ) : null}
              </Row>
            </Card>
          )}
        />
      )}

      <BottomSheet
        visible={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? t('templates.addTitle') : t('templates.editTitle')}
      >
        {editing !== null ? (
          <TemplateForm
            template={editing === 'new' ? null : editing}
            submitting={save.isPending}
            onSubmit={(values) =>
              save.mutate(
                {
                  templateId: editing === 'new' ? undefined : editing.id,
                  body: {
                    name: values.name.trim(),
                    templateType: values.templateType,
                    defaultDiagnosis: values.defaultDiagnosis?.trim() || null,
                    defaultTreatment: values.defaultTreatment?.trim() || null,
                    defaultNotes: values.defaultNotes?.trim() || null,
                    intervalDays: values.intervalDays ? Number(values.intervalDays) : null,
                  },
                },
                {
                  onSuccess: () => {
                    toast.show({ tone: 'success', message: t('templates.saved') });
                    setEditing(null);
                  },
                  onError: (e) =>
                    toast.show({ tone: 'danger', message: medicalErrorMessage(e, t) }),
                },
              )
            }
          />
        ) : null}
      </BottomSheet>

      <ConfirmationDialog
        visible={deleting !== null}
        title={t('templates.deleteConfirmTitle')}
        message={t('templates.deleteConfirmBody')}
        confirmLabel={t('templates.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={del.isPending}
        onConfirm={() => {
          if (!deleting) return;
          del.mutate(
            { templateId: deleting.id },
            {
              onSuccess: () => toast.show({ tone: 'success', message: t('templates.deleted') }),
              onError: (e) => toast.show({ tone: 'danger', message: medicalErrorMessage(e, t) }),
            },
          );
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />
    </SafeAreaScreen>
  );
}

function TemplateForm({
  template,
  submitting,
  onSubmit,
}: {
  template: QuickReviewTemplate | null;
  submitting: boolean;
  onSubmit: (values: TemplateFormValues) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const schema = useMemo(() => buildTemplateSchema(t), [t]);
  const { control, handleSubmit, watch, setValue } = useForm<TemplateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: template?.name ?? '',
      templateType: template?.templateType ?? 'GENERAL',
      defaultDiagnosis: template?.defaultDiagnosis ?? '',
      defaultTreatment: template?.defaultTreatment ?? '',
      defaultNotes: template?.defaultNotes ?? '',
      intervalDays: template?.intervalDays ? String(template.intervalDays) : '',
    },
  });
  const type = watch('templateType');

  return (
    <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 560 }}>
      <FormField control={control} name="name" label={t('templates.fieldName')} />
      <View style={{ rowGap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
        <Label>{t('templates.fieldType')}</Label>
        <Row gap="sm" wrap>
          {QUICK_REVIEW_TEMPLATE_TYPES.map((c) => (
            <Chip
              key={c}
              label={t(`quickReview.category.${c}`)}
              selected={type === c}
              onPress={() => setValue('templateType', c)}
            />
          ))}
        </Row>
      </View>
      <FormField
        control={control}
        name="defaultDiagnosis"
        label={t('templates.fieldDiagnosis')}
        multiline
      />
      <FormField
        control={control}
        name="defaultTreatment"
        label={t('templates.fieldTreatment')}
        multiline
      />
      <FormField
        control={control}
        name="defaultNotes"
        label={t('templates.fieldNotes')}
        multiline
      />
      <FormField
        control={control}
        name="intervalDays"
        label={t('templates.fieldInterval')}
        hint={t('templates.intervalHint')}
        keyboardType="number-pad"
      />
      <Button
        label={t('templates.save')}
        fullWidth
        loading={submitting}
        disabled={submitting}
        onPress={handleSubmit(onSubmit)}
      />
      <View style={{ height: theme.spacing.lg }} />
    </ScrollView>
  );
}
