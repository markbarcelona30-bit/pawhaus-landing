import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { Problem, rooms, reserves, transition, validateBooking, dates } from './domain.ts';
import type { Booking, Role } from './domain.ts';
export interface Staff { id: string; email: string; role: Role }
export class Store {
  db: DatabaseSync;
  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA foreign_keys=ON');
    this.db.exec(readFileSync(new URL('../../migrations/001-local.sql', import.meta.url), 'utf8'));
  }
  createStaff(email: string, password: string, role: Role = 'ADMIN') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) throw new Problem('Use a valid email and a password of at least 12 characters.');
    const salt = randomBytes(16).toString('hex');
    this.db.prepare('INSERT INTO staff VALUES(?,?,?,?)').run(randomUUID(), email.toLowerCase().trim(), `${salt}:${scryptSync(password, salt, 64).toString('hex')}`, role);
  }
  login(email: string, password: string) {
    const row = this.db.prepare('SELECT * FROM staff WHERE email=?').get(email.toLowerCase().trim()) as unknown as (Staff & { password: string }) | undefined;
    const [salt, expected] = (row?.password ?? `${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
    const actual = scryptSync(password, salt, 64);
    if (!timingSafeEqual(actual, Buffer.from(expected, 'hex')) || !row) throw new Problem('Email or password is incorrect.', 401);
    const token = randomBytes(32).toString('hex');
    this.db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
    this.db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(token, row.id, Date.now() + 8 * 3600000);
    return { token, staff: { id: row.id, email: row.email, role: row.role } };
  }
  staff(token: string): Staff | undefined {
    return this.db.prepare('SELECT staff.id,staff.email,staff.role FROM sessions JOIN staff ON staff.id=sessions.staff_id WHERE token=? AND expires>?').get(token, Date.now()) as unknown as Staff | undefined;
  }
  logout(token: string) { this.db.prepare('DELETE FROM sessions WHERE token=?').run(token); }
  limit(key: string, maximum: number, window: number) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('DELETE FROM limits WHERE expires<?').run(Date.now());
      this.db.prepare('INSERT INTO limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key, Date.now() + window);
      const row = this.db.prepare('SELECT count FROM limits WHERE key=?').get(key) as { count: number };
      this.db.exec('COMMIT');
      if (row.count > maximum) throw new Problem('Too many attempts. Please try again later.', 429);
    } catch (error) { if (this.db.isTransaction) this.db.exec('ROLLBACK'); throw error; }
  }
  list(): Booking[] { return this.db.prepare('SELECT data FROM bookings ORDER BY rowid DESC').all().map(row => JSON.parse(String(row.data)) as Booking); }
  availability(checkIn: string, checkOut: string, guests: number) {
    const nights = dates(checkIn, checkOut);
    if (![1, 2].includes(guests)) throw new Problem('Choose 1 or 2 dogs.');
    const active = this.list().filter(b => reserves(b.status));
    return rooms.map(room => {
      let peak = 0;
      for (let day = Date.parse(checkIn); day < Date.parse(checkOut); day += 86400000) {
        const date = new Date(day).toISOString().slice(0, 10);
        peak = Math.max(peak, active.filter(b => b.room === room.id && b.checkIn <= date && b.checkOut > date).length);
      }
      return { ...room, available: guests <= room.dogs ? Math.max(0, room.capacity - peak) : 0, total: room.price * nights };
    });
  }
  create(value: unknown, key: string): Booking {
    if (!/^[\w-]{16,100}$/.test(key)) throw new Problem('A valid request key is required.');
    const { input, nights, total } = validateBooking(value);
    const fingerprint = JSON.stringify(input);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const existing = this.db.prepare('SELECT fingerprint,data FROM bookings WHERE request_key=?').get(key);
      if (existing) {
        if (existing.fingerprint !== fingerprint) throw new Problem('This request key was already used for different details.', 409);
        this.db.exec('COMMIT'); return JSON.parse(String(existing.data)) as Booking;
      }
      if (!this.availability(input.checkIn, input.checkOut, input.guests).find(r => r.id === input.room)?.available) throw new Problem('That room is now full. Please choose another room or dates.', 409);
      const now = new Date().toISOString();
      const booking: Booking = { ...input, id: randomUUID(), reference: `PAW-${randomBytes(6).toString('hex').toUpperCase()}`, nights, total, status: 'PENDING', createdAt: now, updatedAt: now, version: 1 };
      this.db.prepare('INSERT INTO bookings VALUES(?,?,?,?)').run(booking.id, key, fingerprint, JSON.stringify(booking));
      this.audit(booking.id, 'PUBLIC', 'REQUESTED');
      this.db.exec('COMMIT'); return booking;
    } catch (error) { if (this.db.isTransaction) this.db.exec('ROLLBACK'); throw error; }
  }
  update(id: string, to: unknown, version: unknown, actor: Staff) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const row = this.db.prepare('SELECT data FROM bookings WHERE id=?').get(id);
      if (!row) throw new Problem('Booking not found.', 404);
      const booking = JSON.parse(String(row.data)) as Booking;
      if (booking.version !== version) throw new Problem('This booking changed. Refresh and try again.', 409);
      const status = transition(booking.status, to, actor.role, booking);
      const updated = { ...booking, status, version: booking.version + 1, updatedAt: new Date().toISOString() };
      this.db.prepare('UPDATE bookings SET data=? WHERE id=?').run(JSON.stringify(updated), id);
      this.audit(id, actor.email, `${booking.status} → ${status}`);
      this.db.exec('COMMIT'); return updated;
    } catch (error) { if (this.db.isTransaction) this.db.exec('ROLLBACK'); throw error; }
  }
  audit(id: string, actor: string, action: string) { this.db.prepare('INSERT INTO audit(booking_id,actor,action,created_at) VALUES(?,?,?,?)').run(id, actor, action, new Date().toISOString()); }
  history(id: string) { return this.db.prepare('SELECT actor,action,created_at FROM audit WHERE booking_id=? ORDER BY id DESC').all(id); }
}
