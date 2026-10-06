import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { DateField } from '../components/DateField';

describe('DateField', () => {
  const originalOS = Platform.OS;
  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
    jest.restoreAllMocks();
  });

  it('Android: opens the native dialog and commits the LOCAL calendar day', () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    const open = jest
      .spyOn(DateTimePickerAndroid, 'open')
      .mockImplementation(({ onChange }) =>
        onChange?.(
          { type: 'set', nativeEvent: { timestamp: 0, utcOffset: 0 } },
          new Date(2026, 9, 10, 0, 0),
        ),
      );
    const onChange = jest.fn();
    renderWithProviders(
      <DateField
        value={null}
        onChange={onChange}
        placeholder="تاريخ البدء"
        accessibilityLabel="start"
      />,
    );
    fireEvent.press(screen.getByLabelText('start'));
    expect(open).toHaveBeenCalledWith(expect.objectContaining({ mode: 'date' }));
    expect(onChange).toHaveBeenCalledWith('2026-10-10');
  });

  it('Android: a dismissed dialog changes nothing', () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    jest
      .spyOn(DateTimePickerAndroid, 'open')
      .mockImplementation(({ onChange }) =>
        onChange?.({ type: 'dismissed', nativeEvent: { timestamp: 0, utcOffset: 0 } }, undefined),
      );
    const onChange = jest.fn();
    renderWithProviders(
      <DateField
        value="2026-10-01"
        onChange={onChange}
        placeholder="x"
        accessibilityLabel="start"
      />,
    );
    fireEvent.press(screen.getByLabelText('start'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
