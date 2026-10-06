import { readFileSync } from 'node:fs';
import { loadEnvironment } from '../src/backend/connect.ts';
import { databasePool } from '../src/backend/postgres.ts';
loadEnvironment();
const url=process.env.DATABASE_URL_UNPOOLED;
if(!url)throw new Error('Set DATABASE_URL_UNPOOLED in the ignored .env file for migrations.');
if(new URL(url).hostname.includes('-pooler'))throw new Error('Migrations require the direct, unpooled connection.');
const pool=databasePool(url);
const client=await pool.connect();
try{
  await client.query('BEGIN');
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended('pawhaus:migrations',0))");
  await client.query(readFileSync(new URL('../migrations/003-neon.sql',import.meta.url),'utf8'));
  await client.query('COMMIT');console.log('Pawhaus PostgreSQL migration 3 applied.');
}catch{await client.query('ROLLBACK');console.error('Migration failed. No changes were committed. Check the connection and schema permissions.');process.exitCode=1;}
finally{client.release();await pool.end();}
