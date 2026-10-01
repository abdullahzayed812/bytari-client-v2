import { useForm } from 'react-hook-form';
import { Text } from 'react-native';

import { initI18n } from '@/i18n';
import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { CountrySelect } from '../components/CountrySelect';
import { GovernorateSelect } from '../components/GovernorateSelect';

beforeAll(() => initI18n('ar'));

interface LocationForm {
  country: string;
  governorate: string;
}

function LocationFields() {
  const { control, watch } = useForm<LocationForm>({
    defaultValues: { country: 'IQ', governorate: '' },
  });
  const values = watch();
  return (
    <>
      <CountrySelect control={control} name="country" label="الدولة" />
      <GovernorateSelect
        control={control}
        name="governorate"
        countryName="country"
        label="المحافظة"
        placeholder="اختر المحافظة"
      />
      <Text testID="values">{`${values.country}|${values.governorate}`}</Text>
    </>
  );
}

const values = () => screen.getByTestId('values').props.children as string;

describe('CountrySelect → GovernorateSelect', () => {
  it('shows Iraqi governorates for Iraq, then the new country’s regions after a change (and clears the old one)', () => {
    renderWithProviders(<LocationFields />);

    // Pick an Iraqi governorate.
    fireEvent.press(screen.getByRole('button', { name: 'المحافظة' }));
    fireEvent.press(screen.getByRole('menuitem', { name: /البصرة/ }));
    expect(values()).toBe('IQ|البصرة');

    // Open the (searchable) country list and switch to Egypt via search.
    fireEvent.press(screen.getByRole('button', { name: 'الدولة' }));
    fireEvent.changeText(screen.getByLabelText('بحث'), 'مصر');
    expect(screen.queryByRole('menuitem', { name: /الكويت/ })).toBeNull();
    fireEvent.press(screen.getByRole('menuitem', { name: /مصر/ }));

    // The Iraqi governorate was cleared.
    expect(values()).toBe('EG|');

    // Egyptian governorates are offered — no Iraqi ones.
    fireEvent.press(screen.getByRole('button', { name: 'المحافظة' }));
    expect(screen.getByRole('menuitem', { name: /الجيزة/ })).toBeOnTheScreen();
    expect(screen.queryByRole('menuitem', { name: /بغداد/ })).toBeNull();
    fireEvent.press(screen.getByRole('menuitem', { name: /الجيزة/ }));
    expect(values()).toBe('EG|الجيزة');
  });
});
