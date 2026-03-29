const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const mobilePath = path.join(root, 'bahrain-realestate-mobile');
const frontendPath = path.join(root, 'bahrain-realestate-frontend-admin-dashboard');
const backendPath = path.join(root, 'bahrain-realestate-backend');

function walk(dir, exts = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const full = path.join(dir, it.name);
    if (it.isDirectory()) {
      if (it.name === 'node_modules' || it.name === '.next' || it.name === 'dist') continue;
      files.push(...walk(full, exts));
    } else if (exts.includes(path.extname(it.name))) {
      files.push(full);
    }
  }
  return files;
}

function extractKeysFromFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const keys = new Set();
  const regex = /t\(\s*['\"]([a-zA-Z0-9_\-\.]+)['\"]\s*[,)]/g;
  let m;
  while ((m = regex.exec(content))) {
    keys.add(m[1]);
  }
  return keys;
}

function deepSet(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (i === parts.length - 1) {
      cur[p] = cur[p] === undefined ? value : cur[p];
    } else {
      if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
      cur = cur[p];
    }
  }
}

function main() {
  const scanPaths = [];
  if (fs.existsSync(mobilePath)) scanPaths.push(mobilePath);
  if (fs.existsSync(frontendPath)) scanPaths.push(frontendPath);
  if (fs.existsSync(backendPath)) scanPaths.push(backendPath);

  const allFiles = [];
  for (const p of scanPaths) {
    allFiles.push(...walk(p));
  }

  const allKeys = new Set();
  for (const f of allFiles) {
    try {
      const keys = extractKeysFromFile(f);
      keys.forEach(k => allKeys.add(k));
    } catch (e) {}
  }

  // Load mobile i18n files if exist
  const mobileI18nDir = path.join(mobilePath, 'src', 'i18n');
  if (!fs.existsSync(mobileI18nDir)) {
    console.log('Mobile i18n dir not found:', mobileI18nDir);
    return;
  }
  const enFile = path.join(mobileI18nDir, 'en.json');
  const arFile = path.join(mobileI18nDir, 'ar.json');
  if (!fs.existsSync(enFile) || !fs.existsSync(arFile)) {
    console.log('Translation files missing');
    return;
  }

  const en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
  const ar = JSON.parse(fs.readFileSync(arFile, 'utf8'));

  // flatten keys from en
  const existingKeys = new Set();
  function collect(obj, prefix=''){
    for (const k of Object.keys(obj)){
      const val = obj[k];
      const pathKey = prefix ? `${prefix}.${k}` : k;
      if (val && typeof val === 'object') collect(val, pathKey);
      else existingKeys.add(pathKey);
    }
  }
  collect(en);

  const missing = [];
  for (const k of allKeys) {
    if (!existingKeys.has(k)) missing.push(k);
  }

  if (!missing.length) {
    console.log('No missing translation keys found.');
    return;
  }

  console.log('Missing keys:', missing.length);
  missing.forEach(k => console.log(' -', k));

  // Patch en and ar by adding placeholder values
  for (const k of missing) {
    const englishPlaceholder = k.split('.').slice(-1)[0].replace(/[_\-]/g, ' ');
    deepSet(en, k, englishPlaceholder);
    deepSet(ar, k, englishPlaceholder); // leave Arabic placeholder same for now
  }

  fs.writeFileSync(enFile, JSON.stringify(en, null, 2), 'utf8');
  fs.writeFileSync(arFile, JSON.stringify(ar, null, 2), 'utf8');

  console.log('Patched en.json and ar.json with', missing.length, 'keys.');
}

main();
