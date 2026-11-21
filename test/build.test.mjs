import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { build } from '../scripts/build.mjs';
import { validate } from '../scripts/validate.mjs';
import { source, metadata } from './fixtures.mjs';
import { googleVerificationFiles } from '../src/verification.mjs';

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'mockupkit-build-'));
  await mkdir(path.join(root, 'content/guides/en'), { recursive: true });
  await mkdir(path.join(root, 'src/assets'), { recursive: true });
  await cp(new URL('../src/image-assets.json', import.meta.url), path.join(root, 'src/image-assets.json'));
  await mkdir(path.join(root, 'blog'), { recursive: true });
  await cp(new URL('../Assets', import.meta.url), path.join(root, 'Assets'), { recursive: true });
  await cp(new URL('../favicon.ico', import.meta.url), path.join(root, 'favicon.ico'));
  for (const name of googleVerificationFiles) await cp(new URL(`../${name}`, import.meta.url), path.join(root, name));
  await cp(new URL('../src/assets/blog.css', import.meta.url), path.join(root, 'src/assets/blog.css'));
  await writeFile(path.join(root, 'CNAME'), 'mockupkits.com\n');
  await writeFile(path.join(root, 'src/pages.json'), JSON.stringify({ '/': '2026-11-19' }));
  await writeFile(path.join(root, 'index.html'), '<!doctype html><html lang="en"><head><title>Mockup Kit</title><meta name="description" content="Compose artwork on Mac."><link rel="canonical" href="https://mockupkits.com/"></head><body><h1>Mockup Kit</h1><img src="./Assets/logo.png" alt="Mockup Kit logo"><section id="blog"><p>Old teaser</p></section></body></html>');
  await writeFile(path.join(root, 'editorial-policy.html'), 'Unused fixture');
  // Static pages linked by trusted templates need complete documents too.
  const staticRoutes = ['support.html', 'editorial-policy.html', 'terms-of-use.html', 'privacy-policy.html'];
  const dates = { '/': '2026-11-19' };
  for (const route of staticRoutes) {
    dates[`/${route}`] = '2026-11-19';
    await writeFile(path.join(root, route), `<!doctype html><html lang="en"><head><title>${route}</title><meta name="description" content="Site information"><link rel="canonical" href="https://mockupkits.com/${route}"></head><body><h1>Information</h1></body></html>`);
  }
  await writeFile(path.join(root, 'src/pages.json'), JSON.stringify(dates));
  await writeFile(path.join(root, 'blog/index.html'), 'Legacy index must not be rewritten');
  await writeFile(path.join(root, 'sitemap.xml'), 'Legacy sitemap must not be rewritten');
  const post = source(metadata, '## Export\n\n![App canvas](/Assets/asset-1.png)\n\nCheck the screenshot dimensions before exporting.');
  await writeFile(path.join(root, `content/guides/en/${metadata.slug}.md`), post);
  return { root, post };
}

test('build creates a discoverable canonical site without changing sources, at both bases', async () => {
  const { root, post } = await fixture();
  try {
    const names = ['index.html', 'blog/index.html', 'sitemap.xml', `content/guides/en/${metadata.slug}.md`];
    const before = await Promise.all(names.map(name => readFile(path.join(root, name), 'utf8')));
    for (const base of ['/', '/mockupkit-web/']) {
      await build({ root, base });
      assert.equal(validate({ root, base }).guides, 1);
      const html = await readFile(path.join(root, `dist/blog/${metadata.slug}/index.html`), 'utf8');
      assert.match(html, /name="post-source-sha256"/);
      assert.ok(html.includes(createHash('sha256').update(post).digest('hex')));
      assert.ok(html.includes('href="https://mockupkits.com/blog/export-a-screenshot/"'));
      assert.ok(html.includes(`href="${base}Assets/blog.css"`));
      assert.ok(!html.includes(`${base}mockupkit-web/mockupkit-web/`));
      assert.ok(!existsSync(path.join(root, 'dist/website/index.html')));
      assert.ok(!existsSync(path.join(root, 'dist/__missing__/index.html')));
      assert.match(await readFile(path.join(root, 'dist/blog/index.html'), 'utf8'), /export-a-screenshot/);
    }
    assert.deepEqual(await Promise.all(names.map(name => readFile(path.join(root, name), 'utf8'))), before);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('independent site validation catches broken links and wrong source identity', async () => {
  const { root } = await fixture();
  try {
    await build({ root });
    const proofFile = path.join(root, 'dist', googleVerificationFiles[0]);
    const proof = await readFile(proofFile);
    const changedLineEnding = /\r?\n$/.test(proof.toString()) ? proof.toString().replace(/\r?\n$/, '') : `${proof.toString()}\n`;
    await writeFile(proofFile, changedLineEnding);
    assert.throws(() => validate({ root }), /built verification proof differs from its original bytes/);
    await writeFile(proofFile, proof);
    const file = path.join(root, `dist/blog/${metadata.slug}/index.html`);
    const html = await readFile(file, 'utf8');
    await writeFile(file, html.replace('name="post-source-sha256" content="', 'name="post-source-sha256" content="wrong'));
    assert.throws(() => validate({ root }), /source identity differs/);
    await writeFile(file, html.replace('</article>', '<a href="/missing/">Missing</a></article>'));
    assert.throws(() => validate({ root }), /broken internal URL/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
