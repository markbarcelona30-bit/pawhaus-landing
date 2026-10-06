import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { Store } from './store.ts';
import { PostgresStore } from './postgres.ts';
export function loadEnvironment(root=process.cwd()) {
  const path=resolve(root,'.env');if(existsSync(path))loadEnvFile(path);
}
export async function connectStore(root=process.cwd()) {
  loadEnvironment(root);
  if(process.env.DATABASE_URL){const store=new PostgresStore(process.env.DATABASE_URL);await store.ready();return store;}
  if(process.env.NODE_ENV==='production')throw new Error('DATABASE_URL is required in production. SQLite fallback is disabled.');
  return new Store(process.env.PAWHAUS_DB || resolve(root,'.data/pawhaus.sqlite'));
}
