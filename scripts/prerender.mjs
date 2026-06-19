import { readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const ssrDir = path.join(rootDir, '.ssr-temp');
const indexPath = path.join(distDir, 'index.html');
const serverEntry = path.join(ssrDir, 'entry-server.js');

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const template = await readFile(indexPath, 'utf8');
  const { render } = await import(`${serverEntry}?t=${Date.now()}`);
  const { html, head } = render();

  const output = template
    .replace(/<title>.*?<\/title>/s, '')
    .replace(/<meta\s+name="description"[^>]*>\s*/i, '')
    .replace(/<meta\s+name="keywords"[^>]*>\s*/i, '')
    .replace('<!--app-head-->', head)
    .replace(/<div id="root">.*?<\/div>/s, `<div id="root">${html}</div>`);

  await writeFile(indexPath, output, 'utf8');
  await writeFile(path.join(distDir, 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: https://yihuaxiang.github.io/sitemap.xml\n', 'utf8');
  await writeFile(
    path.join(distDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://yihuaxiang.github.io/</loc>\n    <lastmod>${isoDate()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`,
    'utf8',
  );

  await rm(ssrDir, { recursive: true, force: true });
  console.log('prerendered dist/index.html and wrote robots.txt/sitemap.xml');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
