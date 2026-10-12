import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import FullExamEntryScreen from '../screens/FullExamEntryScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
jest.mock('@/features/animals/components/ClinicAnimalPicker', () => ({
  ClinicAnimalPicker: ({ onPick }: { onPick: (pet: { animalId: string }) => void }) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable onPress={() => onPick({ animalId: 'a1' })}>
        <Text>pick-a1</Text>
      </Pressable>
    );
  },
}));

beforeEach(() => {
  resetRouterMock();
  setSearchParams({ organizationId: 'o1' });
});

describe('dashboard full exam entry', () => {
  it('pops the picker and pushes the form, keeping the Clinic Dashboard in the history', () => {
    renderWithProviders(<FullExamEntryScreen />);
    fireEvent.press(screen.getByText('pick-a1'));

    // A cross-stack `replace` would drop the dashboard, so back would land on My Organizations.
    expect(routerMock.replace).not.toHaveBeenCalled();
    expect(routerMock.back).toHaveBeenCalledTimes(1);
    expect(routerMock.push).toHaveBeenCalledWith({
      pathname: '/(app)/organizations/o1/animals/a1/medical-records/create',
      params: { type: 'FULL_EXAM' },
    });
  });
});
