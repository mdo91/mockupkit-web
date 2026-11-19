import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadPosts, publishingDate } from '../src/posts.mjs';

function files(directory) { return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)]); }
let checked = 0;
for (const directory of ['src', 'scripts', 'test']) for (const file of files(directory).filter(file => file.endsWith('.mjs'))) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.error || result.status !== 0) throw Error(`Syntax check failed: ${file}\n${result.stderr || result.error}`);
  checked++;
}
const dates = JSON.parse(readFileSync('src/pages.json', 'utf8'));
for (const value of Object.values(dates)) if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value > publishingDate()) throw Error('Invalid static page modification date');
const posts = loadPosts();
console.log(`Checked ${checked} JavaScript files and ${posts.length} published guides.`);
