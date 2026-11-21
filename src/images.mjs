import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseFragment } from 'parse5';
import { origin } from './posts.mjs';

// These slots follow the homepage's 1120px wrapper and its 980px/600px breakpoints.
const heroSizes = '(max-width: 600px) calc(100vw - 88px), (max-width: 820px) calc(93vw - 44px), (max-width: 980px) 714px, (max-width: 1152px) calc(45vw - 26px), 492px';
const wideSizes = '(max-width: 600px) calc(100vw - 88px), (max-width: 1152px) calc(100vw - 104px), 1046px';
const pairedSizes = '(max-width: 600px) calc(100vw - 88px), (max-width: 980px) calc(100vw - 104px), (max-width: 1152px) calc(50vw - 66px), 507px';
const guideSizes = '(max-width: 600px) calc(100vw - 80px), (max-width: 1012px) calc(100vw - 116px), 780px';
const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
function setAttr(node, name, value) {
  const existing = node.attrs.find(a => a.name === name);
  if (existing) existing.value = String(value); else node.attrs.push({ name, value: String(value) });
}
function walk(node, visit) { visit(node); for (const child of node.childNodes ?? []) walk(child, visit); }
function inside(node, className) {
  for (let parent = node.parentNode; parent; parent = parent.parentNode) {
    if ((attr(parent, 'class') ?? '').split(/\s+/).includes(className)) return true;
  }
  return false;
}
const local = (src, base) => `${base}${src.slice(1)}`;
function assetKey(src, base) {
  if (!src) return null;
  const url = new URL(src, origin);
  if (url.origin !== origin) return null;
  return base !== '/' && url.pathname.startsWith(base) ? `/${url.pathname.slice(base.length)}` : url.pathname;
}

export function loadImageAssets(root) {
  const file = path.join(root, 'src/image-assets.json');
  if (!existsSync(file)) return {};
  const assets = JSON.parse(readFileSync(file, 'utf8'));
  for (const [key, asset] of Object.entries(assets)) {
    if (!/^\/Assets\/[a-zA-Z0-9-]+\.(png|jpe?g)$/.test(key) || !asset.webp?.length) throw Error(`Invalid image manifest entry: ${key}`);
    const widths = new Set();
    for (const variant of [...asset.webp, asset.fallback]) {
      if (!variant || !/^\/Assets\/images\/[a-z0-9-]+\.(webp|jpe?g|png)$/.test(variant.src) || !(variant.width > 0 && variant.height > 0)) throw Error(`Invalid image variant: ${key}`);
      if (!existsSync(path.join(root, variant.src.slice(1)))) throw Error(`Missing image variant: ${variant.src}`);
    }
    for (const variant of asset.webp) {
      if (widths.has(variant.width)) throw Error(`Duplicate image width: ${key}`);
      widths.add(variant.width);
    }
  }
  return assets;
}

export function applyResponsiveImages(document, { root, base }) {
  const assets = loadImageAssets(root);
  const nodes = [];
  walk(document, node => nodes.push(node));
  const heroAssets = new Map();
  for (const node of nodes.filter(node => node.tagName === 'img')) {
    const key = assetKey(attr(node, 'src'), base), asset = assets[key];
    if (!asset || node.parentNode?.tagName === 'picture') continue;
    const hero = inside(node, 'hero');
    const logo = key === '/Assets/logo.png';
    const sizes = logo ? '(max-width: 360px) 30px, (max-width: 600px) 34px, 44px'
      : hero ? heroSizes : inside(node, 'shots') || inside(node, 'feature-captures') ? pairedSizes
      : inside(node, 'prose') ? guideSizes : wideSizes;
    const srcset = asset.webp.map(variant => `${local(variant.src, base)} ${variant.width}w`).join(', ');
    const parent = node.parentNode;
    const picture = parseFragment('<picture class="responsive-image"><source type="image/webp"></picture>').childNodes[0];
    const source = picture.childNodes[0];
    setAttr(source, 'srcset', srcset);
    setAttr(source, 'sizes', sizes);
    setAttr(node, 'src', local(asset.fallback.src, base));
    setAttr(node, 'width', asset.fallback.width);
    setAttr(node, 'height', asset.fallback.height);
    setAttr(node, 'decoding', 'async');
    setAttr(node, 'loading', hero || logo ? 'eager' : 'lazy');
    if (hero) {
      setAttr(node, 'fetchpriority', 'high');
      heroAssets.set(key, { asset, sizes, srcset });
    }
    if (asset.crop && (attr(parent, 'class') ?? '').split(/\s+/).includes('app-window')) {
      setAttr(parent, 'class', `${attr(parent, 'class')} image-optimized`);
    }
    parent.childNodes.splice(parent.childNodes.indexOf(node), 1, picture);
    picture.parentNode = parent;
    picture.childNodes.push(node);
    node.parentNode = picture;
  }

  for (const node of nodes) {
    if (node.tagName === 'link' && attr(node, 'rel') === 'preload' && attr(node, 'as') === 'image') {
      const hero = heroAssets.get(assetKey(attr(node, 'href'), base));
      if (!hero) continue;
      const candidate = hero.asset.webp.find(variant => variant.width >= hero.asset.fallback.width) ?? hero.asset.webp.at(-1);
      setAttr(node, 'href', local(candidate.src, base));
      setAttr(node, 'type', 'image/webp');
      setAttr(node, 'imagesrcset', hero.srcset);
      setAttr(node, 'imagesizes', hero.sizes);
      setAttr(node, 'fetchpriority', 'high');
    }
    if (node.tagName === 'meta' && ['og:image', 'twitter:image'].includes(attr(node, 'property') ?? attr(node, 'name'))) {
      const asset = assets[assetKey(attr(node, 'content'), base)];
      if (asset) setAttr(node, 'content', `${origin}${asset.fallback.src}`);
    }
    if (node.tagName === 'script' && attr(node, 'type') === 'application/ld+json') {
      const rewrite = value => {
        if (typeof value === 'string' && value.startsWith(`${origin}/Assets/`)) {
          const asset = assets[assetKey(value, base)];
          return asset ? `${origin}${asset.fallback.src}` : value;
        }
        if (Array.isArray(value)) return value.map(rewrite);
        if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, rewrite(child)]));
        return value;
      };
      for (const child of node.childNodes) if (child.nodeName === '#text') {
        child.value = JSON.stringify(rewrite(JSON.parse(child.value))).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
      }
    }
  }
}
