import { useAuthStore } from '@/features/auth/store';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { medicalRecordsApi } from '../api';
import MedicalRecordFormScreen from '../screens/MedicalRecordFormScreen';
import type { MedicalRecord } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const rec: MedicalRecord = {
  id: 'r1',
  animalId: 'a1',
  organizationId: 'o1',
  recordedByUserId: 'u1',
  visitDate: '2026-02-01',
  reason: null,
  diagnosis: 'التهاب الأذن',
  treatment: null,
  notes: null,
  createdAt: '2026-02-01T10:00:00.000Z',
  updatedAt: '2026-02-01T10:00:00.000Z',
};

describe('MedicalRecordFormScreen — CLINIC create / edit (§7, §8, §9)', () => {
  const create = jest.spyOn(medicalRecordsApi, 'create');
  const update = jest.spyOn(medicalRecordsApi, 'update');
  const getForClinic = jest.spyOn(medicalRecordsApi, 'getForClinic');

  beforeEach(() => {
    resetRouterMock();
    create.mockReset();
    update.mockReset();
    getForClinic.mockReset();
    useAuthStore.setState({ session: null });
  });
  afterAll(() => jest.restoreAllMocks());

  it('blocks submit until at least one clinical field is filled', async () => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1' });
    renderWithProviders(<MedicalRecordFormScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'حفظ السجل' }));
    await waitFor(() =>
      expect(
        screen.getByText(
          'أدخل واحداً على الأقل من: سبب الزيارة أو التشخيص أو العلاج أو الملاحظات.',
        ),
      ).toBeOnTheScreen(),
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('creates a record (animal id from the route, not the body) then goes back', async () => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1' });
    create.mockResolvedValueOnce({ ...rec });
    renderWithProviders(<MedicalRecordFormScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('التشخيص السريري…'), 'التهاب الأذن');
    fireEvent.press(screen.getByRole('button', { name: 'حفظ السجل' }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        'o1',
        'a1',
        expect.objectContaining({ diagnosis: 'التهاب الأذن' }),
      ),
    );
    await waitFor(() => expect(routerMock.back).toHaveBeenCalled());
  });

  it('maps a 409 ANIMAL_NOT_ACTIVE to the archived-animal message (raw hidden)', async () => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1' });
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    create.mockRejectedValueOnce(
      new ApiError({ code: 'ANIMAL_NOT_ACTIVE' as never, message: 'raw', status: 409 }),
    );
    renderWithProviders(<MedicalRecordFormScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('التشخيص السريري…'), 'x');
    fireEvent.press(screen.getByRole('button', { name: 'حفظ السجل' }));
    await waitFor(() =>
      expect(
        screen.getByText('هذا الحيوان مؤرشف ولا يمكن تعديل بياناته الطبية.'),
      ).toBeOnTheScreen(),
    );
    expect(screen.queryByText('raw')).toBeNull();
  });

  it('guards against a duplicate submit while the request is pending', async () => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1' });
    let resolve!: (r: MedicalRecord) => void;
    create.mockReturnValueOnce(new Promise<MedicalRecord>((r) => (resolve = r)));
    renderWithProviders(<MedicalRecordFormScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('التشخيص السريري…'), 'x');
    const btn = screen.getByRole('button', { name: 'حفظ السجل' });
    fireEvent.press(btn);
    fireEvent.press(btn);
    fireEvent.press(btn);
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    resolve(rec);
  });

  it('edit mode prefills the record and PATCHes it', async () => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1', recordId: 'r1' });
    getForClinic.mockResolvedValue({ ...rec });
    update.mockResolvedValueOnce({ ...rec, diagnosis: 'محدّث' });
    renderWithProviders(<MedicalRecordFormScreen />);

    await waitFor(() => expect(screen.getByDisplayValue('التهاب الأذن')).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('button', { name: 'حفظ التعديلات' }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        'o1',
        'a1',
        'r1',
        expect.objectContaining({ diagnosis: 'التهاب الأذن' }),
      ),
    );
  });
});
