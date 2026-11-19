import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Marked } from 'marked';
import { parse, serialize } from 'parse5';
import { origin, parseSwatches } from './posts.mjs';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = value => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
export function basePath(value = '/') {
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(value)) throw Error('BASE_PATH must be an absolute slash-terminated path');
  return value;
}
export function localUrl(url, base = '/') {
  if (url.startsWith('/') && !url.startsWith('//')) return `${base}${url.slice(1)}`;
  return url;
}
const prettyDate = date => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', dateStyle: 'long' }).format(new Date(`${date}T12:00:00Z`));
const guideUrl = post => `/blog/${post.slug}/`;

export function markdown(post, base = '/') {
  const headingIds = new Map();
  const renderer = {
    heading({ tokens, depth, text }) {
      const id = text.normalize('NFKD').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
      const count = headingIds.get(id) ?? 0;
      headingIds.set(id, count + 1);
      return `<h${depth} id="${escapeHtml(id + (count ? `-${count + 1}` : ''))}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
    },
    link({ href, title, tokens }) {
      return `<a href="${escapeHtml(localUrl(href, base))}"${title ? ` title="${escapeHtml(title)}"` : ''}>${this.parser.parseInline(tokens)}</a>`;
    },
    image({ href, title, text }) {
      return `<img src="${escapeHtml(localUrl(href, base))}" alt="${escapeHtml(text)}" loading="lazy"${title ? ` title="${escapeHtml(title)}"` : ''}>`;
    },
    code({ text, lang }) {
      if (lang !== 'swatches') return `<pre><code${lang ? ` class="language-${escapeHtml(lang)}"` : ''}>${escapeHtml(text)}\n</code></pre>\n`;
      return `<div class="swatch-grid">${parseSwatches(text).map(({ name, start, end }) => `<figure class="swatch-card"><div class="swatch-preview" aria-hidden="true" style="background:${end ? `linear-gradient(160deg, ${start}, ${end})` : start}"></div><figcaption><strong>${escapeHtml(name)}</strong><br><code>${start}${end ? ` → ${end}` : ''}</code></figcaption></figure>`).join('')}</div>\n`;
    }
  };
  return new Marked({ renderer }).parse(post.body, { async: false });
}

function graph(post) {
  const organization = { '@type': 'Organization', '@id': `${origin}/#organization`, name: 'Damas Technologies', url: `${origin}/`, logo: { '@type': 'ImageObject', url: `${origin}/Assets/logo.png` } };
  return { '@context': 'https://schema.org', '@graph': [organization, {
    '@type': 'BlogPosting', '@id': `${origin}${guideUrl(post)}#article`, headline: post.title, description: post.description,
    inLanguage: 'en', datePublished: post.publishedAt, dateModified: post.updatedAt,
    author: { '@id': organization['@id'] }, publisher: { '@id': organization['@id'] },
    image: [`${origin}/Assets/asset-1.png`], mainEntityOfPage: `${origin}${guideUrl(post)}`, url: `${origin}${guideUrl(post)}`
  }, {
    '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${origin}/blog/` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${origin}${guideUrl(post)}` }
    ]
  }] };
}

function shell({ title, description, canonical, body, schema, base, sourceHash }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${escapeHtml(canonical)}">
<link rel="icon" href="${base}favicon.ico" sizes="any"><link rel="apple-touch-icon" href="${base}Assets/apple-touch-icon.png">
<meta name="theme-color" content="#fff9ef"><link rel="stylesheet" href="${base}Assets/blog.css">
${sourceHash ? `<meta name="post-source-sha256" content="${sourceHash}">` : ''}
<meta property="og:type" content="${canonical === `${origin}/blog/` ? 'website' : 'article'}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:image" content="${origin}/Assets/asset-1.png"><meta property="og:site_name" content="Mockup Kit">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${origin}/Assets/asset-1.png">
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-18339507708"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','AW-18339507708');</script>
<script type="application/ld+json">${json(schema)}</script></head>
<body><a class="skip-link" href="#main">Skip to content</a><div class="pattern" aria-hidden="true"></div><span class="shape s1" aria-hidden="true"></span><span class="shape s2" aria-hidden="true"></span><span class="shape s3" aria-hidden="true"></span>
<header><div class="wrap nav"><a class="brand" href="${base}"><img src="${base}Assets/logo.png" alt="Mockup Kit logo"><span>Mockup Kit</span></a><nav aria-label="Main navigation"><a class="back-link" href="${base}blog/">All guides</a> <a class="back-link" href="${base}">Home</a></nav></div></header>
<main id="main" class="wrap">${body}</main><footer><div class="wrap"><p><a href="${base}support.html">Support</a> · <a href="${base}blog/">Blog</a> · <a href="${base}editorial-policy.html">Editorial policy</a> · <a href="${base}terms-of-use.html">Terms of Use</a> · <a href="${base}privacy-policy.html">Privacy Policy</a></p><p>© ${new Date().getUTCFullYear()} Damas Technologies. All rights reserved.</p></div></footer></body></html>`;
}

export function renderPost(post, posts, base = '/') {
  const related = post.related.map(slug => posts.find(p => p.slug === slug));
  const body = `<article class="doc prose"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${base}">Home</a> / <a href="${base}blog/">Blog</a></nav>
<h1>${escapeHtml(post.title)}</h1><p class="meta">By <a href="${base}editorial-policy.html">Damas Technologies</a> · Published <time datetime="${post.publishedAt}">${prettyDate(post.publishedAt)}</time>${post.updatedAt !== post.publishedAt ? ` · Updated <time datetime="${post.updatedAt}">${prettyDate(post.updatedAt)}</time>` : ''}</p>
${markdown(post, base)}
<section class="sources" aria-labelledby="sources"><h2 id="sources">Sources and further reading</h2><ul>${post.sources.map(s => `<li><a href="${escapeHtml(s.url)}">${escapeHtml(s.title)}</a></li>`).join('')}</ul></section>
<aside class="cta"><h2>Compose your App Store artwork on Mac</h2><p>Try one selected screenshot or creative export free. Premium unlocks unlimited selected exports and Export All. Projects remain available during the current app session.</p><a class="read-link" href="https://apps.apple.com/app/id6784220988">Download on the Mac App Store</a></aside>
${related.length ? `<section class="related"><h2>Keep reading</h2><ul>${related.map(p => `<li><a href="${base}blog/${p.slug}/">${escapeHtml(p.title)}</a></li>`).join('')}</ul></section>` : ''}</article>`;
  return shell({ title: `${post.title} | Mockup Kit`, description: post.description, canonical: `${origin}${guideUrl(post)}`, body, schema: graph(post), base, sourceHash: post.sourceHash });
}

export function postCards(posts, base = '/', limit = posts.length) {
  return posts.slice(0, limit).map(post => `<article class="post-card"><h2><a href="${base}blog/${post.slug}/">${escapeHtml(post.title)}</a></h2><p class="meta"><time datetime="${post.updatedAt}">${prettyDate(post.updatedAt)}</time></p><p class="excerpt">${escapeHtml(post.description)}</p><a class="read-link" href="${base}blog/${post.slug}/">Read the guide</a></article>`).join('\n');
}
export function renderIndex(posts, base = '/') {
  const description = 'Practical guides for composing, localizing, and exporting App Store screenshot mockups and creative artwork on Mac.';
  return shell({ title: 'Blog — App Store Artwork Guides | Mockup Kit', description, canonical: `${origin}/blog/`, body: `<section class="doc"><h1>App Store artwork guides</h1><p class="lead">${description}</p><div class="posts">${postCards(posts, base)}</div></section>`, schema: { '@context': 'https://schema.org', '@type': 'Blog', name: 'Mockup Kit Blog', url: `${origin}/blog/`, description, inLanguage: 'en', publisher: { '@type': 'Organization', name: 'Damas Technologies', url: `${origin}/` } }, base });
}

export function walkNodes(node, visitor) {
  visitor(node);
  for (const child of node.childNodes ?? []) walkNodes(child, visitor);
}
function attr(node, name) { return node.attrs?.find(a => a.name === name)?.value; }
function setAttr(node, name, value) {
  const entry = node.attrs?.find(a => a.name === name);
  if (entry) entry.value = String(value); else node.attrs.push({ name, value: String(value) });
}
export function imageSize(bytes) {
  if (bytes.length > 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    for (let offset = 2; offset + 9 < bytes.length;) {
      if (bytes[offset] !== 0xff) break;
      const marker = bytes[offset + 1], length = bytes.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) return [bytes.readUInt16BE(offset + 7), bytes.readUInt16BE(offset + 5)];
      if (length < 2) break;
      offset += 2 + length;
    }
  }
  if (bytes.subarray(0, 2000).toString('utf8').includes('<svg')) {
    const source = bytes.toString('utf8');
    const viewBox = source.match(/\bviewBox=["']([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)["']/);
    if (viewBox) return [Number(viewBox[3]), Number(viewBox[4])];
  }
  return null;
}

export function prepareDocument(html, { route, base = '/', root = process.cwd(), posts = null }) {
  const document = parse(html);
  if (posts) {
    walkNodes(document, node => {
      if (node.tagName === 'section' && attr(node, 'id') === 'blog') {
        const replacement = parse(`<section id="blog" class="section"><div class="wrap panel"><h2>From the blog</h2><p class="sub">Practical App Store artwork guides for Mac.</p><div class="posts">${postCards(posts, '/', 3).replaceAll('<h2>', '<h3>').replaceAll('</h2>', '</h3>')}</div><p><a href="/blog/">Browse all guides</a></p></div></section>`);
        let section;
        walkNodes(replacement, candidate => { if (candidate.tagName === 'section') section = candidate; });
        node.childNodes = section.childNodes;
        for (const child of node.childNodes) child.parentNode = node;
      }
    });
  }
  walkNodes(document, node => {
    if (!node.attrs) return;
    for (const attribute of node.attrs) {
      if (!['href', 'src', 'poster'].includes(attribute.name) || !attribute.value || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(attribute.value)) continue;
      const resolved = new URL(attribute.value, `${origin}${route}`);
      if (resolved.pathname.endsWith('/index.html')) resolved.pathname = resolved.pathname.slice(0, -10);
      attribute.value = `${base}${resolved.pathname.slice(1)}${resolved.search}${resolved.hash}`;
    }
    if (node.tagName === 'img') {
      const src = attr(node, 'src');
      if (!src?.startsWith(`${base}Assets/`)) return;
      const file = path.resolve(root, src.slice(base.length));
      if (!file.startsWith(`${path.resolve(root, 'Assets')}${path.sep}`)) throw Error('Unsafe image path');
      const dimensions = imageSize(readFileSync(file));
      if (dimensions?.every(n => n > 0 && Number.isFinite(n))) {
        setAttr(node, 'width', dimensions[0]); setAttr(node, 'height', dimensions[1]);
        if (dimensions[1] > dimensions[0] * 1.25) setAttr(node, 'class', `${attr(node, 'class') ?? ''} portrait-image`.trim());
      }
    }
  });
  return serialize(document);
}
