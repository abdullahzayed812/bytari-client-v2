import { renderWithProviders, screen } from '@/test-utils/render';

import {
  VeterinaryOfficeProductCard,
  VeterinaryOfficeProductForm,
  VeterinaryOfficeProductManageCard,
} from '../dashboard/components';
import type { VeterinaryOfficeProduct } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

/** A product as an older server could still send it — with a legacy zero stock. */
const legacyZeroStock = {
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
  stockQuantity: 0,
} as VeterinaryOfficeProduct;

describe('veterinary office products — no inventory management', () => {
  it('the add / edit form has no stock field', () => {
    for (const mode of ['create', 'edit'] as const) {
      const { unmount } = renderWithProviders(
        <VeterinaryOfficeProductForm mode={mode} submitting={false} onSubmit={() => {}} />,
      );
      expect(screen.queryByText('المخزون الافتتاحي')).toBeNull();
      unmount();
    }
  });

  it('cards show a zero-stock product as a normal product (no stock / "out of stock" line)', () => {
    renderWithProviders(
      <>
        <VeterinaryOfficeProductCard product={legacyZeroStock} onPress={() => {}} />
        <VeterinaryOfficeProductManageCard
          product={legacyZeroStock}
          width={180}
          onPress={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
          onToggleHidden={() => {}}
        />
      </>,
    );
    expect(screen.getAllByText('أنتي بيك')).toHaveLength(2);
    expect(screen.queryByText('غير متوفر')).toBeNull();
    expect(screen.queryByText(/المخزون/)).toBeNull();
  });
});
