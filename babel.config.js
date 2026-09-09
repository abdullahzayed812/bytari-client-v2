module.exports = function (api) {
  api.cache(true);
  return {
    // `unstable_transformImportMeta` rewrites `import.meta` (used by Expo's
    // winter runtime, e.g. `expo/src/winter/getBundleUrl.web.ts`) to
    // `globalThis.__ExpoImportMetaRegistry`. Without it the web dev bundle —
    // served as a classic <script>, not a module — throws
    // "Cannot use 'import.meta' outside a module".
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
    plugins: ['react-native-reanimated/plugin'],
  };
};
