import pg from 'pg';
import { randomUUID, randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { Problem, rooms, dates, validateBooking, transition } from './domain.ts';
import type { Booking, Role } from './domain.ts';
import type { Staff } from './store.ts';
import type { Repository, RoomAvailability } from './repository.ts';
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export function databasePool(connectionString: string) {
  const url = new URL(connectionString);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DATABASE_URL must be a PostgreSQL URL.');
  // Validate the certificate; pg's sslmode=require shorthand can disable validation.
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'channel_binding']) url.searchParams.delete(key);
  return new pg.Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: true }, max: 5, connectionTimeoutMillis: 15000, idleTimeoutMillis: 10000, statement_timeout: 15000 });
}
export class PostgresStore implements Repository {
  readonly mode = 'neon' as const;
  pool: pg.Pool;
  constructor(connectionString: string) {
    this.pool = databasePool(connectionString);
    this.pool.on('error', () => console.error('PostgreSQL idle connection error.'));
  }
  async ready() {
    const result = await this.pool.query('SELECT version FROM pawhaus.schema_migrations WHERE version=3');
    if (!result.rowCount) throw new Error('Apply the Pawhaus PostgreSQL migration before starting the server.');
  }
  async close() { await this.pool.end(); }
  async transaction<T>(work: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try { await client.query('BEGIN'); const value = await work(client); await client.query('COMMIT'); return value; }
    catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  async createStaff(email: string, password: string, role: Role = 'ADMIN') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || !['ADMIN','FRONT_DESK','CARE_STAFF'].includes(role)) throw new Problem('Use a valid email, role, and password of at least 12 characters.');
    const salt = randomBytes(16).toString('hex');
    await this.pool.query('INSERT INTO pawhaus.staff(id,email,password,role) VALUES($1,$2,$3,$4)', [randomUUID(),email.toLowerCase().trim(),`${salt}:${scryptSync(password,salt,64).toString('hex')}`,role]);
  }
  async login(email: string, password: string) {
    const result = await this.pool.query<Staff & { password: string }>('SELECT id,email,password,role FROM pawhaus.staff WHERE email=$1',[email.toLowerCase().trim()]);
    const row = result.rows[0];
    const [salt,expected] = (row?.password ?? `${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
    if (!timingSafeEqual(scryptSync(password,salt,64),Buffer.from(expected,'hex')) || !row) throw new Problem('Email or password is incorrect.',401);
    const token = randomBytes(32).toString('hex');
    await this.pool.query('DELETE FROM pawhaus.sessions WHERE expires<$1',[Date.now()]);
    await this.pool.query('INSERT INTO pawhaus.sessions VALUES($1,$2,$3)',[tokenHash(token),row.id,Date.now()+8*3600000]);
    return {token,staff:{id:row.id,email:row.email,role:row.role}};
  }
  async staff(token: string) {
    if (!token) return undefined;
    const result = await this.pool.query<Staff>('SELECT s.id,s.email,s.role FROM pawhaus.staff s JOIN pawhaus.sessions t ON t.staff_id=s.id WHERE t.token_hash=$1 AND t.expires>$2',[tokenHash(token),Date.now()]);
    return result.rows[0];
  }
  async logout(token: string) { await this.pool.query('DELETE FROM pawhaus.sessions WHERE token_hash=$1',[tokenHash(token)]); }
  async limit(key: string, maximum: number, window: number) {
    const now=Date.now();
    const result=await this.pool.query<{count:number}>(`INSERT INTO pawhaus.limits(key,count,expires) VALUES($1,1,$2)
      ON CONFLICT(key) DO UPDATE SET count=CASE WHEN pawhaus.limits.expires<$3 THEN 1 ELSE pawhaus.limits.count+1 END,
      expires=CASE WHEN pawhaus.limits.expires<$3 THEN EXCLUDED.expires ELSE pawhaus.limits.expires END RETURNING count`,[key,now+window,now]);
    if(result.rows[0].count>maximum)throw new Problem('Too many attempts. Please try again later.',429);
  }
  async list(): Promise<Booking[]> { const result=await this.pool.query<{data:Booking}>('SELECT data FROM pawhaus.bookings ORDER BY created_at DESC,id');return result.rows.map(row=>row.data); }
  async availability(checkIn:string,checkOut:string,guests:number):Promise<RoomAvailability[]> {
    const nights=dates(checkIn,checkOut);if(![1,2].includes(guests))throw new Problem('Choose 1 or 2 dogs.');
    const result=await this.pool.query<{room_id:string;peak:number}>(`SELECT room_id, max(occupied)::integer AS peak FROM (
      SELECT b.room_id,d.day,count(*) AS occupied FROM pawhaus.bookings b
      JOIN generate_series($1::date,$2::date-1,interval '1 day') d(day)
      ON b.check_in<=d.day::date AND b.check_out>d.day::date
      WHERE b.status IN ('PENDING','CONFIRMED','CHECKED_IN') AND b.check_in<$2::date AND b.check_out>$1::date
      GROUP BY b.room_id,d.day) nights GROUP BY room_id`,[checkIn,checkOut]);
    return rooms.map(room=>({...room,available:guests<=room.dogs?Math.max(0,room.capacity-(result.rows.find(row=>row.room_id===room.id)?.peak??0)):0,total:room.price*nights}));
  }
  async create(value:unknown,key:string):Promise<Booking> {
    if(!/^[\w-]{16,100}$/.test(key))throw new Problem('A valid request key is required.');
    const {input,nights,total}=validateBooking(value);const fingerprint=JSON.stringify(input);
    return this.transaction(async client=>{
      // Retry keys are locked independently of room choice, including changed payloads.
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`pawhaus:request:${key}`]);
      const existing=await client.query<{fingerprint:string;data:Booking}>('SELECT fingerprint,data FROM pawhaus.bookings WHERE request_key=$1',[key]);
      if(existing.rows[0]){if(existing.rows[0].fingerprint!==fingerprint)throw new Problem('This request key was already used for different details.',409);return existing.rows[0].data;}
      // One room-type lock covers all reserved nights and competing API instances.
      await client.query('SELECT id FROM pawhaus.room_inventory WHERE id=$1 FOR UPDATE',[input.room]);
      const count=await client.query<{peak:number}>(`SELECT COALESCE(max(occupied),0)::integer AS peak FROM (
        SELECT d.day,count(b.id) AS occupied FROM generate_series($1::date,$2::date-1,interval '1 day') d(day)
        LEFT JOIN pawhaus.bookings b ON b.room_id=$3 AND b.status IN ('PENDING','CONFIRMED','CHECKED_IN')
        AND b.check_in<=d.day::date AND b.check_out>d.day::date GROUP BY d.day) nights`,[input.checkIn,input.checkOut,input.room]);
      if(count.rows[0].peak>=rooms.find(room=>room.id===input.room)!.capacity)throw new Problem('That room is now full. Please choose another room or dates.',409);
      const now=new Date().toISOString();const booking:Booking={...input,id:randomUUID(),reference:`PAW-${randomBytes(6).toString('hex').toUpperCase()}`,nights,total,status:'PENDING',createdAt:now,updatedAt:now,version:1};
      await client.query('INSERT INTO pawhaus.bookings(id,request_key,fingerprint,data,room_id,check_in,check_out,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[booking.id,key,fingerprint,JSON.stringify(booking),input.room,input.checkIn,input.checkOut,booking.status]);
      await client.query('INSERT INTO pawhaus.audit(booking_id,actor,action) VALUES($1,$2,$3)',[booking.id,'PUBLIC','REQUESTED']);return booking;
    });
  }
  async update(id:string,to:unknown,version:unknown,actor:Staff):Promise<Booking> {
    return this.transaction(async client=>{
      const result=await client.query<{data:Booking}>('SELECT data FROM pawhaus.bookings WHERE id=$1 FOR UPDATE',[id]);
      const booking=result.rows[0]?.data;if(!booking)throw new Problem('Booking not found.',404);
      if(booking.version!==version)throw new Problem('This booking changed. Refresh and try again.',409);
      const status=transition(booking.status,to,actor.role,booking);
      const updated={...booking,status,version:booking.version+1,updatedAt:new Date().toISOString()};
      await client.query('UPDATE pawhaus.bookings SET data=$1,status=$2 WHERE id=$3',[JSON.stringify(updated),status,id]);
      await client.query('INSERT INTO pawhaus.audit(booking_id,actor,action) VALUES($1,$2,$3)',[id,actor.email,`${booking.status} → ${status}`]);return updated;
    });
  }
  async history(id:string) { const result=await this.pool.query('SELECT actor,action,created_at FROM pawhaus.audit WHERE booking_id=$1 ORDER BY id DESC',[id]);return result.rows; }
}
