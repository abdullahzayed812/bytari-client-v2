import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Avatar } from '@/components/content';
import { Alert, ConfirmationDialog } from '@/components/feedback';
import { Input, Select } from '@/components/forms';
import { Modal } from '@/components/overlays';
import { Caption, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import {
  formatDate,
  isNotFutureIsoDate,
  isValidIsoDate,
  normalizeIsoDate,
  openPhone,
  toLocalIsoDate,
} from '@/utils';

import {
  useLinkPoultrySupervisor,
  usePoultrySupervisionOptions,
  useReplacePoultrySupervisor,
  useUnlinkPoultrySupervisor,
} from '../../hooks';
import {
  SUPERVISION_TYPES,
  type PoultrySupervisionFarm,
  type PoultrySupervisionLinkInfo,
  type PoultrySupervisionVeterinarian,
  type SupervisionType,
} from '../../types';

import { farmNumber, farmPlace, StatePill, vetName, vetNumber } from './SupervisionParts';

type FarmLink = PoultrySupervisionLinkInfo & { veterinarian: PoultrySupervisionVeterinarian };
type VetLink = PoultrySupervisionLinkInfo & {
  farm: { organizationId: string; name: string; governorate: string | null };
};

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', columnGap: 12 }}>
      <Caption>{label}</Caption>
      <Text variant="label" style={{ flexShrink: 1, textAlign: 'left' }}>
        {value}
      </Text>
    </View>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        rowGap: theme.spacing.sm,
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
      }}
    >
      {children}
    </View>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>{children}</View>;
}

function Grow({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}

// --- "إدارة الارتباط" --------------------------------------------------------

/** Current supervising vet(s) of a farm: unlink each, or change the vet. */
export function ManageLinkModal({
  farm,
  links,
  onClose,
  onChangeVet,
}: {
  farm: PoultrySupervisionFarm | null;
  links: FarmLink[];
  onClose: () => void;
  onChangeVet: (link: FarmLink) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const unlink = useUnlinkPoultrySupervisor();
  const [confirm, setConfirm] = useState<FarmLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setError(null), [farm]);

  return (
    <>
      <Modal
        visible={farm !== null && confirm === null}
        onClose={onClose}
        title={farm ? t('poultrySupervisors.manageTitle', { name: farm.name }) : ''}
      >
        {farm ? (
          <View style={{ rowGap: theme.spacing.md }}>
            <Caption>
              {[
                farm.governorate,
                `${t('poultrySupervisors.farmCode')}: ${farmNumber(farm.organizationId)}`,
              ]
                .filter(Boolean)
                .join(' - ')}
            </Caption>
            {error ? <Alert tone="danger" message={error} /> : null}
            <Caption>{t('poultrySupervisors.currentSupervisor')}</Caption>
            {links.map((l) => (
              <Panel key={l.membershipId}>
                <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 10 }}>
                  <Avatar
                    uri={l.veterinarian.avatarUrl}
                    name={vetName(l.veterinarian)}
                    size="avatarSm"
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="label">{vetName(l.veterinarian)}</Text>
                    <Caption>
                      {t('poultrySupervisors.assignedOn', { date: formatDate(l.assignedAt) })}
                    </Caption>
                    {l.supervisionType ? (
                      <Caption>
                        {t(`poultrySupervisors.supervisionType.${l.supervisionType}`)}
                      </Caption>
                    ) : null}
                  </View>
                </View>
                <Button
                  label={t('poultrySupervisors.unlink')}
                  variant="danger"
                  size="sm"
                  onPress={() => setConfirm(l)}
                />
              </Panel>
            ))}
            <Footer>
              <Grow>
                <Button
                  label={t('poultrySupervisors.close')}
                  variant="outline"
                  fullWidth
                  onPress={onClose}
                />
              </Grow>
              {links[0] ? (
                <Grow>
                  <Button
                    label={t('poultrySupervisors.changeVet')}
                    fullWidth
                    onPress={() => onChangeVet(links[0] as FarmLink)}
                  />
                </Grow>
              ) : null}
            </Footer>
          </View>
        ) : null}
      </Modal>
      <ConfirmationDialog
        visible={confirm !== null}
        title={t('poultrySupervisors.unlinkConfirmTitle')}
        message={
          confirm && farm
            ? t('poultrySupervisors.unlinkConfirmBody', {
                vet: vetName(confirm.veterinarian),
                farm: farm.name,
              })
            : ''
        }
        confirmLabel={t('poultrySupervisors.unlink')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={unlink.isPending}
        onConfirm={() => {
          if (!confirm) return;
          unlink.mutate(confirm.membershipId, {
            onSuccess: () => {
              setConfirm(null);
              onClose();
            },
            onError: (e) => {
              setError(apiErrorMessage(e));
              setConfirm(null);
            },
          });
        }}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

// --- "ربط طبيب بيطري بحقل دواجن" / "تغيير الطبيب المشرف" ---------------------

export type LinkFormTarget =
  | { mode: 'link'; farmId?: string; vetId?: string }
  | { mode: 'change'; farm: PoultrySupervisionFarm; link: FarmLink };

/**
 * Link form (pick a farm without a vet + an approved vet + supervision type +
 * start date + notes) — or, in `change` mode, the same form for a farm whose
 * current vet is replaced in one step.
 */
export function LinkVetModal({
  target,
  onClose,
  onDone,
}: {
  target: LinkFormTarget | null;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const options = usePoultrySupervisionOptions(target !== null);
  const link = useLinkPoultrySupervisor();
  const replace = useReplacePoultrySupervisor();

  const [farmId, setFarmId] = useState<string | null>(null);
  const [vetId, setVetId] = useState<string | null>(null);
  const [type, setType] = useState<SupervisionType>('WEEKLY');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    setFarmId(target.mode === 'link' ? (target.farmId ?? null) : target.farm.organizationId);
    setVetId(target.mode === 'link' ? (target.vetId ?? null) : null);
    setType(target.mode === 'change' ? (target.link.supervisionType ?? 'WEEKLY') : 'WEEKLY');
    setStartDate(formatDate(toLocalIsoDate(new Date())));
    setNotes('');
    setError(null);
  }, [target]);

  const farmOptions = useMemo(
    () =>
      (options.farms.data?.items ?? []).map((f) => ({
        value: f.organizationId,
        label: `${f.name} (${farmNumber(f.organizationId)})${f.governorate ? ` - ${f.governorate}` : ''}`,
      })),
    [options.farms.data],
  );
  const vetOptions = useMemo(
    () =>
      (options.vets.data?.items ?? [])
        .filter(
          (r) =>
            target?.mode !== 'change' || r.veterinarian.userId !== target.link.veterinarian.userId,
        )
        .map((r) => ({
          value: r.veterinarian.userId,
          label: `${vetName(r.veterinarian)} (${r.veterinarian.specialization ?? vetNumber(r.veterinarian.userId)} - ${
            r.links.length > 0
              ? t('poultrySupervisors.vetBusy', { count: r.links.length })
              : t('poultrySupervisors.vetAvailable')
          })`,
        })),
    [options.vets.data, target, t],
  );
  const typeOptions = SUPERVISION_TYPES.map((v) => ({
    value: v,
    label: t(`poultrySupervisors.supervisionType.${v}`),
  }));

  const dateInvalid = startDate.length > 0 && !isValidIsoDate(startDate);
  const dateFuture = !dateInvalid && startDate.length > 0 && !isNotFutureIsoDate(startDate);
  const pending = link.isPending || replace.isPending;
  const canSubmit =
    Boolean(farmId && vetId && startDate && !dateInvalid && !dateFuture) && !pending;

  const submit = () => {
    if (!target || !farmId || !vetId) return;
    setError(null);
    const body = {
      veterinarianUserId: vetId,
      supervisionType: type,
      startDate: normalizeIsoDate(startDate) ?? startDate,
      notes: notes.trim() || undefined,
    };
    const handlers = {
      onSuccess: () =>
        onDone(
          target.mode === 'change'
            ? t('poultrySupervisors.toast.changed')
            : t('poultrySupervisors.toast.linked'),
        ),
      onError: (e: unknown) => setError(apiErrorMessage(e)),
    };
    if (target.mode === 'change') {
      replace.mutate({ membershipId: target.link.membershipId, ...body }, handlers);
    } else {
      link.mutate({ organizationId: farmId, ...body }, handlers);
    }
  };

  return (
    <Modal
      visible={target !== null}
      onClose={onClose}
      title={
        target?.mode === 'change'
          ? t('poultrySupervisors.changeTitle')
          : t('poultrySupervisors.linkTitle')
      }
    >
      <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ rowGap: theme.spacing.md }}>
        <Caption>
          {target?.mode === 'change'
            ? t('poultrySupervisors.changeHint', { vet: vetName(target.link.veterinarian) })
            : t('poultrySupervisors.linkHint')}
        </Caption>
        {error ? <Alert tone="danger" message={error} /> : null}
        {target?.mode === 'change' ? (
          <Panel>
            <InfoRow label={t('poultrySupervisors.chooseFarm')} value={target.farm.name} />
          </Panel>
        ) : (
          <Select
            label={t('poultrySupervisors.chooseFarm')}
            placeholder={t('poultrySupervisors.tapToChoose')}
            value={farmId}
            options={farmOptions}
            onChange={setFarmId}
            searchable
            required
          />
        )}
        <Select
          label={t('poultrySupervisors.chooseVet')}
          placeholder={t('poultrySupervisors.tapToChoose')}
          value={vetId}
          options={vetOptions}
          onChange={setVetId}
          searchable
          required
        />
        <Select
          label={t('poultrySupervisors.supervisionTypeLabel')}
          value={type}
          options={typeOptions}
          onChange={setType}
          searchable={false}
        />
        <Input
          label={t('poultrySupervisors.startDate')}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="2026-11-5"
          keyboardType="numbers-and-punctuation"
          autoCorrect={false}
          hint={t('poultrySupervisors.dateHint')}
          error={
            dateInvalid
              ? t('poultrySupervisors.dateInvalid')
              : dateFuture
                ? t('poultrySupervisors.dateFuture')
                : undefined
          }
        />
        <Input
          label={t('poultrySupervisors.notesOptional')}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('poultrySupervisors.notesPlaceholder')}
          multiline
          numberOfLines={2}
          maxLength={1000}
        />
        <Footer>
          <Grow>
            <Button label={t('common.cancel')} variant="outline" fullWidth onPress={onClose} />
          </Grow>
          <Grow>
            <Button
              label={t('poultrySupervisors.saveLink')}
              fullWidth
              loading={pending}
              disabled={!canSubmit}
              onPress={submit}
            />
          </Grow>
        </Footer>
      </ScrollView>
    </Modal>
  );
}

// --- "ملف الحقل" -------------------------------------------------------------

export function FarmProfileModal({
  farm,
  links,
  onClose,
  onOpenVet,
  onManage,
  onLink,
  onOpenFullFile,
}: {
  farm: PoultrySupervisionFarm | null;
  links: FarmLink[];
  onClose: () => void;
  onOpenVet: (vet: PoultrySupervisionVeterinarian) => void;
  onManage: () => void;
  onLink: () => void;
  /** "فتح ملف الحقل الكامل" — passed for the main ADMIN only (omitted → hidden). */
  onOpenFullFile?: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const linked = links.length > 0;
  return (
    <Modal visible={farm !== null} onClose={onClose} title={farm?.name ?? ''}>
      {farm ? (
        <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ rowGap: theme.spacing.md }}>
          <Caption>
            {t('poultrySupervisors.farmNumber')}: {farmNumber(farm.organizationId)}
          </Caption>
          <Panel>
            <InfoRow label={t('poultrySupervisors.fields.governorate')} value={farmPlace(farm)} />
            <InfoRow
              label={t('poultrySupervisors.fields.capacity')}
              value={
                farm.capacity != null
                  ? t('poultrySupervisors.birds', { count: farm.capacity })
                  : farm.currentBirdCount != null
                    ? t('poultrySupervisors.birds', { count: farm.currentBirdCount })
                    : null
              }
            />
            <InfoRow
              label={t('poultrySupervisors.fields.productionType')}
              value={
                farm.productionType
                  ? t(`poultrySupervisors.productionType.${farm.productionType}`, {
                      defaultValue: farm.productionType,
                    })
                  : null
              }
            />
            <InfoRow label={t('poultrySupervisors.owner')} value={farm.ownerName} />
            <InfoRow
              label={t('poultrySupervisors.fields.phone')}
              value={farm.contactPhone ?? farm.ownerPhone}
            />
            <InfoRow
              label={t('poultrySupervisors.fields.farmStatus')}
              value={t(`orgs.status.${farm.status}`)}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Caption>{t('poultrySupervisors.supervisionState')}</Caption>
              <StatePill
                linked={linked}
                label={
                  linked
                    ? t('poultrySupervisors.linkedApproved')
                    : t('poultrySupervisors.unlinkedBadge')
                }
              />
            </View>
          </Panel>
          {linked ? (
            <View style={{ rowGap: theme.spacing.sm }}>
              <Caption>{t('poultrySupervisors.supervisingVet')}</Caption>
              {links.map((l) => (
                <Panel key={l.membershipId}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 10 }}>
                    <Avatar
                      uri={l.veterinarian.avatarUrl}
                      name={vetName(l.veterinarian)}
                      size="avatarSm"
                    />
                    <View style={{ flex: 1 }}>
                      <Text variant="label">{vetName(l.veterinarian)}</Text>
                      <Caption>
                        {t('poultrySupervisors.assignedOn', { date: formatDate(l.assignedAt) })}
                      </Caption>
                    </View>
                    <Button
                      label={t('poultrySupervisors.viewVet')}
                      variant="ghost"
                      size="sm"
                      onPress={() => onOpenVet(l.veterinarian)}
                    />
                  </View>
                </Panel>
              ))}
            </View>
          ) : (
            <Alert tone="warning" message={t('poultrySupervisors.noVetLinked')} />
          )}
          {onOpenFullFile ? (
            <Button
              label={t('poultrySupervisors.openFarmFile')}
              variant="ghost"
              leftIcon="open-outline"
              onPress={onOpenFullFile}
            />
          ) : null}
          <Footer>
            <Grow>
              <Button
                label={t('poultrySupervisors.close')}
                variant="outline"
                fullWidth
                onPress={onClose}
              />
            </Grow>
            <Grow>
              <Button
                label={
                  linked
                    ? t('poultrySupervisors.manageLink')
                    : t('poultrySupervisors.linkVetToFarm')
                }
                fullWidth
                onPress={linked ? onManage : onLink}
              />
            </Grow>
          </Footer>
        </ScrollView>
      ) : null}
    </Modal>
  );
}

// --- "ملف الطبيب" ------------------------------------------------------------

export function VetProfileModal({
  vet,
  links,
  onClose,
  onOpenFullProfile,
}: {
  vet: PoultrySupervisionVeterinarian | null;
  links: VetLink[];
  onClose: () => void;
  /** "فتح الملف الكامل للطبيب" — passed for the main ADMIN only (omitted → hidden). */
  onOpenFullProfile?: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const phone = vet?.phone ?? null;
  const whatsapp = vet?.whatsapp ?? vet?.phone ?? null;
  return (
    <Modal visible={vet !== null} onClose={onClose} title={vet ? vetName(vet) : ''}>
      {vet ? (
        <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ rowGap: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 12 }}>
            <Avatar uri={vet.avatarUrl} name={vetName(vet)} size="avatarLg" />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{vetName(vet)}</Text>
              <Caption>{vet.specialization ?? t('poultrySupervisors.noSpecialization')}</Caption>
            </View>
          </View>
          <Panel>
            <InfoRow label={t('poultrySupervisors.vetId')} value={vet.userId} />
            <InfoRow
              label={t('poultrySupervisors.fields.accountStatus')}
              value={
                vet.status === 'ACTIVE'
                  ? t('poultrySupervisors.activeApprovedVet')
                  : t(`users.status.${vet.status}` as never)
              }
            />
            <InfoRow label={t('poultrySupervisors.fields.phone')} value={vet.phone} />
            <InfoRow label={t('poultrySupervisors.fields.email')} value={vet.email} />
            <InfoRow label={t('poultrySupervisors.fields.governorate')} value={vet.governorate} />
            <InfoRow
              label={t('poultrySupervisors.fields.registeredAt')}
              value={formatDate(vet.createdAt)}
            />
          </Panel>
          <View style={{ rowGap: theme.spacing.sm }}>
            <Caption>{t('poultrySupervisors.currentFarm')}</Caption>
            {links.length > 0 ? (
              links.map((l) => (
                <Panel key={l.membershipId}>
                  <Text variant="label" color="primary">
                    {l.farm.name} ({farmNumber(l.farm.organizationId)})
                  </Text>
                  <Caption>
                    {t('poultrySupervisors.linkedSince', { date: formatDate(l.assignedAt) })}
                  </Caption>
                </Panel>
              ))
            ) : (
              <Alert tone="info" message={t('poultrySupervisors.noFarmLinked')} />
            )}
          </View>
          {onOpenFullProfile ? (
            <Button
              label={t('poultrySupervisors.openVetProfile')}
              variant="ghost"
              leftIcon="open-outline"
              onPress={onOpenFullProfile}
            />
          ) : null}
          <Footer>
            <Grow>
              <Button
                label={t('poultrySupervisors.close')}
                variant="outline"
                fullWidth
                onPress={onClose}
              />
            </Grow>
            <Grow>
              <Button
                label={t('poultrySupervisors.contactVet')}
                leftIcon="call-outline"
                fullWidth
                disabled={!phone}
                onPress={() => void openPhone(phone)}
              />
            </Grow>
          </Footer>
          {whatsapp ? (
            <Button
              label={t('poultrySupervisors.whatsapp')}
              variant="outline"
              leftIcon="logo-whatsapp"
              onPress={() => void Linking.openURL(`https://wa.me/${whatsapp.replace(/\D/g, '')}`)}
            />
          ) : null}
        </ScrollView>
      ) : null}
    </Modal>
  );
}
