import { connectStore } from '../src/backend/connect.ts';
import { randomBytes } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Role } from '../src/backend/domain.ts';
const email = process.argv[2];
const role = (process.argv[3] ?? 'ADMIN') as Role;
if (!email || !['ADMIN', 'FRONT_DESK', 'CARE_STAFF'].includes(role)) {
  console.error('Usage: npm run admin:create -- staff@example.com [ADMIN|FRONT_DESK|CARE_STAFF]'); process.exit(1);
}
const store = await connectStore();
const password = randomBytes(18).toString('base64url');
try {
  await store.createStaff(email, password, role);
  mkdirSync(resolve('.data'), { recursive: true });
  const path = resolve('.data', `staff-access-${Date.now()}.txt`);
  writeFileSync(path, `Pawhaus staff access\nURL: http://localhost:3000/admin\nEmail: ${email}\nPassword: ${password}\nRole: ${role}\n\nKeep this file private. Delete it after storing the password in your password manager.\n`, { mode: 0o600 });
  console.log(`Staff account created. Private credentials saved to ${path}`);
} catch (error) { console.error(error instanceof Error && error.message.includes('UNIQUE') ? 'This staff email already exists.' : 'Could not create staff account. Check the email and database path.'); process.exitCode = 1; }
finally { if ('close' in store) await store.close(); else store.db.close(); }
