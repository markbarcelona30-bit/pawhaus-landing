import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { Store } from '../src/backend/store.ts';
import { api } from '../src/backend/api.ts';
import { businessToday, dates, validateBooking } from '../src/backend/domain.ts';
import type { BookingInput } from '../src/backend/domain.ts';
const plus = (days: number) => new Date(Date.parse(businessToday()) + days * 86400000).toISOString().slice(0, 10);
const input = (extra: Partial<BookingInput> = {}): BookingInput => ({checkIn:plus(1),checkOut:plus(3),room:'cozy',guests:1,dogName:'Milo',sibling:'',breed:'Corgi',size:'small',owner:'Test Guest',email:'guest@example.com',phone:'',notes:'Usual food. Quiet play.',consent:true,...extra});
test('price comes from server rates; invalid dates and dog capacity are rejected', () => {
  assert.equal(validateBooking({...input(),total:1}).total,2400);
  assert.throws(()=>dates('2027-02-30','2027-03-02'));
  assert.throws(()=>validateBooking(input({checkOut:plus(32)})));
  assert.throws(()=>validateBooking(input({checkIn:plus(-1)})));
  assert.throws(()=>validateBooking(input({size:'large'})));
  assert.throws(()=>validateBooking(input({guests:2,sibling:'Pip'})));
  assert.throws(()=>validateBooking({...input(),consent:false}));
  assert.equal(validateBooking(input({room:'garden',guests:2,sibling:'Pip'})).total,5200);
});
test('capacity is checked per night, requests are idempotent, cancellation frees inventory', () => {
  const store=new Store(':memory:');
  try{
    const key=randomUUID(),booking=store.create(input(),key);
    assert.equal(store.create(input(),key).id,booking.id);
    assert.throws(()=>store.create(input({notes:'Changed'}),key));
    for(let i=0;i<3;i++)store.create(input(),randomUUID());
    assert.throws(()=>store.create(input(),randomUUID()),/full/);
    assert.equal(store.availability(plus(3),plus(5),1)[0].available,4);
    assert.throws(()=>store.update(booking.id,'CONFIRMED',1,{id:'care',email:'care@example.com',role:'CARE_STAFF'}),/role/);
    store.update(booking.id,'CANCELLED',1,{id:'staff',email:'staff@example.com',role:'ADMIN'});
    assert.equal(store.availability(plus(1),plus(3),1)[0].available,1);
    assert.throws(()=>store.update(booking.id,'CONFIRMED',2,{id:'staff',email:'staff@example.com',role:'ADMIN'}),/not allowed/);
    assert.equal(store.history(booking.id).length,2);
  }finally{store.db.close();}
});
test('non-overlapping bookings are not added together when measuring peak occupancy',()=>{
  const store=new Store(':memory:');
  try{for(let i=0;i<2;i++){store.create(input({checkIn:plus(1),checkOut:plus(2)}),randomUUID());store.create(input({checkIn:plus(2),checkOut:plus(3)}),randomUUID());}assert.equal(store.availability(plus(1),plus(3),1)[0].available,2);store.create(input(),randomUUID());assert.equal(store.availability(plus(1),plus(3),1)[0].available,1);assert.equal(store.availability(plus(3),plus(4),1)[0].available,4);}finally{store.db.close();}
});
test('status workflow enforces date rules and optimistic concurrency',()=>{
  const store=new Store(':memory:'),staff={id:'staff',email:'staff@example.com',role:'FRONT_DESK' as const};
  try{const future=store.create(input(),randomUUID());assert.throws(()=>store.update(future.id,'CHECKED_OUT',1,staff));const confirmed=store.update(future.id,'CONFIRMED',1,staff);assert.throws(()=>store.update(future.id,'CANCELLED',1,staff),/changed/);assert.throws(()=>store.update(future.id,'CHECKED_IN',confirmed.version,staff),/arrival/);const today=store.create(input({checkIn:plus(0),checkOut:plus(1)}),randomUUID());const a=store.update(today.id,'CONFIRMED',1,staff);const b=store.update(a.id,'CHECKED_IN',a.version,staff);const c=store.update(b.id,'CHECKED_OUT',b.version,staff);assert.equal(c.status,'CHECKED_OUT');assert.throws(()=>store.update(c.id,'CONFIRMED',c.version,staff));}finally{store.db.close();}
});
test('bookings and staff survive database reopen; authentication expires and logout revokes',()=>{
  const directory=mkdtempSync(join(tmpdir(),'pawhaus-test-')),path=join(directory,'bookings.sqlite');
  let store=new Store(path);
  try{store.createStaff('admin@example.com','A-long-test-password');store.create(input(),randomUUID());store.db.close();store=new Store(path);assert.equal(store.list().length,1);assert.throws(()=>store.login('admin@example.com','wrong'),/incorrect/);const result=store.login('admin@example.com','A-long-test-password');assert.equal(store.staff(result.token)?.role,'ADMIN');store.logout(result.token);assert.equal(store.staff(result.token),undefined);const expired=store.login('admin@example.com','A-long-test-password');store.db.prepare('UPDATE sessions SET expires=0').run();assert.equal(store.staff(expired.token),undefined);}finally{store.db.close();rmSync(directory,{recursive:true,force:true});}
});
test('HTTP booking → staff login → confirmation; private data stays protected',async()=>{
  const store=new Store(':memory:');store.createStaff('admin@example.com','A-long-test-password');store.createStaff('care@example.com','A-long-test-password','CARE_STAFF');
  const server=createServer(api(store));await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();assert.ok(address&&typeof address!=='string');const base=`http://127.0.0.1:${address.port}`;
  try{
    assert.equal((await fetch(`${base}/api/admin/bookings`)).status,401);
    const malicious=await fetch(`${base}/api/bookings`,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://untrusted.example'},body:JSON.stringify(input())});assert.equal(malicious.status,403);
    const request=await fetch(`${base}/api/bookings`,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':randomUUID()},body:JSON.stringify(input())});assert.equal(request.status,201);const saved=await request.json();assert.ok(saved.reference);assert.equal(saved.email,undefined);assert.equal(saved.total,2400);
    const login=await fetch(`${base}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@example.com',password:'A-long-test-password'})});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie')!;assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);
    const headers={'Content-Type':'application/json',Cookie:cookie};const listing=await fetch(`${base}/api/admin/bookings`,{headers});const data=await listing.json();assert.equal(data.bookings[0].reference,saved.reference);
    const id=data.bookings[0].id;const change=await fetch(`${base}/api/admin/bookings/${id}`,{method:'PATCH',headers,body:JSON.stringify({status:'CONFIRMED',version:1})});assert.equal(change.status,200);assert.equal((await change.json()).booking.status,'CONFIRMED');
    const care=await fetch(`${base}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'care@example.com',password:'A-long-test-password'})});const forbidden=await fetch(`${base}/api/admin/bookings/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json',Cookie:care.headers.get('set-cookie')!},body:JSON.stringify({status:'CANCELLED',version:2})});assert.equal(forbidden.status,403);
    const logout=await fetch(`${base}/api/auth/logout`,{method:'POST',headers,body:'{}'});assert.equal(logout.status,200);assert.equal((await fetch(`${base}/api/admin/bookings`,{headers})).status,401);
    const racing = await Promise.all(Array.from({length:4},()=>fetch(`${base}/api/bookings`,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':randomUUID()},body:JSON.stringify(input())})));
    assert.equal(racing.filter(response=>response.status===201).length,3);
    assert.equal(racing.filter(response=>response.status===409).length,1);
    assert.equal(store.list().filter(booking=>booking.room==='cozy').length,4);
  }finally{await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));store.db.close();}
});
