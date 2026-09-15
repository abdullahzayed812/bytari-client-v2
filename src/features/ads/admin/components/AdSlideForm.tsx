import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Input } from '@/components/forms';
import { useTheme } from '@/theme';

import type { AdSlide, AdSlideContentInput } from '../../types';

export interface AdSlideFormProps {
  initial?: AdSlide;
  submitting: boolean;
  onSubmit: (body: AdSlideContentInput) => void;
  onCancel: () => void;
}

/** Add / edit form for one slide's text fields. The image is a separate step (`AdSlideRow`'s `ImageUploader`, needs an existing slide id). */
export function AdSlideForm({ initial, submitting, onSubmit, onCancel }: AdSlideFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('ads');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? '');
  const [ctaLabel, setCtaLabel] = useState(initial?.ctaLabel ?? '');
  const [ctaUrl, setCtaUrl] = useState(initial?.ctaUrl ?? '');

  const submit = (): void => {
    onSubmit({
      title: title.trim() || null,
      subtitle: subtitle.trim() || null,
      ctaLabel: ctaLabel.trim() || null,
      ctaUrl: ctaUrl.trim() || null,
    });
  };

  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      <Input label={t('admin.slides.fieldTitle')} value={title} onChangeText={setTitle} />
      <Input label={t('admin.slides.fieldSubtitle')} value={subtitle} onChangeText={setSubtitle} />
      <Input label={t('admin.slides.fieldCtaLabel')} value={ctaLabel} onChangeText={setCtaLabel} />
      <Input
        label={t('admin.slides.fieldCtaUrl')}
        value={ctaUrl}
        onChangeText={setCtaUrl}
        autoCapitalize="none"
        keyboardType="url"
      />
      <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
        <View style={{ flex: 1 }}>
          <Button
            label={initial ? t('admin.slides.submitSave') : t('admin.slides.submitAdd')}
            loading={submitting}
            disabled={submitting}
            onPress={submit}
            fullWidth
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={t('admin.common.cancel')}
            variant="outline"
            disabled={submitting}
            onPress={onCancel}
            fullWidth
          />
        </View>
      </View>
    </View>
  );
}
