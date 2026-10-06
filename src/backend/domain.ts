export const rooms = [
  { id: 'cozy', name: 'Cozy Nook', price: 1200, capacity: 4, dogs: 1 },
  { id: 'sunny', name: 'Sunny Suite', price: 1800, capacity: 3, dogs: 1 },
  { id: 'garden', name: 'Garden Hangout', price: 2600, capacity: 2, dogs: 2 },
] as const;
export type Role = 'ADMIN' | 'FRONT_DESK' | 'CARE_STAFF';
export type Status = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';
export interface BookingInput {
  checkIn: string; checkOut: string; room: string; guests: number;
  dogName: string; sibling: string; breed: string; size: string;
  owner: string; email: string; phone: string; notes: string;
  consent: true;
}
export interface Booking extends BookingInput {
  id: string; reference: string; nights: number; total: number;
  status: Status; createdAt: string; updatedAt: string; version: number;
}
export class Problem extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}
export const businessToday = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type)!.value).join('-');
};
export function dates(checkIn: unknown, checkOut: unknown, allowPast = false) {
  if (typeof checkIn !== 'string' || typeof checkOut !== 'string') throw new Problem('Choose check-in and check-out dates.');
  for (const value of [checkIn, checkOut]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Problem('Choose valid dates.');
  }
  const nights = (Date.parse(checkOut) - Date.parse(checkIn)) / 86400000;
  if (nights < 1 || nights > 30) throw new Problem('Choose a stay of 1–30 nights.');
  if (!allowPast && checkIn < businessToday()) throw new Problem('Check-in must be today or later.');
  return nights;
}
export function validateBooking(value: unknown): { input: BookingInput; nights: number; total: number } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Problem('Invalid booking details.');
  const data = value as Record<string, unknown>;
  const field = (key: string, max: number, required = true): string => {
    const value = data[key];
    if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Problem(`Please provide a valid ${key}.`);
    return value.trim();
  };
  const nights = dates(data.checkIn, data.checkOut);
  const room = rooms.find(r => r.id === data.room);
  if (!room || ![1, 2].includes(Number(data.guests)) || typeof data.guests !== 'number' || data.guests > room.dogs) throw new Problem('Choose a room that accommodates your dogs.');
  if (!['small', 'medium', 'large'].includes(String(data.size)) || (room.id === 'cozy' && data.size === 'large')) throw new Problem('Choose a suitable room for their size.');
  const email = field('email', 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Problem('Please provide a valid email address.');
  if (data.consent !== true) throw new Problem('Please acknowledge the booking request.');
  const input: BookingInput = {
    checkIn: data.checkIn as string, checkOut: data.checkOut as string, room: room.id, guests: data.guests,
    dogName: field('dogName', 60), sibling: field('sibling', 60, data.guests === 2), breed: field('breed', 80), size: data.size as string,
    owner: field('owner', 80), email, phone: field('phone', 30, false), notes: field('notes', 1000, false), consent: true,
  };
  return { input, nights, total: room.price * nights };
}
export const reserves = (status: Status) => ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(status);
export function transition(from: Status, to: unknown, role: Role, booking: Booking) {
  const allowed: Record<Status, Status[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
    CHECKED_IN: ['CHECKED_OUT'], CHECKED_OUT: [], CANCELLED: [], NO_SHOW: [],
  };
  if (role === 'CARE_STAFF') throw new Problem('Your role cannot change booking status.', 403);
  if (!allowed[from].includes(to as Status)) throw new Problem('This status change is not allowed.', 409);
  if (to === 'CHECKED_IN' && booking.checkIn > businessToday()) throw new Problem('Check-in opens on their arrival date.', 409);
  if (to === 'NO_SHOW' && booking.checkIn > businessToday()) throw new Problem('A future arrival cannot be marked as a no-show.', 409);
  if (to === 'CONFIRMED' && booking.checkOut <= businessToday()) throw new Problem('An expired request cannot be confirmed.', 409);
  return to as Status;
}
