import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { syndicatesApi } from '../api/syndicatesApi';
import SyndicateIdRequirementsScreen from '../screens/SyndicateIdRequirementsScreen';
import SyndicateServiceContentEditScreen from '../screens/SyndicateServiceContentEditScreen';
import type { MySyndicateAccess, SyndicateServiceContent, SyndicateServiceItem } from '../types';

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
  content: null,
  updatedAt: '2026-10-28T10:00:00.000Z',
  ...over,
});

const CUSTOM: SyndicateServiceContent = {
  heading: 'الشروط',
  body: null,
  sections: [
    {
      id: 'a',
      title: 'قسم مخصص',
      style: 'CHECK',
      items: [
        { id: 'a1', text: 'بند أول' },
        { id: 'a2', text: 'بند ثانٍ' },
      ],
    },
    { id: 'b', title: 'ملاحظات', style: 'NOTE', items: [] },
  ],
  footnote: null,
  note: 'ملاحظة مخصصة',
};

describe('Syndicate service page content', () => {
  beforeEach(() => {
    resetRouterMock();
    setSearchParams({ organizationId: 's1' });
  });
  afterEach(() => jest.restoreAllMocks());

  it('shows the built-in content until the syndicate saves its own, then the saved document', async () => {
    jest.spyOn(syndicatesApi, 'getMyAccess').mockResolvedValue(access({ canManageProfile: false }));
    const list = jest.spyOn(syndicatesApi, 'listServices').mockResolvedValue([service({})]);
    const { unmount } = renderWithProviders(<SyndicateIdRequirementsScreen />);
    expect(await screen.findByText('لإصدار هوية نقابية جديدة')).toBeOnTheScreen();
    expect(screen.getByText('صورة شخصية حديثة بخلفية بيضاء.')).toBeOnTheScreen();
    // No edit action for a viewer without syndicate.profile.manage.
    expect(screen.queryByLabelText('تعديل محتوى الصفحة')).toBeNull();
    unmount();

    list.mockResolvedValue([service({ content: CUSTOM })]);
    renderWithProviders(<SyndicateIdRequirementsScreen />);
    expect(await screen.findByText('قسم مخصص')).toBeOnTheScreen();
    expect(screen.getByText('بند ثانٍ')).toBeOnTheScreen();
    expect(screen.getByText('ملاحظة مخصصة')).toBeOnTheScreen();
    expect(screen.queryByText('لإصدار هوية نقابية جديدة')).toBeNull();
  });

  it('a manager opens the editor from the page header', async () => {
    jest.spyOn(syndicatesApi, 'getMyAccess').mockResolvedValue(access());
    jest.spyOn(syndicatesApi, 'listServices').mockResolvedValue([service({})]);
    renderWithProviders(<SyndicateIdRequirementsScreen />);
    fireEvent.press(await screen.findByLabelText('تعديل محتوى الصفحة'));
    expect(routerMock.push).toHaveBeenCalledWith(
      '/(app)/syndicates/s1/service-content?serviceKey=ID_CARD',
    );
  });

  it('edits the built-in content: rename, add, delete, reorder — and saves one document in place', async () => {
    setSearchParams({ organizationId: 's1', serviceKey: 'ID_CARD' });
    jest.spyOn(syndicatesApi, 'getMyAccess').mockResolvedValue(access());
    jest.spyOn(syndicatesApi, 'listServices').mockResolvedValue([service({})]);
    const update = jest
      .spyOn(syndicatesApi, 'updateService')
      .mockImplementation(async (_o, _s, input) => service({ content: input.content ?? null }));

    renderWithProviders(<SyndicateServiceContentEditScreen />);
    // Pre-filled with what users currently see.
    const firstItem = await screen.findByDisplayValue('صورة شخصية حديثة بخلفية بيضاء.');
    expect(screen.getByDisplayValue('لتجديد الهوية النقابية')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'حفظ المحتوى' })).toBeDisabled();

    fireEvent.changeText(firstItem, 'صورة شخصية ملونة.');
    fireEvent.press(screen.getByLabelText('حذف البند 5')); // first section's last item
    fireEvent.press(screen.getByLabelText('نقل القسم 2 للأعلى'));
    fireEvent.press(screen.getAllByText('إضافة بند')[0]!); // now the renew section
    const blanks = screen.getAllByDisplayValue('');
    fireEvent.changeText(blanks[blanks.length - 1]!, 'بند جديد');

    fireEvent.press(screen.getByRole('button', { name: 'حفظ المحتوى' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    const [org, serviceId, input] = update.mock.calls[0]!;
    expect([org, serviceId]).toEqual(['s1', 'sv1']);
    const content = input.content as SyndicateServiceContent;
    expect(content.sections.map((s) => s.title)).toEqual([
      'لتجديد الهوية النقابية',
      'لإصدار هوية نقابية جديدة',
    ]);
    expect(content.sections[0]!.items.map((i) => i.text).at(-1)).toBe('بند جديد');
    expect(content.sections[1]!.items.map((i) => i.text)).toEqual([
      'صورة شخصية ملونة.',
      'صورة من عقد الإيجار أو صك الملكية للموقع.',
      'صورة من البطاقة الوطنية / الإقامة.',
      'صورة من إجازة مزاولة المهنة سارية المفعول.',
    ]);
    expect(content.note).toBeTruthy();
    expect(await screen.findByText('تم حفظ محتوى الصفحة')).toBeOnTheScreen();
  });

  it('blocks saving an empty item / section title, and restores the default on confirm', async () => {
    setSearchParams({ organizationId: 's1', serviceKey: 'ID_CARD' });
    jest.spyOn(syndicatesApi, 'getMyAccess').mockResolvedValue(access());
    jest.spyOn(syndicatesApi, 'listServices').mockResolvedValue([service({ content: CUSTOM })]);
    const update = jest
      .spyOn(syndicatesApi, 'updateService')
      .mockResolvedValue(service({ content: null }));

    renderWithProviders(<SyndicateServiceContentEditScreen />);
    // Saved content (incl. an empty section) loads safely.
    fireEvent.changeText(await screen.findByDisplayValue('بند أول'), '   ');
    expect(screen.getByText('نص البند مطلوب — احذفه إن لم يعد لازماً.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'حفظ المحتوى' })).toBeDisabled();
    fireEvent.press(screen.getByLabelText('حذف البند 1'));
    fireEvent.changeText(screen.getByDisplayValue('قسم مخصص'), '');
    expect(screen.getByText('عنوان القسم مطلوب.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'حفظ المحتوى' })).toBeDisabled();
    expect(update).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('استعادة المحتوى الافتراضي'));
    fireEvent.press(screen.getAllByText('استعادة المحتوى الافتراضي').at(-1)!);
    await waitFor(() => expect(update).toHaveBeenCalledWith('s1', 'sv1', { content: null }));
  });

  it('is locked for a viewer without syndicate.profile.manage and for a non-content service', async () => {
    setSearchParams({ organizationId: 's1', serviceKey: 'ID_CARD' });
    jest.spyOn(syndicatesApi, 'getMyAccess').mockResolvedValue(access({ canManageProfile: false }));
    jest.spyOn(syndicatesApi, 'listServices').mockResolvedValue([service({})]);
    const { unmount } = renderWithProviders(<SyndicateServiceContentEditScreen />);
    expect(await screen.findByText('النقابة غير متاحة')).toBeOnTheScreen();
    unmount();

    setSearchParams({ organizationId: 's1', serviceKey: 'INQUIRY' });
    jest.spyOn(syndicatesApi, 'getMyAccess').mockResolvedValue(access());
    jest
      .spyOn(syndicatesApi, 'listServices')
      .mockResolvedValue([service({ id: 'sv2', serviceKey: 'INQUIRY' })]);
    renderWithProviders(<SyndicateServiceContentEditScreen />);
    expect(
      await screen.findByText('هذه الخدمة لا تحتوي على صفحة محتوى قابلة للتعديل'),
    ).toBeOnTheScreen();
  });
});
