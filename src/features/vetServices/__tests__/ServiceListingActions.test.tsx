import { useAuthStore } from '@/features/auth/store';
import type { User } from '@/features/auth/types';
import { apiClient } from '@/services/api';
import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { ServiceListingCard } from '../components';
import ServiceListingDetailScreen from '../screens/ServiceListingDetailScreen';
import type { ServiceListing } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const listing: ServiceListing = {
  id: 'l1',
  veterinarianUserId: 'vet-1',
  veterinarian: {
    id: 'vet-1',
    firstName: 'زهير',
    lastName: 'جميل',
  } as ServiceListing['veterinarian'],
  title: 'تلقيح المواشي',
  description: 'خدمة تلقيح ميدانية',
  serviceType: 'VACCINATION' as ServiceListing['serviceType'],
  animalType: 'CATTLE' as ServiceListing['animalType'],
  specialty: null,
  governorate: 'بغداد',
  district: null,
  priceAmount: '25000',
  priceType: 'FIXED' as ServiceListing['priceType'],
  locationMode: 'FIELD' as ServiceListing['locationMode'],
  availability: null,
  contactPhone: null,
  contactWhatsapp: null,
  executionDuration: null,
  arrivalTime: null,
  details: [],
  imageUrls: [],
  status: 'APPROVED',
  rejectionReason: null,
  closedAt: null,
  reviewedAt: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

beforeEach(() => {
  resetRouterMock();
  jest.restoreAllMocks();
});

describe('Vet services — request / contact live on the Service Details page only', () => {
  it('the list card has no request / contact buttons and opens the details', () => {
    const onPress = jest.fn();
    renderWithProviders(<ServiceListingCard listing={listing} onPress={onPress} />);
    expect(screen.queryByText('طلب الخدمة')).toBeNull();
    expect(screen.queryByText('تواصل مع الطبيب')).toBeNull();
    fireEvent.press(screen.getByText('تلقيح المواشي'));
    expect(onPress).toHaveBeenCalled();
  });

  it('the details page offers both actions to another user', async () => {
    useAuthStore.setState({ user: { id: 'owner-1' } as User });
    setSearchParams({ listingId: 'l1' });
    jest.spyOn(apiClient, 'get').mockResolvedValue(listing);
    renderWithProviders(<ServiceListingDetailScreen />);

    fireEvent.press(await screen.findByText('طلب الخدمة'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/vet-services/listings/l1/request');
    expect(screen.getByText('تواصل مع الطبيب')).toBeTruthy();
  });
});
