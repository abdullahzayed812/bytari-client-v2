import { renderWithProviders, screen, fireEvent } from '@/test-utils/render';

import { ImageThumbnailRow } from '../ImageThumbnailRow';

const URLS = [
  'https://cdn.example/r2/a.jpg',
  'https://cdn.example/r2/b.jpg',
  'https://cdn.example/r2/c.jpg',
];

describe('ImageThumbnailRow', () => {
  it('renders one tappable tile per image and reports the tapped index', () => {
    const onPress = jest.fn();
    renderWithProviders(<ImageThumbnailRow images={URLS} onPress={onPress} />);

    expect(screen.getByLabelText('1/3')).toBeTruthy();
    expect(screen.getByLabelText('3/3')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('2/3'));
    expect(onPress).toHaveBeenCalledWith(1);
  });

  it('uses a caller-supplied accessibility label (e.g. a document kind)', () => {
    renderWithProviders(
      <ImageThumbnailRow
        images={URLS.slice(0, 1)}
        accessibilityLabelFor={(index, total) => `doc ${index + 1} of ${total}`}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByLabelText('doc 1 of 1')).toBeTruthy();
  });

  it('renders the empty label instead of tiles when there are no images', () => {
    const onPress = jest.fn();
    renderWithProviders(
      <ImageThumbnailRow images={[]} emptyLabel="no photos" onPress={onPress} />,
    );
    expect(screen.getByText('no photos')).toBeTruthy();
    expect(screen.queryByLabelText('1/0')).toBeNull();
  });

  it('renders nothing when empty with no emptyLabel and no placeholder requested', () => {
    const { toJSON } = renderWithProviders(<ImageThumbnailRow images={[]} />);
    // Only the test providers' own wrapper remains — the component itself is absent.
    expect((toJSON() as { children: unknown[] } | null)?.children).toBeFalsy();
  });

  it('renders one inert placeholder tile when asked, so list rows keep their layout', () => {
    const { toJSON } = renderWithProviders(<ImageThumbnailRow images={[]} placeholderWhenEmpty />);
    expect((toJSON() as { children: unknown[] } | null)?.children).toBeTruthy();
  });

  it('is not pressable when no onPress is supplied', () => {
    renderWithProviders(<ImageThumbnailRow images={URLS.slice(0, 1)} />);
    expect(screen.getByLabelText('1/1').props.accessibilityRole).toBe('image');
  });
});
