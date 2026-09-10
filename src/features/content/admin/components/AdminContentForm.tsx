import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Chip } from '@/components/content';
import { Alert } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { Row } from '@/components/layout';
import { Label } from '@/components/typography';
import { useTheme } from '@/theme';

import type { ContentType } from '../../types';
import type { AdminCategory } from '../types';

export interface AdminContentFormValues {
  title: string;
  description: string;
  body: string;
  authorName: string;
  language: string;
  pageCount: string;
  publishYear: string;
  categoryIds: string[];
}

interface AdminContentFormProps {
  type: ContentType;
  mode: 'create' | 'edit';
  categories: AdminCategory[];
  defaultValues?: Partial<AdminContentFormValues>;
  submitting: boolean;
  formError?: string | null;
  onSubmit: (values: AdminContentFormValues) => void;
}

const EMPTY: AdminContentFormValues = {
  title: '',
  description: '',
  body: '',
  authorName: '',
  language: '',
  pageCount: '',
  publishYear: '',
  categoryIds: [],
};

/** Shared add/edit form for Veterinary Magazine (MAGAZINE) & Books (BOOK) admin. RHF + zod, RTL. */
export function AdminContentForm({
  type,
  mode,
  categories,
  defaultValues,
  submitting,
  formError,
  onSubmit,
}: AdminContentFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('content');

  const schema = useMemo(
    () =>
      z.object({
        title: z.string().trim().min(1, t('admin.form.errors.title')).max(300),
        description: z.string().trim().max(2000),
        body: z.string().max(50_000),
        authorName: z.string().trim().max(200),
        language: z.string().trim().max(50),
        pageCount: z.string().trim().regex(/^\d*$/, t('admin.form.errors.number')),
        publishYear: z.string().trim().regex(/^\d*$/, t('admin.form.errors.number')),
        categoryIds: z.array(z.string().uuid()),
      }),
    [t],
  );

  const { control, handleSubmit, watch, setValue } = useForm<AdminContentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...EMPTY, ...defaultValues },
    mode: 'onTouched',
  });

  const selectedCategoryIds = watch('categoryIds');
  const toggleCategory = (id: string) => {
    const next = selectedCategoryIds.includes(id)
      ? selectedCategoryIds.filter((c) => c !== id)
      : [...selectedCategoryIds, id];
    setValue('categoryIds', next, { shouldDirty: true });
  };

  return (
    <View style={{ rowGap: theme.spacing.md }}>
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <FormField control={control} name="title" label={t('admin.form.fieldTitle')} />
      <FormField
        control={control}
        name="authorName"
        label={t('admin.form.fieldAuthor')}
      />
      <FormField
        control={control}
        name="description"
        label={t('admin.form.fieldDescription')}
        multiline
        numberOfLines={3}
      />
      <FormField
        control={control}
        name="body"
        label={t('admin.form.fieldBody')}
        multiline
        numberOfLines={8}
      />

      {type === 'BOOK' ? (
        <>
          <FormField control={control} name="language" label={t('admin.form.fieldLanguage')} />
          <FormField
            control={control}
            name="pageCount"
            label={t('admin.form.fieldPageCount')}
            keyboardType="number-pad"
          />
          <FormField
            control={control}
            name="publishYear"
            label={t('admin.form.fieldPublishYear')}
            keyboardType="number-pad"
          />
        </>
      ) : null}

      <View style={{ rowGap: theme.spacing.sm }}>
        <Label>{t('admin.form.fieldCategories')}</Label>
        <Row gap="sm" wrap>
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              selected={selectedCategoryIds.includes(c.id)}
              onPress={() => toggleCategory(c.id)}
            />
          ))}
        </Row>
      </View>

      <Button
        label={mode === 'create' ? t('admin.form.submitCreate') : t('admin.form.submitSave')}
        fullWidth
        loading={submitting}
        disabled={submitting}
        onPress={handleSubmit(onSubmit)}
      />
    </View>
  );
}
