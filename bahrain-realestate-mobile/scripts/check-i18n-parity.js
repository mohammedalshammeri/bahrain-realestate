/*
  Checks that src/i18n/en.json and src/i18n/ar.json have the same key shape.
  Exits with code 1 if keys are missing in either file.

  Usage:
    node scripts/check-i18n-parity.js
*/

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const enPath = path.join(root, 'src', 'i18n', 'en.json');
const arPath = path.join(root, 'src', 'i18n', 'ar.json');

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function collectKeys(obj, prefix = '') {
  const keys = new Set();

  function walk(node, base) {
    if (!isPlainObject(node)) {
      if (base) keys.add(base);
      return;
    }

    const entries = Object.entries(node);
    if (entries.length === 0) {
      if (base) keys.add(base);
      return;
    }

    for (const [k, v] of entries) {
      const next = base ? `${base}.${k}` : k;
      if (isPlainObject(v)) {
        walk(v, next);
      } else {
        keys.add(next);
      }
    }
  }

  walk(obj, prefix);
  return keys;
}

function diffKeys(a, b) {
  const missing = [];
  for (const k of a) {
    if (!b.has(k)) missing.push(k);
  }
  return missing.sort();
}

try {
  const en = loadJson(enPath);
  const ar = loadJson(arPath);

  const enKeys = collectKeys(en);
  const arKeys = collectKeys(ar);

  const missingInAr = diffKeys(enKeys, arKeys);
  const missingInEn = diffKeys(arKeys, enKeys);

  let hasError = false;

  if (missingInAr.length) {
    hasError = true;
    console.log(`\nMissing in ar.json (${missingInAr.length}):`);
    for (const k of missingInAr) console.log(`- ${k}`);
  }

  if (missingInEn.length) {
    hasError = true;
    console.log(`\nMissing in en.json (${missingInEn.length}):`);
    for (const k of missingInEn) console.log(`- ${k}`);
  }

  if (!hasError) {
    console.log('OK: en.json and ar.json keys match.');
    process.exit(0);
  }

  process.exit(1);
} catch (err) {
  console.error('Failed to check i18n parity:', err);
  process.exit(1);
}
