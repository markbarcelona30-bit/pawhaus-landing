import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';

test('check-in workspace shows future confirmed bookings separately from due arrivals and departures',()=>{
  const element={addEventListener(){},textContent:''};
  const context=createContext({document:{querySelector(){return element;},querySelectorAll(){return [];},addEventListener(){}},fetch:()=>new Promise(()=>{}),Intl,Date});
  runInContext(readFileSync(new URL('../src/js/admin.js',import.meta.url),'utf8'),context);
  runInContext(`today='2026-10-06'; rooms=[{id:'cozy',name:'Cozy Nook'}]; bookings=[
    {id:'future',dogName:'Future dog',status:'CONFIRMED',checkIn:'2026-10-07',checkOut:'2026-10-08',room:'cozy',total:1200},
    {id:'late',dogName:'Late arrival',status:'CONFIRMED',checkIn:'2026-10-05',checkOut:'2026-10-07',room:'cozy',total:2400},
    {id:'out',dogName:'Due departure',status:'CHECKED_IN',checkIn:'2026-10-05',checkOut:'2026-10-06',room:'cozy',total:1200},
    {id:'cancelled',dogName:'Cancelled dog',status:'CANCELLED',checkIn:'2026-10-07',checkOut:'2026-10-08',room:'cozy',total:1200},
    {id:'pending',dogName:'Pending dog',status:'PENDING',checkIn:'2026-10-07',checkOut:'2026-10-08',room:'cozy',total:1200}
  ];`,context);
  const html=String(runInContext('arrivalsView()',context));
  const sections=html.split('<div class="card">');
  assert.match(sections[1],/Late arrival/);assert.doesNotMatch(sections[1],/Future dog/);
  assert.match(sections[2],/Due departure/);assert.doesNotMatch(sections[2],/Future dog/);
  assert.match(sections[3],/Future dog/);assert.match(sections[3],/Check-in opens on the arrival date/);
  assert.match(sections[4],/Future dog/);
  assert.doesNotMatch(html,/Cancelled dog|Pending dog/);
});
