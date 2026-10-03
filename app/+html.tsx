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
/**
 * Startup watchdog (plain ES5, runs before the app bundle). If the bundle
 * throws during startup on a browser it can't support — or hasn't mounted
 * after 30 s (slow network: removed again as soon as the app mounts) — show a readable Arabic message instead of a blank white page.
 * `app/_layout.tsx` sets `window.__BYTARI_BOOTED__` on its first layout.
 */
const STARTUP_WATCHDOG = `(function(){
  // Metro's prelude reads globalThis before any polyfill (iOS < 12.2 lacks it).
  if (typeof globalThis === 'undefined') { window.globalThis = window; }
  var shown = false;
  function fallback(){
    if (shown || window.__BYTARI_BOOTED__) return;
    shown = true;
    var d = document.createElement('div');
    d.id = 'bytari-boot-fallback';
    d.setAttribute('role','alert');
    d.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;background:#fff;color:#1f2937;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font:16px/1.7 -apple-system,system-ui,sans-serif;direction:rtl';
    d.innerHTML = '<div><p style="font-weight:700;margin:0 0 8px">تعذّر تشغيل التطبيق على هذا المتصفح</p><p style="margin:0 0 16px">يرجى تحديث نظام iOS / متصفح Safari إلى أحدث إصدار متاح ثم إعادة المحاولة.</p><button onclick="location.reload()" style="font:inherit;padding:8px 20px;border-radius:8px;border:1px solid #d1d5db;background:#f9fafb">إعادة المحاولة</button></div>';
    (document.body || document.documentElement).appendChild(d);
  }
  window.addEventListener('error', function(e){
    if (!window.__BYTARI_BOOTED__ && e && (e.error instanceof SyntaxError || /SyntaxError|is not a function|is not defined/.test(String(e.message)))) fallback();
  });
  setTimeout(fallback, 30000);
})();`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        {/* Disable body scrolling on web so `ScrollView` behaves like native. */}
        <ScrollViewStyleReset />
        <script dangerouslySetInnerHTML={{ __html: STARTUP_WATCHDOG }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
