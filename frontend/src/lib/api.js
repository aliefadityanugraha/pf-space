const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const urlObj = new URL(endpoint, BASE_URL);
  
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.append(key, String(value));
      }
    });
    delete options.params;
  }
  
  const url = urlObj.toString();
  const config = {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers
    },
  };

  if (options.body && !(options.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }
    throw new ApiError(
      'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
      0,
      null
    );
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
  
  // Google OAuth - redirect
  loginWithGoogle: () => {
    window.location.href = `${BASE_URL}/api/auth/google`;
  }
};

export { ApiError };
