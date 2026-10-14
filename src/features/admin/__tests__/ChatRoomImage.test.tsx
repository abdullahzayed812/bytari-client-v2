import { ConversationCard } from '@/features/chat/components/ConversationCard';
import type { Conversation } from '@/features/chat/types';
import { globalChatApi } from '@/features/globalChat';
import { uploadOrganizationLogo } from '@/features/organizations/lib/registrationUploads';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import AdminCreateChatRoomScreen from '../screens/AdminCreateChatRoomScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
jest.mock('@/features/organizations/lib/registrationUploads', () => ({
  uploadOrganizationLogo: jest.fn(),
}));
// Stand-in for the native picker: one tap "picks" a local image.
jest.mock('@/components/media', () => {
  const actual = jest.requireActual('@/components/media');
  const { Pressable: P, Text: T } = jest.requireActual('react-native');
  return {
    ...actual,
    LocalImageUploader: ({
      onChange,
      label,
    }: {
      onChange: (f: unknown) => void;
      label: string;
    }) => (
      <P
        accessibilityRole="button"
        onPress={() =>
          onChange({ uri: 'file:///room.jpg', name: 'room.jpg', mimeType: 'image/jpeg', size: 10 })
        }
      >
        <T>{label}</T>
      </P>
    ),
  };
});

const upload = uploadOrganizationLogo as jest.MockedFunction<typeof uploadOrganizationLogo>;

const room = (over: Record<string, unknown> = {}) =>
  ({
    id: 'r1',
    name: 'الدواجن',
    description: null,
    logoUrl: null,
    memberCount: 1,
    unreadCount: 0,
    isJoined: true,
    status: 'ACTIVE',
    createdAt: '',
    rules: null,
    conversationId: 'c1',
    joinedAt: null,
    notificationsMuted: false,
    pinnedMessage: null,
    ...over,
  }) as never;

beforeEach(() => {
  resetRouterMock();
  upload.mockReset();
});
afterEach(() => jest.restoreAllMocks());

describe('AdminCreateChatRoomScreen — room image', () => {
  async function fillAndSubmit() {
    fireEvent.changeText(screen.getByPlaceholderText('مثال: الأغنام والماعز'), 'الدواجن');
    fireEvent.press(screen.getByText('إنشاء الغرفة'));
  }

  it('uploads the picked image to the new room through its logo endpoints', async () => {
    const create = jest.spyOn(globalChatApi, 'createAdmin').mockResolvedValue(room());
    upload.mockResolvedValue(undefined);
    renderWithProviders(<AdminCreateChatRoomScreen />);

    fireEvent.press(screen.getByText('صورة الغرفة'));
    await fillAndSubmit();

    await waitFor(() => expect(routerMock.back).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ name: 'الدواجن' }));
    expect(upload).toHaveBeenCalledWith('r1', expect.objectContaining({ name: 'room.jpg' }));
  });

  it('creates without an upload when no image is picked', async () => {
    jest.spyOn(globalChatApi, 'createAdmin').mockResolvedValue(room());
    renderWithProviders(<AdminCreateChatRoomScreen />);
    await fillAndSubmit();
    await waitFor(() => expect(routerMock.back).toHaveBeenCalled());
    expect(upload).not.toHaveBeenCalled();
  });

  it('a failed image upload never loses the created room', async () => {
    jest.spyOn(globalChatApi, 'createAdmin').mockResolvedValue(room());
    upload.mockRejectedValue(new Error('network'));
    renderWithProviders(<AdminCreateChatRoomScreen />);
    fireEvent.press(screen.getByText('صورة الغرفة'));
    await fillAndSubmit();
    await waitFor(() => expect(routerMock.back).toHaveBeenCalled());
  });
});

describe('ConversationCard — a joined room shows its own image', () => {
  const conversation: Conversation = {
    id: 'c1',
    type: 'CHAT_ROOM',
    organizationId: 'r1',
    counterpartUserId: null,
    viewerSide: 'ROOM_MEMBER' as never,
    subjectType: null,
    subjectId: null,
    status: 'OPEN',
    lastMessageAt: null,
    unreadCount: 0,
    createdAt: '',
    updatedAt: '',
  };

  it('renders the room image when configured', async () => {
    jest
      .spyOn(globalChatApi, 'get')
      .mockResolvedValue(room({ logoUrl: 'https://cdn.test/rooms/r1.jpg' }));
    renderWithProviders(<ConversationCard conversation={conversation} />);
    expect(await screen.findByTestId('conversation-room-image')).toBeOnTheScreen();
    expect(await screen.findByText('الدواجن')).toBeOnTheScreen();
  });

  it('falls back to the chat icon without an image', async () => {
    jest.spyOn(globalChatApi, 'get').mockResolvedValue(room());
    renderWithProviders(<ConversationCard conversation={conversation} />);
    expect(await screen.findByText('الدواجن')).toBeOnTheScreen();
    expect(screen.queryByTestId('conversation-room-image')).toBeNull();
  });
});
