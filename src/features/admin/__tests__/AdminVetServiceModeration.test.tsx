import { adminVetServicesApi } from '@/features/vetServices';
import type { ServiceListing, ServiceRequest } from '@/features/vetServices';
import { renderWithProviders, screen, waitFor, fireEvent } from '@/test-utils/render';
import { resetRouterMock } from '@/test-utils/routerMock';

import AdminVetServiceListingsScreen from '../screens/AdminVetServiceListingsScreen';
import AdminVetServiceRequestsScreen from '../screens/AdminVetServiceRequestsScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const LISTING: ServiceListing = {
  id: 'l1',
  veterinarianUserId: 'v1',
  veterinarian: { id: 'v1', firstName: 'سالم', lastName: 'الطبيب' },
  title: 'تطعيم شامل للكلاب',
  description: 'خدمة تطعيم منزلية',
  serviceType: 'VACCINATION',
  animalType: 'DOG',
  specialty: null,
  governorate: 'بغداد',
  district: 'الكرادة',
  priceAmount: '25000',
  priceType: 'APPROXIMATE',
  locationMode: 'CLINIC',
  availability: null,
  contactPhone: '0770',
  contactWhatsapp: null,
  executionDuration: null,
  arrivalTime: null,
  details: [],
  imageUrls: [],
  status: 'PENDING',
  rejectionReason: null,
  closedAt: null,
  reviewedAt: null,
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
};

const REQUEST: ServiceRequest = {
  id: 'r1',
  requestNumber: 'REQ-2026-00001',
  petOwnerUserId: 'o1',
  petOwner: { id: 'o1', firstName: 'مريم', lastName: 'صاحبة' },
  title: 'كشف عاجل على قطة',
  description: 'القطة لا تأكل منذ يومين',
  animalType: 'CAT',
  serviceType: 'EXAMINATION',
  animalCount: 1,
  animalAge: 'سنتان',
  governorate: 'البصرة',
  district: null,
  detailedAddress: 'حي الجزائر، شارع 5',
  needsFieldVisit: true,
  preferredDate: null,
  budgetAmount: '15000',
  urgency: 'URGENT',
  extraNotes: null,
  imageUrls: [],
  status: 'PENDING',
  rejectionReason: null,
  closedAt: null,
  createdAt: '2026-03-02T00:00:00.000Z',
  updatedAt: '2026-03-02T00:00:00.000Z',
};

let listListings: jest.SpyInstance;
let approveListing: jest.SpyInstance;
let rejectListing: jest.SpyInstance;
let listRequests: jest.SpyInstance;
let approveRequest: jest.SpyInstance;
let rejectRequest: jest.SpyInstance;

beforeEach(() => {
  resetRouterMock();
  listListings = jest.spyOn(adminVetServicesApi, 'listListings').mockResolvedValue({
    items: [LISTING],
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  });
  approveListing = jest
    .spyOn(adminVetServicesApi, 'approveListing')
    .mockResolvedValue({ ...LISTING, status: 'APPROVED' });
  rejectListing = jest
    .spyOn(adminVetServicesApi, 'rejectListing')
    .mockResolvedValue({ ...LISTING, status: 'REJECTED' });
  listRequests = jest.spyOn(adminVetServicesApi, 'listRequests').mockResolvedValue({
    items: [REQUEST],
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  });
  approveRequest = jest
    .spyOn(adminVetServicesApi, 'approveRequest')
    .mockResolvedValue({ ...REQUEST, status: 'APPROVED' });
  rejectRequest = jest
    .spyOn(adminVetServicesApi, 'rejectRequest')
    .mockResolvedValue({ ...REQUEST, status: 'REJECTED' });
});
afterEach(() => jest.restoreAllMocks());

describe('AdminVetServiceListingsScreen', () => {
  it('lists PENDING listings by default and approves one', async () => {
    renderWithProviders(<AdminVetServiceListingsScreen />);
    await waitFor(() => expect(screen.getByText('تطعيم شامل للكلاب')).toBeTruthy());
    expect(listListings).toHaveBeenCalledWith(1, 20, { status: 'PENDING' });

    fireEvent.press(screen.getByText('موافقة'));
    fireEvent.press(screen.getByText('تأكيد الموافقة'));
    await waitFor(() => expect(approveListing).toHaveBeenCalledWith('l1'));
  });

  it('rejects a listing with a required reason', async () => {
    renderWithProviders(<AdminVetServiceListingsScreen />);
    await waitFor(() => expect(screen.getByText('تطعيم شامل للكلاب')).toBeTruthy());

    fireEvent.press(screen.getByText('رفض'));
    fireEvent.changeText(screen.getByPlaceholderText('اكتب سبب الرفض…'), 'بيانات غير كافية');
    fireEvent.press(screen.getByText('تأكيد الرفض'));
    await waitFor(() => expect(rejectListing).toHaveBeenCalledWith('l1', 'بيانات غير كافية'));
  });

  it('opens a details modal showing modal-only fields', async () => {
    renderWithProviders(<AdminVetServiceListingsScreen />);
    await waitFor(() => expect(screen.getByText('تطعيم شامل للكلاب')).toBeTruthy());

    fireEvent.press(screen.getByText('تطعيم شامل للكلاب'));
    await waitFor(() => expect(screen.getByText('0770')).toBeTruthy());
  });
});

describe('AdminVetServiceRequestsScreen', () => {
  it('lists PENDING requests by default and approves one', async () => {
    renderWithProviders(<AdminVetServiceRequestsScreen />);
    await waitFor(() => expect(screen.getByText('كشف عاجل على قطة')).toBeTruthy());
    expect(listRequests).toHaveBeenCalledWith(1, 20, { status: 'PENDING' });

    fireEvent.press(screen.getByText('موافقة'));
    fireEvent.press(screen.getByText('تأكيد الموافقة'));
    await waitFor(() => expect(approveRequest).toHaveBeenCalledWith('r1'));
  });

  it('rejects a request with a reason', async () => {
    renderWithProviders(<AdminVetServiceRequestsScreen />);
    await waitFor(() => expect(screen.getByText('كشف عاجل على قطة')).toBeTruthy());

    fireEvent.press(screen.getByText('رفض'));
    fireEvent.changeText(screen.getByPlaceholderText('اكتب سبب الرفض…'), 'خارج نطاق الخدمة');
    fireEvent.press(screen.getByText('تأكيد الرفض'));
    await waitFor(() => expect(rejectRequest).toHaveBeenCalledWith('r1', 'خارج نطاق الخدمة'));
  });
});
