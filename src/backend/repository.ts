import type { Booking, Role } from './domain.ts';
import type { Staff } from './store.ts';
type Awaitable<T> = T | Promise<T>;
export interface RoomAvailability { id: string; name: string; price: number; capacity: number; dogs: number; available: number; total: number }
export interface Repository {
  mode?: 'local' | 'neon';
  createStaff(email: string, password: string, role?: Role): Awaitable<void>;
  login(email: string, password: string): Awaitable<{ token: string; staff: Staff }>;
  staff(token: string): Awaitable<Staff | undefined>;
  logout(token: string): Awaitable<void>;
  limit(key: string, maximum: number, window: number): Awaitable<void>;
  list(): Awaitable<Booking[]>;
  availability(checkIn: string, checkOut: string, guests: number): Awaitable<RoomAvailability[]>;
  create(value: unknown, key: string): Awaitable<Booking>;
  update(id: string, to: unknown, version: unknown, actor: Staff): Awaitable<Booking>;
  history(id: string): Awaitable<unknown[]>;
}
