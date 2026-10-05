import { router } from 'expo-router';
import { Alert } from 'react-native';

import { blockUser } from '@/api/safety';
import type { ReportTarget } from '@/constants/enums';

import { errorMessage } from './errors';

export function openReport(targetType: ReportTarget, targetId: string, subject: string) {
  router.push({ pathname: '/report', params: { targetType, targetId, subject } });
}

type ReportListener = (targetType: ReportTarget, targetId: string) => void;
const reportListeners = new Set<ReportListener>();

/** Lets open screens react to a submitted report, e.g. the chat hides a reported message at once. */
export function onReported(listener: ReportListener): () => void {
  reportListeners.add(listener);
  return () => {
    reportListeners.delete(listener);
  };
}

export function notifyReported(targetType: ReportTarget, targetId: string) {
  reportListeners.forEach((listener) => listener(targetType, targetId));
}

/** Confirms, blocks, then explains what blocking does. Calls onBlocked after success. */
export function confirmBlock(userId: string, name: string, onBlocked?: () => void) {
  Alert.alert(
    `Block ${name}?`,
    'You will no longer see their messages, games or groups. They will not be notified.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await blockUser(userId);
            Alert.alert(
              `${name} is blocked`,
              'Their messages, games and groups are now hidden from you. If they broke the Community Guidelines, please also report them so our team can review. You can unblock anytime from Profile > Blocked users.',
            );
            onBlocked?.();
          } catch (e) {
            Alert.alert('Could not block', errorMessage(e));
          }
        },
      },
    ],
  );
}
