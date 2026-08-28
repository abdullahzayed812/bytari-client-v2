import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme, type StyleProp } from 'react-native';

import { buildTheme, defaultTheme, type Theme } from './index';

export type ThemePreference = 'light' | 'dark' | 'system';

const ThemeContext = createContext<Theme>(defaultTheme);

interface ThemeProviderProps {
  children: ReactNode;
  /** `system` follows the OS. Wire this to the preferences store at the app root. */
  preference?: ThemePreference;
}

export function ThemeProvider({ children, preference = 'light' }: ThemeProviderProps) {
  const system = useColorScheme();
  const theme = useMemo<Theme>(() => {
    const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
    return buildTheme(scheme);
  }, [preference, system]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/**
 * Build memoised styles from the theme. Pass a factory that returns a style
 * object map; it re-runs only when the theme identity changes.
 */
export function useThemedStyles<T extends Record<string, StyleProp<unknown>>>(
  factory: (theme: Theme) => T,
): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
