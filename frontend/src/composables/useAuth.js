import { ref, computed, readonly } from 'vue';
import { authApi, ApiError } from '@/lib/api';

// Global state
const user = ref(null);
const loading = ref(false);
const initialized = ref(false);
let initPromise = null;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

import { assetUrl } from '@/lib/format';

function normalizeUser(u) {
  if (!u) return u;
  const copy = { ...u };
  if (copy.image) {
    copy.image = assetUrl(copy.image);
  }
  return copy;
}

export function useAuth() {
  const isLoggedIn = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role?.name === 'admin');
  const isModerator = computed(() => ['moderator', 'admin'].includes(user.value?.role?.name));
  const isCreator = computed(() => ['creator', 'moderator', 'admin'].includes(user.value?.role?.name));

  // Initialize - check session on app load
  async function init() {
    if (initialized.value) return;
    if (initPromise) return initPromise;
    
    initPromise = (async () => {
      loading.value = true;
      try {
        const res = await authApi.getProfile();
        if (res.success) {
          user.value = normalizeUser(res.data);
        }
      } catch {
        user.value = null;
      } finally {
        loading.value = false;
        initialized.value = true;
      }
    })();
    
    return initPromise;
  }

  // Login with email/password
  async function login(email, password) {
    loading.value = true;
    try {
      await authApi.login(email, password);
      const res = await authApi.getProfile();
      user.value = normalizeUser(res.data);
      return { success: true };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Login failed';
      return { success: false, message };
    } finally {
      loading.value = false;
    }
  }

  // Register
  async function register(data) {
    loading.value = true;
    try {
      await authApi.register(data);
      // Auto login after register
      const res = await authApi.getProfile();
      user.value = normalizeUser(res.data);
      return { success: true };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Registration failed';
      return { success: false, message };
    } finally {
      loading.value = false;
    }
  }

  // Login with Google
  function loginWithGoogle() {
    authApi.loginWithGoogle();
  }

  // Logout
  async function logout() {
    try {
      await authApi.logout();
      
      // Manual cleanup of cookies just in case the browser is stubborn
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });

      user.value = null;
      
      // Hard reload and redirect to home to clear any memory cache and reset app state
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
      // Fallback
      window.location.href = '/';
    } finally {
      user.value = null;
    }
  }

  // Refresh user data
  async function refreshUser() {
    try {
      const res = await authApi.getProfile();
      if (res.success && res.data) {
        user.value = normalizeUser(res.data);
      }
    } catch (err) {
      // Only clear user if it's a 401 unauthorized error
      if (err.status === 401) {
        user.value = null;
      }
      // For other errors (network, 500, etc.), keep current user data
      // This prevents profile image from disappearing on temporary network issues
      console.warn('Failed to refresh user data:', err.message);
    }
  }

  return {
    // State (readonly)
    user: readonly(user),
    loading: readonly(loading),
    initialized: readonly(initialized),
    
    // Computed
    isLoggedIn,
    isAdmin,
    isModerator,
    isCreator,
    
    // Actions
    init,
    login,
    register,
    loginWithGoogle,
    logout,
    refreshUser
  };
}
