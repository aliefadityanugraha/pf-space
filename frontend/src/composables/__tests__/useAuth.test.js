import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth, _resetAuthState } from '../useAuth';

// Mock authApi
vi.mock('@/lib/api', () => ({
  authApi: {
    getProfile: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
  ApiError: class extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  },
  assetUrl: (url) => url // simple mock
}));

import { authApi } from '@/lib/api';

describe('useAuth Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetAuthState();
  });

  it('should start with uninitialized state', () => {
    const { isLoggedIn, user, initialized } = useAuth();
    expect(isLoggedIn.value).toBe(false);
    expect(user.value).toBe(null);
    expect(initialized.value).toBe(false);
  });

  it('should set user and initialized to true on successful init', async () => {
    const userData = { id: 1, name: 'John Doe', role: { name: 'admin' } };
    authApi.getProfile.mockResolvedValue({ success: true, data: userData });

    const { init, user, initialized } = useAuth();
    await init();

    expect(user.value).toMatchObject({ name: 'John Doe' });
    expect(initialized.value).toBe(true);
  });

  it('should identify admin roles correctly', async () => {
    const userData = { id: 1, name: 'Admin User', role: { name: 'admin' } };
    authApi.getProfile.mockResolvedValue({ success: true, data: userData });

    const { init, isAdmin, isModerator, isCreator } = useAuth();
    await init();

    expect(isAdmin.value).toBe(true);
    expect(isModerator.value).toBe(true);
    expect(isCreator.value).toBe(true);
  });

  it('should identify creator roles correctly', async () => {
    const userData = { id: 2, name: 'Creator User', role: { name: 'creator' } };
    authApi.getProfile.mockResolvedValue({ success: true, data: userData });

    const { init, isAdmin, isCreator } = useAuth();
    await init();

    expect(isAdmin.value).toBe(false);
    expect(isCreator.value).toBe(true);
  });

  it('should clear state and redirect on logout', async () => {
    // Set initial logged in state
    const userData = { id: 1, name: 'John Doe', role: { name: 'user' } };
    authApi.getProfile.mockResolvedValue({ success: true, data: userData });
    const { init, logout, user, isLoggedIn } = useAuth();
    await init();
    
    expect(isLoggedIn.value).toBe(true);

    // Mock window.location
    const originalLocation = window.location;
    delete window.location;
    window.location = { 
      replace: vi.fn(),
      hostname: 'localhost',
      pathname: '/'
    };

    // Mock storage clear
    const localStorageSpy = vi.spyOn(Storage.prototype, 'clear');
    
    await logout();

    expect(authApi.logout).toHaveBeenCalled();
    expect(user.value).toBe(null);
    expect(isLoggedIn.value).toBe(false);
    expect(localStorageSpy).toHaveBeenCalled();
    expect(window.location.replace).toHaveBeenCalledWith('/');

    // Restore window.location
    window.location = originalLocation;
    localStorageSpy.mockRestore();
  });
});
