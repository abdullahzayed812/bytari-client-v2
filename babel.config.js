/**
 * Web needs extra down-levelling for older iPhone Safari: the default Expo web
 * output keeps `?.` / `??` (Safari < 13.1), `??=` / `||=` (< 14) and class
 * fields / private members (< 14 / 15) — a SyntaxError there means the bundle
 * never runs and the page stays blank. These transforms are added ONLY when
 * Metro bundles for web (keyed on the caller platform), so the Hermes
 * native bundles are untouched. Runtime APIs are shimmed separately in
 * `src/polyfills/web-legacy-safari.js`.
 */
const LEGACY_WEB_PLUGINS = [
  '@babel/plugin-transform-optional-chaining',
  '@babel/plugin-transform-nullish-coalescing-operator',
  '@babel/plugin-transform-logical-assignment-operators',
  '@babel/plugin-transform-numeric-separator',
  '@babel/plugin-transform-optional-catch-binding',
  '@babel/plugin-transform-class-properties',
  '@babel/plugin-transform-private-methods',
  '@babel/plugin-transform-private-property-in-object',
];

module.exports = function (api) {
  // Cache per caller (platform), so web and native get their own configs.
  const platform = api.caller((caller) => caller && caller.platform);
  return {
    // `unstable_transformImportMeta` rewrites `import.meta` (used by Expo's
    // winter runtime, e.g. `expo/src/winter/getBundleUrl.web.ts`) to
    // `globalThis.__ExpoImportMetaRegistry`. Without it the web dev bundle —
    // served as a classic <script>, not a module — throws
    // "Cannot use 'import.meta' outside a module".
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
    plugins: [
      ...(platform === 'web' ? LEGACY_WEB_PLUGINS : []),
      // must stay last
      'react-native-reanimated/plugin',
    ],
  };
};
