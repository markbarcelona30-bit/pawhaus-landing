import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectStore } from './backend/connect.ts';
import { api } from './backend/api.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicRoot = resolve(root, 'public');
const sourceRoot = resolve(root, 'src');
const store = await connectStore(root);
const handleApi = api(store);
const types = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.md': 'text/plain',
};

const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.startsWith('/api/')) { await handleApi(req, res); return; }
    let directory = publicRoot;
    let relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (pathname === '/admin' || pathname === '/admin/') relativePath = 'admin/index.html';

    if (pathname.startsWith('/public/')) {
      relativePath = pathname.slice('/public/'.length);
    } else if (pathname.startsWith('/css/') || pathname.startsWith('/js/')) {
      directory = sourceRoot;
    } else if (pathname.startsWith('/src/css/') || pathname.startsWith('/src/js/')) {
      directory = sourceRoot;
      relativePath = pathname.slice('/src/'.length);
    }

    const path = resolve(directory, relativePath);
    if (path !== directory && !path.startsWith(directory + sep)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch (error) {
    res.writeHead(error instanceof URIError ? 400 : 404).end('Not found');
  }
});

server.listen(Number(process.env.PORT) || 3000, process.env.HOST || '127.0.0.1', () => {
  console.log('Pawhaus ready at http://localhost:3000');
});
