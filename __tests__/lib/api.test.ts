import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch } from '@/lib/api';

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  // Reset localStorage et location
  localStorage.clear();
  // Réinitialise window.location pour les tests de redirection
  Object.defineProperty(window, 'location', {
    value: { href: '/' },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests : construction de l'URL ─────────────────────────────────────────────

describe('apiFetch - construction URL proxy', () => {
  it('préfixe /api/proxy/ en remplaçant /api/', async () => {
    vi.mocked(fetch).mockResolvedValue({ status: 200 } as Response);

    await apiFetch('/api/slots');

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toBe('/api/proxy/slots');
  });

  it('fonctionne avec un endpoint sans /api/ au début', async () => {
    vi.mocked(fetch).mockResolvedValue({ status: 200 } as Response);

    await apiFetch('/api/gift-cards');

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toBe('/api/proxy/gift-cards');
  });

  it('conserve les query params dans l\'URL', async () => {
    vi.mocked(fetch).mockResolvedValue({ status: 200 } as Response);

    await apiFetch('/api/clients?page=2&limit=10');

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('page=2');
    expect(url).toContain('limit=10');
  });
});

// ── Tests : headers par défaut ────────────────────────────────────────────────

describe('apiFetch - headers', () => {
  it('inclut Content-Type application/json', async () => {
    vi.mocked(fetch).mockResolvedValue({ status: 200 } as Response);

    await apiFetch('/api/slots');

    const options = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('inclut X-Requested-With XMLHttpRequest', async () => {
    vi.mocked(fetch).mockResolvedValue({ status: 200 } as Response);

    await apiFetch('/api/slots');

    const options = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect((options.headers as Record<string, string>)['X-Requested-With']).toBe('XMLHttpRequest');
  });

  it('fusionne les headers custom avec les headers par défaut', async () => {
    vi.mocked(fetch).mockResolvedValue({ status: 200 } as Response);

    await apiFetch('/api/slots', { headers: { 'X-Custom': 'test' } });

    const options = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    const headers = options.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-Custom']).toBe('test');
  });
});

// ── Tests : gestion 401 / 403 ─────────────────────────────────────────────────

describe('apiFetch - redirections auth', () => {
  it('supprime localStorage["user"] et redirige sur 401', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 1 }));
    vi.mocked(fetch).mockResolvedValue({ status: 401 } as Response);

    await apiFetch('/api/slots');

    expect(localStorage.getItem('user')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('supprime localStorage["user"] et redirige sur 403', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 1 }));
    vi.mocked(fetch).mockResolvedValue({ status: 403 } as Response);

    await apiFetch('/api/slots');

    expect(localStorage.getItem('user')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('ne redirige pas sur 200', async () => {
    vi.mocked(fetch).mockResolvedValue({ status: 200 } as Response);

    await apiFetch('/api/slots');

    expect(window.location.href).toBe('/');
  });

  it('retourne la Response même sur 401', async () => {
    vi.mocked(fetch).mockResolvedValue({ status: 401 } as Response);

    const res = await apiFetch('/api/slots');

    expect(res.status).toBe(401);
  });
});

// ── Tests : transmission des options fetch ─────────────────────────────────────

describe('apiFetch - options fetch', () => {
  it('transmet la méthode POST', async () => {
    vi.mocked(fetch).mockResolvedValue({ status: 200 } as Response);

    await apiFetch('/api/slots', { method: 'POST', body: JSON.stringify({ title: 'Test' }) });

    const options = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(options.method).toBe('POST');
  });

  it('transmet le body', async () => {
    vi.mocked(fetch).mockResolvedValue({ status: 200 } as Response);

    const body = JSON.stringify({ key: 'value' });
    await apiFetch('/api/slots', { method: 'PATCH', body });

    const options = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(options.body).toBe(body);
  });
});
