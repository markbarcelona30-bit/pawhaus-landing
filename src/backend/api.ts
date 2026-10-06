import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Repository } from './repository.ts';
import { Problem, rooms, businessToday } from './domain.ts';
export function api(store: Repository) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const send = (status: number, value: unknown) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(value)); };
    const token = /(?:^|;\s*)pawhaus_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie ?? '')?.[1] ?? '';
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    const cookie = (value: string, age: number) => res.setHeader('Set-Cookie', `pawhaus_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secure}`);
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const method = req.method ?? 'GET';
      if (!['GET', 'POST', 'PATCH'].includes(method)) throw new Problem('Method not allowed.', 405);
      if (method !== 'GET' && req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) throw new Problem('Cross-site requests are not allowed.', 403);
      let data: Record<string, unknown> = {};
      if (method !== 'GET') {
        if (!req.headers['content-type']?.startsWith('application/json')) throw new Problem('JSON content is required.', 415);
        let body = '';
        for await (const chunk of req) { body += chunk.toString(); if (Buffer.byteLength(body) > 16384) throw new Problem('Request is too large.', 413); }
        try { const parsed: unknown = JSON.parse(body); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(); data = parsed as Record<string, unknown>; } catch { throw new Problem('Invalid JSON request.'); }
      }
      if (url.pathname === '/api/config' && method === 'GET') { send(200, { mode: store.mode ?? 'local', rooms, today: businessToday() }); return; }
      if (url.pathname === '/api/availability' && method === 'GET') { send(200, { rooms: await store.availability(url.searchParams.get('checkIn') ?? '', url.searchParams.get('checkOut') ?? '', Number(url.searchParams.get('guests'))) }); return; }
      if (url.pathname === '/api/bookings' && method === 'POST') {
        await store.limit(`booking:${req.socket.remoteAddress}`, 20, 3600000);
        const booking = await store.create(data, String(req.headers['idempotency-key'] ?? ''));
        send(201, { reference: booking.reference, status: booking.status, total: booking.total, nights: booking.nights }); return;
      }
      if (url.pathname === '/api/auth/login' && method === 'POST') {
        await store.limit(`login:${req.socket.remoteAddress}`, 10, 900000);
        if (typeof data.email !== 'string' || data.email.length > 120 || typeof data.password !== 'string' || data.password.length > 200) throw new Problem('Enter your email and password.');
        const result = await store.login(data.email, data.password); cookie(result.token, 8 * 3600); send(200, { staff: result.staff }); return;
      }
      if (url.pathname === '/api/auth/logout' && method === 'POST') { await store.logout(token); cookie('', 0); send(200, { ok: true }); return; }
      const staff = await store.staff(token);
      if (!staff) throw new Problem('Please sign in to the staff portal.', 401);
      if (url.pathname === '/api/auth/session' && method === 'GET') { send(200, { staff }); return; }
      if (url.pathname === '/api/admin/bookings' && method === 'GET') { send(200, { bookings: await store.list() }); return; }
      const match = /^\/api\/admin\/bookings\/([a-f0-9-]{36})(\/history)?$/.exec(url.pathname);
      if (match?.[2] && method === 'GET') { send(200, { history: await store.history(match[1]) }); return; }
      if (match && !match[2] && method === 'PATCH') { send(200, { booking: await store.update(match[1], data.status, data.version, staff) }); return; }
      throw new Problem('Endpoint not found.', 404);
    } catch (error) {
      if (error instanceof Problem) send(error.status, { error: error.message });
      else { console.error('Booking API failed:', error instanceof Error ? error.name : 'Unknown error'); send(500, { error: 'Something went wrong. Please try again.' }); }
    }
  };
}
