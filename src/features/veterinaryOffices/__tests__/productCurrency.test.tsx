import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';

import { PublicVeterinaryOfficeProductCard } from '../browse/components';
import { VeterinaryOfficeProductForm } from '../dashboard/components';
import type { VeterinaryOfficeProduct } from '../types';
import { productCurrency } from '../utils';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const product = (over: Partial<VeterinaryOfficeProduct> = {}): VeterinaryOfficeProduct => ({
  id: 'p1',
  organizationId: 'o1',
  name: 'أنتي بيك',
  description: null,
  productType: 'MEDICINE',
  price: '25000.00',
  stockQuantity: 10,
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

describe('office product currency — display', () => {
  it('legacy products without a currency are dinars', () => {
    expect(productCurrency({})).toBe('IQD');
    expect(productCurrency({ currency: 'USD' })).toBe('USD');
  });

  it('shows the dinar sign for IQD and the dollar sign for USD', () => {
    const { rerender } = renderWithProviders(
      <PublicVeterinaryOfficeProductCard product={product()} width={180} onPress={() => {}} />,
    );
    expect(screen.getByText('25,000 د.ع')).toBeOnTheScreen();

    rerender(
      <PublicVeterinaryOfficeProductCard
        product={product({ price: '12.50', currency: 'USD' })}
        width={180}
        onPress={() => {}}
      />,
    );
    expect(screen.getByText('12.50 $')).toBeOnTheScreen();
  });
});

describe('office product currency — form', () => {
  it('defaults to Dinar and submits the chosen currency', async () => {
    const onSubmit = jest.fn();
    renderWithProviders(
      <VeterinaryOfficeProductForm
        mode="create"
        submitting={false}
        defaultValues={{ name: 'لقاح', price: '12.50' }}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByText('العملة')).toBeOnTheScreen();
    expect(screen.getByText('دينار عراقي')).toBeOnTheScreen();

    fireEvent.press(screen.getByText('دينار عراقي'));
    fireEvent.press(await screen.findByText('دولار أمريكي'));
    fireEvent.press(screen.getByLabelText('حفظ المنتج'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ price: '12.50', currency: 'USD' });
  });

  it('edit keeps the product’s existing currency', async () => {
    const onSubmit = jest.fn();
    renderWithProviders(
      <VeterinaryOfficeProductForm
        mode="edit"
        submitting={false}
        defaultValues={{ name: 'لقاح', price: '9', currency: 'USD' }}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByText('دولار أمريكي')).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText('حفظ التغييرات'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ currency: 'USD' });
  });
});
