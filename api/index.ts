import type { IncomingMessage, ServerResponse } from 'node:http';
import { attachDatabasePool } from '@vercel/functions/db-connections';
import { PostgresStore } from '../src/backend/postgres.ts';
import { api } from '../src/backend/api.ts';

let connection: Promise<ReturnType<typeof api>> | undefined;
function handler() {
  if (!connection) connection = (async()=>{
    if (!process.env.DATABASE_URL) throw new Error('Production database configuration is missing.');
    const store=new PostgresStore(process.env.DATABASE_URL);
    attachDatabasePool(store.pool);
    try { await store.ready(); } catch(error) { await store.close(); throw error; }
    return api(store,{trustedProxy:true});
  })().catch(error=>{connection=undefined;throw error;});
  return connection;
}

export default async function serve(req:IncomingMessage,res:ServerResponse) {
  try {
    // The rewrite carries the original API path while retaining query parameters.
    const url=new URL(req.url??'/', 'https://pawhaus.invalid');
    const path=url.searchParams.get('__pawhaus_route');
    if(path!==null){
      if(!/^[a-zA-Z0-9/-]+$/.test(path)){res.writeHead(404).end();return;}
      url.pathname=`/api/${path}`;url.searchParams.delete('__pawhaus_route');
      req.url=url.pathname+url.search;
    }
    await (await handler())(req,res);
  } catch {
    console.error('Pawhaus API initialization failed.');
    res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});
    res.end(JSON.stringify({error:'The booking service is temporarily unavailable. Please try again.'}));
  }
}
