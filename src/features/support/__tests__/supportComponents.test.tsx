import { usersApi } from '@/features/users';
import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { MessageBubble } from '../components/MessageBubble';
import { MessageComposer } from '../components/MessageComposer';
import { ThreadCard } from '../components/ThreadCard';
import { ThreadStatusBadge } from '../components/ThreadStatusBadge';
import type { Thread, ThreadMessage } from '../types';

const ME = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';

const msg = (over: Partial<ThreadMessage> = {}): ThreadMessage => ({
  id: 'm1',
  threadId: 'c1',
  senderUserId: ME,
  source: 'USER',
  body: 'hello there',
  deletedAt: null,
  createdAt: '2026-01-01T10:00:00.000Z',
  ...over,
});

beforeEach(() => {
  jest.spyOn(usersApi, 'getSummary').mockResolvedValue({
    id: OTHER,
    firstName: 'سارة',
    lastName: 'ن',
    veterinarianStatus: 'APPROVED',
  });
});
afterEach(() => jest.restoreAllMocks());

describe('MessageBubble', () => {
  it('renders the body as plain text and no role label for the current user’s own USER message', () => {
    renderWithProviders(<MessageBubble message={msg()} currentUserId={ME} />);
    expect(screen.getByText('hello there')).toBeOnTheScreen();
    expect(screen.queryByText('المشرف')).toBeNull();
  });

  it('shows the supervisor role label for a SUPERVISOR message', () => {
    renderWithProviders(
      <MessageBubble
        message={msg({ source: 'SUPERVISOR', senderUserId: OTHER })}
        currentUserId={ME}
      />,
    );
    expect(screen.getByText('المشرف')).toBeOnTheScreen();
  });

  it('centres a SYSTEM message', () => {
    renderWithProviders(
      <MessageBubble
        message={msg({ source: 'SYSTEM', senderUserId: null, body: 'أُغلقت المحادثة' })}
        currentUserId={ME}
      />,
    );
    expect(screen.getByText(/أُغلقت المحادثة/)).toBeOnTheScreen();
  });

  it('shows a placeholder for a soft-deleted message instead of the body', () => {
    renderWithProviders(
      <MessageBubble
        message={msg({ deletedAt: '2026-01-02', body: 'secret' })}
        currentUserId={ME}
      />,
    );
    expect(screen.getByText('تم حذف الرسالة')).toBeOnTheScreen();
    expect(screen.queryByText('secret')).toBeNull();
  });
});

describe('MessageComposer', () => {
  it('disables the send button until there is trimmed text', () => {
    const onSend = jest.fn();
    renderWithProviders(<MessageComposer sending={false} onSend={onSend} />);
    fireEvent.press(screen.getByLabelText('إرسال'));
    expect(onSend).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText('اكتب رسالة…'), '  hi  ');
    fireEvent.press(screen.getByLabelText('إرسال'));
    expect(onSend).toHaveBeenCalledWith('hi');
  });

  it('is fully disabled (not just hidden) with a reason line when the thread is not writable', () => {
    const onSend = jest.fn();
    renderWithProviders(
      <MessageComposer disabledReason="هذه المحادثة مغلقة" sending={false} onSend={onSend} />,
    );
    expect(screen.getByText('هذه المحادثة مغلقة')).toBeOnTheScreen();
    fireEvent.changeText(screen.getByLabelText('اكتب رسالة…'), 'trying anyway');
    fireEvent.press(screen.getByLabelText('إرسال'));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('surfaces a mapped error string', () => {
    renderWithProviders(
      <MessageComposer sending={false} error="تعذّر الإرسال" onSend={jest.fn()} />,
    );
    expect(screen.getByText('تعذّر الإرسال')).toBeOnTheScreen();
  });
});

describe('ThreadStatusBadge', () => {
  it('renders localised OPEN / CLOSED', () => {
    const { rerender } = renderWithProviders(<ThreadStatusBadge status="OPEN" />);
    expect(screen.getByText('مفتوحة')).toBeOnTheScreen();
    rerender(<ThreadStatusBadge status="CLOSED" />);
    expect(screen.getByText('مغلقة')).toBeOnTheScreen();
  });
});

describe('ThreadCard', () => {
  const thread = (over: Partial<Thread> = {}): Thread => ({
    id: 'c1',
    kind: 'CONSULTATION',
    status: 'OPEN',
    createdByUserId: OTHER,
    animalId: null,
    senderBlocked: false,
    aiResponded: false,
    lastMessageAt: null,
    closedAt: null,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    ...over,
  });

  it('shows the kind label + status and fires onPress; no creator name unless asked', () => {
    const onPress = jest.fn();
    renderWithProviders(<ThreadCard thread={thread()} onPress={onPress} />);
    expect(screen.getByText('استشارة')).toBeOnTheScreen();
    expect(screen.getByText('مفتوحة')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });

  it('surfaces the AI-replied / attached-animal / blocked hints', () => {
    renderWithProviders(
      <ThreadCard thread={thread({ aiResponded: true, animalId: 'a1', senderBlocked: true })} />,
    );
    expect(screen.getByText('رد آلي')).toBeOnTheScreen();
    expect(screen.getByText('مرتبطة بحيوان')).toBeOnTheScreen();
    expect(screen.getByText('المُرسِل موقوف')).toBeOnTheScreen();
  });

  it('renders the creator name only when showCreator is set', async () => {
    renderWithProviders(<ThreadCard thread={thread()} showCreator />);
    expect(await screen.findByText('سارة ن')).toBeOnTheScreen();
  });
});
