import { renderWithProviders, screen } from '@/test-utils/render';

import { Input } from '../Input';
import { NoAutofill } from '../NoAutofill';

describe('NoAutofill', () => {
  it('turns autofill off for every Input inside the scope', () => {
    renderWithProviders(
      <NoAutofill>
        <Input accessibilityLabel="inside" value="" onChangeText={() => {}} />
      </NoAutofill>,
    );
    expect(screen.getByLabelText('inside').props.autoComplete).toBe('off');
  });

  it('leaves Inputs outside the scope untouched', () => {
    renderWithProviders(<Input accessibilityLabel="outside" value="" onChangeText={() => {}} />);
    expect(screen.getByLabelText('outside').props.autoComplete).toBeUndefined();
  });

  it('an explicit autoComplete on a field still wins', () => {
    renderWithProviders(
      <NoAutofill>
        <Input accessibilityLabel="email" autoComplete="email" value="" onChangeText={() => {}} />
      </NoAutofill>,
    );
    expect(screen.getByLabelText('email').props.autoComplete).toBe('email');
  });
});
