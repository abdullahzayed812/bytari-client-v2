import { useAuthStore } from '@/features/auth/store';
import type { User } from '@/features/auth/types';
import { apiClient } from '@/services/api';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
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

  // Exactly what `GET /vet-services/listings/:id` returns (public projection):
  // no moderation metadata, but `status` + `closedAt` drive the actions.
  const publicDetail = {
    ...listing,
    veterinarianUserId: undefined,
    rejectionReason: undefined,
    reviewedAt: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    publishedAt: '2026-10-01T00:00:00.000Z',
  };
  const openDetails = (data: object, viewerId = 'owner-1') => {
    useAuthStore.setState({ user: { id: viewerId } as User });
    setSearchParams({ listingId: 'l1' });
    jest.spyOn(apiClient, 'get').mockResolvedValue(data);
    renderWithProviders(<ServiceListingDetailScreen />);
  };

  it('the details page offers both actions to another user; "طلب الخدمة" opens the request flow', async () => {
    openDetails(publicDetail);
    fireEvent.press(await screen.findByText('طلب الخدمة'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/vet-services/listings/l1/request');
    expect(screen.getByText('تواصل مع الطبيب')).toBeTruthy();
  });

  it('"تواصل مع الطبيب" opens (or reuses) the deal chat with that vet', async () => {
    const post = jest.spyOn(apiClient, 'post').mockResolvedValue({ conversationId: 'conv-9' });
    openDetails(publicDetail);
    fireEvent.press(await screen.findByText('تواصل مع الطبيب'));
    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledWith('/(app)/vet-services/deals/conv-9'),
    );
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/vet-services/listings/l1/conversation');
  });

  it('a chat the backend refuses shows an error and does not navigate', async () => {
    const { ApiError } = jest.requireActual('@/services/api');
    jest
      .spyOn(apiClient, 'post')
      .mockRejectedValue(new ApiError({ code: 'FORBIDDEN', message: 'غير مسموح', status: 403 }));
    openDetails(publicDetail);
    fireEvent.press(await screen.findByText('تواصل مع الطبيب'));
    await waitFor(() => expect(screen.getByText('لا تملك صلاحية تنفيذ هذا الإجراء.')).toBeTruthy());
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it('the provider viewing their own service, or a closed service, gets no request / contact actions', async () => {
    openDetails(publicDetail, 'vet-1');
    await screen.findByText('تلقيح المواشي');
    expect(screen.queryByText('طلب الخدمة')).toBeNull();
    expect(screen.queryByText('تواصل مع الطبيب')).toBeNull();
  });

  it('a closed service hides both actions', async () => {
    openDetails({ ...publicDetail, closedAt: '2026-10-05T00:00:00.000Z' });
    await screen.findByText('تلقيح المواشي');
    expect(screen.queryByText('طلب الخدمة')).toBeNull();
    expect(screen.queryByText('تواصل مع الطبيب')).toBeNull();
  });
});
