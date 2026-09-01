import '@testing-library/react-native/extend-expect';

// --- AsyncStorage: official jest mock ---
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// --- expo-secure-store: in-memory fake ---
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'whenUnlockedThisDeviceOnly',
    setItemAsync: jest.fn((k: string, v: string) => {
      store.set(k, v);
      return Promise.resolve();
    }),
    getItemAsync: jest.fn((k: string) => Promise.resolve(store.get(k) ?? null)),
    deleteItemAsync: jest.fn((k: string) => {
      store.delete(k);
      return Promise.resolve();
    }),
    __reset: () => store.clear(),
  };
});

// --- expo-localization ---
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'ar', languageTag: 'ar-SA', textDirection: 'rtl' }],
  getCalendars: () => [{ calendar: 'gregory' }],
}));

// --- @expo/vector-icons: synchronous stub (real one loads fonts async and
//     schedules setState after the test finishes → act() warnings + hangs).
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const StubIcon = ({ name, ...rest }: { name?: string }) =>
    React.createElement(Text, { ...rest }, name ?? '');
  return new Proxy(
    { __esModule: true },
    {
      get: (target: Record<string, unknown>, key: string) =>
        key in target ? target[key] : StubIcon,
    },
  );
});

// Quieten the RN animated-helper warning under jest.
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });

// Initialise i18n once for the whole run so components using `useTranslation`
// (ErrorState, screens, …) render without a react-i18next warning/crash.
require('@/i18n').initI18n('ar');
