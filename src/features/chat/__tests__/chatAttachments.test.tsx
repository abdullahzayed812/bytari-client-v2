import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { MessageBubble } from '../components/MessageBubble';
import { MessageComposer } from '../components/MessageComposer';
import type { ChatMessage } from '../types';

const mockUpload = {
  status: 'idle' as 'idle' | 'uploading' | 'success' | 'error',
  progress: 0,
  result: null as { storageKey: string; size: number } | null,
  error: null,
  file: null as { uri: string; name: string; mimeType: string; size?: number } | null,
  upload: jest.fn(),
  cancel: jest.fn(),
  reset: jest.fn(),
};

jest.mock('../hooks/useChatAttachment', () => ({
  useChatAttachmentUpload: () => mockUpload,
  withFileSize: (f: unknown) => Promise.resolve(f),
}));

const photo = { uri: 'file:///p.jpg', name: 'p.jpg', mimeType: 'image/jpeg', size: 2048 };

beforeEach(() => {
  Object.assign(mockUpload, { status: 'idle', progress: 0, result: null, file: null });
  mockUpload.upload.mockReset();
  mockUpload.reset.mockReset();
});

describe('MessageComposer — attachments', () => {
  it('offers the attach action only when a conversation is given', () => {
    const { rerender } = renderWithProviders(
      <MessageComposer sending={false} onSend={jest.fn()} />,
    );
    expect(screen.queryByLabelText('إرفاق')).toBeNull();
    rerender(<MessageComposer conversationId="c1" sending={false} onSend={jest.fn()} />);
    expect(screen.getByLabelText('إرفاق')).toBeOnTheScreen();
  });

  it('shows upload progress and blocks sending while uploading', () => {
    Object.assign(mockUpload, { status: 'uploading', progress: 0.4, file: photo });
    const onSend = jest.fn();
    renderWithProviders(<MessageComposer conversationId="c1" sending={false} onSend={onSend} />);
    expect(screen.getByText('جارٍ الرفع… 40%')).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText('إرسال'));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends an uploaded attachment (text optional) and clears it', () => {
    Object.assign(mockUpload, {
      status: 'success',
      progress: 1,
      file: photo,
      result: { storageKey: 'chat/attachments/c1/2026/09/x.jpg', size: 2048 },
    });
    const onSend = jest.fn();
    renderWithProviders(<MessageComposer conversationId="c1" sending={false} onSend={onSend} />);
    fireEvent.press(screen.getByLabelText('إرسال'));
    expect(onSend).toHaveBeenCalledWith('', {
      kind: 'IMAGE',
      storageKey: 'chat/attachments/c1/2026/09/x.jpg',
      fileName: 'p.jpg',
    });
    expect(mockUpload.reset).toHaveBeenCalled();
  });

  it('a failed upload offers retry and cancel', () => {
    Object.assign(mockUpload, { status: 'error', file: photo });
    renderWithProviders(<MessageComposer conversationId="c1" sending={false} onSend={jest.fn()} />);
    expect(screen.getByText('فشل رفع المرفق')).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText('إعادة المحاولة'));
    expect(mockUpload.upload).toHaveBeenCalledWith(photo);
    fireEvent.press(screen.getByLabelText('إلغاء المرفق'));
    expect(mockUpload.reset).toHaveBeenCalled();
  });
});

describe('MessageBubble — attachments', () => {
  const base: ChatMessage = {
    id: 'm1',
    conversationId: 'c1',
    senderUserId: 'u1',
    body: '',
    type: 'TEXT',
    deletedAt: null,
    createdAt: '2026-09-01T00:00:00.000Z',
  };

  it('renders a file attachment tile with its name', () => {
    renderWithProviders(
      <MessageBubble
        currentUserId="u1"
        message={{
          ...base,
          attachment: {
            kind: 'FILE',
            fileName: 'report.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 2048,
            url: 'https://signed.example/x',
            urlExpiresInSeconds: 3600,
          },
        }}
      />,
    );
    expect(screen.getByText('report.pdf')).toBeOnTheScreen();
  });

  it('never renders an attachment of a deleted message', () => {
    renderWithProviders(
      <MessageBubble
        currentUserId="u1"
        message={{
          ...base,
          body: null,
          deletedAt: '2026-09-02T00:00:00.000Z',
          attachment: {
            kind: 'FILE',
            fileName: 'secret.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 1,
            url: 'https://signed.example/y',
            urlExpiresInSeconds: 3600,
          },
        }}
      />,
    );
    expect(screen.queryByText('secret.pdf')).toBeNull();
    expect(screen.getByText('تم حذف الرسالة')).toBeOnTheScreen();
  });
});
