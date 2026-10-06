import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist');
await mkdir(output, { recursive: true });
await cp(resolve(root, 'public'), output, { recursive: true, filter: path => !path.endsWith('.backup') });
await cp(resolve(root, 'src/css'), resolve(output, 'css'), { recursive: true });
await cp(resolve(root, 'src/js'), resolve(output, 'js'), { recursive: true });
for (const name of ['styles.css', 'sections.css', 'booking.css']) {
  const path = resolve(output, 'css', name);
  const css = await readFile(path, 'utf8');
  await writeFile(path, css.replaceAll('/public/images/', '/images/'));
}
console.log('Pawhaus static site built in dist/');
