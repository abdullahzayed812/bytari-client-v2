import { renderHook } from '@testing-library/react-native';

import { useCapabilities } from '@/hooks/useCapabilities';
import { useAuthStore } from '@/features/auth/store';
import type { SessionSnapshot } from '@/features/auth/types';

function setSession(partial: Partial<SessionSnapshot>): void {
  const base: SessionSnapshot = {
    user: {
      id: 'u',
      email: 'e',
      firstName: 'f',
      lastName: 'l',
      phone: null,
      status: 'ACTIVE',
      veterinarianStatus: 'NOT_APPLIED',
      createdAt: '',
      updatedAt: '',
    },
    roles: ['PET_OWNER'],
    permissions: [],
    isAdmin: false,
    supervisorDomains: [],
    veterinarian: { status: 'NOT_APPLIED', approved: false },
  };
  useAuthStore.setState({ session: { ...base, ...partial } });
}

describe('useCapabilities', () => {
  afterEach(() => useAuthStore.setState({ session: null }));

  it('is not ready without a session', () => {
    useAuthStore.setState({ session: null });
    const { result } = renderHook(() => useCapabilities());
    expect(result.current.isReady).toBe(false);
    expect(result.current.can('user.read')).toBe(false);
    expect(result.current.canAccessControlCentre).toBe(false);
  });

  it('grants everything to an admin regardless of the permission list', () => {
    setSession({ isAdmin: true, roles: ['ADMIN'], permissions: [] });
    const { result } = renderHook(() => useCapabilities());
    expect(result.current.can('anything.at.all')).toBe(true);
    expect(result.current.canAccessControlCentre).toBe(true);
    expect(result.current.canEnterVeterinarianMode).toBe(true);
  });

  it('honours explicit permission grants for a non-admin', () => {
    setSession({ permissions: ['audit.read'] });
    const { result } = renderHook(() => useCapabilities());
    expect(result.current.can('audit.read')).toBe(true);
    expect(result.current.can('user.delete')).toBe(false);
    expect(result.current.canAny(['user.delete', 'audit.read'])).toBe(true);
    expect(result.current.canAll(['user.delete', 'audit.read'])).toBe(false);
  });

  it('gates veterinarian mode on backend approval, not the role alone', () => {
    setSession({
      roles: ['PET_OWNER', 'VETERINARIAN'],
      veterinarian: { status: 'PENDING', approved: false },
    });
    const pending = renderHook(() => useCapabilities());
    expect(pending.result.current.canEnterVeterinarianMode).toBe(false);

    setSession({
      roles: ['PET_OWNER', 'VETERINARIAN'],
      veterinarian: { status: 'APPROVED', approved: true },
    });
    const approved = renderHook(() => useCapabilities());
    expect(approved.result.current.canEnterVeterinarianMode).toBe(true);
  });

  it('treats any supervisor domain as control-centre access', () => {
    setSession({ supervisorDomains: ['CONTENT'] });
    const { result } = renderHook(() => useCapabilities());
    expect(result.current.canAccessControlCentre).toBe(true);
    expect(result.current.isSupervisorOf('CONTENT')).toBe(true);
    expect(result.current.isSupervisorOf('ANIMAL')).toBe(false);
  });
});
