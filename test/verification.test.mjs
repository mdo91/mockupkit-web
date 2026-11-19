import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, symlink, link, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { googleVerificationFiles, validateVerificationBytes, readGoogleVerificationFiles } from '../src/verification.mjs';

const name = googleVerificationFiles[0], content = Buffer.from(`google-site-verification: ${name}`);

test('only the explicit self-named Google proof is accepted without rewriting its bytes', () => {
  for (const bytes of [content, Buffer.concat([content, Buffer.from('\n')]), Buffer.concat([content, Buffer.from('\r\n')])]) assert.equal(validateVerificationBytes(name, bytes), bytes);
  for (const bytes of [Buffer.from('<html>verification</html>'), Buffer.from('google-site-verification: google0000000000000000.html'), Buffer.concat([content, Buffer.from('\n<script>unexpected</script>')]), Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), content])]) assert.throws(() => validateVerificationBytes(name, bytes), /unexpected Google verification content/);
  for (const other of ['google0000000000000000.html', `../${name}`, `folder/${name}`]) assert.throws(() => validateVerificationBytes(other, content), /Unapproved/);
});

test('Google proof reads require real, non-linked files and never collect other root files', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'mockupkit-proof-'));
  try {
    const file = path.join(root, name), other = path.join(root, 'unrelated.html');
    await writeFile(file, content);
    await writeFile(other, '<h1>Not an ownership proof</h1>');
    assert.deepEqual(readGoogleVerificationFiles(root), [{ name, bytes: content }]);
    await rm(file);
    await symlink(other, file);
    assert.throws(() => readGoogleVerificationFiles(root), /bounded regular file/);
    await rm(file);
    await writeFile(other, content);
    await link(other, file);
    assert.throws(() => readGoogleVerificationFiles(root), /bounded regular file/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
