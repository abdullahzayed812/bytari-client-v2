import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { MessageBubble } from '../components/MessageBubble';
import { MessageComposer } from '../components/MessageComposer';
import type { ChatMessage } from '../types';

const ME = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';

const msg = (over: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'm1',
  conversationId: 'c1',
  senderUserId: ME,
  body: 'hello there',
  type: 'TEXT',
  deletedAt: null,
  createdAt: '2026-08-29T09:00:00.000Z',
  ...over,
});

describe('MessageBubble', () => {
  it('renders body as plain text; long-press deletes only own, non-deleted messages', () => {
    const onDelete = jest.fn();
    const { rerender } = renderWithProviders(
      <MessageBubble message={msg()} currentUserId={ME} onDelete={onDelete} />,
    );
    fireEvent(screen.getByText('hello there'), 'longPress');
    expect(onDelete).toHaveBeenCalledWith('m1');

    onDelete.mockClear();
    rerender(
      <MessageBubble
        message={msg({ senderUserId: OTHER })}
        currentUserId={ME}
        onDelete={onDelete}
      />,
    );
    fireEvent(screen.getByText('hello there'), 'longPress');
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('shows a placeholder for a soft-deleted message, never the body', () => {
    renderWithProviders(
      <MessageBubble message={msg({ deletedAt: '2026-08-29', body: null })} currentUserId={ME} />,
    );
    expect(screen.getByText('تم حذف الرسالة')).toBeOnTheScreen();
  });

  it('centres a SYSTEM message', () => {
    renderWithProviders(
      <MessageBubble
        message={msg({ type: 'SYSTEM', senderUserId: OTHER, body: 'أُنشئت المحادثة' })}
        currentUserId={ME}
      />,
    );
    expect(screen.getByText(/أُنشئت المحادثة/)).toBeOnTheScreen();
  });
});

describe('MessageComposer', () => {
  it('disables send until trimmed text, then sends and clears', () => {
    const onSend = jest.fn();
    renderWithProviders(<MessageComposer sending={false} onSend={onSend} />);
    fireEvent.press(screen.getByLabelText('إرسال'));
    expect(onSend).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText('اكتب رسالة…'), '  hi  ');
    fireEvent.press(screen.getByLabelText('إرسال'));
    expect(onSend).toHaveBeenCalledWith('hi');
  });

  it('is fully disabled with a reason line', () => {
    const onSend = jest.fn();
    renderWithProviders(
      <MessageComposer disabledReason="المؤسسة غير نشطة" sending={false} onSend={onSend} />,
    );
    expect(screen.getByText('المؤسسة غير نشطة')).toBeOnTheScreen();
    fireEvent.changeText(screen.getByLabelText('اكتب رسالة…'), 'x');
    fireEvent.press(screen.getByLabelText('إرسال'));
    expect(onSend).not.toHaveBeenCalled();
  });
});
