import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parse } from 'parse5';
import { build } from '../scripts/build.mjs';
import { validate } from '../scripts/validate.mjs';
import { walkNodes } from '../src/render.mjs';
import { googleVerificationFiles } from '../src/verification.mjs';

const tagId = 'AW-18339507708';
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const text = node => node.value ?? node.childNodes?.map(text).join('') ?? '';
function elements(source) { const rows = []; walkNodes(parse(source), node => rows.push(node)); return rows; }
const verify = rows => rows.filter(node => node.tagName === 'meta' && attr(node, 'name') === 'google-site-verification').map(node => attr(node, 'content')).sort();
function analytics(source, label) {
  const rows = elements(source);
  const loaders = rows.filter(node => node.tagName === 'script' && attr(node, 'src')?.startsWith('https://www.googletagmanager.com/gtag/js?'));
  assert.equal(loaders.length, 1, `${label}: keep exactly one existing Google tag loader`);
  assert.equal(new URL(attr(loaders[0], 'src')).searchParams.get('id'), tagId, `${label}: Google tag identity must not change`);
  assert.ok(loaders[0].attrs.some(item => item.name === 'async'), `${label}: retain asynchronous loading`);
  const scripts = rows.filter(node => node.tagName === 'script' && !attr(node, 'src') && attr(node, 'type') !== 'application/ld+json').map(text).join('\n');
  assert.equal([...scripts.matchAll(/gtag\(\s*['"]config['"]\s*,\s*['"]AW-18339507708['"]\s*\)/g)].length, 1, `${label}: configure the existing tag once`);
  assert.equal([...scripts.matchAll(/gtag\(\s*['"]js['"]\s*,/g)].length, 1, `${label}: initialize the tag once`);
}

test('production builds preserve Google bindings, verification tags, canonical routes, and custom domain', async () => {
  const repository = process.cwd(), root = await mkdtemp(path.join(os.tmpdir(), 'mockupkit-bindings-'));
  const names = ['index.html', 'support.html', 'terms-of-use.html', 'privacy-policy.html', 'editorial-policy.html', 'growth-research.html', 'growth-research-privacy.html'];
  try {
    for (const name of [...names, ...googleVerificationFiles, 'CNAME', 'favicon.ico', 'Assets', 'content']) await cp(path.join(repository, name), path.join(root, name), { recursive: true });
    await mkdir(path.join(root, 'src'), { recursive: true });
    await cp(path.join(repository, 'src/assets'), path.join(root, 'src/assets'), { recursive: true });
    await cp(path.join(repository, 'src/pages.json'), path.join(root, 'src/pages.json'));
    await cp(path.join(repository, 'src/image-assets.json'), path.join(root, 'src/image-assets.json'));
    const original = new Map(await Promise.all(names.map(async name => [name, await readFile(path.join(root, name), 'utf8')])));
    for (const base of ['/', '/mockupkit-web/']) {
      const result = await build({ root, base });
      validate({ root, base });
      assert.equal((await readFile(path.join(root, 'dist/CNAME'), 'utf8')).trim(), 'mockupkits.com');
      assert.equal((await readFile(path.join(root, 'dist/robots.txt'), 'utf8')).match(/Sitemap:\s*(\S+)/)[1], 'https://mockupkits.com/sitemap.xml');
      const sitemap = await readFile(path.join(root, 'dist/sitemap.xml'), 'utf8');
      for (const name of googleVerificationFiles) {
        assert.deepEqual(await readFile(path.join(root, 'dist', name)), await readFile(path.join(repository, name)), `${name}: Google ownership proof bytes must be preserved at every base`);
        assert.ok(!sitemap.includes(name), 'Ownership proofs must not become sitemap content');
      }
      for (const [name, source] of original) {
        const built = await readFile(path.join(root, 'dist', name), 'utf8');
        analytics(built, name);
        assert.deepEqual(verify(elements(built)), verify(elements(source)), `${name}: existing ownership verification must survive rendering`);
        assert.equal(elements(built).filter(node => node.tagName === 'link' && attr(node, 'rel') === 'canonical').length, 1);
      }
      for (const post of result.posts) analytics(await readFile(path.join(root, `dist/blog/${post.slug}/index.html`), 'utf8'), post.slug);
      analytics(await readFile(path.join(root, 'dist/blog/index.html'), 'utf8'), 'blog index');
      const home = await readFile(path.join(root, 'dist/index.html'), 'utf8');
      assert.ok(home.includes(`href="${base}Assets/site.css"`));
      assert.ok(existsSync(path.join(root, 'dist/Assets/site.css')));
      const nav = elements(home).find(node => node.tagName === 'nav' && attr(node, 'aria-label') === 'Main navigation');
      assert.ok(nav, 'Keep a semantic primary navigation landmark');
      const links = [];
      walkNodes(nav, node => { if (node.tagName === 'a') links.push(attr(node, 'href')); });
      assert.ok(links.includes('#features') && links.includes('#upcoming') && links.includes(`${base}blog/`), 'Available tools, upcoming release and guides must stay directly discoverable');
    }
    for (const [name, source] of original) assert.equal(await readFile(path.join(root, name), 'utf8'), source, 'Build must not edit analytics source');
  } finally { await rm(root, { recursive: true, force: true }); }
});
