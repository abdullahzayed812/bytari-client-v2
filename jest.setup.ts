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

// Quieten the RN animated-helper warning under jest.
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });
