import { copyFile, cp, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');

await rm(path.join(rootDir, 'assets'), { recursive: true, force: true });
await cp(path.join(distDir, 'assets'), path.join(rootDir, 'assets'), { recursive: true });
await copyFile(path.join(distDir, 'index.html'), path.join(rootDir, 'index.html'));
await copyFile(path.join(distDir, 'robots.txt'), path.join(rootDir, 'robots.txt'));
await copyFile(path.join(distDir, 'sitemap.xml'), path.join(rootDir, 'sitemap.xml'));
await writeFile(path.join(rootDir, '.nojekyll'), '', 'utf8');

console.log('exported built site to repository root for branch-based GitHub Pages');
