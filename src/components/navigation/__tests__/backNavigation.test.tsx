import { I18nManager, StyleSheet } from 'react-native';

import { physicalLeft, physicalRow } from '@/lib/rtl';
import { renderWithProviders, screen } from '@/test-utils/render';

import { AppHeader } from '../AppHeader';
import { BackButton } from '../BackButton';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

type Node = ReturnType<typeof screen.UNSAFE_getByType>;

function setRTL(rtl: boolean) {
  Object.defineProperty(I18nManager, 'isRTL', { value: rtl, configurable: true });
}

const scaleX = (node: { props: { style?: unknown } }): number | undefined => {
  const style = StyleSheet.flatten(node.props.style) as
    { transform?: { scaleX?: number }[] } | undefined;
  return style?.transform?.find((t) => t.scaleX !== undefined)?.scaleX;
};

afterEach(() => setRTL(false));

describe('back navigation convention — left in both languages', () => {
  it.each([
    ['Arabic (RTL)', true],
    ['English (LTR)', false],
  ])('%s: the back chevron is never mirrored (points left)', (_, rtl) => {
    setRTL(rtl);
    renderWithProviders(<BackButton accessibilityLabel="back" />);
    const icons = screen.UNSAFE_root.findAll(
      (n: Node) => (n.props as { name?: string }).name === 'chevron-back',
    );
    expect(icons.length).toBeGreaterThan(0);
    icons.forEach((icon: Node) => expect(scaleX(icon) ?? 1).toBe(1));
  });

  it('physicalRow / physicalLeft cancel the native RTL flip', () => {
    setRTL(true);
    expect(physicalRow()).toBe('row-reverse');
    expect(physicalLeft(8)).toEqual({ end: 8 });
    setRTL(false);
    expect(physicalRow()).toBe('row');
    expect(physicalLeft(8)).toEqual({ start: 8 });
  });

  it('AppHeader pins the back slot to the physical left by default (RTL)', () => {
    setRTL(true);
    renderWithProviders(<AppHeader title="العنوان" showBack />);
    const rows = screen.UNSAFE_root.findAll(
      (n: Node) =>
        typeof n.type === 'string' &&
        (StyleSheet.flatten(n.props.style) as { flexDirection?: string } | undefined)
          ?.flexDirection === 'row-reverse',
    );
    expect(rows.length).toBeGreaterThan(0);
  });
});
