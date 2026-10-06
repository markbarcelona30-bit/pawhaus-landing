import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

test('room cards show future confirmed stays and count only their reserved nights', () => {
  const element = {addEventListener(){}, textContent:'', querySelectorAll(){return [];}};
  const context=createContext({document:{querySelector(){return element;},querySelectorAll(){return [];},addEventListener(){}},fetch:()=>new Promise(()=>{}),Intl,Date});
  runInContext(readFileSync(new URL('../src/js/admin.js',import.meta.url),'utf8'),context);
  runInContext(`today='2026-10-06'; rooms=[{id:'cozy',name:'Cozy Nook',price:1200,dogs:1,capacity:4}]; bookings=[{room:'cozy',status:'CONFIRMED',checkIn:'2026-10-07',checkOut:'2026-10-08'}];`,context);
  const render=()=>String(runInContext('roomCards()',context));
  assert.match(render(),/0 of 4 rooms reserved today/);
  assert.match(render(),/1 upcoming confirmed stay after this date/);
  runInContext("roomDate='2026-10-07'",context);
  assert.match(render(),/1 of 4 rooms reserved on 7 Oct 2026/);
  assert.match(render(),/width:25%/);
  runInContext("roomDate='2026-10-08'",context);
  assert.match(render(),/0 of 4 rooms reserved on 8 Oct 2026/);
  runInContext("roomDate='2026-10-07'; bookings[0].status='CANCELLED'",context);
  assert.match(render(),/0 of 4 rooms reserved/);
  runInContext("bookings[0].status='PENDING'",context);
  assert.match(render(),/1 of 4 rooms reserved/);
  runInContext("bookings[0].status='CHECKED_IN'",context);
  assert.match(render(),/1 of 4 rooms reserved/);
});
