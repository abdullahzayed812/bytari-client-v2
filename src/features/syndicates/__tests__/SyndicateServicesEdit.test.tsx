import { TextInput } from 'react-native';

import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import { syndicatesApi } from '../api/syndicatesApi';
import SyndicateServicesEditScreen from '../screens/SyndicateServicesEditScreen';
import type { MySyndicateAccess, SyndicateServiceItem } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const access = (over: Partial<MySyndicateAccess> = {}): MySyndicateAccess => ({
  isAdmin: false,
  isOwner: false,
  canManageProfile: true,
  canManageAnnouncements: true,
  canReadSubmissions: true,
  canRespondSubmissions: true,
  canReadMembers: true,
  canManageMembers: true,
  canMessageMembers: true,
  canDelete: false,
  isRegistered: false,
  ...over,
});

const service = (over: Partial<SyndicateServiceItem>): SyndicateServiceItem => ({
  id: 'sv1',
  organizationId: 's1',
  serviceKey: 'ID_CARD',
  title: null,
  description: null,
  isEnabled: true,
  sortOrder: 1,
  updatedAt: '2026-10-28T10:00:00.000Z',
  ...over,
});

describe('Syndicate — Edit Services', () => {
  beforeEach(() => {
    resetRouterMock();
    setSearchParams({ organizationId: 's1' });
  });
  afterEach(() => jest.restoreAllMocks());

  it('lists every service with its current data and saves one in place (same id)', async () => {
    jest.spyOn(syndicatesApi, 'getMyAccess').mockResolvedValue(access());
    const list = jest.spyOn(syndicatesApi, 'listServices').mockResolvedValue([
      service({ id: 'sv1', serviceKey: 'ID_CARD' }),
      service({
        id: 'sv5',
        serviceKey: 'LEGAL_SUPPORT',
        title: 'الاستشارات القانونية',
        description: 'نص قديم',
        sortOrder: 5,
      }),
    ]);
    const update = jest
      .spyOn(syndicatesApi, 'updateService')
      .mockResolvedValue(service({ id: 'sv5', serviceKey: 'LEGAL_SUPPORT', title: 'جديد' }));

    renderWithProviders(<SyndicateServicesEditScreen />);
    // Current data is loaded into the fields (custom title shown; default title as placeholder).
    expect(await screen.findByDisplayValue('الاستشارات القانونية')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('نص قديم')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('إصدار/تجديد هوية نقابة')).toBeOnTheScreen();

    fireEvent.changeText(screen.getByDisplayValue('الاستشارات القانونية'), 'جديد');
    fireEvent.press(screen.getByRole('button', { name: 'حفظ الخدمة — الدعم القانوني' }));

    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update).toHaveBeenCalledWith('s1', 'sv5', {
      title: 'جديد',
      description: 'نص قديم',
      isEnabled: true,
    });
    expect(await screen.findByText('تم حفظ الخدمة')).toBeOnTheScreen();
    // The list is reloaded from the server after saving.
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
  });

  it('an unchanged service cannot be saved; a too-long title is flagged', async () => {
    jest.spyOn(syndicatesApi, 'getMyAccess').mockResolvedValue(access());
    jest.spyOn(syndicatesApi, 'listServices').mockResolvedValue([service({})]);
    renderWithProviders(<SyndicateServicesEditScreen />);
    const save = await screen.findByRole('button', { name: 'حفظ الخدمة — إصدار/تجديد هوية نقابة' });
    expect(save).toBeDisabled();
    fireEvent.changeText(screen.UNSAFE_getAllByType(TextInput)[0]!, 'x'.repeat(121));
    expect(screen.getByText('العنوان طويل جداً (120 حرفاً كحد أقصى).')).toBeOnTheScreen();
    expect(save).toBeDisabled();
  });

  it('a viewer without syndicate.profile.manage gets no editor', async () => {
    jest.spyOn(syndicatesApi, 'getMyAccess').mockResolvedValue(access({ canManageProfile: false }));
    jest.spyOn(syndicatesApi, 'listServices').mockResolvedValue([service({})]);
    renderWithProviders(<SyndicateServicesEditScreen />);
    expect(await screen.findByText('النقابة غير متاحة')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /حفظ الخدمة/ })).toBeNull();
  });
});
