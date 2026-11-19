import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'acorn';
import { loadPosts, publishingDate } from '../src/posts.mjs';

function files(directory) { return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)]); }

// Parse without evaluating modules or invoking a child process. The pinned
// parser keeps this check available inside the production networkless sandbox.
export function checkModuleSyntax(source, file = '<module>') {
  try {
    parse(source, { ecmaVersion: 'latest', sourceType: 'module', locations: true, allowHashBang: true });
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    const location = error.loc ? `:${error.loc.line}:${error.loc.column + 1}` : '';
    throw new SyntaxError(`Syntax check failed: ${file}${location}: ${error.message}`, { cause: error });
  }
}

export function checkWebsite({ root = process.cwd(), now = new Date() } = {}) {
  let checked = 0;
  for (const directory of ['src', 'scripts', 'test']) for (const file of files(path.join(root, directory)).filter(file => file.endsWith('.mjs'))) {
    checkModuleSyntax(readFileSync(file, 'utf8'), path.relative(root, file));
    checked++;
  }
  const dates = JSON.parse(readFileSync(path.join(root, 'src/pages.json'), 'utf8'));
  for (const value of Object.values(dates)) if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value > publishingDate(now)) throw Error('Invalid static page modification date');
  const posts = loadPosts({ root, now });
  return { checked, posts: posts.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkWebsite();
  console.log(`Checked ${result.checked} JavaScript files and ${result.posts} published guides.`);
}
