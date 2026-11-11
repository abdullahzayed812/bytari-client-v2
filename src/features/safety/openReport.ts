import { router } from 'expo-router';

import { Routes } from '@/constants/routes';
import type { ReportTargetType } from '@/features/globalChat/types';

/** Open the shared "report content" screen for any reportable target. */
export function openReport(targetType: ReportTargetType, targetId: string): void {
  router.push({ pathname: Routes.globalChatReport, params: { targetType, targetId } });
}
