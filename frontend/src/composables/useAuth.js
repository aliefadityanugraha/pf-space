import { ref, computed, readonly } from 'vue';
import { authApi, api, ApiError } from '@/lib/api';
import { useNotifications } from '@/composables/useNotifications';

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

// Pindahkan computed properties ke Global Scope agar tidak di-recreate setiap useAuth() dipanggil
const isLoggedIn = computed(() => !!user.value);
const isAdmin = computed(() => user.value?.role?.name === 'admin');
const isModerator = computed(() => ['moderator', 'admin'].includes(user.value?.role?.name));
const isCreator = computed(() => ['creator', 'moderator', 'admin'].includes(user.value?.role?.name));

export function useAuth() {
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

  /**
   * Login with email/password
   * @returns {Promise<{success: boolean, message?: string}>} Mengembalikan object error. Pastikan komponen selalu mengecek `if (!res.success)`
   */
  async function login(email, password) {
    loading.value = true;
    try {
      await authApi.login(email, password);
      const res = await authApi.getProfile();
      user.value = normalizeUser(res.data);
      try {
        await api.post('/api/notifications', { type: 'system', title: 'Login Berhasil', message: `Selamat datang kembali, ${user.value.name}!` });
        useNotifications().fetchNotifications();
      } catch (err) {
        console.warn('Gagal membuat notifikasi', err);
      }
      return { success: true };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Login failed';
      return { success: false, message };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Register akun baru
   * @returns {Promise<{success: boolean, message?: string}>} Mengembalikan object error. Pastikan komponen selalu mengecek `if (!res.success)`
   */
  async function register(data) {
    loading.value = true;
    try {
      await authApi.register(data);
      // Auto login after register
      const res = await authApi.getProfile();
      user.value = normalizeUser(res.data);
      try {
        await api.post('/api/notifications', { type: 'system', title: 'Registrasi Berhasil', message: `Selamat datang, ${user.value.name}! Akun Anda berhasil dibuat.` });
        useNotifications().fetchNotifications();
      } catch (err) {
        console.warn('Gagal membuat notifikasi', err);
      }
      return { success: true };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Registration failed';
      return { success: false, message };
    } finally {
      loading.value = false;
    }
  }

  // Login with Google
  async function loginWithGoogle() {
    await authApi.loginWithGoogle();
  }

  // Logout
  async function logout() {
    try {
      // 1. Tell backend to sign out
      // Catatan Terkait Cookie: Cookie keamanan `HttpOnly` TIDAK dapat dihapus dengan JavaScript pada browser. 
      // Ia hanya bisa dihapus dengan instruksi `Set-Cookie` dari backend (dari authApi.logout() ini).
      await authApi.logout();
    } catch (err) {
      console.warn('Backend logout failed, continuing with frontend cleanup');
    } finally {
      // 2. Clear app-specific local data (avoid clearing third-party data)
      const appPrefixes = ['pf-', 'auth-', 'user-', 'film-', 'draft-', 'chat-'];
      [localStorage, sessionStorage].forEach(storage => {
        const keysToRemove = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (appPrefixes.some(prefix => key.startsWith(prefix)) || key === 'token' || key === 'user') {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => storage.removeItem(key));
      });

      // 3. Brutal cookie clearing for all possible paths and domains
      const cookies = document.cookie.split(";");
      const domain = window.location.hostname;
      const baseDomain = domain.split('.').slice(-2).join('.');

      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        
        // Clear for current path, root path, and domains
        const paths = ['/', window.location.pathname];
        const domains = [null, domain, `.${domain}`, `.${baseDomain}`];
        
        paths.forEach(p => {
          domains.forEach(d => {
            let cookieString = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${p}`;
            if (d) cookieString += `;domain=${d}`;
            document.cookie = cookieString;
          });
        });
      }

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

// For testing purposes only
export function _resetAuthState() {
  user.value = null;
  initialized.value = false;
  initPromise = null;
}
