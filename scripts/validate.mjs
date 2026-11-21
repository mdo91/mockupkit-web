import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import { loadPosts, origin } from '../src/posts.mjs';
import { basePath, imageSize, walkNodes } from '../src/render.mjs';
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
const unescapeXml = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&apos;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
function srcsetCandidates(value, label) {
  const widths = new Set();
  return value.split(',').map(candidate => {
    const match = candidate.trim().match(/^(\S+)\s+([1-9]\d*)w$/);
    fail(match, `${label}: invalid responsive image candidate`);
    const width = Number(match[2]);
    fail(Number.isSafeInteger(width) && !widths.has(width), `${label}: duplicate or invalid responsive image width`);
    widths.add(width);
    return { src: match[1], width };
  });
}
function ancestorHasClass(node, name) {
  for (let parent = node.parentNode; parent; parent = parent.parentNode) if (attributes(parent).class?.split(/\s+/).includes(name)) return true;
  return false;
}
function validAssetSignature(bytes, extension) {
  if (extension === '.webp') return bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
  if (extension === '.png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (['.jpg', '.jpeg'].includes(extension)) return bytes[0] === 0xff && bytes[1] === 0xd8;
  return true;
}

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
  const checkUrl = (href, route, { responsive = false } = {}) => {
    fail(typeof href === 'string' && href && !/[\u0000-\u0020\u007f\\]/.test(href) && !/^(?:javascript|data|vbscript):/i.test(href), `${route}: unsafe URL`);
    if (/^(?:mailto|tel):/i.test(href)) return null;
    const absolute = new URL(href, `${origin}${base}${route.slice(1)}`);
    if (absolute.origin !== origin) {
      if (responsive) fail(absolute.protocol === 'https:' && !absolute.username && !absolute.password, `${route}: unsafe responsive image URL`);
      return null;
    }
    if (responsive && base !== '/') fail(absolute.pathname.startsWith(base), `${route}: responsive image is missing output base ${base}`);
    const destination = routeFor(absolute.href);
    fail(destination && !destination.route.includes('..') && !destination.route.includes('\\'), `${route}: invalid internal URL`);
    let target = path.join(directory, destination.route);
    if (destination.route.endsWith('/')) target = path.join(target, 'index.html');
    fail(existsSync(target) && lstatSync(target).isFile(), `${route}: broken internal URL ${href}`);
    return { ...destination, target };
  };
  const edges = new Map();
  for (const [route, document] of pages) {
    const destinations = new Set();
    for (const node of nodes(document, node => ['a', 'img', 'link', 'script', 'iframe', 'source'].includes(node.tagName))) {
      const attrs = attributes(node);
      const href = attrs.href ?? attrs.src;
      const destination = href ? checkUrl(href, route) : null;
      if (node.tagName === 'a' && destination) {
        destinations.add(destination.route);
        if (destination.hash && pages.has(destination.route)) fail(nodes(pages.get(destination.route), node => attributes(node).id === destination.hash).length > 0, `${route}: missing link fragment ${href}`);
      }
      if (node.tagName === 'img' && destination?.route.startsWith('/Assets/images/')) {
        const bytes = readFileSync(destination.target), dimensions = imageSize(bytes);
        fail(validAssetSignature(bytes, path.extname(destination.target)), `${route}: image extension does not match its encoded format`);
        fail(dimensions && dimensions[0] === Number(attrs.width) && dimensions[1] === Number(attrs.height), `${route}: image dimensions differ from its file`);
      }
      for (const [setName, sizesName] of [['srcset', 'sizes'], ['imagesrcset', 'imagesizes']]) {
        if (attrs[setName] === undefined) continue;
        fail(typeof attrs[sizesName] === 'string' && attrs[sizesName].trim(), `${route}: responsive image needs ${sizesName}`);
        for (const { src, width } of srcsetCandidates(attrs[setName], route)) {
          const candidate = checkUrl(src, route, { responsive: true });
          if (!candidate) continue;
          const bytes = readFileSync(candidate.target), dimensions = imageSize(bytes);
          fail(dimensions && dimensions[0] === width, `${route}: responsive image width differs from its file`);
          fail(validAssetSignature(bytes, path.extname(candidate.target)), `${route}: image extension does not match its encoded format`);
        }
      }
    }
    const heroImages = nodes(document, node => node.tagName === 'img' && ancestorHasClass(node, 'hero') && /\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(attributes(node).src ?? '') && !/logo/i.test(attributes(node).src ?? ''));
    if (heroImages.length) {
      fail(heroImages.length === 1, `${route}: hero must have one primary image`);
      const hero = heroImages[0], attrs = attributes(hero);
      fail(attrs.loading === 'eager' && attrs.fetchpriority === 'high', `${route}: hero image must load eagerly with high priority`);
      const source = hero.parentNode?.childNodes?.find(node => node.tagName === 'source' && attributes(node).type === 'image/webp');
      fail(source, `${route}: hero needs its responsive WebP source`);
      const sourceAttrs = attributes(source);
      const preloads = nodes(document, node => node.tagName === 'link' && attributes(node).rel === 'preload' && attributes(node).as === 'image');
      fail(preloads.length === 1, `${route}: hero needs one image preload`);
      const preload = attributes(preloads[0]);
      fail(preload.type === 'image/webp' && preload.fetchpriority === 'high' && preload.imagesrcset === sourceAttrs.srcset && preload.imagesizes === sourceAttrs.sizes, `${route}: hero preload differs from its responsive image`);
      fail(srcsetCandidates(sourceAttrs.srcset, route).some(candidate => candidate.src === preload.href), `${route}: hero preload fallback is not a responsive candidate`);
    }
    edges.set(route, destinations);
  }
  const sitemap = readFileSync(path.join(directory, 'sitemap.xml'), 'utf8');
  const entries = [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>([\s\S]*?)<\/url>/g)].map(([, url, modified, images]) => ({ url: unescapeXml(url), modified, images: [...images.matchAll(/<image:image>\s*<image:loc>([^<]+)<\/image:loc>\s*<\/image:image>/g)].map(([, image]) => unescapeXml(image)) }));
  fail(entries.length === pages.size && new Set(entries.map(entry => entry.url)).size === pages.size, 'Sitemap must contain exactly the canonical public pages');
  for (const [route, document] of pages) {
    const entry = entries.find(entry => entry.url === `${origin}${route}`);
    fail(entry, `Missing sitemap canonical: ${route}`);
    const expectedImages = [...new Set(nodes(document, node => node.tagName === 'img').map(node => attributes(node).src).filter(src => /\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(src ?? '') && !/logo/i.test(src ?? '')).map(src => {
      const url = new URL(src, `${origin}${base}${route.slice(1)}`);
      if (url.origin !== origin) return null;
      return `${origin}${routeFor(url.href).route}`;
    }).filter(Boolean))];
    fail(entry.images.length === expectedImages.length && new Set(entry.images).size === expectedImages.length && expectedImages.every(image => entry.images.includes(image)), `${route}: sitemap images differ from visible image fallbacks`);
    if (expectedImages.length) fail(sitemap.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'), 'Sitemap is missing the image namespace');
    for (const image of entry.images) {
      fail(image.startsWith(`${origin}/Assets/`), `${route}: sitemap image is not a production asset URL`);
      checkUrl(image, route);
    }
  }
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
