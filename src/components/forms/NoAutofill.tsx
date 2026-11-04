import { createContext, useContext, type ReactNode } from 'react';
import { Platform, type TextInputProps } from 'react-native';

const NoAutofillContext = createContext(false);

/**
 * Turns OFF browser / device autofill and saved-value suggestions for every
 * design-system `Input` (and so `FormField`) rendered inside. Use it on forms
 * whose fields describe something other than the signed-in user (a service,
 * an offer, a farm, a job…), where the browser's saved name / phone / address
 * suggestions are wrong. Values the app itself fills (form `defaultValues`,
 * pickers, selections) are untouched — only the platform's suggestions go.
 *
 * A field can still opt back in with an explicit `autoComplete` prop.
 */
export function NoAutofill({ children }: { children: ReactNode }) {
  return <NoAutofillContext.Provider value>{children}</NoAutofillContext.Provider>;
}

export function useNoAutofill(): boolean {
  return useContext(NoAutofillContext);
}

/**
 * Props that disable autofill on each platform:
 *  - web: `autocomplete="off"` (RN-web forwards it to the DOM input);
 *  - Android: `importantForAutofill="no"` (+ `autoComplete="off"`);
 *  - iOS: `textContentType="none"` (no QuickType contact / password chips).
 */
export function noAutofillProps(): Pick<
  TextInputProps,
  'autoComplete' | 'importantForAutofill' | 'textContentType'
> {
  return Platform.select({
    ios: { autoComplete: 'off', textContentType: 'none' },
    android: { autoComplete: 'off', importantForAutofill: 'no' },
    default: { autoComplete: 'off' },
  });
}
