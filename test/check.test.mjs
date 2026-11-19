import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { checkModuleSyntax, checkWebsite } from '../scripts/check.mjs';
import { metadata, source } from './fixtures.mjs';

test('in-process syntax validation accepts modern ESM without importing or executing it', () => {
  assert.doesNotThrow(() => checkModuleSyntax(`#!/usr/bin/env node
import missing from './this-module-is-not-resolved.mjs';
import data from './not-loaded.json' with { type: 'json' };
export const directory = import.meta.dirname;
const result = await Promise.resolve(missing?.value ?? data);
export default result;
throw new Error('Syntax checking must not execute this module');
`, 'fixture.mjs'));
});

test('malformed modules, non-module returns, and invalid ESM bindings fail with file locations', () => {
  for (const input of ['export const broken = ;', 'return 1;', 'import { value } from "./x.mjs"; const value = 2;', 'await function () { await Promise.resolve(); };']) {
    assert.throws(() => checkModuleSyntax(input, 'malformed.mjs'), error => error instanceof SyntaxError && /malformed\.mjs:1:\d+/.test(error.message));
  }
});

test('the website check validates source syntax and guide content while child-process APIs are unavailable', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'mockupkit-check-'));
  try {
    for (const directory of ['src', 'scripts', 'test', 'content/guides/en']) await mkdir(path.join(root, directory), { recursive: true });
    await writeFile(path.join(root, 'src/pages.json'), JSON.stringify({ '/': '2026-11-19' }));
    const moduleFile = path.join(root, 'src/fixture.mjs');
    await writeFile(moduleFile, 'import value from "./not-executed.mjs"; export const result = await value;');
    const guide = path.join(root, `content/guides/en/${metadata.slug}.md`);
    await writeFile(guide, source());
    for (const name of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) mock.method(childProcess, name, () => { throw Error('Child processes are unavailable in the sandbox'); });
    syncBuiltinESMExports();
    const options = { root, now: new Date('2026-11-19T12:00:00Z') };
    assert.deepEqual(checkWebsite(options), { checked: 1, posts: 1 });
    await writeFile(moduleFile, 'export const broken = ;');
    assert.throws(() => checkWebsite(options), /Syntax check failed: src\/fixture\.mjs/);
    await writeFile(moduleFile, 'export const valid = import.meta.url;');
    await writeFile(guide, source({ ...metadata, updatedAt: '2026-07-19' }));
    assert.throws(() => checkWebsite(options), /updated before publication/);
  } finally {
    mock.restoreAll();
    syncBuiltinESMExports();
    await rm(root, { recursive: true, force: true });
  }
});
