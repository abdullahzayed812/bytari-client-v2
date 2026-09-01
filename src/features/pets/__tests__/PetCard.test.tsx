import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { PetCard } from '../components';
import type { Pet } from '../types';

const pet: Pet = {
  id: 'p1',
  name: 'لولو',
  species: 'CAT',
  breed: 'شيرازي',
  sex: 'FEMALE',
  dateOfBirth: '2022-01-01',
  notes: null,
  status: 'ACTIVE',
  createdBy: 'u1',
  currentOwnerUserId: 'u1',
  createdAt: '',
  updatedAt: '',
};

describe('PetCard', () => {
  it('shows the pet name, localized species and breed', () => {
    renderWithProviders(<PetCard pet={pet} />);
    expect(screen.getByText('لولو')).toBeOnTheScreen();
    expect(screen.getByText(/قط/)).toBeOnTheScreen();
    expect(screen.getByText(/شيرازي/)).toBeOnTheScreen();
  });

  it('fires onPress', () => {
    const onPress = jest.fn();
    renderWithProviders(<PetCard pet={pet} onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: /لولو/ }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows an archived badge for a deactivated pet', () => {
    renderWithProviders(<PetCard pet={{ ...pet, status: 'DEACTIVATED' }} />);
    expect(screen.getByText('مؤرشف')).toBeOnTheScreen();
  });

  it('falls back to "breed not set" when breed is null', () => {
    renderWithProviders(<PetCard pet={{ ...pet, breed: null }} />);
    expect(screen.getByText(/سلالة غير محددة/)).toBeOnTheScreen();
  });
});
