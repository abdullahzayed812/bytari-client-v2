import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, IconButton, TextButton } from '@/components/actions';
import { Avatar, Badge, Banner, Card, Chip, Divider, Icon } from '@/components/content';
import {
  Alert,
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Loading,
  Skeleton,
  SkeletonText,
  useToast,
} from '@/components/feedback';
import {
  Checkbox,
  Input,
  PasswordInput,
  Radio,
  SearchInput,
  Select,
  Switch,
} from '@/components/forms';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { BottomSheet, Modal } from '@/components/overlays';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { rawPalette } from '@/theme/colors';

/** DEV-ONLY. Visual verification of the design system. Not a production feature. */
export default function ShowcaseScreen() {
  const theme = useTheme();
  const { t } = useTranslation('showcase');
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState('a');
  const [switched, setSwitched] = useState(false);
  const [select, setSelect] = useState<string | null>('dog');
  const [modal, setModal] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const swatches = [
    ['primary', theme.colors.primary],
    ['surfaceAccent', theme.colors.surfaceAccent],
    ['success', theme.colors.success],
    ['warning', theme.colors.warning],
    ['danger', theme.colors.danger],
    ['info', theme.colors.info],
    ['green700', rawPalette.green700],
    ['gray300', rawPalette.gray300],
  ] as const;

  return (
    <ScrollScreen>
      <AppHeader title={t('title')} showBack />
      <Section spacing="lg">
        <Caption>{t('subtitle')}</Caption>
      </Section>

      <Section>
        <Label>{t('sections.typography')}</Label>
        <Heading level={1}>{t('title')}</Heading>
        <Heading level={2}>عنوان فرعي</Heading>
        <Heading level={3}>عنوان صغير</Heading>
        <Text variant="body">{t('sample.paragraph')}</Text>
        <Text variant="bodyMedium">نص متوسط الوزن</Text>
        <Caption>{t('sample.paragraph')}</Caption>
      </Section>

      <Section>
        <Label>{t('sections.colors')}</Label>
        <Row gap="sm" wrap>
          {swatches.map(([name, value]) => (
            <View key={name} style={{ alignItems: 'center', width: 72 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: theme.radius.md,
                  backgroundColor: value,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              />
              <Caption>{name}</Caption>
            </View>
          ))}
        </Row>
      </Section>

      <Section>
        <Label>{t('sections.buttons')}</Label>
        <View style={{ rowGap: theme.spacing.sm }}>
          <Button
            label={t('sample.buttonPrimary')}
            onPress={() => toast.show({ message: 'primary', tone: 'success' })}
          />
          <Button label="secondary" variant="secondary" />
          <Button label="outline" variant="outline" leftIcon="add" />
          <Button label="ghost" variant="ghost" rightIcon="arrow-forward" />
          <Button label="danger" variant="danger" />
          <Button label="loading" loading />
          <Row gap="md">
            <IconButton icon="heart-outline" accessibilityLabel="like" variant="soft" />
            <IconButton icon="share-outline" accessibilityLabel="share" variant="filled" />
            <TextButton label={t('sample.buttonSecondary')} icon="eye-outline" />
          </Row>
        </View>
      </Section>

      <Section>
        <Label>{t('sections.inputs')}</Label>
        <View style={{ rowGap: theme.spacing.md }}>
          <Input
            label={t('sample.inputLabel')}
            placeholder={t('sample.inputPlaceholder')}
            leftIcon="paw-outline"
          />
          <PasswordInput label="كلمة المرور" placeholder="••••••••" />
          <SearchInput
            placeholder="بحث…"
            value={search}
            onChangeText={setSearch}
            onClear={() => setSearch('')}
          />
          <Select
            label="النوع"
            value={select}
            onChange={setSelect}
            options={[
              { label: 'قط', value: 'cat' },
              { label: 'كلب', value: 'dog' },
              { label: 'طائر', value: 'bird' },
            ]}
          />
          <Checkbox label="أوافق على الشروط" checked={checked} onChange={setChecked} />
          <Row gap="lg">
            <Radio label="خيار أ" checked={radio === 'a'} onChange={() => setRadio('a')} />
            <Radio label="خيار ب" checked={radio === 'b'} onChange={() => setRadio('b')} />
          </Row>
          <Switch label="الإشعارات" value={switched} onValueChange={setSwitched} />
        </View>
      </Section>

      <Section>
        <Label>{t('sections.cards')}</Label>
        <Card>
          <Text variant="subtitle" weight="bold">
            بطاقة مرتفعة
          </Text>
          <Caption>ظل ناعم وحواف دائرية.</Caption>
        </Card>
        <View style={{ height: theme.spacing.md }} />
        <Card variant="accent">
          <Text variant="bodyMedium">سطح أخضر فاتح</Text>
        </Card>
      </Section>

      <Section>
        <Label>{t('sections.badges')}</Label>
        <Row gap="sm" wrap>
          <Badge label="جديد" tone="primary" />
          <Badge label="مكتمل" tone="success" />
          <Badge label="قيد الانتظار" tone="warning" />
          <Badge label="مرفوض" tone="danger" />
          <Chip label="فلتر" icon="options-outline" selected />
          <Chip label="غير محدد" />
        </Row>
      </Section>

      <Section>
        <Label>{t('sections.avatars')}</Label>
        <Row gap="md">
          <Avatar name="لولو قط" size="avatarSm" />
          <Avatar name="ريم أحمد" size="avatarMd" />
          <Avatar name="سالم" size="avatarLg" />
        </Row>
      </Section>

      <Section>
        <Label>{t('sections.banners')}</Label>
        <Banner
          title={t('sample.bannerTitle')}
          body={t('sample.bannerBody')}
          actionLabel={t('sample.buttonSecondary')}
        />
      </Section>

      <Section>
        <Label>{t('sections.feedback')}</Label>
        <Alert tone="info" title="معلومة" message="هذه رسالة معلوماتية." />
        <View style={{ height: theme.spacing.md }} />
        <Alert tone="danger" message="حدث خطأ في التحقق." />
        <Divider label="تحميل" />
        <Loading label={t('sample.errorTitle')} />
        <Divider label="هيكل" />
        <Skeleton height={20} />
        <View style={{ height: theme.spacing.sm }} />
        <SkeletonText lines={3} />
        <Divider label="فارغ" />
        <EmptyState
          title={t('sample.emptyTitle')}
          message={t('sample.paragraph')}
          actionLabel={t('sample.buttonSecondary')}
          onAction={() => {}}
        />
        <Divider label="خطأ" />
        <ErrorState
          title={t('sample.errorTitle')}
          error={
            new ApiError({
              code: 'SERVICE_UNAVAILABLE',
              message: 'x',
              status: 503,
              requestId: 'req_123',
            })
          }
          onRetry={() => toast.show({ message: 'retry', tone: 'info' })}
        />
      </Section>

      <Section spacing="giant">
        <Label>{t('sections.overlays')}</Label>
        <Row gap="md" wrap>
          <Button
            label={t('sample.openModal')}
            variant="secondary"
            onPress={() => setModal(true)}
          />
          <Button
            label={t('sample.openSheet')}
            variant="secondary"
            onPress={() => setSheet(true)}
          />
          <Button label="تأكيد" variant="outline" onPress={() => setConfirm(true)} />
          <Button
            label="Toast"
            variant="ghost"
            onPress={() => toast.show({ message: 'تم الحفظ', tone: 'success' })}
          />
        </Row>
        <Row gap="sm" style={{ marginTop: theme.spacing.md }}>
          <Icon name="chevron-back" directional color="textMuted" />
          <Caption>أيقونة اتجاهية تنعكس في RTL</Caption>
        </Row>
      </Section>

      <Modal visible={modal} onClose={() => setModal(false)} title="نافذة">
        <Text variant="body" color="textSecondary">
          {t('sample.paragraph')}
        </Text>
        <Button label={t('sample.buttonSecondary')} onPress={() => setModal(false)} />
      </Modal>

      <BottomSheet visible={sheet} onClose={() => setSheet(false)} title="لوحة سفلية">
        <Text variant="body" color="textSecondary">
          {t('sample.paragraph')}
        </Text>
      </BottomSheet>

      <ConfirmationDialog
        visible={confirm}
        title="تأكيد الإجراء"
        message="هل أنت متأكد؟"
        confirmLabel="نعم"
        cancelLabel="لا"
        onConfirm={() => setConfirm(false)}
        onCancel={() => setConfirm(false)}
      />
    </ScrollScreen>
  );
}
