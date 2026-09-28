import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { TextButton } from '@/components/actions';
import { ErrorState, Loading, useToast } from '@/components/feedback';
import { ImagePreview, ImageUploader } from '@/components/media';
import { Caption, Label } from '@/components/typography';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';

import { OrganizationForm, OrgFormLayout } from '../components';
import {
  useOrganization,
  useOrganizationGalleryPresignProvider,
  useOrganizationLicenseDocumentPresignProvider,
  useOrganizationLogoPresignProvider,
  useRemoveOrganizationGalleryImage,
  useRemoveOrganizationLicenseDocument,
  useRemoveOrganizationLogo,
  useUpdateOrganization,
} from '../hooks';
import {
  LICENSABLE_ORG_TYPES,
  PROFILE_FIELDS_ORG_TYPES,
  type UpdateOrganizationInput,
} from '../types';
import { servicesToArray, type EditOrganizationFormValues } from '../validation/schemas';

const MAX_GALLERY_IMAGES = 8;
const MAX_LICENSE_DOCUMENTS = 3;

/**
 * One stored license photo: tap / "change image" swaps it in place through
 * the server's `replacesStorageKey` flow (works even at the 3-photo cap);
 * × deletes it server-side after a confirmation.
 */
function LicenseDocumentTile({
  organizationId,
  url,
  storageKey,
  removing,
  onRemove,
}: {
  organizationId: string;
  url: string;
  storageKey: string;
  removing: boolean;
  onRemove: () => void;
}) {
  const { t } = useTranslation('organizations');
  const toast = useToast();
  const provider = useOrganizationLicenseDocumentPresignProvider(organizationId, storageKey);
  return (
    <ImageUploader
      value={url}
      provider={provider}
      edit={false}
      size={88}
      replaceable
      disabled={removing}
      onRemove={onRemove}
      onChange={(result) => {
        if (result) toast.show({ tone: 'success', message: t('form.licenseReplaced') });
      }}
    />
  );
}

/** `''` clears an optional field; anything else is trimmed and sent as-is. */
function clearable(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/**
 * Route `/organizations/[organizationId]/edit` — name/description always,
 * plus the full profile field set (address/contact/social/license) for
 * CLINIC / VETERINARY_OFFICE / VETERINARY_STORE, plus logo upload/replace/
 * remove. `type`, `status`, ownership and approval are never sent. The
 * backend enforces `organization.update`; a caller without it gets a 403 that
 * is mapped to a safe Arabic message.
 */
export default function OrganizationEditScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';
  const q = useOrganization(orgId);
  const update = useUpdateOrganization(orgId);
  const removeLogo = useRemoveOrganizationLogo(orgId);
  const logoPresign = useOrganizationLogoPresignProvider(orgId);
  const galleryPresign = useOrganizationGalleryPresignProvider(orgId);
  const removeGalleryImage = useRemoveOrganizationGalleryImage(orgId);
  const licensePresign = useOrganizationLicenseDocumentPresignProvider(orgId);
  const removeLicenseDocument = useRemoveOrganizationLicenseDocument(orgId);

  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const [logoKey, setLogoKey] = useState(0);
  const [galleryUploadKey, setGalleryUploadKey] = useState(0);
  const [licenseUploadKey, setLicenseUploadKey] = useState(0);

  if (q.isLoading) {
    return (
      <OrgFormLayout title={t('form.editTitle')}>
        <Loading fill />
      </OrgFormLayout>
    );
  }
  if (q.isError || !q.data) {
    const denied =
      q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
    return (
      <OrgFormLayout title={t('form.editTitle')}>
        <ErrorState
          error={q.error}
          title={denied ? t('detail.notAvailableTitle') : undefined}
          onRetry={denied ? undefined : () => void q.refetch()}
        />
      </OrgFormLayout>
    );
  }

  const org = q.data;
  const hasProfileFields = PROFILE_FIELDS_ORG_TYPES.includes(org.type);
  const isLicensable = LICENSABLE_ORG_TYPES.includes(org.type);

  const defaultValues: EditOrganizationFormValues = {
    name: org.name,
    description: org.description ?? '',
    address: org.details.address ?? '',
    country: org.details.country ?? '',
    phone: org.details.phone ?? '',
    workingHours: org.details.workingHours ?? '',
    services: org.details.services?.join(', ') ?? '',
    email: org.details.email ?? '',
    whatsapp: org.details.whatsapp ?? '',
    websiteUrl: org.details.websiteUrl ?? '',
    facebookUrl: org.details.facebookUrl ?? '',
    instagramUrl: org.details.instagramUrl ?? '',
    tiktokUrl: org.details.tiktokUrl ?? '',
    licenseNumber: org.details.licenseNumber ?? '',
  };

  const onSubmit = (values: EditOrganizationFormValues) => {
    if (inFlight.current || update.isPending) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    const payload: UpdateOrganizationInput = {
      name: values.name.trim(),
      description: clearable(values.description),
    };
    if (hasProfileFields) {
      payload.address = clearable(values.address);
      payload.country = clearable(values.country);
      payload.phone = clearable(values.phone);
      payload.workingHours = clearable(values.workingHours);
      payload.services = servicesToArray(values.services);
      payload.email = clearable(values.email);
      payload.whatsapp = clearable(values.whatsapp);
      payload.websiteUrl = clearable(values.websiteUrl);
      payload.facebookUrl = clearable(values.facebookUrl);
      payload.instagramUrl = clearable(values.instagramUrl);
      payload.tiktokUrl = clearable(values.tiktokUrl);
      if (isLicensable) payload.licenseNumber = clearable(values.licenseNumber);
    }
    update.mutate(payload, {
      onSuccess: () => {
        toast.show({ tone: 'success', message: t('form.editSuccess') });
        router.back();
      },
      onError: (error) => {
        setServerFields(fieldErrors(error));
        setFormError(apiErrorMessage(error));
      },
      onSettled: () => {
        inFlight.current = false;
      },
    });
  };

  return (
    <OrgFormLayout title={t('form.editTitle')}>
      {hasProfileFields ? (
        <View
          style={{ alignItems: 'center', rowGap: theme.spacing.xs, marginBottom: theme.spacing.md }}
        >
          <Label>{t('form.logoLabel')}</Label>
          <ImageUploader
            key={logoKey}
            value={org.details.logoUrl}
            provider={logoPresign}
            edit={{ aspects: ['1:1'], defaultAspect: '1:1', defaultMaxDimension: 1280 }}
            shape="circle"
            size={96}
            onChange={(result) => {
              if (result) {
                setLogoKey((k) => k + 1);
                toast.show({ tone: 'success', message: t('form.logoUpdated') });
              }
            }}
          />
          {org.details.logoUrl ? (
            <TextButton
              label={t('form.logoRemoveCta')}
              icon="trash-outline"
              tone="danger"
              disabled={removeLogo.isPending}
              onPress={() =>
                removeLogo.mutate(undefined, {
                  onSuccess: () => toast.show({ tone: 'success', message: t('form.logoRemoved') }),
                  onError: (error) =>
                    toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
                })
              }
            />
          ) : null}
        </View>
      ) : null}

      {hasProfileFields ? (
        <View style={{ rowGap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
          <Label>{t('form.galleryLabel')}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {(org.details.galleryUrls ?? []).map((url, index) => {
              const key = org.details.galleryKeys?.[index];
              return (
                <ImagePreview
                  key={url}
                  uri={url}
                  size={88}
                  onRemove={
                    key
                      ? () =>
                          removeGalleryImage.mutate(key, {
                            onError: (error) =>
                              toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
                          })
                      : undefined
                  }
                />
              );
            })}
            {(org.details.galleryUrls?.length ?? 0) < MAX_GALLERY_IMAGES ? (
              <ImageUploader
                key={galleryUploadKey}
                value={null}
                provider={galleryPresign}
                icon="add"
                size={88}
                onChange={(result) => {
                  if (result) setGalleryUploadKey((k) => k + 1);
                }}
              />
            ) : null}
          </View>
        </View>
      ) : null}

      {isLicensable ? (
        <View style={{ rowGap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
          <Label>{t('form.licenseImagesLabel')}</Label>
          <Caption>{t('form.licenseImagesHint', { max: MAX_LICENSE_DOCUMENTS })}</Caption>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
            {(org.details.licenseDocumentUrls ?? []).map((url, index) => {
              const key = org.details.licenseDocumentKeys?.[index];
              return key ? (
                <LicenseDocumentTile
                  key={key}
                  organizationId={orgId}
                  url={url}
                  storageKey={key}
                  removing={removeLicenseDocument.isPending}
                  onRemove={() =>
                    Alert.alert(t('form.licenseRemoveTitle'), t('form.licenseRemoveBody'), [
                      { text: t('form.cancel'), style: 'cancel' },
                      {
                        text: t('form.licenseRemoveCta'),
                        style: 'destructive',
                        onPress: () =>
                          removeLicenseDocument.mutate(key, {
                            onSuccess: () =>
                              toast.show({ tone: 'success', message: t('form.licenseRemoved') }),
                            onError: (error) =>
                              toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
                          }),
                      },
                    ])
                  }
                />
              ) : (
                <ImagePreview key={url} uri={url} size={88} />
              );
            })}
            {(org.details.licenseDocumentUrls?.length ?? 0) < MAX_LICENSE_DOCUMENTS ? (
              <ImageUploader
                key={licenseUploadKey}
                value={null}
                provider={licensePresign}
                // License documents are kept exactly as photographed.
                edit={false}
                icon="add"
                size={88}
                onChange={(result) => {
                  if (result) {
                    setLicenseUploadKey((k) => k + 1);
                    toast.show({ tone: 'success', message: t('form.licenseUploaded') });
                  }
                }}
              />
            ) : null}
          </View>
        </View>
      ) : null}

      <OrganizationForm
        mode="edit"
        orgType={org.type}
        defaultValues={defaultValues}
        submitting={update.isPending}
        formError={formError}
        serverFields={serverFields}
        onSubmit={onSubmit}
      />
    </OrgFormLayout>
  );
}
