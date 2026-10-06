import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { loadEnvironment } from '../src/backend/connect.ts';
import { PostgresStore } from '../src/backend/postgres.ts';
loadEnvironment();
if(!process.env.DATABASE_URL_UNPOOLED)throw new Error('Set DATABASE_URL_UNPOOLED before importing.');
const source=new DatabaseSync(resolve(process.argv[2]??'.data/pawhaus.sqlite'),{readOnly:true});
const target=new PostgresStore(process.env.DATABASE_URL_UNPOOLED);
try {
  await target.ready();
  const staff=source.prepare('SELECT id,email,password,role FROM staff').all();
  const bookings=source.prepare('SELECT id,request_key,fingerprint,data FROM bookings').all();
  const audit=source.prepare('SELECT booking_id,actor,action,created_at FROM audit ORDER BY id').all();
  await target.transaction(async client=>{
    await client.query('LOCK TABLE pawhaus.staff,pawhaus.bookings,pawhaus.audit IN EXCLUSIVE MODE');
    const result=await client.query('SELECT (SELECT count(*) FROM pawhaus.staff)+(SELECT count(*) FROM pawhaus.bookings) AS count');
    if(Number(result.rows[0].count)!==0)throw new Error('Import requires an empty target. Existing data will not be overwritten.');
    for(const row of staff)await client.query('INSERT INTO pawhaus.staff(id,email,password,role) VALUES($1,$2,$3,$4)',[row.id,row.email,row.password,row.role]);
    for(const row of bookings){
      const b=JSON.parse(String(row.data));
      await client.query('INSERT INTO pawhaus.bookings(id,request_key,fingerprint,data,room_id,check_in,check_out,status,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[row.id,row.request_key,row.fingerprint,row.data,b.room,b.checkIn,b.checkOut,b.status,b.createdAt]);
    }
    for(const row of audit)await client.query('INSERT INTO pawhaus.audit(booking_id,actor,action,created_at) VALUES($1,$2,$3,$4)',[row.booking_id,row.actor,row.action,row.created_at]);
  });
  console.log(`Imported ${staff.length} staff, ${bookings.length} bookings and ${audit.length} activity records. SQLite was preserved; staff must sign in again.`);
} finally {source.close();await target.close();}
