#!/usr/bin/env node
/**
 * Lists every Next App Router page file for WebView QA matrix (plan Phase 6r).
 * Run: npm run cap:list-routes
 */
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = join(scriptsDir, '..');
const appDir = join(projectRoot, 'src', 'app');

async function walk(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      await walk(p, out);
    } else if (e.isFile() && /^page\.(js|jsx|ts|tsx)$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

/** Rough URL path from .../src/app/.../page.js (route groups omitted). */
function filePathToRoute(absPath) {
  const fromApp = relative(appDir, absPath).replace(/\\/g, '/');
  if (/^page\.(js|jsx|ts|tsx)$/.test(fromApp)) return '/';
  const dir = fromApp.replace(/\/page\.(js|jsx|ts|tsx)$/, '');
  if (!dir) return '/';
  const segments = dir.split('/').filter((s) => !(s.startsWith('(') && s.endsWith(')')));
  return '/' + segments.join('/');
}

const files = (await walk(appDir)).sort();
console.log(`Found ${files.length} page files under src/app:\n`);
for (const f of files) {
  const rel = relative(projectRoot, f).replace(/\\/g, '/');
  console.log(`${rel}\t${filePathToRoute(f)}`);
}
