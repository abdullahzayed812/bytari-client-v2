import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { BottomSheet } from '@/components/overlays';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { FarmJoinCodeCard } from './FarmJoinCodeCard';

export interface FarmAddStaffSheetProps {
  visible: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
}

/**
 * The farm dashboard's "إضافة" (doctors / employees). A veterinarian is
 * attached ONLY through the farm join code or its QR code (the backend
 * rejects adding a vet to a farm by email — `FARM_VETERINARIAN_REQUIRES_JOIN_CODE`);
 * a non-vet employee can still be added directly (STAFF).
 */
export function FarmAddStaffSheet({
  visible,
  onClose,
  organizationId,
  organizationName,
}: FarmAddStaffSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation('farm');
  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('staff.addTitle')}>
      <ScrollView
        contentContainerStyle={{ rowGap: theme.spacing.md, paddingBottom: theme.spacing.lg }}
      >
        <Caption>{t('staff.addIntro')}</Caption>
        <FarmJoinCodeCard organizationId={organizationId} organizationName={organizationName} />
        <View>
          <Button
            label={t('staff.addEmployee')}
            variant="outline"
            leftIcon="person-add-outline"
            fullWidth
            onPress={() => {
              onClose();
              router.push(Routes.organizationMembersAdd(organizationId));
            }}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
