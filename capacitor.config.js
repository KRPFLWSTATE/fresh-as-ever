const { readFileSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');

const root = __dirname;

function tryLoadEnv(filename) {
  const p = resolve(root, filename);
  if (!existsSync(p)) return;
  const lines = readFileSync(p, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

tryLoadEnv('.env.local');
tryLoadEnv('.env');

const serverUrl = (process.env.CAPACITOR_SERVER_URL || '').trim();
const cleartextExplicit = process.env.CAPACITOR_ANDROID_CLEARTEXT === 'true';
const cleartext =
  cleartextExplicit || (serverUrl.startsWith('http://') && serverUrl.length > 0);

const extraAllowNav = (process.env.CAPACITOR_EXTRA_ALLOW_NAVIGATION || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const defaultAllowNavigation = [
  '*.supabase.co',
  '*.supabase.in',
  'payhere.lk',
  '*.payhere.lk',
  '*.vercel.app',
  'vercel.app',
  'basemaps.cartocdn.com',
  '*.basemaps.cartocdn.com',
  'carto.com',
  'www.openstreetmap.org',
  'openstreetmap.org',
  'nominatim.openstreetmap.org',
  'images.unsplash.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  ...extraAllowNav,
];

/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: 'com.freshasever.app',
  appName: 'Fresh As Ever',
  webDir: 'www',
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext,
        androidScheme: serverUrl.startsWith('https://') ? 'https' : 'http',
        allowNavigation: defaultAllowNavigation,
      }
    : undefined,
};

module.exports = config;
