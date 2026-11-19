import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync, lstatSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { origin, loadPosts } from '../src/posts.mjs';
import { basePath, escapeHtml, prepareDocument, renderIndex, renderPost } from '../src/render.mjs';

export async function build({ root = process.cwd(), output = path.join(root, 'dist'), base = process.env.BASE_PATH || '/' } = {}) {
  base = basePath(base);
  if (path.resolve(output) !== path.join(path.resolve(root), 'dist')) throw Error('Build output must be the website dist directory');
  if (existsSync(output) && lstatSync(output).isSymbolicLink()) throw Error('Build output cannot be a symlink');
  const posts = loadPosts({ root });
  const pageDates = JSON.parse(await readFile(path.join(root, 'src/pages.json'), 'utf8'));
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await cp(path.join(root, 'Assets'), path.join(output, 'Assets'), { recursive: true });
  await cp(path.join(root, 'src/assets'), path.join(output, 'Assets'), { recursive: true });
  for (const name of ['favicon.ico', 'CNAME']) await cp(path.join(root, name), path.join(output, name));
  const pages = [];
  for (const [route, modified] of Object.entries(pageDates)) {
    const file = route === '/' ? 'index.html' : route.slice(1);
    if (!existsSync(path.join(root, file))) continue;
    const html = await readFile(path.join(root, file), 'utf8');
    await writeFile(path.join(output, file), prepareDocument(html, { route, base, root, posts: route === '/' ? posts : null }));
    pages.push({ route, modified: route === '/' ? [modified, ...posts.map(p => p.updatedAt)].sort().at(-1) : modified });
  }
  await mkdir(path.join(output, 'blog'), { recursive: true });
  await writeFile(path.join(output, 'blog/index.html'), prepareDocument(renderIndex(posts), { route: '/blog/', base, root }));
  pages.push({ route: '/blog/', modified: posts.map(p => p.updatedAt).sort().at(-1) ?? '2026-07-20' });
  for (const post of posts) {
    const route = `/blog/${post.slug}/`;
    await mkdir(path.join(output, route), { recursive: true });
    await writeFile(path.join(output, route, 'index.html'), prepareDocument(renderPost(post, posts), { route, base, root }));
    pages.push({ route, modified: post.updatedAt });
  }
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(({ route, modified }) => `  <url><loc>${escapeHtml(origin + route)}</loc><lastmod>${modified}</lastmod></url>`).join('\n')}\n</urlset>\n`;
  await writeFile(path.join(output, 'sitemap.xml'), sitemap);
  await writeFile(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
  await writeFile(path.join(output, '.nojekyll'), '');
  console.log(`Built ${pages.length} pages and ${posts.length} guides at base ${base}.`);
  return { posts, pages, output, base };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
