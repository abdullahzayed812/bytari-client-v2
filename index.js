// App entry. The legacy-Safari shims must run before ANY library code
// (expo-router / React Navigation / Reanimated call `Array#findLast`,
// `structuredClone`, … during startup), so they are imported first. On native
// Metro resolves the no-op `legacySafari.js`; on web `legacySafari.web.js`.
import './src/polyfills/legacySafari';
import 'expo-router/entry';
