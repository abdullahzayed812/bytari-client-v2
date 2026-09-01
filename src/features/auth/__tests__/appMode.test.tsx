import { renderHook } from '@testing-library/react-native';

import { useAppMode } from '@/hooks/useAppMode';

import { useAuthStore } from '../store';
import type { SessionSnapshot, VeterinarianStatus } from '../types';

function setSession(over: Partial<SessionSnapshot>) {
  useAuthStore.setState({
    session: {
      user: {
        id: 'u',
        email: 'e@x.c',
        firstName: 'F',
        lastName: 'L',
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
      ...over,
    },
  });
}

const vet = (status: VeterinarianStatus, approved: boolean): Partial<SessionSnapshot> => ({
  veterinarian: { status, approved },
  roles: ['PET_OWNER', 'VETERINARIAN'],
});

describe('useAppMode — veterinarian mode availability (§15)', () => {
  afterEach(() => useAuthStore.setState({ session: null }));

  it('owner mode is always available', () => {
    setSession({});
    const { result } = renderHook(() => useAppMode());
    expect(result.current.availableModes).toContain('owner');
  });

  it('approved veterinarian → veterinarian mode is available, no lock reason', () => {
    setSession(vet('APPROVED', true));
    const { result } = renderHook(() => useAppMode());
    expect(result.current.veterinarianModeAvailable).toBe(true);
    expect(result.current.availableModes).toEqual(['owner', 'veterinarian']);
    expect(result.current.veterinarianLockReasonKey).toBeNull();
  });

  it('pending veterinarian → unavailable, with a "pending" lock reason', () => {
    setSession(vet('PENDING', false));
    const { result } = renderHook(() => useAppMode());
    expect(result.current.veterinarianModeAvailable).toBe(false);
    expect(result.current.veterinarianLockReasonKey).toBe('mode.vetLockedPending');
  });

  it('rejected veterinarian → unavailable, with a "rejected" lock reason', () => {
    setSession(vet('REJECTED', false));
    const { result } = renderHook(() => useAppMode());
    expect(result.current.veterinarianLockReasonKey).toBe('mode.vetLockedRejected');
  });

  it('never-applied user → unavailable, with a "not applied" lock reason', () => {
    setSession({});
    const { result } = renderHook(() => useAppMode());
    expect(result.current.veterinarianLockReasonKey).toBe('mode.vetLockedNotApplied');
  });

  it('setMode("veterinarian") is a no-op (falls back to owner) when not approved', () => {
    setSession(vet('PENDING', false));
    const { result } = renderHook(() => useAppMode());
    result.current.setMode('veterinarian');
    expect(useAppMode).toBeDefined();
    // effective mode never becomes veterinarian
    const { result: after } = renderHook(() => useAppMode());
    expect(after.current.activeMode).toBe('owner');
  });
});
