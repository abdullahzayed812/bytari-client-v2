import { Linking } from 'react-native';

import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';

import { ContactActionRow } from '../ContactActionRow';

describe('ContactActionRow', () => {
  const open = jest.spyOn(Linking, 'openURL');
  beforeEach(() => open.mockReset().mockResolvedValue(true));

  it('a phone number opens the dialer (tel:) and keeps its displayed format', async () => {
    renderWithProviders(<ContactActionRow kind="phone" value="+964 777 756 4666" />);
    expect(screen.getByText('+964 777 756 4666')).toBeTruthy();
    fireEvent.press(screen.getByRole('link'));
    await waitFor(() => expect(open).toHaveBeenCalledWith('tel:+9647777564666'));
  });

  it('a website opens a normalised https URL', async () => {
    renderWithProviders(<ContactActionRow kind="website" value="www.vet.iq" />);
    fireEvent.press(screen.getByRole('link'));
    await waitFor(() => expect(open).toHaveBeenCalledWith('https://www.vet.iq/'));
  });

  it('an unsafe website is plain, non-tappable text', () => {
    renderWithProviders(<ContactActionRow kind="website" value="javascript:alert(1)" />);
    expect(screen.getByText('javascript:alert(1)')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
