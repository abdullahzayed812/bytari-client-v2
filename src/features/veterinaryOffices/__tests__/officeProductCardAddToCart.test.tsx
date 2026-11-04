import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { PublicVeterinaryOfficeProductCard } from '../browse/components';
import type { VeterinaryOfficeProduct } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const product = (over: Partial<VeterinaryOfficeProduct> = {}): VeterinaryOfficeProduct => ({
  id: 'p1',
  organizationId: 'o1',
  name: 'أنتي بيك',
  description: null,
  productType: 'MEDICINE',
  price: '25000.00',
  status: 'ACTIVE',
  isHidden: false,
  subtype: null,
  weight: null,
  usageInstructions: null,
  dosage: null,
  shelfLife: null,
  manufacturer: null,
  brand: null,
  countryOfOrigin: null,
  highlights: [],
  primaryImageUrl: null,
  images: [],
  createdByUserId: 'u1',
  createdAt: '',
  updatedAt: '',
  ...over,
});

describe('clinic / office product card — "تسوق"', () => {
  it('adds to cart without opening the product', () => {
    const onPress = jest.fn();
    const onAddToCart = jest.fn();
    renderWithProviders(
      <PublicVeterinaryOfficeProductCard
        product={product()}
        width={180}
        onPress={onPress}
        onAddToCart={onAddToCart}
      />,
    );
    fireEvent.press(screen.getByText('تسوق'));
    expect(onAddToCart).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('is disabled for a product without a price', () => {
    const onAddToCart = jest.fn();
    renderWithProviders(
      <PublicVeterinaryOfficeProductCard
        product={product({ price: null })}
        width={180}
        onPress={() => {}}
        onAddToCart={onAddToCart}
      />,
    );
    fireEvent.press(screen.getByText('تسوق'));
    expect(onAddToCart).not.toHaveBeenCalled();
  });

  it('shows no button when the screen does not offer add-to-cart', () => {
    renderWithProviders(
      <PublicVeterinaryOfficeProductCard product={product()} width={180} onPress={() => {}} />,
    );
    expect(screen.queryByText('تسوق')).toBeNull();
  });
});
