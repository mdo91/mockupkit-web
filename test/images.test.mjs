import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parse } from 'parse5';
import { build } from '../scripts/build.mjs';
import { validate } from '../scripts/validate.mjs';
import { imageSize, walkNodes } from '../src/render.mjs';
import { googleVerificationFiles } from '../src/verification.mjs';

const repository = process.cwd();
const manifest = JSON.parse(readFileSync(path.join(repository, 'src/image-assets.json'), 'utf8'));
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
function elements(source, tag) {
  const result = [];
  walkNodes(parse(source), node => { if (!tag || node.tagName === tag) result.push(node); });
  return result;
}
function ancestorHasClass(node, name) {
  for (let parent = node.parentNode; parent; parent = parent.parentNode) if (attr(parent, 'class')?.split(/\s+/).includes(name)) return true;
  return false;
}
function candidateUrls(source) {
  return elements(source).flatMap(node => ['srcset', 'imagesrcset'].flatMap(name => {
    const value = attr(node, name);
    return value ? value.split(',').map(candidate => candidate.trim().split(/\s+/)[0]) : [];
  }));
}
async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'mockupkit-images-'));
  const files = ['index.html', 'support.html', 'terms-of-use.html', 'privacy-policy.html', 'editorial-policy.html', 'growth-research.html', 'growth-research-privacy.html', ...googleVerificationFiles, 'CNAME', 'favicon.ico', 'Assets', 'content'];
  for (const name of files) await cp(path.join(repository, name), path.join(root, name), { recursive: true });
  await mkdir(path.join(root, 'src'), { recursive: true });
  for (const name of ['assets', 'pages.json', 'image-assets.json']) await cp(path.join(repository, 'src', name), path.join(root, 'src', name), { recursive: true });
  return root;
}

test('responsive artwork preserves crop geometry and stays within image transfer budgets', () => {
  for (const original of ['/Assets/main.png', '/Assets/example.png', '/Assets/search-result.png', '/Assets/localization.png', '/Assets/templates.png', '/Assets/store-preview.png', '/Assets/asset-1.png', '/Assets/asset-2.png', '/Assets/logo.png']) assert.ok(manifest[original], `Missing optimized image: ${original}`);
  let originalBytes = 0, largestWebpBytes = 0;
  for (const [original, entry] of Object.entries(manifest)) {
    originalBytes += entry.original.bytes;
    assert.ok(entry.webp.length > 1, `${original}: responsive sizes are required`);
    const widths = entry.webp.map(variant => variant.width);
    assert.deepEqual([...new Set(widths)].sort((a, b) => a - b), widths, `${original}: responsive widths must be unique and ordered`);
    if (entry.crop) {
      assert.ok(entry.crop.x >= 0 && entry.crop.y >= 0);
      assert.ok(entry.crop.x + entry.crop.width <= entry.original.width && entry.crop.y + entry.crop.height <= entry.original.height, `${original}: crop escapes the original image`);
      assert.equal(entry.width, entry.crop.width);
      assert.equal(entry.height, entry.crop.height);
    }
    largestWebpBytes += Math.max(...entry.webp.map(variant => variant.bytes));
    for (const variant of [...entry.webp, entry.fallback]) {
      assert.match(variant.src, /^\/Assets\/images\/[a-z0-9]+(?:-[a-z0-9]+)+\.(?:webp|jpe?g|png)$/);
      const bytes = readFileSync(path.join(repository, variant.src));
      assert.equal(bytes.length, variant.bytes, `${variant.src}: file size differs from manifest`);
      assert.deepEqual(imageSize(bytes), [variant.width, variant.height], `${variant.src}: pixel dimensions differ from manifest`);
      assert.ok(variant.width <= entry.width, `${variant.src}: image must not be upscaled`);
      assert.ok(Math.abs(variant.height - Math.round(entry.height * variant.width / entry.width)) <= 1, `${variant.src}: image aspect ratio changed`);
      if (variant.type === 'image/webp') {
        assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
        assert.equal(bytes.subarray(8, 12).toString(), 'WEBP');
        assert.ok(bytes.length < 100000, `${variant.src}: exceeds 100 KB WebP budget`);
      } else if (variant.type === 'image/jpeg') {
        assert.ok(/\.jpe?g$/.test(variant.src) && bytes[0] === 0xff && bytes[1] === 0xd8, `${variant.src}: JPEG extension must match encoded data`);
        assert.ok(bytes.length < 200000, `${variant.src}: exceeds 200 KB fallback budget`);
      } else {
        assert.equal(variant.type, 'image/png');
        assert.ok(variant.src.endsWith('.png') && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${variant.src}: PNG extension must match encoded data`);
      }
    }
  }
  assert.ok(largestWebpBytes < originalBytes * 0.1, 'Largest WebP alternatives must save at least 90% compared with their originals');
});

test('homepage and guide image delivery stays responsive and discoverable at both URL bases', async () => {
  const root = await fixture();
  try {
    for (const base of ['/', '/mockupkit-web/']) {
      await build({ root, base });
      validate({ root, base });
      const homepage = await readFile(path.join(root, 'dist/index.html'), 'utf8');
      const hero = elements(homepage, 'img').find(node => ancestorHasClass(node, 'hero') && !/logo|\.svg/i.test(attr(node, 'src')));
      assert.ok(hero, 'The requested localization hero must remain visible');
      assert.equal(attr(hero, 'src'), `${base}${manifest['/Assets/localization.png'].fallback.src.slice(1)}`);
      assert.equal(attr(hero, 'loading'), 'eager');
      assert.equal(attr(hero, 'fetchpriority'), 'high');
      assert.match(attr(hero, 'alt'), /French|localized|language/i);
      const heroSource = hero.parentNode.childNodes.find(node => node.tagName === 'source');
      const preload = elements(homepage, 'link').find(node => attr(node, 'as') === 'image');
      assert.equal(attr(preload, 'imagesrcset'), attr(heroSource, 'srcset'));
      assert.equal(attr(preload, 'imagesizes'), attr(heroSource, 'sizes'));
      assert.ok(attr(heroSource, 'sizes').includes('980px'), 'Hero variants must account for the actual stacked-layout breakpoint');
      const gallery = elements(homepage, 'img').filter(node => ancestorHasClass(node, 'shots'));
      assert.deepEqual(gallery.map(node => attr(node, 'src')), ['/Assets/main.png', '/Assets/example.png'].map(original => `${base}${manifest[original].fallback.src.slice(1)}`));
      for (const image of elements(homepage, 'img').filter(node => ancestorHasClass(node, 'feature-capture') || ancestorHasClass(node, 'shots'))) assert.equal(attr(image, 'loading'), 'lazy');
      const guide = await readFile(path.join(root, 'dist/blog/how-to-make-app-store-screenshots-on-mac/index.html'), 'utf8');
      for (const source of [homepage, guide]) {
        assert.ok(candidateUrls(source).length > 0);
        for (const url of candidateUrls(source)) assert.ok(url.startsWith(`${base}Assets/images/`), `Responsive candidate is missing output base: ${url}`);
        for (const image of elements(source, 'img')) assert.ok(!Object.keys(manifest).some(original => attr(image, 'src') === `${base}${original.slice(1)}`), 'Known large originals must not be requested by rendered images');
      }
      const sitemap = await readFile(path.join(root, 'dist/sitemap.xml'), 'utf8');
      assert.match(sitemap, /xmlns:image="http:\/\/www.google.com\/schemas\/sitemap-image\/1\.1"/);
      assert.ok(sitemap.includes(`https://mockupkits.com${manifest['/Assets/localization.png'].fallback.src}`));
      assert.ok(!sitemap.includes('https://mockupkits.com/mockupkit-web/Assets/'), 'Image sitemap URLs must stay canonical under subpath builds');
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('image validation catches missing files, incorrect width descriptors, unsafe candidates, and mismatched hero preloads', async () => {
  const root = await fixture();
  try {
    const base = '/mockupkit-web/';
    await build({ root, base });
    const file = path.join(root, 'dist/index.html'), html = await readFile(file, 'utf8');
    const firstSource = elements(html, 'source').find(node => attr(node, 'srcset'));
    const sourceSet = attr(firstSource, 'srcset');
    const [candidate, descriptor] = sourceSet.split(',')[0].trim().split(/\s+/);
    const cases = [
      [html.replace(sourceSet, sourceSet.replace(candidate, `${base}Assets/images/missing-480.webp`)), /broken internal URL/],
      [html.replace(sourceSet, sourceSet.replace(descriptor, `${Number.parseInt(descriptor) + 1}w`)), /width differs/],
      [html.replace(sourceSet, sourceSet.replace(candidate, 'javascript:alert(1)')), /unsafe URL/],
      [html.replace(sourceSet, sourceSet.replace(candidate, candidate.replace(base, '/'))), /missing output base/],
      [html.replace('imagesizes="', 'data-imagesizes="'), /needs imagesizes/],
      [html.replace('imagesrcset="', 'data-imagesrcset="'), /hero preload differs/]
    ];
    for (const [changed, error] of cases) {
      await writeFile(file, changed);
      assert.throws(() => validate({ root, base }), error);
    }
    await writeFile(file, html);
    const missing = manifest['/Assets/localization.png'].webp.at(-1).src;
    await rm(path.join(root, 'dist', missing));
    assert.throws(() => validate({ root, base }), /broken internal URL/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
