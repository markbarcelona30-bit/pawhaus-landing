// Disposable browser test accounts belong only to the explicitly named verification database.
import { Store } from '../src/backend/store.ts';
import { resolve } from 'node:path';
const store = new Store(resolve('.data/verification.sqlite'));
if (!store.db.prepare('SELECT id FROM staff WHERE email=?').get('test-staff@example.com')) store.createStaff('test-staff@example.com', 'Local-browser-test-123!');
store.db.close();
console.log('Isolated browser verification database ready.');
