import type { TranslationResources } from '../ar';

/**
 * English resources — structurally identical to `ar` (typed by
 * `TranslationResources`), so a missing key is a compile error. English is a
 * supported future locale, not the default.
 */
export const en: TranslationResources = {
  common: {
    appName: 'Bytari',
    tagline: 'Veterinary care platform',
    actions: {
      continue: 'Continue',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      retry: 'Retry',
      close: 'Close',
      back: 'Back',
      search: 'Search',
      signIn: 'Sign in',
      signOut: 'Sign out',
      signUp: 'Create account',
    },
    states: {
      loading: 'Loading…',
      empty: 'Nothing to show',
      emptyHint: 'Content will appear here once available.',
      offline: 'No internet connection',
      offlineHint: 'Check your connection and try again.',
    },
    mode: {
      owner: 'Pet Owner mode',
      veterinarian: 'Veterinarian mode',
      switchTo: 'Switch to {{mode}}',
    },
    greeting: {
      hello: 'Welcome',
      welcome: 'Welcome to Bytari',
    },
  },
  nav: {
    tabs: {
      account: 'Account',
      animals: 'Animals',
      home: 'Home',
      services: 'Services',
      more: 'More',
    },
    controlCentre: 'Control Centre',
    designSystem: 'Design System',
  },
  errors: {
    title: 'Something went wrong',
    generic: 'Something went wrong. Please try again.',
    network: 'Unable to reach the server. Check your connection.',
    timeout: 'The request took too long. Please try again.',
    unauthorized: 'Your session expired. Please sign in again.',
    forbidden: 'You do not have permission to do this.',
    notFound: 'The requested item was not found.',
    validation: 'Please check the information you entered.',
    rateLimited: 'Too many attempts. Wait a moment and try again.',
  },
  showcase: {
    title: 'Design System',
    subtitle: 'Internal development screen for visual verification — not a production feature.',
    sections: {
      typography: 'Typography',
      colors: 'Colors',
      buttons: 'Buttons',
      inputs: 'Inputs',
      cards: 'Cards',
      badges: 'Badges',
      avatars: 'Avatars',
      banners: 'Banners',
      feedback: 'UI states',
      overlays: 'Overlays',
    },
    sample: {
      paragraph:
        'Modern veterinary care starts with close monitoring of your animal’s health and direct contact with certified vets.',
      buttonPrimary: 'Book appointment',
      buttonSecondary: 'View details',
      inputLabel: 'Animal name',
      inputPlaceholder: 'e.g. Lulu',
      bannerTitle: 'Instant veterinary consultation',
      bannerBody: 'Talk to a certified vet within minutes.',
      emptyTitle: 'No items',
      errorTitle: 'Could not load data',
      openModal: 'Open modal',
      openSheet: 'Open bottom sheet',
    },
  },
};
