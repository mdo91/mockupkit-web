import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parse } from 'yaml';
import { marked } from 'marked';

export const origin = 'https://mockupkits.com';
export const publishingTimeZone = 'Europe/Istanbul';
export const features = ['screenshot-mockups', 'headers-search-assets', 'localization-export', 'image-finishing'];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: publishingTimeZone, year: 'numeric', month: '2-digit', day: '2-digit' });

export function publishingDate(now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw Error('Invalid publishing clock');
  const parts = Object.fromEntries(formatter.formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function safeUrl(value, { image = false } = {}) {
  if (typeof value !== 'string' || !value || /[\s\u0000-\u001f\u007f\\]/u.test(value)) return false;
  if (image) return /^\/Assets\/[a-zA-Z0-9_./%-]+$/.test(value) && !decodePath(value).includes('\\') && !decodePath(value).split('/').some(p => p === '.' || p === '..') && !/%2f|%5c/i.test(value);
  if (value.startsWith('#')) return true;
  if (value.startsWith('/') && !value.startsWith('//')) return !decodePath(value).split(/[/?#]/).some(p => p === '.' || p === '..') && !/%2f|%5c/i.test(value);
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port;
  } catch { return false; }
}
function decodePath(value) { try { return decodeURIComponent(value); } catch { return '\\'; } }
function requiredString(metadata, key, file) {
  if (typeof metadata[key] !== 'string' || !metadata[key].trim() || /[\u0000-\u001f\u007f]/.test(metadata[key])) throw Error(`${file}: invalid ${key}`);
  return metadata[key].trim();
}
function date(value, file, key) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error(`${file}: invalid ${key}`);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw Error(`${file}: invalid ${key}`);
}

export function parsePost(source, file, now = new Date()) {
  if (typeof source !== 'string' || Buffer.byteLength(source) > 75000) throw Error(`${file}: guide is too large`);
  if (typeof file !== 'string' || file.includes('\\') || file.split('/').includes('..')) throw Error('Invalid guide path');
  const parts = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!parts) throw Error(`${file}: missing YAML metadata`);
  const metadata = parse(parts[1], { maxAliasCount: 0, uniqueKeys: true });
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw Error(`${file}: invalid metadata`);
  const allowed = new Set(['title', 'description', 'slug', 'locale', 'publishedAt', 'updatedAt', 'status', 'primaryQuery', 'topics', 'sources', 'related', 'translationKey']);
  if (Object.keys(metadata).some(key => !allowed.has(key))) throw Error(`${file}: unknown metadata field`);
  const result = {};
  for (const key of ['title', 'description', 'slug', 'locale', 'publishedAt', 'updatedAt', 'primaryQuery', 'translationKey']) result[key] = requiredString(metadata, key, file);
  if (!slugPattern.test(result.slug) || !slugPattern.test(result.translationKey)) throw Error(`${file}: invalid slug or translationKey`);
  if (result.locale !== 'en') throw Error(`${file}: unsupported locale`);
  if (!['published', 'draft'].includes(metadata.status)) throw Error(`${file}: invalid status`);
  result.status = metadata.status;
  for (const key of ['publishedAt', 'updatedAt']) date(result[key], file, key);
  if (result.updatedAt < result.publishedAt) throw Error(`${file}: updated before publication`);
  if (result.publishedAt > publishingDate(now) || result.updatedAt > publishingDate(now)) throw Error(`${file}: future article date`);
  for (const key of ['topics', 'related']) {
    if (!Array.isArray(metadata[key]) || !metadata[key].every(v => typeof v === 'string' && slugPattern.test(v)) || new Set(metadata[key]).size !== metadata[key].length) throw Error(`${file}: invalid ${key}`);
    result[key] = metadata[key];
  }
  if (!result.topics.length || result.topics.some(topic => !features.includes(topic))) throw Error(`${file}: unsupported topic`);
  if (result.related.includes(result.slug)) throw Error(`${file}: related guide refers to itself`);
  if (!Array.isArray(metadata.sources) || !metadata.sources.length || !metadata.sources.every(s => s && typeof s.title === 'string' && s.title.trim() && safeUrl(s.url) && s.url.startsWith('https://'))) throw Error(`${file}: HTTPS sources required`);
  result.sources = metadata.sources.map(({ title, url }) => ({ title: title.trim(), url }));
  if (!parts[2].trim()) throw Error(`${file}: empty guide`);
  marked.walkTokens(marked.lexer(parts[2]), token => {
    if (token.type === 'html') throw Error(`${file}: raw HTML is not allowed in guides`);
    if ((token.type === 'link' || token.type === 'image') && !safeUrl(token.href, { image: token.type === 'image' })) throw Error(`${file}: unsupported link or image URL`);
    if (token.type === 'image' && !token.text?.trim()) throw Error(`${file}: images need descriptive alternate text`);
    if (token.type === 'heading' && token.depth === 1) throw Error(`${file}: use metadata for the page heading`);
    if (token.type === 'code' && token.lang === 'swatches') parseSwatches(token.text, file);
  });
  return { ...result, body: parts[2], file, sourceHash: createHash('sha256').update(source).digest('hex') };
}

export function parseSwatches(source, file = 'swatches') {
  const rows = source.trim().split('\n').map(row => row.trim()).filter(Boolean);
  if (!rows.length || rows.length > 24) throw Error(`${file}: invalid swatch count`);
  return rows.map(row => {
    const match = row.match(/^([^|\n]{1,80})\s*\|\s*(#[a-f\d]{6})(?:\s*(?:->|→)\s*(#[a-f\d]{6}))?$/i);
    if (!match) throw Error(`${file}: invalid swatch`);
    return { name: match[1].trim(), start: match[2].toUpperCase(), end: match[3]?.toUpperCase() ?? null };
  });
}

function walk(directory) {
  if (lstatSync(directory).isSymbolicLink()) throw Error('Guide directory cannot be a symlink');
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw Error('Guide sources cannot be symlinks');
    if (entry.isDirectory()) return walk(file);
    return entry.isFile() && entry.name.endsWith('.md') ? [file] : [];
  });
}

export function loadPosts({ root = process.cwd(), now = new Date() } = {}) {
  const directory = path.resolve(root, 'content/guides');
  const all = walk(directory).map(file => {
    const relative = path.relative(root, file).split(path.sep).join('/');
    const post = parsePost(readFileSync(file, 'utf8'), relative, now);
    if (path.relative(directory, file).split(path.sep).join('/') !== `${post.locale}/${post.slug}.md`) throw Error(`${relative}: path does not match metadata`);
    return post;
  });
  const published = all.filter(post => post.status === 'published');
  const seen = new Set();
  for (const post of all) {
    const identity = `${post.locale}/${post.translationKey}`;
    if (seen.has(identity)) throw Error(`${post.file}: duplicate translation group`);
    seen.add(identity);
  }
  for (const post of published) {
    if (post.related.some(slug => !published.some(other => other.slug === slug))) throw Error(`${post.file}: related guide is missing or a draft`);
  }
  return published.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.slug.localeCompare(b.slug));
}
