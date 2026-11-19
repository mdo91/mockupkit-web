import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import { loadPosts, origin } from '../src/posts.mjs';
import { basePath, walkNodes } from '../src/render.mjs';
import { googleVerificationFiles, readGoogleVerificationFiles } from '../src/verification.mjs';

function files(directory) { return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(directory, entry.name);
  if (entry.isSymbolicLink()) throw Error('Built site cannot contain symlinks');
  return entry.isDirectory() ? files(file) : [file];
}); }
function attributes(node) { return Object.fromEntries((node.attrs ?? []).map(({ name, value }) => [name, value])); }
function nodes(document, predicate) { const result = []; walkNodes(document, node => { if (predicate(node)) result.push(node); }); return result; }
function text(node) { return node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join(''); }
const fail = (condition, message) => { if (!condition) throw Error(message); };

export function validate({ root = process.cwd(), directory = path.join(root, 'dist'), base = process.env.BASE_PATH || '/' } = {}) {
  base = basePath(base);
  fail(existsSync(directory) && !lstatSync(directory).isSymbolicLink(), 'Build the site before validation');
  const proofs = readGoogleVerificationFiles(root), builtProofs = readGoogleVerificationFiles(directory);
  for (const { name, bytes } of proofs) fail(builtProofs.find(proof => proof.name === name)?.bytes.equals(bytes), `${name}: built verification proof differs from its original bytes`);
  const posts = loadPosts({ root });
  const pages = new Map();
  for (const file of files(directory).filter(file => file.endsWith('.html') && !googleVerificationFiles.includes(path.relative(directory, file).split(path.sep).join('/')))) {
    const relative = path.relative(directory, file).split(path.sep).join('/');
    const route = `/${relative}`.replace(/index\.html$/, '');
    const document = parse(readFileSync(file, 'utf8'));
    pages.set(route, document);
    const meta = nodes(document, node => node.tagName === 'meta');
    const canonical = nodes(document, node => node.tagName === 'link' && attributes(node).rel === 'canonical');
    fail(canonical.length === 1 && attributes(canonical[0]).href === `${origin}${route}`, `${route}: wrong canonical URL`);
    fail(nodes(document, node => node.tagName === 'title').length === 1 && text(nodes(document, node => node.tagName === 'title')[0]).trim(), `${route}: missing title`);
    fail(meta.some(node => attributes(node).name === 'description' && attributes(node).content?.trim()), `${route}: missing description`);
    fail(!meta.some(node => ['robots', 'googlebot'].includes(attributes(node).name) && /noindex/i.test(attributes(node).content)), `${route}: published page is noindex`);
    fail(nodes(document, node => node.tagName === 'h1').length === 1, `${route}: needs exactly one page heading`);
    fail(nodes(document, node => node.tagName === 'html' && attributes(node).lang === 'en').length === 1, `${route}: incorrect document language`);
    for (const node of nodes(document, node => node.tagName === 'img')) {
      const attrs = attributes(node);
      fail(typeof attrs.alt === 'string' && attrs.alt.trim(), `${route}: image is missing alternate text`);
      fail(Number(attrs.width) > 0 && Number(attrs.height) > 0, `${route}: image is missing intrinsic dimensions`);
    }
  }
  const routeFor = href => {
    const url = new URL(href, `${origin}/`);
    if (url.origin !== origin) return null;
    let route = decodeURIComponent(url.pathname);
    if (base !== '/' && route.startsWith(base)) route = `/${route.slice(base.length)}`;
    return { route: route.replace(/index\.html$/, ''), hash: decodeURIComponent(url.hash.slice(1)) };
  };
  const edges = new Map();
  for (const [route, document] of pages) {
    const destinations = new Set();
    for (const node of nodes(document, node => ['a', 'img', 'link', 'script', 'iframe', 'source'].includes(node.tagName))) {
      const attrs = attributes(node);
      const href = attrs.href ?? attrs.src;
      if (!href) continue;
      fail(!/^(?:javascript|data|vbscript):/i.test(href), `${route}: unsafe URL`);
      if (/^(?:mailto|tel):/i.test(href)) continue;
      const absolute = new URL(href, `${origin}${base}${route.slice(1)}`);
      if (absolute.origin !== origin) continue;
      const destination = routeFor(absolute.href);
      fail(destination && !destination.route.includes('..'), `${route}: invalid internal URL`);
      let target = path.join(directory, destination.route);
      if (destination.route.endsWith('/')) target = path.join(target, 'index.html');
      fail(existsSync(target) && lstatSync(target).isFile(), `${route}: broken internal URL ${href}`);
      if (node.tagName === 'a') {
        destinations.add(destination.route);
        if (destination.hash && pages.has(destination.route)) fail(nodes(pages.get(destination.route), node => attributes(node).id === destination.hash).length > 0, `${route}: missing link fragment ${href}`);
      }
    }
    edges.set(route, destinations);
  }
  const sitemap = readFileSync(path.join(directory, 'sitemap.xml'), 'utf8');
  const entries = [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>\s*<\/url>/g)].map(([, url, modified]) => ({ url: url.replaceAll('&amp;', '&'), modified }));
  fail(entries.length === pages.size && new Set(entries.map(entry => entry.url)).size === pages.size, 'Sitemap must contain exactly the canonical public pages');
  for (const route of pages.keys()) fail(entries.some(entry => entry.url === `${origin}${route}`), `Missing sitemap canonical: ${route}`);
  for (const post of posts) {
    const route = `/blog/${post.slug}/`, document = pages.get(route);
    fail(document, `Missing published guide: ${route}`);
    fail(entries.some(entry => entry.url === `${origin}${route}` && entry.modified === post.updatedAt), `${route}: sitemap date differs from article`);
    const schemas = nodes(document, node => node.tagName === 'script' && attributes(node).type === 'application/ld+json').flatMap(node => {
      const data = JSON.parse(text(node));
      return data['@graph'] ?? [data];
    });
    const article = schemas.find(schema => schema['@type'] === 'BlogPosting');
    fail(article && article.datePublished === post.publishedAt && article.dateModified === post.updatedAt && article.headline === post.title && article.mainEntityOfPage === `${origin}${route}`, `${route}: article schema differs from visible content`);
    fail(nodes(document, node => node.tagName === 'meta' && attributes(node).name === 'post-source-sha256' && attributes(node).content === post.sourceHash).length === 1, `${route}: source identity differs from the approved guide`);
    fail(schemas.some(schema => schema['@type'] === 'BreadcrumbList'), `${route}: missing breadcrumbs`);
    fail(text(document).includes('By Damas Technologies'), `${route}: missing organization byline`);
    fail((edges.get('/')?.has(route) || [...(edges.get('/') ?? [])].some(link => edges.get(link)?.has(route))), `${route}: not discoverable within two links from the homepage`);
  }
  fail(!existsSync(path.join(directory, '__mockupkit_missing_page__/index.html')), 'The build must not synthesize missing routes');
  fail(readFileSync(path.join(directory, 'robots.txt'), 'utf8').includes(`Sitemap: ${origin}/sitemap.xml`), 'Missing robots sitemap reference');
  fail(readFileSync(path.join(directory, 'CNAME'), 'utf8').trim() === new URL(origin).hostname, 'Wrong production hostname');
  console.log(`Validated ${pages.size} canonical pages, ${posts.length} guides, links, metadata, schemas, and sitemap at base ${base}.`);
  return { pages: [...pages.keys()], guides: posts.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) validate();
