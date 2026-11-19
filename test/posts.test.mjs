import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parsePost, loadPosts, publishingDate, safeUrl, parseSwatches } from '../src/posts.mjs';
import { markdown } from '../src/render.mjs';

import { metadata, source } from './fixtures.mjs';
const now = new Date('2026-11-19T12:00:00Z');

test('metadata and original source identity are preserved', () => {
  const input = source();
  const post = parsePost(input, 'content/guides/en/export-a-screenshot.md', now);
  assert.equal(post.title, metadata.title);
  assert.equal(post.file, 'content/guides/en/export-a-screenshot.md');
  assert.equal(post.sourceHash, createHash('sha256').update(input).digest('hex'));
  assert.equal(post.publishedAt, '2026-07-20');
});

test('publishing dates use Istanbul across the UTC day boundary', () => {
  assert.equal(publishingDate(new Date('2026-11-18T21:00:00Z')), '2026-11-19');
  assert.doesNotThrow(() => parsePost(source(), 'guide.md', new Date('2026-11-18T21:00:00Z')));
  assert.throws(() => parsePost(source(), 'guide.md', new Date('2026-11-18T20:59:59Z')), /future article/);
  assert.throws(() => parsePost(source({ ...metadata, publishedAt: '2026-02-30' }), 'guide.md', now), /invalid publishedAt/);
  assert.throws(() => parsePost(source({ ...metadata, updatedAt: '2026-07-19' }), 'guide.md', now), /updated before publication/);
});

test('guide HTML, unsafe URLs, invalid metadata, and empty alt text are rejected', () => {
  for (const body of ['<script>alert(1)</script>', '<img src="/Assets/logo.png">', '# Duplicate page heading', '[Click](javascript:alert)', '![Image](https://example.com/tracker.png)', '![](/Assets/logo.png)', '[Click](//example.com/)', '![Image](/Assets/%2e%2e/private.png)']) {
    assert.throws(() => parsePost(source(metadata, body), 'guide.md', now));
  }
  for (const patch of [{ locale: 'fr' }, { slug: '../escape' }, { topics: ['unsupported-feature'] }, { related: [metadata.slug] }, { translationKey: 'Invalid Key' }, { privateMetrics: 'must not publish' }, { sources: [{ title: 'Source', url: 'http://example.com' }] }]) {
    assert.throws(() => parsePost(source({ ...metadata, ...patch }), 'guide.md', now));
  }
  assert.throws(() => parsePost('---\ntitle: one\ntitle: two\n---\nbody', 'guide.md', now), /Map keys must be unique/);
});

test('URLs and swatch components reject executable or escaped values', () => {
  assert.equal(safeUrl('https://example.com/page'), true);
  assert.equal(safeUrl('https://user:password@example.com'), false);
  assert.equal(safeUrl('/Assets/%GG.png', { image: true }), false);
  assert.equal(safeUrl('/Assets/../private.png', { image: true }), false);
  assert.equal(safeUrl('/Assets/logo.png', { image: true }), true);
  assert.throws(() => parseSwatches('Danger | red; background:url(javascript:alert(1))'), /invalid swatch/);
  assert.deepEqual(parseSwatches('Blue | #123abc -> #001122'), [{ name: 'Blue', start: '#123ABC', end: '#001122' }]);
  const html = markdown({ body: '```swatches\nA < B | #123ABC -> #001122\n```' });
  assert.match(html, /A &lt; B/);
  assert.match(html, /linear-gradient\(160deg, #123ABC, #001122\)/);
});

test('rendered Markdown has escaped content, stable heading IDs, and subpath links', () => {
  const post = parsePost(source(metadata, '## Export\n\n[Read more](/blog/)\n\n## Export\n\n![App canvas](/Assets/asset-1.png)'), 'guide.md', now);
  const html = markdown(post, '/mockupkit-web/');
  assert.match(html, /id="export"/);
  assert.match(html, /id="export-2"/);
  assert.match(html, /href="\/mockupkit-web\/blog\/"/);
  assert.match(html, /src="\/mockupkit-web\/Assets\/asset-1.png"/);
});

test('loadPosts enforces source paths, related publication, unique identity, and symlink boundaries', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'mockupkit-posts-'));
  const directory = path.join(root, 'content/guides/en');
  await mkdir(directory, { recursive: true });
  try {
    const file = path.join(directory, `${metadata.slug}.md`);
    await writeFile(file, source());
    assert.equal(loadPosts({ root, now }).length, 1);
    await writeFile(file, source({ ...metadata, related: ['missing-guide'] }));
    assert.throws(() => loadPosts({ root, now }), /related guide is missing/);
    await writeFile(file, source());
    await writeFile(path.join(directory, 'other-guide.md'), source({ ...metadata, slug: 'other-guide' }));
    assert.throws(() => loadPosts({ root, now }), /duplicate translation group/);
    await rm(path.join(directory, 'other-guide.md'));
    await symlink(file, path.join(directory, 'linked.md'));
    assert.throws(() => loadPosts({ root, now }), /cannot be symlinks/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
