import { copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await copyFile(path.join(rootDir, 'index.template.html'), path.join(rootDir, 'index.html'));
console.log('restored Vite template -> index.html');
