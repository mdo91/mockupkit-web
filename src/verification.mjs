import { lstatSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Publishing an ownership proof can grant Google Search Console owner access.
// Add or replace entries only after the intended account's approval is recorded.
export const googleVerificationFiles = Object.freeze(['google57df504ec2b74253.html']);

export function validateVerificationBytes(name, bytes) {
  if (!googleVerificationFiles.includes(name) || !/^google[a-f0-9]{16}\.html$/.test(name) || !Buffer.isBuffer(bytes)) throw Error('Unapproved Google verification file');
  const expected = Buffer.from(`google-site-verification: ${name}`, 'utf8');
  if (![expected, Buffer.concat([expected, Buffer.from('\n')]), Buffer.concat([expected, Buffer.from('\r\n')])].some(value => value.equals(bytes))) throw Error(`${name}: unexpected Google verification content`);
  return bytes;
}

export function readGoogleVerificationFiles(root) {
  return googleVerificationFiles.map(name => {
    const file = path.join(root, name), info = lstatSync(file);
    if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1 || info.size > 512) throw Error(`${name}: verification proof must be a bounded regular file`);
    return { name, bytes: validateVerificationBytes(name, readFileSync(file)) };
  });
}
