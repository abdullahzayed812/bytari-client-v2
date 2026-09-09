import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web-only: the HTML document that wraps every statically-rendered route and the
 * dev-server shell. This file is NOT included in the native bundle.
 *
 * The app is Arabic-first, so the document is `dir="rtl"` / `lang="ar"` from the
 * first paint — react-native-web's `I18nManager` is a no-op, so DOM direction is
 * the only thing that actually drives RTL on web (logical CSS props, `row`
 * flex reversal, text alignment, scrollbars). A runtime language switch updates
 * `document.documentElement.dir` — see `src/lib/rtl.ts`.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        {/* Disable body scrolling on web so `ScrollView` behaves like native. */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
