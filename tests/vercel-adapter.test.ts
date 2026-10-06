import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {Store} from '../src/backend/store.ts';
import {api} from '../src/backend/api.ts';

test('API validates already-parsed Vercel bodies and preserves size limits',async()=>{
  const store=new Store(':memory:');store.createStaff('admin@example.com','Fictional-test-password');
  const handle=api(store);
  const server=createServer(async(req,res)=>{
    let body='';for await(const chunk of req)body+=chunk;
    Object.assign(req,{body:body?JSON.parse(body):undefined});
    await handle(req,res);
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();assert.ok(address&&typeof address!=='string');
  const base=`http://127.0.0.1:${address.port}`;
  try{
    const post=(body:unknown)=>fetch(`${base}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    assert.equal((await post({email:'admin@example.com',password:'Fictional-test-password'})).status,200);
    assert.equal((await post([])).status,400);
    assert.equal((await post({email:'admin@example.com',password:'x'.repeat(17000)})).status,413);
  }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));store.db.close();}
});
