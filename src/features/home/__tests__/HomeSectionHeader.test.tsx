import { StyleSheet } from 'react-native';

import { renderWithProviders, screen } from '@/test-utils/render';

import { HomeSectionHeader } from '../components/HomeSectionHeader';

describe('HomeSectionHeader — the title is never clipped to its first word', () => {
  it('renders the full title and gives it the row’s remaining width (flex: 1)', () => {
    renderWithProviders(
      <HomeSectionHeader title="آخر الأخبار" actionLabel="عرض الكل" onAction={() => undefined} />,
    );
    const title = screen.getByText('آخر الأخبار');
    // A measured (intrinsic) width came back short on some Android devices and
    // the second word disappeared; a flex width cannot be under-measured.
    expect(StyleSheet.flatten(title.props.style)).toMatchObject({ flex: 1 });
    expect(screen.getByText('عرض الكل')).toBeOnTheScreen();
  });
});
