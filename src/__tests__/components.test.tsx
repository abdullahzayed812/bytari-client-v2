import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';
import { Button, TextButton } from '@/components/actions';
import { Badge, Card } from '@/components/content';
import { EmptyState, ErrorState } from '@/components/feedback';
import { Text } from '@/components/typography';
import { ApiError } from '@/services/api';

describe('design system components render with the theme', () => {
  it('renders Text with content', () => {
    renderWithProviders(<Text>مرحبا</Text>);
    expect(screen.getByText('مرحبا')).toBeOnTheScreen();
  });

  it('renders a Button and fires onPress', () => {
    const onPress = jest.fn();
    renderWithProviders(<Button label="حفظ" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'حفظ' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress while loading', () => {
    const onPress = jest.fn();
    renderWithProviders(<Button label="حفظ" loading onPress={onPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders a Badge label', () => {
    renderWithProviders(<Badge label="جديد" tone="primary" />);
    expect(screen.getByText('جديد')).toBeOnTheScreen();
  });

  it('renders Card children', () => {
    renderWithProviders(
      <Card>
        <Text>محتوى البطاقة</Text>
      </Card>,
    );
    expect(screen.getByText('محتوى البطاقة')).toBeOnTheScreen();
  });

  it('renders EmptyState with an action', () => {
    const onAction = jest.fn();
    renderWithProviders(
      <EmptyState title="لا يوجد" message="أضف عنصراً" actionLabel="إضافة" onAction={onAction} />,
    );
    expect(screen.getByText('لا يوجد')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'إضافة' }));
    expect(onAction).toHaveBeenCalled();
  });

  it('ErrorState shows a friendly message + request ref, never internal detail', () => {
    renderWithProviders(
      <ErrorState
        error={
          new ApiError({
            code: 'INTERNAL_ERROR',
            message: 'stack trace leak',
            status: 500,
            requestId: 'req_9',
          })
        }
      />,
    );
    expect(screen.queryByText('stack trace leak')).toBeNull();
    expect(screen.getByText(/Ref: req_9/)).toBeOnTheScreen();
  });

  it('renders a TextButton', () => {
    renderWithProviders(<TextButton label="عرض الكل" />);
    expect(screen.getByText('عرض الكل')).toBeOnTheScreen();
  });
});
