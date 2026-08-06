const getDefaultBaseUrl = () => {
  const configuredBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

  if (typeof window !== 'undefined') {
    const isLocalhostDomain = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // If configured API URL contains localhost but we are running on a real domain (e.g. pfspace.my.id),
    // ignore the hardcoded localhost API URL and use relative origin!
    if (configuredBaseUrl && configuredBaseUrl.includes('localhost') && !isLocalhostDomain) {
      return window.location.origin;
    }
  }

  const normalizeIfHttps = (value) => {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      return value.replace(/^http:/, 'https:');
    }
    return value;
  };

  if (configuredBaseUrl) {
    const normalized = configuredBaseUrl.trim();
    return normalizeIfHttps(normalized);
  }

  if (typeof window !== 'undefined') {
    return normalizeIfHttps(window.location.origin);
  }

  return 'http://localhost:3000';
};

export const BASE_URL = getDefaultBaseUrl();

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const DEFAULT_TIMEOUT_MS = 20000;

async function request(endpoint, options = {}) {
  const { timeout = DEFAULT_TIMEOUT_MS, signal: externalSignal, params, ...rest } = options;
  const baseUrl = BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
  const urlObj = new URL(endpoint, baseUrl);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.append(key, String(value));
      }
    });
  }
  
  const url = urlObj.toString();
  const config = {
    ...rest,
    credentials: 'include',
    headers: {
      ...rest.headers
    },
  };

  if (rest.body && !(rest.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  // Abort the request if it exceeds the timeout so the UI never hangs forever.
  // Combine with the caller-provided signal (if any) for cancellation support.
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }
  const timer = timeout > 0 ? setTimeout(() => controller.abort(), timeout) : null;

  let response;
  try {
    response = await fetch(url, { ...config, signal: controller.signal });
  } catch (err) {
    const abortedByCaller = !!externalSignal?.aborted;
    if (abortedByCaller) {
      throw err;
    }
    // Timeout or network failure — surface a fallback screen instead of hanging
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api:down'));
    }
    const isTimeout = controller.signal.aborted;
    throw new ApiError(
      isTimeout
        ? 'Waktu permintaan ke server habis. Silakan coba lagi.'
        : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
      0,
      null
    );
  } finally {
    if (timer) clearTimeout(timer);
    if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
  }
  
  if (response.status === 204) {
    return { success: true };
  }
  
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const status = response.status;
    const path = urlObj.pathname || '';
    const isAuthPath = path.startsWith('/api/auth/');

    let serverMessage = null;
    if (data && Array.isArray(data.details) && data.details.length > 0) {
      // Prioritize Zod validation details
      serverMessage = data.details.map(d => d.message).join(', ');
    } else if (data && typeof data.message === 'string' && data.message) {
      serverMessage = data.message;
    } else if (data && typeof data.error === 'string' && data.error) {
      serverMessage = data.error;
    }

    let message = serverMessage || 'Terjadi kesalahan. Silakan coba lagi.';

    if (status === 401 && typeof window !== 'undefined' && !isAuthPath) {
      const current =
        window.location.pathname +
        window.location.search +
        window.location.hash;
      const onLogin = window.location.pathname.startsWith('/auth/login');
      const redirectParam =
        current && !onLogin ? `?redirect=${encodeURIComponent(current)}` : '';
      const target = `/auth/login${redirectParam}`;
      if (!onLogin) {
        window.location.href = target;
      }
      if (!serverMessage) {
        message = 'Sesi Anda telah berakhir. Silakan login kembali.';
      }
    }

    throw new ApiError(
      message,
      status,
      data
    );
  }

  return data;
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint, body, options) => request(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body)
  }),
  
  patch: (endpoint, body, options) => request(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(body)
  }),
  
  put: (endpoint, body, options) => request(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body)
  }),
  
  delete: (endpoint, options) => request(endpoint, {
    ...options,
    method: 'DELETE'
  }),

  upload: (endpoint, formData, options) => request(endpoint, {
    ...(options || {}),
    method: options && options.method ? options.method : 'POST',
    body: formData
  }),
};

// Auth specific helpers
export const authApi = {
  login: (email, password) => api.post('/api/auth/sign-in/email', { email, password }),
  register: (data) => api.post('/api/auth/sign-up/email', data),
  logout: () => api.post('/api/auth/logout', {}),
  getSession: () => api.get('/api/auth/get-session'),
  getProfile: () => api.get('/api/auth/me'),
  
  // Google OAuth - use Better Auth native endpoint directly (no custom proxy)
  loginWithGoogle: async () => {
    const callbackURL = `${window.location.origin}/auth/callback`;
    const response = await fetch('/api/auth/sign-in/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ provider: 'google', callbackURL })
    });
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new ApiError('Gagal memulai login Google', response.status, data);
    }
  }
};

export { ApiError };
