import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Icon, type IconName } from '@/components/content';
import { ErrorState, Loading, useToast } from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { Caption, Heading, Text } from '@/components/typography';
import { ImageCarousel, usePublicOrganization } from '@/features/organizations';
import { useTheme } from '@/theme';

import { veterinaryOfficeProductTypeIcon } from '../../constants';
import { usePublicVeterinaryOfficeProduct } from '../hooks';
import type { VeterinaryOfficeProduct } from '../../types';
import { formatProductPrice } from '../../utils';

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <Row justify="space-between" gap="lg">
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <Text style={{ flex: 1, textAlign: 'left' }}>{value}</Text>
    </Row>
  );
}

/** A public product's details — the office's contact info comes from its own profile. */
export default function PublicVeterinaryOfficeProductDetailsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinaryOffices');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const { officeId, productId } = useLocalSearchParams<{ officeId: string; productId: string }>();

  const q = usePublicVeterinaryOfficeProduct(officeId, productId);
  const office = usePublicOrganization(officeId, { enabled: Boolean(q.data) });

  if (q.isLoading) {
    return (
      <ScrollScreen padded={false}>
        <Loading fill />
      </ScrollScreen>
    );
  }
  if (q.isError || !q.data) {
    return (
      <ScrollScreen>
        <ErrorState error={q.error} title={t('product.notFound')} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }

  const product: VeterinaryOfficeProduct = q.data;
  const images = product.images.length > 0 ? product.images.map((i) => i.url) : [];

  const detailRows: { label: string; value: string | null }[] = [
    { label: t('product.category'), value: t(`productType.${product.productType}`) },
    { label: t('product.subtype'), value: product.subtype },
    { label: t('product.weight'), value: product.weight },
    { label: t('product.usage'), value: product.usageInstructions },
    { label: t('product.dosage'), value: product.dosage },
    { label: t('product.shelfLife'), value: product.shelfLife },
    { label: t('product.manufacturer'), value: product.manufacturer },
  ].filter((r) => r.value);

  const officePhone = office.data?.phone ?? null;
  const officeWhatsapp = office.data?.whatsapp ?? null;

  const onCall = () => {
    if (officePhone) void Linking.openURL(`tel:${officePhone}`);
  };
  const onWhatsapp = () => {
    if (officeWhatsapp) void Linking.openURL(`https://wa.me/${officeWhatsapp.replace(/\D/g, '')}`);
  };

  return (
    <ScrollScreen padded={false}>
      <View>
        {images.length > 0 ? (
          <ImageCarousel images={images} />
        ) : (
          <View
            style={{
              width: '100%',
              aspectRatio: 1,
              backgroundColor: theme.colors.surfaceAccent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={veterinaryOfficeProductTypeIcon(product.productType)} size="iconXl" color="primary" />
          </View>
        )}
        <View style={{ position: 'absolute', top: theme.spacing.md, end: theme.spacing.md }}>
          <Button
            label={t('product.favoriteA11y')}
            variant="secondary"
            size="sm"
            leftIcon="heart-outline"
            onPress={() => toast.show({ message: tc('comingSoon'), tone: 'info' })}
          />
        </View>
      </View>

      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.lg }}>
        <Section>
          <Heading level={2}>{product.name}</Heading>
          <Text
            variant="title"
            color="primary"
            style={{ marginTop: theme.spacing.sm, fontWeight: '700' }}
          >
            {product.price != null
              ? t('product.price', { value: formatProductPrice(product.price) })
              : t('product.noPrice')}
          </Text>
          {product.description ? (
            <Text style={{ marginTop: theme.spacing.md }}>{product.description}</Text>
          ) : null}
        </Section>

        {product.highlights.length > 0 ? (
          <Section>
            <Row gap="sm" wrap>
              {product.highlights.map((h) => (
                <View
                  key={h}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    columnGap: 4,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.radius.pill,
                    backgroundColor: theme.colors.primarySoft,
                  }}
                >
                  <Icon name={'checkmark-circle' as IconName} size="iconXs" color="primary" />
                  <Caption color="primary">{h}</Caption>
                </View>
              ))}
            </Row>
          </Section>
        ) : null}

        {detailRows.length > 0 ? (
          <Section>
            <Card padding="lg">
              <Row gap="xs">
                <Text variant="bodyStrong">{t('product.infoTitle')}</Text>
                <Icon name="information-circle-outline" size="iconSm" color="primary" />
              </Row>
              <View style={{ marginTop: theme.spacing.lg, rowGap: theme.spacing.md }}>
                {detailRows.map((r) => (
                  <DetailRow key={r.label} label={r.label} value={r.value as string} />
                ))}
              </View>
            </Card>
          </Section>
        ) : null}

        {officePhone || officeWhatsapp ? (
          <Section spacing="giant">
            <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.md }}>
              {t('product.contactOffice')}
            </Text>
            <Row gap="md">
              {officePhone ? (
                <Button label={t('product.call')} variant="outline" leftIcon="call" onPress={onCall} fullWidth />
              ) : null}
              {officeWhatsapp ? (
                <Button
                  label={t('product.whatsapp')}
                  leftIcon="logo-whatsapp"
                  onPress={onWhatsapp}
                  fullWidth
                />
              ) : null}
            </Row>
          </Section>
        ) : null}
      </View>
    </ScrollScreen>
  );
}
