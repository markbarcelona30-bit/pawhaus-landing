import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { PostgresStore } from '../src/backend/postgres.ts';
import { api } from '../src/backend/api.ts';
import { businessToday } from '../src/backend/domain.ts';

test('Neon HTTP workflow, concurrent capacity, retries, persistence and authorization', {skip: !process.env.TEST_DATABASE_URL}, async()=>{
  const url=process.env.TEST_DATABASE_URL!;
  // This suite initializes schema and creates fictional records only in a test database.
  assert.match(new URL(url).pathname, /_test$/);
  const store=new PostgresStore(url);
  const suffix=randomUUID();
  const email=`admin-${suffix}@example.com`,careEmail=`care-${suffix}@example.com`;
  const password='Fictional-test-password-123';
  const start=new Date(Date.parse(businessToday())+86400000*100).toISOString().slice(0,10);
  const end=new Date(Date.parse(start)+86400000*2).toISOString().slice(0,10);
  const input={checkIn:start,checkOut:end,room:'cozy',guests:1,dogName:'Test Milo',sibling:'',breed:'Corgi',size:'small',owner:'Test Guest',email:'test@example.com',phone:'',notes:'Integration test',consent:true};
  const createdIds:string[]=[];
  const server=createServer(api(store));
  try {
    await store.pool.query(readFileSync(new URL('../migrations/003-neon.sql',import.meta.url),'utf8'));
    await store.ready();
    await store.createStaff(email,password);await store.createStaff(careEmail,password,'CARE_STAFF');
    await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
    const address=server.address();assert.ok(address&&typeof address!=='string');
    const base=`http://127.0.0.1:${address.port}`;
    assert.equal((await fetch(`${base}/api/config`).then(r=>r.json())).mode,'neon');
    assert.equal((await fetch(`${base}/api/admin/bookings`)).status,401);
    const key=randomUUID();
    const first=await store.create(input,key);createdIds.push(first.id);
    const repeated=await Promise.all([store.create(input,key),store.create(input,key)]);
    assert.ok(repeated.every(b=>b.id===first.id));
    await assert.rejects(store.create({...input,notes:'Changed'},key),/different details/);
    const results=await Promise.allSettled(Array.from({length:4},()=>store.create(input,randomUUID())));
    for(const result of results)if(result.status==='fulfilled')createdIds.push(result.value.id);
    assert.equal(results.filter(r=>r.status==='fulfilled').length,3);
    assert.equal(results.filter(r=>r.status==='rejected').length,1);
    assert.equal((await store.availability(start,end,1))[0].available,0);
    const login=await fetch(`${base}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    assert.equal(login.status,200);const cookie=login.headers.get('set-cookie')!;assert.match(cookie,/HttpOnly/);
    const headers={'Content-Type':'application/json',Cookie:cookie};
    const listing=await fetch(`${base}/api/admin/bookings`,{headers}).then(r=>r.json());
    assert.ok(listing.bookings.some((b:{id:string})=>b.id===first.id));
    const change=await fetch(`${base}/api/admin/bookings/${first.id}`,{method:'PATCH',headers,body:JSON.stringify({status:'CONFIRMED',version:1})});
    assert.equal(change.status,200);
    await assert.rejects(store.update(first.id,'CANCELLED',1,{id:randomUUID(),email,role:'ADMIN'}),/changed/);
    await assert.rejects(store.update(first.id,'CANCELLED',2,{id:randomUUID(),email:careEmail,role:'CARE_STAFF'}),/role/);
    await store.update(first.id,'CANCELLED',2,{id:randomUUID(),email,role:'ADMIN'});
    assert.equal((await store.availability(start,end,1))[0].available,1);
    assert.equal((await store.history(first.id)).length,3);
    const reopened=new PostgresStore(url);try{await reopened.ready();assert.ok((await reopened.list()).some(b=>b.id===first.id));}finally{await reopened.close();}
    assert.equal((await fetch(`${base}/api/auth/logout`,{method:'POST',headers,body:'{}'})).status,200);
    assert.equal((await fetch(`${base}/api/admin/bookings`,{headers})).status,401);
  } finally {
    if(server.listening)await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
    if(createdIds.length){await store.pool.query('DELETE FROM pawhaus.audit WHERE booking_id=ANY($1::uuid[])',[createdIds]);await store.pool.query('DELETE FROM pawhaus.bookings WHERE id=ANY($1::uuid[])',[createdIds]);}
    await store.pool.query('DELETE FROM pawhaus.staff WHERE email=ANY($1::text[])',[[email,careEmail]]);
    await store.close();
  }
});
