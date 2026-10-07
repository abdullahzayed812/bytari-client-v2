import { useAuthStore } from '@/features/auth/store';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';
import { apiClient } from '@/services/api';

import { clinicCareApi, medicalRecordsApi, vaccinationsApi } from '../api';
import MedicalRecordFormScreen from '../screens/MedicalRecordFormScreen';
import QuickReviewScreen from '../screens/QuickReviewScreen';
import ReminderFormScreen from '../screens/ReminderFormScreen';
import type { MedicalRecord, QuickReviewTemplate } from '../types';
import { recordExtras } from './fixtures';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const rec: MedicalRecord = {
  ...recordExtras,
  id: 'r1',
  animalId: 'a1',
  organizationId: 'o1',
  recordedByUserId: 'u1',
  visitDate: '2026-02-01',
  reason: null,
  diagnosis: 'x',
  treatment: null,
  notes: null,
  createdAt: '',
  updatedAt: '',
};

function template(over: Partial<QuickReviewTemplate>): QuickReviewTemplate {
  return {
    id: 't1',
    organizationId: 'o1',
    name: 'لقاح السعار',
    templateType: 'VACCINE',
    defaultDiagnosis: null,
    defaultTreatment: null,
    defaultNotes: 'سنوي',
    intervalDays: 365,
    createdAt: '',
    updatedAt: '',
    ...over,
  };
}

beforeEach(() => {
  resetRouterMock();
  useAuthStore.setState({ session: null });
});
afterAll(() => jest.restoreAllMocks());

describe('full exam / lab / file entry (legacy parity)', () => {
  const create = jest.spyOn(medicalRecordsApi, 'create');
  beforeEach(() => create.mockReset().mockResolvedValue(rec));

  it('full exam requires a diagnosis, folds medications into the treatment, and stores the legacy fields', async () => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1', type: 'FULL_EXAM' });
    renderWithProviders(<MedicalRecordFormScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'حفظ السجل' }));
    await waitFor(() => expect(screen.getByText('يجب إدخال التشخيص.')).toBeOnTheScreen());
    expect(create).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByPlaceholderText('التشخيص السريري…'), 'التهاب');
    fireEvent.changeText(screen.getByPlaceholderText('الأعراض الظاهرة…'), 'حرارة');
    fireEvent.press(screen.getByText('شديدة'));
    fireEvent.press(screen.getByText('إضافة دواء'));
    fireEvent.changeText(screen.getByPlaceholderText('اسم الدواء'), 'أموكسيسيلين');
    fireEvent.changeText(screen.getByPlaceholderText('الجرعة'), '250mg');
    fireEvent.changeText(screen.getByPlaceholderText('أدخل نتائج التحاليل المخبرية'), 'CBC');
    fireEvent.press(screen.getByRole('button', { name: 'حفظ السجل' }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        'o1',
        'a1',
        expect.objectContaining({
          recordType: 'FULL_EXAM',
          diagnosis: 'التهاب',
          symptoms: 'حرارة',
          severity: 'SEVERE',
          treatment: 'أموكسيسيلين - 250mg',
          labNotes: 'CBC',
          isDraft: false,
          attachmentKeys: [],
        }),
      ),
    );
  });

  it('a full exam can be saved as a draft without a treatment', async () => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1', type: 'FULL_EXAM' });
    renderWithProviders(<MedicalRecordFormScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('التشخيص السريري…'), 'متابعة');
    fireEvent.press(screen.getByRole('button', { name: 'حفظ كمسودة' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        'o1',
        'a1',
        expect.objectContaining({ isDraft: true, recordType: 'FULL_EXAM' }),
      ),
    );
  });

  it('a lab entry requires lab results', async () => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1', type: 'LAB' });
    renderWithProviders(<MedicalRecordFormScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'حفظ السجل' }));
    await waitFor(() => expect(screen.getByText('يرجى إدخال نتائج التحليل.')).toBeOnTheScreen());
    fireEvent.changeText(screen.getByPlaceholderText('أدخل نتائج التحاليل المخبرية'), 'Glucose 90');
    fireEvent.press(screen.getByRole('button', { name: 'حفظ السجل' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        'o1',
        'a1',
        expect.objectContaining({ recordType: 'LAB', labNotes: 'Glucose 90' }),
      ),
    );
  });

  it('a file entry requires an image or file', async () => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1', type: 'FILE' });
    renderWithProviders(<MedicalRecordFormScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'حفظ السجل' }));
    await waitFor(() => expect(screen.getByText('يرجى إضافة صورة أو ملف.')).toBeOnTheScreen());
    expect(create).not.toHaveBeenCalled();
  });
});

describe('quick review — legacy routing rule', () => {
  const list = jest.spyOn(clinicCareApi, 'listTemplates');
  const createVax = jest.spyOn(vaccinationsApi, 'create');
  const createRec = jest.spyOn(medicalRecordsApi, 'create');
  beforeEach(() => {
    createVax.mockReset().mockResolvedValue({} as never);
    createRec.mockReset().mockResolvedValue(rec);
    setSearchParams({ organizationId: 'o1', animalId: 'a1' });
  });

  it('a VACCINE template becomes a scheduled vaccination with the template interval', async () => {
    list.mockResolvedValue([template({})]);
    renderWithProviders(<QuickReviewScreen />);
    await waitFor(() => expect(screen.getByText('لقاح السعار')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('لقاح السعار'));
    fireEvent.press(screen.getByRole('button', { name: 'حفظ الإجراء' }));
    await waitFor(() =>
      expect(createVax).toHaveBeenCalledWith(
        'o1',
        'a1',
        expect.objectContaining({
          vaccineName: 'لقاح السعار',
          status: 'SCHEDULED',
          nextDueOn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          notes: 'سنوي',
        }),
      ),
    );
    expect(createRec).not.toHaveBeenCalled();
  });

  it('a DIAGNOSIS template becomes a QUICK_REVIEW medical record', async () => {
    list.mockResolvedValue([
      template({
        id: 't2',
        name: 'فحص أذن',
        templateType: 'DIAGNOSIS',
        defaultDiagnosis: 'التهاب الأذن',
        defaultTreatment: 'قطرة',
        defaultNotes: null,
        intervalDays: null,
      }),
    ]);
    renderWithProviders(<QuickReviewScreen />);
    await waitFor(() => expect(screen.getByText('فحص أذن')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('فحص أذن'));
    fireEvent.press(screen.getByRole('button', { name: 'حفظ الإجراء' }));
    await waitFor(() =>
      expect(createRec).toHaveBeenCalledWith(
        'o1',
        'a1',
        expect.objectContaining({
          recordType: 'QUICK_REVIEW',
          diagnosis: 'التهاب الأذن',
          treatment: 'قطرة',
        }),
      ),
    );
    expect(createVax).not.toHaveBeenCalled();
  });
});

describe('reminder form', () => {
  it('requires a title and creates the reminder (default date one week ahead, type CHECKUP)', async () => {
    const create = jest.spyOn(clinicCareApi, 'createReminder').mockResolvedValue({} as never);
    setSearchParams({ organizationId: 'o1', animalId: 'a1' });
    renderWithProviders(<ReminderFormScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'حفظ التذكير' }));
    await waitFor(() => expect(screen.getByText('عنوان التذكير مطلوب.')).toBeOnTheScreen());
    fireEvent.changeText(screen.getByPlaceholderText('أدخل عنوان التذكير'), 'فحص دوري');
    fireEvent.press(screen.getByText('دواء'));
    fireEvent.press(screen.getByRole('button', { name: 'حفظ التذكير' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        'o1',
        'a1',
        expect.objectContaining({
          title: 'فحص دوري',
          reminderType: 'MEDICATION',
          reminderDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
      ),
    );
    await waitFor(() => expect(routerMock.back).toHaveBeenCalled());
  });
});

describe('clinic care API wrappers (org + animal ids in the URL only)', () => {
  let get: jest.SpyInstance;
  let post: jest.SpyInstance;
  let envelope: jest.SpyInstance;
  beforeEach(() => {
    jest.restoreAllMocks(); // the screen tests above stub clinicCareApi methods
    get = jest.spyOn(apiClient, 'get').mockResolvedValue([] as never);
    post = jest.spyOn(apiClient, 'post').mockResolvedValue({} as never);
    envelope = jest
      .spyOn(apiClient, 'requestEnvelope')
      .mockResolvedValue({ data: [], meta: {} } as never);
  });

  it('hits the clinic-scoped routes', async () => {
    await clinicCareApi.requestAttachmentUpload('o1', 'a1', {
      filename: 'rx.jpg',
      mimeType: 'image/jpeg',
      size: 10,
    });
    expect(post).toHaveBeenCalledWith(
      '/organizations/o1/animals/a1/medical-records/attachments/upload-url',
      { filename: 'rx.jpg', mimeType: 'image/jpeg', size: 10 },
    );
    await clinicCareApi.listClinicVaccinations('o1', 'OVERDUE', 1, 20);
    expect(envelope).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/organizations/o1/clinic-vaccinations',
        params: { status: 'OVERDUE', page: 1, pageSize: 20 },
      }),
    );
    await clinicCareApi.notifyTodayReminders('o1');
    expect(post).toHaveBeenCalledWith('/organizations/o1/clinic-reminders/notify-today');
    await clinicCareApi.listTemplates('o1');
    expect(get).toHaveBeenCalledWith('/organizations/o1/quick-review-templates');
    await clinicCareApi.listOwnerReminders('a1', 1, 50);
    expect(envelope).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/animals/a1/reminders' }),
    );
  });
});
