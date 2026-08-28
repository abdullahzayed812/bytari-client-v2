import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/content/Icon';
import { Text } from '@/components/typography';
import { AppConfig } from '@/constants/config';
import { useTheme, type Theme } from '@/theme';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  durationMs?: number;
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
  hide: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICON: Record<ToastTone, IconName> = {
  info: 'information-circle',
  success: 'checkmark-circle',
  danger: 'alert-circle',
  warning: 'warning',
};

function toneColor(theme: Theme, tone: ToastTone): string {
  return tone === 'success'
    ? theme.colors.success
    : tone === 'danger'
      ? theme.colors.danger
      : tone === 'warning'
        ? theme.colors.warning
        : theme.colors.info;
}

/** App-wide transient message host. Wrap the app once; consume via `useToast()`. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(translateY, { toValue: -120, duration: 200, useNativeDriver: true }).start(() =>
      setToast(null),
    );
  }, [translateY]);

  const show = useCallback(
    (options: ToastOptions) => {
      if (timer.current) clearTimeout(timer.current);
      setToast(options);
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
      timer.current = setTimeout(hide, options.durationMs ?? AppConfig.toastDurationMs);
    },
    [hide, translateY],
  );

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const value = useMemo<ToastContextValue>(() => ({ show, hide }), [show, hide]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: insets.top + theme.spacing.sm,
            left: theme.spacing.lg,
            right: theme.spacing.lg,
            transform: [{ translateY }],
            zIndex: theme.zIndex.toast,
          }}
        >
          <View
            accessibilityRole="alert"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: theme.spacing.md,
              padding: theme.spacing.lg,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.surface,
              borderLeftWidth: 4,
              borderLeftColor: toneColor(theme, toast.tone ?? 'info'),
              ...theme.shadows.raised,
            }}
          >
            <Icon
              name={ICON[toast.tone ?? 'info']}
              size="iconMd"
              style={{ color: toneColor(theme, toast.tone ?? 'info') }}
            />
            <Text variant="label" style={{ flex: 1 }}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
