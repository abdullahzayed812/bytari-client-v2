/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // `react-native-gesture-handler/jestSetup` stubs the native module that
  // `GestureHandlerRootView` / `GestureDetector` call into — without it any
  // component rendering the shared `ImageViewer` throws
  // "_RNGestureHandlerModule.default.install is not a function".
  setupFiles: ['<rootDir>/jest.env.js', 'react-native-gesture-handler/jestSetup'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@tanstack/.*))',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}', '<rootDir>/__tests__/**/*.test.{ts,tsx}'],
};
