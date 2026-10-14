import { i18n, initI18n } from '@/i18n';
import { usePreferencesStore } from '@/store';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';

import { LanguageSelector } from '../components';

beforeAll(() => initI18n('ar'));
afterEach(async () => {
  usePreferencesStore.getState().setLanguage('ar');
  await i18n.changeLanguage('ar');
});

describe('LanguageSelector — signed-out language list', () => {
  it('shows the current language and opens a list of every supported language', () => {
    renderWithProviders(<LanguageSelector />);
    expect(screen.getByTestId('language-selector')).toHaveTextContent(/العربية/);
    expect(screen.queryByTestId('language-option-en')).toBeNull();

    fireEvent.press(screen.getByTestId('language-selector'));

    expect(screen.getByRole('radio', { name: 'العربية' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'English' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'کوردی' })).toBeOnTheScreen();
    expect(screen.getByTestId('language-option-ar')).toHaveProp(
      'accessibilityState',
      expect.objectContaining({ selected: true }),
    );
  });

  it('selecting a language applies it through the existing localization system', async () => {
    renderWithProviders(<LanguageSelector />);
    fireEvent.press(screen.getByTestId('language-selector'));
    fireEvent.press(screen.getByTestId('language-option-ku'));

    await waitFor(() => expect(i18n.language).toBe('ku'));
    expect(usePreferencesStore.getState().language).toBe('ku');
    // The list closes; the control now shows the chosen language.
    await waitFor(() => expect(screen.queryByTestId('language-option-en')).toBeNull());
    expect(screen.getByTestId('language-selector')).toHaveTextContent(/کوردی/);
  });

  it('opening the list never changes the language by itself (no cycling)', () => {
    renderWithProviders(<LanguageSelector />);
    fireEvent.press(screen.getByTestId('language-selector'));
    expect(i18n.language).toBe('ar');
    expect(usePreferencesStore.getState().language).toBe('ar');
  });
});
