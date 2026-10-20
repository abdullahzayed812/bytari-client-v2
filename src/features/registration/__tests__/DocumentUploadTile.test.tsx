import {
  ID_DOCUMENT_EDIT,
  editorAspects,
  initialCropRect,
  lockedRatio,
  planEditActions,
  resizeCropFromHandle,
  type LocalFile,
} from '@/services/media';
import { act, fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';

import { DocumentUploadTile } from '../components/DocumentUploadTile';

const mockPickImage = jest.fn();
jest.mock('@/services/media', () => {
  const actual = jest.requireActual('@/services/media');
  return { ...actual, pickImage: (...a: unknown[]) => mockPickImage(...a) };
});

const FILE: LocalFile = {
  uri: 'file:///tmp/id.jpg',
  name: 'id.jpg',
  mimeType: 'image/jpeg',
  size: 1234,
  width: 4000,
  height: 3000,
};

beforeEach(() => mockPickImage.mockReset());

describe('veterinarian / student ID uploads — free crop in the shared editor', () => {
  it('routes the picked ID photo through the shared editor with the free-crop preset', async () => {
    mockPickImage.mockResolvedValue(FILE);
    const onChange = jest.fn();
    renderWithProviders(
      <DocumentUploadTile label="هوية الطالب (الوجه)" required value={null} onChange={onChange} />,
    );

    fireEvent.press(screen.getByLabelText('إضافة صورة'));
    await act(async () => {
      fireEvent.press(screen.getByLabelText('اختيار من المعرض'));
    });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(FILE));
    expect(mockPickImage).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'library', edit: ID_DOCUMENT_EDIT }),
    );
  });

  it('the preset starts unlocked (free) and keeps a legible, size-safe export cap', () => {
    expect(ID_DOCUMENT_EDIT.defaultAspect).toBe('free');
    expect(editorAspects(ID_DOCUMENT_EDIT)[0]).toBe('free');
    expect(ID_DOCUMENT_EDIT.outputSize).toBeUndefined(); // no forced output dimensions
    expect(ID_DOCUMENT_EDIT.defaultMaxDimension).toBe(2048);
    expect(lockedRatio('free', 4000, 3000)).toBeNull();
  });

  it('a free crop resizes each side independently and exports exactly the framed area', () => {
    const bounds = { width: 2000, height: 1500 };
    let rect = initialCropRect(bounds.width, bounds.height, 'free');
    expect(rect).toEqual({ x: 0, y: 0, width: 2000, height: 1500 });

    // pull the right edge in and the top edge down — no ratio lock
    rect = resizeCropFromHandle(rect, 'r', -600, 0, bounds, null, 48);
    rect = resizeCropFromHandle(rect, 't', 0, 300, bounds, null, 48);
    // and a corner, on both axes at once
    rect = resizeCropFromHandle(rect, 'bl', 100, -200, bounds, null, 48);
    expect(rect).toEqual({ x: 100, y: 300, width: 1300, height: 1000 });

    const { actions, output } = planEditActions(bounds, rect, { maxDimension: 2048 });
    expect(actions).toEqual([{ crop: { originX: 100, originY: 300, width: 1300, height: 1000 } }]);
    expect(output).toEqual({ width: 1300, height: 1000 });
  });
});
