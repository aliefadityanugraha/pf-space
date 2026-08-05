import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { auth } from '../lib/auth.js';

vi.mock('../lib/auth.js', () => ({
  auth: {
    handler: vi.fn(),
    api: {
      getSession: vi.fn()
    }
  }
}));

describe('Better Auth integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves Better Auth Set-Cookie headers without stripping Secure', async () => {
    const controller = new AuthController();
    const reply = {
      statusCode: 200,
      headers: {},
      status(code) {
        this.statusCode = code;
        return this;
      },
      header(name, value) {
        this.headers[name] = value;
      },
      send(payload) {
        this.payload = payload;
        return this;
      },
      raw: {
        setHeader(name, value) {
          this.headers[name] = value;
        },
        getHeader(name) {
          return this.headers[name];
        },
        headers: {}
      }
    };

    const request = {
      url: '/api/auth/sign-in/email',
      method: 'POST',
      headers: {
        host: 'example.com',
        cookie: '__Secure-better-auth.session_token=abc'
      },
      body: { email: 'test@example.com', password: 'secret' },
      protocol: 'https',
      ip: '127.0.0.1'
    };

    auth.handler.mockResolvedValue(new Response('ok', {
      status: 200,
      headers: {
        'set-cookie': '__Secure-better-auth.session_token=abc; HttpOnly; SameSite=Lax; Secure; Path=/'
      }
    }));

    await controller.handleAuth(request, reply);

    const setCookies = reply.raw.getHeader('Set-Cookie');
    expect(setCookies).toEqual([
      '__Secure-better-auth.session_token=abc; HttpOnly; SameSite=Lax; Secure; Path=/'
    ]);
  });

  it('passes a Headers instance to auth.api.getSession', async () => {
    const request = {
      url: '/api/me',
      headers: {
        cookie: '__Secure-better-auth.session_token=abc'
      }
    };
    const reply = {};

    auth.api.getSession.mockResolvedValue({
      user: { id: 1 },
      session: { id: 'sess-1' }
    });

    await authenticate(request, reply);

    expect(auth.api.getSession).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.any(Headers)
      })
    );
  });
});
