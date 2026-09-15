import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card, Divider } from '@/components/content';
import { ConfirmationDialog, EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { Input } from '@/components/forms';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { AdSlideForm, AdSlideRow } from '../components';
import { useAdminAdCampaign, useAdminAdCampaignMutations, useAdminAdSlideMutations } from '../hooks';

type SlideEditorState = { mode: 'add' } | { mode: 'edit'; slideId: string } | null;

/** Route `/(app)/admin/ads/[placement]/[campaignId]` — one campaign: info + slides. */
export default function AdminAdCampaignDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('ads');
  const toast = useToast();
  const { campaignId } = useLocalSearchParams<{ placement: string; campaignId: string }>();

  const q = useAdminAdCampaign(campaignId);
  const { update, remove, restore, activate, deactivate } = useAdminAdCampaignMutations();
  const slideMutations = useAdminAdSlideMutations(campaignId ?? '');

  const [editingInfo, setEditingInfo] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [sortOrderDraft, setSortOrderDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [slideEditor, setSlideEditor] = useState<SlideEditorState>(null);
  const [confirmDeleteSlideId, setConfirmDeleteSlideId] = useState<string | null>(null);

  const notFound = q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
  if (notFound) {
    return (
      <ScrollScreen>
        <AppHeader title={t('admin.detail.title')} showBack />
        <EmptyState
          icon="megaphone-outline"
          title={t('admin.detail.notFoundTitle')}
          message={t('admin.detail.notFoundBody')}
        />
      </ScrollScreen>
    );
  }
  if (q.isError) {
    return (
      <ScrollScreen>
        <AppHeader title={t('admin.detail.title')} showBack />
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }

  const campaign = q.data;
  const busy = update.isPending || remove.isPending || restore.isPending || activate.isPending || deactivate.isPending;
  const bannerLimitReached = campaign?.type === 'BANNER' && (campaign?.slides.length ?? 0) >= 1;

  const startEditInfo = () => {
    if (!campaign) return;
    setTitleDraft(campaign.title);
    setSortOrderDraft(String(campaign.sortOrder));
    setEditingInfo(true);
  };

  const saveInfo = () => {
    if (!campaign) return;
    update.mutate(
      { campaignId: campaign.id, body: { title: titleDraft.trim(), sortOrder: Number(sortOrderDraft) || 0 } },
      {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('admin.detail.saveSuccess') });
          setEditingInfo(false);
        },
        onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
      },
    );
  };

  const toggleActive = () => {
    if (!campaign) return;
    const action = campaign.isActive ? deactivate : activate;
    action.mutate(campaign.id, {
      onSuccess: () =>
        toast.show({
          tone: 'success',
          message: t(campaign.isActive ? 'admin.detail.deactivateSuccess' : 'admin.detail.activateSuccess'),
        }),
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  const onDelete = () => {
    if (!campaign) return;
    setConfirmDelete(false);
    remove.mutate(campaign.id, {
      onSuccess: () => {
        toast.show({ tone: 'success', message: t('admin.detail.deleteSuccess') });
        router.back();
      },
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  const onRestore = () => {
    if (!campaign) return;
    restore.mutate(campaign.id, {
      onSuccess: () => toast.show({ tone: 'success', message: t('admin.detail.restoreSuccess') }),
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  const onSlideSubmit = (body: Parameters<typeof slideMutations.addSlide.mutate>[0]) => {
    if (slideEditor?.mode === 'edit') {
      slideMutations.updateSlide.mutate(
        { slideId: slideEditor.slideId, body },
        {
          onSuccess: () => {
            toast.show({ tone: 'success', message: t('admin.slides.updateSuccess') });
            setSlideEditor(null);
          },
          onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
        },
      );
    } else {
      slideMutations.addSlide.mutate(body, {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('admin.slides.addSuccess') });
          setSlideEditor(null);
        },
        onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
      });
    }
  };

  const onDeleteSlide = () => {
    if (!confirmDeleteSlideId) return;
    const slideId = confirmDeleteSlideId;
    setConfirmDeleteSlideId(null);
    slideMutations.removeSlide.mutate(slideId, {
      onSuccess: () => toast.show({ tone: 'success', message: t('admin.slides.deleteSuccess') }),
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    if (!campaign) return;
    const ids = campaign.slides.map((s) => s.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target] as string, ids[index] as string];
    slideMutations.reorderSlides.mutate(ids, {
      onSuccess: () => toast.show({ tone: 'success', message: t('admin.slides.reorderSuccess') }),
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  return (
    <ScrollScreen>
      <AppHeader title={t('admin.detail.title')} showBack />

      {q.isLoading || !campaign ? (
        <Section spacing="xl">
          <Loading />
        </Section>
      ) : (
        <>
          <Section spacing="lg">
            <Row justify="space-between" align="center">
              <Label>{t('admin.detail.sectionInfo')}</Label>
              {!editingInfo ? (
                <Text variant="label" color="primary" onPress={startEditInfo}>
                  {t('admin.detail.editCta')}
                </Text>
              ) : null}
            </Row>

            <Card variant="outlined" padding="md">
              {editingInfo ? (
                <View style={{ rowGap: theme.spacing.sm }}>
                  <Input label={t('admin.detail.fieldTitle')} value={titleDraft} onChangeText={setTitleDraft} />
                  <Input
                    label={t('admin.detail.fieldSortOrder')}
                    value={sortOrderDraft}
                    onChangeText={setSortOrderDraft}
                    keyboardType="number-pad"
                  />
                  <Row gap="sm">
                    <View style={{ flex: 1 }}>
                      <Button label={t('admin.detail.saveCta')} loading={update.isPending} onPress={saveInfo} fullWidth />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        label={t('admin.detail.cancelEdit')}
                        variant="outline"
                        onPress={() => setEditingInfo(false)}
                        fullWidth
                      />
                    </View>
                  </Row>
                </View>
              ) : (
                <View style={{ rowGap: theme.spacing.xs }}>
                  <Field label={t('admin.detail.fieldTitle')} value={campaign.title} />
                  <Divider spacing="sm" />
                  <Field label={t('admin.detail.fieldType')} value={t(`admin.campaignType.${campaign.type}`)} />
                  <Divider spacing="sm" />
                  <Field label={t('admin.detail.fieldPlacement')} value={t(`placements.${campaign.placement}`)} />
                  <Divider spacing="sm" />
                  <Field label={t('admin.detail.fieldSortOrder')} value={String(campaign.sortOrder)} />
                  <Divider spacing="sm" />
                  <Row justify="space-between" align="center">
                    <Caption>{t('admin.detail.fieldStatus')}</Caption>
                    <Badge
                      label={t(campaign.isActive ? 'admin.active' : 'admin.inactive')}
                      tone={campaign.isActive ? 'success' : 'neutral'}
                      size="sm"
                    />
                  </Row>
                  <Divider spacing="sm" />
                  <Field
                    label={t('admin.detail.fieldSchedule')}
                    value={
                      campaign.startsAt && campaign.endsAt
                        ? t('admin.detail.scheduleValue', {
                            start: formatDate(campaign.startsAt),
                            end: formatDate(campaign.endsAt),
                          })
                        : t('admin.detail.scheduleNotSet')
                    }
                  />
                </View>
              )}
            </Card>
          </Section>

          <Section spacing="lg">
            <Row gap="sm">
              <View style={{ flex: 1 }}>
                <Button
                  label={t(campaign.isActive ? 'admin.detail.deactivateCta' : 'admin.detail.activateCta')}
                  variant="outline"
                  disabled={busy}
                  onPress={toggleActive}
                  fullWidth
                />
              </View>
            </Row>
          </Section>

          <Section spacing="xl">
            <Row justify="space-between" align="center">
              <Label>{t('admin.slides.title')}</Label>
              {!bannerLimitReached && slideEditor === null ? (
                <Text variant="label" color="primary" onPress={() => setSlideEditor({ mode: 'add' })}>
                  {t('admin.slides.addCta')}
                </Text>
              ) : null}
            </Row>
            {bannerLimitReached ? <Caption>{t('admin.slides.bannerLimitReached')}</Caption> : null}

            {slideEditor?.mode === 'add' ? (
              <Card variant="outlined" padding="md">
                <Label style={{ marginBottom: theme.spacing.sm }}>{t('admin.slides.formAddTitle')}</Label>
                <AdSlideForm
                  submitting={slideMutations.addSlide.isPending}
                  onSubmit={onSlideSubmit}
                  onCancel={() => setSlideEditor(null)}
                />
              </Card>
            ) : null}

            {campaign.slides.length === 0 && slideEditor === null ? (
              <EmptyState icon="images-outline" title={t('admin.slides.empty')} message={t('admin.slides.emptyHint')} />
            ) : (
              <View style={{ rowGap: theme.spacing.md }}>
                {campaign.slides.map((slide, index) =>
                  slideEditor?.mode === 'edit' && slideEditor.slideId === slide.id ? (
                    <Card key={slide.id} variant="outlined" padding="md">
                      <Label style={{ marginBottom: theme.spacing.sm }}>{t('admin.slides.formEditTitle')}</Label>
                      <AdSlideForm
                        initial={slide}
                        submitting={slideMutations.updateSlide.isPending}
                        onSubmit={onSlideSubmit}
                        onCancel={() => setSlideEditor(null)}
                      />
                    </Card>
                  ) : (
                    <AdSlideRow
                      key={slide.id}
                      campaignId={campaign.id}
                      slide={slide}
                      isFirst={index === 0}
                      isLast={index === campaign.slides.length - 1}
                      onEdit={() => setSlideEditor({ mode: 'edit', slideId: slide.id })}
                      onDelete={() => setConfirmDeleteSlideId(slide.id)}
                      onMoveUp={() => moveSlide(index, -1)}
                      onMoveDown={() => moveSlide(index, 1)}
                    />
                  ),
                )}
              </View>
            )}
          </Section>

          <Section spacing="giant">
            <Button
              label={t('admin.detail.deleteCta')}
              variant="ghost"
              disabled={busy}
              onPress={() => setConfirmDelete(true)}
            />
          </Section>

          <ConfirmationDialog
            visible={confirmDelete}
            title={t('admin.detail.deleteConfirmTitle')}
            message={t('admin.detail.deleteConfirmBody')}
            confirmLabel={t('admin.detail.deleteCta')}
            cancelLabel={t('admin.common.cancel')}
            destructive
            loading={remove.isPending}
            onConfirm={onDelete}
            onCancel={() => setConfirmDelete(false)}
          />
          <ConfirmationDialog
            visible={confirmDeleteSlideId != null}
            title={t('admin.slides.deleteConfirmTitle')}
            message={t('admin.slides.deleteConfirmBody')}
            confirmLabel={t('admin.slides.deleteCta')}
            cancelLabel={t('admin.common.cancel')}
            destructive
            loading={slideMutations.removeSlide.isPending}
            onConfirm={onDeleteSlide}
            onCancel={() => setConfirmDeleteSlideId(null)}
          />
        </>
      )}
    </ScrollScreen>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Row justify="space-between" align="center">
      <Caption>{label}</Caption>
      <Text variant="bodyMedium" numberOfLines={1} style={{ maxWidth: '60%' }}>
        {value}
      </Text>
    </Row>
  );
}
