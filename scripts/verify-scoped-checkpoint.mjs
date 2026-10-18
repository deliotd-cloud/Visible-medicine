// Verify only the copied before/after bytes of a local scoped checkpoint.
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {lstat,readFile} from 'node:fs/promises';
import {isAbsolute,join,resolve,win32} from 'node:path';
import {pathToFileURL} from 'node:url';

const hex = /^[0-9a-f]{64}$/;
const fail = code => { throw new Error(code); };

function canonicalPath(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') ||
      value.includes(':') || value.includes('\0') || isAbsolute(value) ||
      win32.isAbsolute(value) || value.split('/').some(s => !s || s === '.' || s === '..')) {
    fail('invalid-path');
  }
  for (const segment of value.split('/')) {
    if (/[\x00-\x1f\x7f<>"|?*]/.test(segment) || /[. ]$/.test(segment) ||
        /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(segment)) fail('invalid-path');
  }
  return value;
}

async function regularPath(root, parts) {
  let current = root;
  for (let i = 0; i < parts.length; i++) {
    current = join(current, parts[i]);
    let entry;
    try { entry = await lstat(current); }
    catch { fail('missing-or-inaccessible-file'); }
    if (entry.isSymbolicLink()) fail('linked-path');
    if (i < parts.length - 1 ? !entry.isDirectory() : !entry.isFile()) {
      fail('wrong-file-type');
    }
  }
  return current;
}

async function digest(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

export async function verifyScopedCheckpoint(directory) {
  if (typeof directory !== 'string' || !directory) fail('checkpoint-directory-required');
  const root = resolve(directory);
  const rootStat = await lstat(root).catch(() => fail('missing-checkpoint-directory'));
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) fail('invalid-checkpoint-directory');
  const manifestPath = await regularPath(root, ['checkpoint.json']);
  let checkpoint;
  try { checkpoint = JSON.parse(await readFile(manifestPath, 'utf8')); }
  catch { fail('invalid-checkpoint-json'); }
  if (!checkpoint || !Array.isArray(checkpoint.files) || checkpoint.files.length === 0) {
    fail('invalid-files-array');
  }
  const seen = new Set();
  let copies = 0;
  for (const row of checkpoint.files) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) fail('invalid-file-record');
    const path = canonicalPath(row.path);
    const alias = path.toLowerCase(); // Conservative on every platform: Windows paths alias by case.
    if (seen.has(alias)) fail('duplicate-path');
    seen.add(alias);
    if (!Object.hasOwn(row, 'before') || !Object.hasOwn(row, 'after') ||
        (row.before !== null && (typeof row.before !== 'string' || !hex.test(row.before))) ||
        (row.after !== null && (typeof row.after !== 'string' || !hex.test(row.after))) ||
        (row.before === null && row.after === null)) fail('invalid-file-hash');
    for (const side of ['before', 'after']) {
      if (row[side] === null) continue;
      const file = await regularPath(root, [side, ...path.split('/')]);
      if (await digest(file) !== row[side]) fail('hash-mismatch');
      copies++;
    }
  }
  return {kind:'scoped-checkpoint-integrity', verified:true, files:seen.size,
    copies, fullRestoreVerified:false, remoteBackupVerified:false};
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.length !== 3) fail('expected-one-checkpoint-directory');
    console.log(JSON.stringify(await verifyScopedCheckpoint(process.argv[2])));
  } catch (error) {
    console.error(JSON.stringify({kind:'scoped-checkpoint-integrity', verified:false,
      error:error.message, fullRestoreVerified:false, remoteBackupVerified:false}));
    process.exitCode = 1;
  }
}
