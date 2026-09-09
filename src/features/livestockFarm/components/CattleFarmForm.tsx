import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Icon, type IconName } from '@/components/content';
import { Alert, useToast } from '@/components/feedback';
import { Checkbox, FormField, Select, TileOptionGroup } from '@/components/forms';
import { ImagePreview } from '@/components/media';
import { Caption, Label, Text } from '@/components/typography';
import { IRAQ_GOVERNORATES } from '@/constants/governorates';
import { apiErrorMessage } from '@/lib/apiError';
import { isPermissionError, pickImage, type LocalFile } from '@/services/media';
import { useTheme } from '@/theme';

import { CATTLE_PRODUCTION_TYPE_ORDER } from '../constants';
import type { CattleProductionType } from '../types';
import { buildCreateCattleFarmSchema, type CreateCattleFarmFormValues } from '../validation/schemas';

export interface CattleFarmFormProps {
  defaultValues?: Partial<CreateCattleFarmFormValues>;
  submitting: boolean;
  formError?: string | null;
  serverFields?: Record<string, string>;
  onSubmit: (values: CreateCattleFarmFormValues, image: LocalFile | null) => void;
}

/**
 * Starter values — the form opens pre-filled so it's one review away from
 * submit. Screen-level `defaultValues` (the signed-in user's contact info)
 * still take precedence, and the user must actively accept the terms.
 */
const DEFAULTS: CreateCattleFarmFormValues = {
  name: 'مزرعة الأبقار النموذجية',
  location: 'بغداد',
  governorate: 'بغداد',
  cattleProductionType: 'DAIRY',
  description: 'مزرعة لتربية الأبقار لإنتاج الحليب.',
  address: 'حي الجامعة، شارع 14',
  capacity: '150',
  currentCattleCount: '80',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  termsAccepted: false,
};

function FormCard({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Card variant="outlined" padding="lg" style={{ rowGap: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
        <Icon name={icon} size="iconSm" color="primary" />
        <Label>{title}</Label>
      </View>
      {children}
    </Card>
  );
}

/** "Add Cattle Farm" form — mirrors `SheepFarmForm`/`PoultryFarmForm` exactly. */
export function CattleFarmForm({ defaultValues, submitting, formError, serverFields = {}, onSubmit }: CattleFarmFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('sheepCattleFarm');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const schema = useMemo(() => buildCreateCattleFarmSchema(t), [t]);
  const [image, setImage] = useState<LocalFile | null>(null);

  const { control, handleSubmit } = useForm<CreateCattleFarmFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...DEFAULTS, ...defaultValues },
    mode: 'onTouched',
  });

  const pick = async (): Promise<void> => {
    try {
      const file = await pickImage({ source: 'library', allowsEditing: true });
      if (file) setImage(file);
    } catch (error) {
      toast.show({
        message: isPermissionError(error) ? tc('media.permissionBody') : apiErrorMessage(error),
        tone: isPermissionError(error) ? 'warning' : 'danger',
      });
    }
  };

  const governorateOptions = useMemo(() => IRAQ_GOVERNORATES.map((g) => ({ label: g, value: g })), []);
  const productionOptions: { value: CattleProductionType; icon: IconName; label: string }[] =
    CATTLE_PRODUCTION_TYPE_ORDER.map((v) => ({
      value: v,
      icon: 'paw-outline',
      label: t(`create.cattleProduction.${v}`),
    }));

  const submit = handleSubmit((values) => onSubmit(values, image));

  return (
    <View style={{ rowGap: theme.spacing.lg }}>
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <FormCard icon="create-outline" title={t('create.sections.basic')}>
        <FormField control={control} name="name" label={t('create.fields.name')} serverError={serverFields.name} />
        <FormField control={control} name="location" label={t('create.fields.location')} serverError={serverFields.location} />
        <Controller
          control={control}
          name="governorate"
          render={({ field: { value, onChange }, fieldState }) => (
            <Select
              label={t('create.fields.governorate')}
              placeholder={t('create.placeholders.governorate')}
              value={value || null}
              options={governorateOptions}
              onChange={onChange}
              error={fieldState.error?.message ?? serverFields.governorate}
            />
          )}
        />
        <FormField control={control} name="description" label={t('create.fields.description')} multiline numberOfLines={3} serverError={serverFields.description} />
        <FormField control={control} name="address" label={t('create.fields.address')} multiline numberOfLines={2} serverError={serverFields.address} />
      </FormCard>

      <FormCard icon="pulse-outline" title={t('create.fields.production')}>
        <Controller
          control={control}
          name="cattleProductionType"
          render={({ field: { value, onChange }, fieldState }) => (
            <TileOptionGroup options={productionOptions} value={value} onChange={onChange} error={fieldState.error?.message} />
          )}
        />
      </FormCard>

      <FormCard icon="people-outline" title={t('create.sections.capacity')}>
        <FormField control={control} name="capacity" label={t('create.fields.capacity')} keyboardType="number-pad" serverError={serverFields.capacity} />
        <FormField control={control} name="currentCattleCount" label={t('create.fields.currentCattleCount')} keyboardType="number-pad" serverError={serverFields.currentCattleCount} />
      </FormCard>

      <FormCard icon="call-outline" title={t('create.sections.contact')}>
        <FormField control={control} name="contactName" label={t('create.fields.contactName')} serverError={serverFields.contactName} />
        <FormField control={control} name="contactPhone" label={t('create.fields.contactPhone')} keyboardType="phone-pad" serverError={serverFields.contactPhone} />
        <FormField control={control} name="contactEmail" label={t('create.fields.contactEmail')} keyboardType="email-address" autoCapitalize="none" serverError={serverFields.contactEmail} />
      </FormCard>

      <FormCard icon="image-outline" title={t('create.sections.image')}>
        <Label>{t('create.fields.image')}</Label>
        {image ? (
          <ImagePreview uri={image.uri} size={120} onRemove={() => setImage(null)} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('create.addImage')}
            onPress={() => void pick()}
            style={{
              width: 120,
              height: 120,
              borderRadius: theme.radius.lg,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.surfaceAccent,
              alignItems: 'center',
              justifyContent: 'center',
              rowGap: 4,
            }}
          >
            <Icon name="add" size="iconLg" color="primary" />
            <Text variant="label" color="primary">
              {t('create.addImage')}
            </Text>
            <Caption>0/1</Caption>
          </Pressable>
        )}
      </FormCard>

      <Controller
        control={control}
        name="termsAccepted"
        render={({ field: { value, onChange }, fieldState }) => (
          <View style={{ rowGap: 4 }}>
            <Checkbox
              label={t('create.terms')}
              checked={value === true}
              onChange={(next) => onChange(next)}
            />
            {fieldState.error ? <Caption style={{ color: theme.colors.danger }}>{fieldState.error.message}</Caption> : null}
          </View>
        )}
      />

      <Button label={t('create.submit')} leftIcon="create-outline" fullWidth loading={submitting} onPress={submit} />
    </View>
  );
}
