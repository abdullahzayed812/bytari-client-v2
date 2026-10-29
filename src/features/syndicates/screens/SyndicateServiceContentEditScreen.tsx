import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, IconButton, TextButton } from '@/components/actions';
import { Card } from '@/components/content';
import {
  Alert,
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Loading,
  useToast,
} from '@/components/feedback';
import { Input, SegmentedControl } from '@/components/forms';
import { Row, SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { useMySyndicateAccess, useSyndicateServices, useUpdateSyndicateService } from '../hooks';
import { defaultServiceContent, hasContentPage, resolveServiceContent } from '../serviceContent';
import { findService, serviceTileFor } from '../serviceTiles';
import type {
  SyndicateContentSection,
  SyndicateContentSectionStyle,
  SyndicateServiceContent,
  SyndicateServiceItem,
  SyndicateServiceKey,
} from '../types';

/** Same limits as the server's `syndicateServiceContentSchema`. */
const LIMITS = {
  heading: 120,
  body: 4000,
  sectionTitle: 200,
  item: 1000,
  footnote: 1000,
  note: 1000,
  sections: 20,
  items: 50,
};

let seq = 0;
/** A new section / item key — kept by the server as its stable id. */
const newId = (): string => `n${Date.now().toString(36)}${(seq++).toString(36)}`;

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
}

/** Trimmed copy for saving / comparing (blank optional texts → null). */
function normalize(c: SyndicateServiceContent): SyndicateServiceContent {
  const opt = (v: string | null): string | null => (v?.trim() ? v.trim() : null);
  return {
    heading: opt(c.heading),
    body: opt(c.body),
    sections: c.sections.map((s) => ({
      ...s,
      title: s.title.trim(),
      items: s.items.map((i) => ({ ...i, text: i.text.trim() })),
    })),
    footnote: opt(c.footnote),
    note: opt(c.note),
  };
}

/**
 * Route `/(app)/syndicates/[organizationId]/service-content?serviceKey=` —
 * "تعديل محتوى الصفحة": the internal content of one service page (heading,
 * intro, sections with their items, processing-time line, note). Starts from
 * the syndicate's saved content, else the built-in text, so the manager edits
 * what users currently see. Add / delete / reorder sections and items; one
 * save replaces the page document on the SAME service row (no duplicates).
 * `syndicate.profile.manage` — server-enforced; the screen also gates on it.
 */
export default function SyndicateServiceContentEditScreen() {
  const { t } = useTranslation('syndicates');
  const { organizationId, serviceKey } = useLocalSearchParams<{
    organizationId: string;
    serviceKey?: string;
  }>();
  const access = useMySyndicateAccess(organizationId);
  const q = useSyndicateServices(organizationId);
  const key = serviceKey as SyndicateServiceKey | undefined;
  const service = key ? findService(q.data, key) : undefined;

  return (
    <SafeAreaScreen>
      <AppHeader title={t('serviceContent.title')} showBack />
      {q.isLoading || access.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : !access.data?.canManageProfile ? (
        <EmptyState icon="lock-closed-outline" title={t('home.notFound')} />
      ) : !service || !hasContentPage(service.serviceKey) ? (
        <EmptyState icon="document-outline" title={t('serviceContent.notEditable')} />
      ) : (
        <ContentEditor organizationId={organizationId as string} service={service} />
      )}
    </SafeAreaScreen>
  );
}

function ContentEditor({
  organizationId,
  service,
}: {
  organizationId: string;
  service: SyndicateServiceItem;
}) {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const toast = useToast();
  const update = useUpdateSyndicateService(organizationId);
  const key = service.serviceKey as Parameters<typeof defaultServiceContent>[0];
  const tile = serviceTileFor(service.serviceKey);
  const serviceTitle = service.title || (tile ? t(tile.labelKey as never) : service.serviceKey);

  const saved = useMemo(() => resolveServiceContent(service, key, t), [service, key, t]);
  const [draft, setDraft] = useState<SyndicateServiceContent>(saved);
  const [confirmReset, setConfirmReset] = useState(false);
  // Re-seed from the server after a save (or a change elsewhere) — never mid-edit.
  const baseline = useRef(JSON.stringify(normalize(saved)));
  useEffect(() => {
    const next = JSON.stringify(normalize(saved));
    if (next !== baseline.current) {
      baseline.current = next;
      setDraft(saved);
    }
  }, [saved]);

  const dirty = JSON.stringify(normalize(draft)) !== baseline.current;
  const tooLong = (v: string | null, max: number): string | undefined =>
    (v?.trim().length ?? 0) > max ? t('serviceContent.errors.tooLong', { max }) : undefined;
  const sectionError = (s: SyndicateContentSection): string | undefined =>
    !s.title.trim()
      ? t('serviceContent.errors.sectionTitle')
      : tooLong(s.title, LIMITS.sectionTitle);
  const itemError = (text: string): string | undefined =>
    !text.trim() ? t('serviceContent.errors.item') : tooLong(text, LIMITS.item);
  const invalid =
    Boolean(
      tooLong(draft.heading, LIMITS.heading) ||
      tooLong(draft.body, LIMITS.body) ||
      tooLong(draft.footnote, LIMITS.footnote) ||
      tooLong(draft.note, LIMITS.note),
    ) || draft.sections.some((s) => sectionError(s) || s.items.some((i) => itemError(i.text)));

  const setSections = (fn: (list: SyndicateContentSection[]) => SyndicateContentSection[]) =>
    setDraft((d) => ({ ...d, sections: fn(d.sections) }));
  const setSection = (id: string, fn: (s: SyndicateContentSection) => SyndicateContentSection) =>
    setSections((list) => list.map((s) => (s.id === id ? fn(s) : s)));

  const save = (content: SyndicateServiceContent | null): void => {
    update.mutate(
      { serviceId: service.id, input: { content: content ? normalize(content) : null } },
      {
        onSuccess: () => {
          setConfirmReset(false);
          toast.show({
            message: content ? t('serviceContent.saved') : t('serviceContent.resetDone'),
            tone: 'success',
          });
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={{
          padding: theme.screenPadding,
          rowGap: theme.spacing.md,
          paddingBottom: theme.spacing.huge,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="subtitle" weight="bold">
          {serviceTitle}
        </Text>
        <Alert tone="info" message={t('serviceContent.hint')} />

        <Input
          label={t('serviceContent.headingLabel')}
          value={draft.heading ?? ''}
          onChangeText={(v) => setDraft((d) => ({ ...d, heading: v }))}
          error={tooLong(draft.heading, LIMITS.heading)}
        />
        <Input
          label={t('serviceContent.bodyLabel')}
          placeholder={t('serviceContent.optional')}
          value={draft.body ?? ''}
          onChangeText={(v) => setDraft((d) => ({ ...d, body: v }))}
          multiline
          numberOfLines={3}
          error={tooLong(draft.body, LIMITS.body)}
        />

        <Text variant="bodyStrong">{t('serviceContent.sectionsTitle')}</Text>
        {draft.sections.length === 0 ? (
          <Caption color="textMuted">{t('serviceContent.noSections')}</Caption>
        ) : null}
        {draft.sections.map((section, index) => (
          <SectionEditor
            key={section.id}
            section={section}
            index={index}
            count={draft.sections.length}
            titleError={sectionError(section)}
            itemError={itemError}
            onChange={(fn) => setSection(section.id, fn)}
            onMove={(dir) => setSections((list) => move(list, index, index + dir))}
            onDelete={() => setSections((list) => list.filter((s) => s.id !== section.id))}
          />
        ))}
        <TextButton
          label={t('serviceContent.addSection')}
          icon="add-circle-outline"
          disabled={draft.sections.length >= LIMITS.sections}
          onPress={() =>
            setSections((list) => [
              ...list,
              { id: newId(), title: '', style: 'CHECK', items: [{ id: newId(), text: '' }] },
            ])
          }
        />

        <Input
          label={t('serviceContent.footnoteLabel')}
          placeholder={t('serviceContent.optional')}
          value={draft.footnote ?? ''}
          onChangeText={(v) => setDraft((d) => ({ ...d, footnote: v }))}
          multiline
          error={tooLong(draft.footnote, LIMITS.footnote)}
        />
        <Input
          label={t('serviceContent.noteLabel')}
          placeholder={t('serviceContent.optional')}
          value={draft.note ?? ''}
          onChangeText={(v) => setDraft((d) => ({ ...d, note: v }))}
          multiline
          error={tooLong(draft.note, LIMITS.note)}
        />

        {update.isError ? <Alert tone="danger" message={apiErrorMessage(update.error)} /> : null}
        {invalid ? <Caption color="danger">{t('serviceContent.errors.fixFields')}</Caption> : null}
        <Button
          label={update.isPending ? t('services.saving') : t('serviceContent.save')}
          loading={update.isPending}
          disabled={!dirty || invalid || update.isPending}
          onPress={() => save(draft)}
        />
        {service.content ? (
          <TextButton
            label={t('serviceContent.reset')}
            icon="refresh-outline"
            tone="danger"
            disabled={update.isPending}
            onPress={() => setConfirmReset(true)}
          />
        ) : null}
      </ScrollView>

      <ConfirmationDialog
        visible={confirmReset}
        title={t('serviceContent.resetConfirmTitle')}
        message={t('serviceContent.resetConfirmBody')}
        confirmLabel={t('serviceContent.reset')}
        destructive
        loading={update.isPending}
        onConfirm={() => save(null)}
        onCancel={() => setConfirmReset(false)}
      />
    </>
  );
}

function SectionEditor({
  section,
  index,
  count,
  titleError,
  itemError,
  onChange,
  onMove,
  onDelete,
}: {
  section: SyndicateContentSection;
  index: number;
  count: number;
  titleError: string | undefined;
  itemError: (text: string) => string | undefined;
  onChange: (fn: (s: SyndicateContentSection) => SyndicateContentSection) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const n = index + 1;
  const setItems = (
    fn: (items: SyndicateContentSection['items']) => SyndicateContentSection['items'],
  ) => onChange((s) => ({ ...s, items: fn(s.items) }));

  return (
    <Card variant="outlined" padding="md">
      <View style={{ rowGap: theme.spacing.sm }}>
        <Row gap="xs" align="center">
          <Text variant="label" style={{ flex: 1 }}>
            {t('serviceContent.sectionN', { n })}
          </Text>
          <IconButton
            icon="arrow-up-outline"
            size="sm"
            disabled={index === 0}
            accessibilityLabel={t('serviceContent.moveSectionUp', { n })}
            onPress={() => onMove(-1)}
          />
          <IconButton
            icon="arrow-down-outline"
            size="sm"
            disabled={index === count - 1}
            accessibilityLabel={t('serviceContent.moveSectionDown', { n })}
            onPress={() => onMove(1)}
          />
          <IconButton
            icon="trash-outline"
            size="sm"
            color="danger"
            accessibilityLabel={t('serviceContent.deleteSection', { n })}
            onPress={onDelete}
          />
        </Row>
        <Input
          label={t('serviceContent.sectionTitleLabel')}
          value={section.title}
          onChangeText={(v) => onChange((s) => ({ ...s, title: v }))}
          error={titleError}
        />
        <SegmentedControl<SyndicateContentSectionStyle>
          value={section.style}
          onChange={(style) => onChange((s) => ({ ...s, style }))}
          options={[
            { value: 'CHECK', label: t('serviceContent.styleCheck') },
            { value: 'NOTE', label: t('serviceContent.styleNote') },
          ]}
        />

        {section.items.length === 0 ? (
          <Caption color="textMuted">{t('serviceContent.noItems')}</Caption>
        ) : null}
        {section.items.map((item, i) => (
          <Row key={item.id} gap="xs" align="flex-start">
            <View style={{ flex: 1 }}>
              <Input
                label={t('serviceContent.itemN', { n: i + 1 })}
                value={item.text}
                onChangeText={(v) =>
                  setItems((items) => items.map((x) => (x.id === item.id ? { ...x, text: v } : x)))
                }
                multiline
                error={itemError(item.text)}
              />
            </View>
            <View style={{ paddingTop: theme.spacing.lg }}>
              <IconButton
                icon="chevron-up-outline"
                size="sm"
                disabled={i === 0}
                accessibilityLabel={t('serviceContent.moveItemUp', { n: i + 1 })}
                onPress={() => setItems((items) => move(items, i, i - 1))}
              />
              <IconButton
                icon="chevron-down-outline"
                size="sm"
                disabled={i === section.items.length - 1}
                accessibilityLabel={t('serviceContent.moveItemDown', { n: i + 1 })}
                onPress={() => setItems((items) => move(items, i, i + 1))}
              />
              <IconButton
                icon="close-circle-outline"
                size="sm"
                color="danger"
                accessibilityLabel={t('serviceContent.deleteItem', { n: i + 1 })}
                onPress={() => setItems((items) => items.filter((x) => x.id !== item.id))}
              />
            </View>
          </Row>
        ))}
        <TextButton
          label={t('serviceContent.addItem')}
          icon="add-outline"
          disabled={section.items.length >= LIMITS.items}
          onPress={() => setItems((items) => [...items, { id: newId(), text: '' }])}
        />
      </View>
    </Card>
  );
}
