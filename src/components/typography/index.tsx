import { Text, type TextProps } from './Text';

export { Text, type TextProps };

export function Heading(props: Omit<TextProps, 'variant'> & { level?: 1 | 2 | 3 }) {
  const { level = 1, ...rest } = props;
  const variant = level === 1 ? 'display' : level === 2 ? 'heading' : 'title';
  return <Text variant={variant} {...rest} />;
}

export function Label(props: Omit<TextProps, 'variant'>) {
  return <Text variant="label" color="textSecondary" {...props} />;
}

export function Caption(props: Omit<TextProps, 'variant'>) {
  return <Text variant="caption" color="textMuted" {...props} />;
}
