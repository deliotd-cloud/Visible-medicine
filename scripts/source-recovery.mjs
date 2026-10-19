import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { promises as fs, constants } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const forbiddenSegments = new Set(['.git', 'node_modules', '.wrangler', '.local', '.next', 'dist', 'build', 'out', 'coverage']);
const forbiddenNames = new Set(['id_rsa', 'id_ed25519', 'credentials', 'credentials.json', 'secrets.json']);
const forbiddenExtensions = /\.(?:nii(?:\.gz)?|nrrd|mha|mhd|dcm|dicom|ima|vti|vtu|vtk|h5|hdf5|db|db3|sqlite(?:3)?|mdb|accdb|pem|key|p12|pfx|jks|keystore|kdbx|zip|7z|rar|tar(?:\.gz|\.bz2|\.xz)?|tgz|gz|bz2|xz)$/i;
const windowsReserved = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
const manifestName = 'manifest.json';
const maxFiles = 10000;

function fail(message) { throw new Error(`Source recovery: ${message}`); }
function absolute(value, label) {
  if (typeof value !== 'string' || !path.isAbsolute(value)) fail(`${label} must be an absolute path`);
  return path.resolve(value);
}
function folded(value) { return process.platform === 'win32' ? value.toLowerCase() : value; }
function overlaps(a, b) {
  a = folded(path.resolve(a)); b = folded(path.resolve(b));
  return a === b || a.startsWith(b + path.sep) || b.startsWith(a + path.sep);
}
function safeRelative(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.startsWith('/') || /[\u0000-\u001f\u007f]/.test(value)) fail('unsafe relative path');
  const parts = value.split('/');
  if (parts.some(part => !part || part === '.' || part === '..' || part.endsWith('.') || part.endsWith(' ') || /[<>"|?*:]/.test(part) || windowsReserved.test(part))) fail('unsafe path segment');
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (forbiddenSegments.has(lower) || forbiddenNames.has(lower) || (lower.startsWith('.env') && lower !== '.env.example') || forbiddenExtensions.test(lower)) fail(`disallowed source path: ${value}`);
  }
  return value;
}
function uniquePaths(paths) {
  if (!Array.isArray(paths) || paths.length < 1 || paths.length > maxFiles) fail('paths must be a nonempty bounded array');
  const result = paths.map(safeRelative);
  const seen = new Set();
  for (const item of result) {
    const key = item.toLowerCase();
    if (seen.has(key)) fail(`duplicate or case-colliding path: ${item}`);
    seen.add(key);
  }
  return result.sort();
}
async function checkExistingChain(target, requireDirectory = false) {
  const resolved = path.resolve(target);
  const parsed = path.parse(resolved);
  let cursor = parsed.root;
  const segments = resolved.slice(parsed.root.length).split(path.sep).filter(Boolean);
  for (let i = 0; i < segments.length; i++) {
    cursor = path.join(cursor, segments[i]);
    let stat;
    try { stat = await fs.lstat(cursor); }
    catch (error) { if (error.code === 'ENOENT') break; throw error; }
    if (stat.isSymbolicLink()) fail(`symlink or reparse path: ${cursor}`);
    if (i < segments.length - 1 && !stat.isDirectory()) fail(`non-directory ancestor: ${cursor}`);
    if (i === segments.length - 1 && requireDirectory && !stat.isDirectory()) fail(`not a directory: ${cursor}`);
  }
}
async function requireFreshDirectory(target) {
  await checkExistingChain(path.dirname(target), true);
  try { await fs.lstat(target); fail(`destination already exists: ${target}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
async function regularFile(root, relative) {
  const pieces = relative.split('/');
  let cursor = root;
  for (let i = 0; i < pieces.length; i++) {
    cursor = path.join(cursor, pieces[i]);
    const stat = await fs.lstat(cursor);
    if (stat.isSymbolicLink()) fail(`symlink or reparse path: ${relative}`);
    if (i < pieces.length - 1 && !stat.isDirectory()) fail(`non-directory path: ${relative}`);
    if (i === pieces.length - 1 && !stat.isFile()) fail(`nonregular file: ${relative}`);
  }
  return cursor;
}
async function digest(file) {
  const handle = await fs.open(file, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
  try {
    const stat = await handle.stat();
    if (!stat.isFile()) fail(`nonregular file: ${file}`);
    const hash = createHash('sha256');
    let size = 0;
    for await (const chunk of handle.createReadStream({ autoClose: false })) { hash.update(chunk); size += chunk.length; }
    return { sha256: hash.digest('hex'), size };
  } finally { await handle.close(); }
}
async function copyChecked(from, to) {
  const handle = await fs.open(from, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
  try {
    if (!(await handle.stat()).isFile()) fail(`nonregular file: ${from}`);
    await fs.mkdir(path.dirname(to), { recursive: true });
    await pipeline(handle.createReadStream({ autoClose: false }), createWriteStream(to, { flags: 'wx' }));
  } finally { await handle.close(); }
}
async function listFiles(root) {
  const found = [];
  async function visit(dir, prefix) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) fail(`symlink in snapshot: ${relative}`);
      if (entry.isDirectory()) { found.push(`${relative}/`); await visit(path.join(dir, entry.name), relative); }
      else if (entry.isFile()) found.push(relative);
      else fail(`nonregular snapshot entry: ${relative}`);
    }
  }
  await visit(root, '');
  return found.sort();
}
function validateManifest(manifest) {
  if (!manifest || manifest.version !== 1 || manifest.scope !== 'local-source-only' || manifest.excludes !== 'datasets, dependencies, off-device backups, and clinical recovery' || !Array.isArray(manifest.files)) fail('invalid manifest scope or version');
  const names = uniquePaths(manifest.files.map(file => file?.path));
  if (names.length !== manifest.files.length || manifest.files.some((file, i) => file.path !== names[i] || !/^[a-f0-9]{64}$/.test(file.sha256) || !Number.isSafeInteger(file.size) || file.size < 0)) fail('invalid manifest files');
  return manifest.files;
}

export async function captureSourceRecovery({ sourceRoot, destinationRoot, paths }) {
  const source = absolute(sourceRoot, 'sourceRoot');
  const destination = absolute(destinationRoot, 'destinationRoot');
  const names = uniquePaths(paths);
  if (overlaps(source, destination)) fail('source and destination overlap');
  await checkExistingChain(source, true);
  await requireFreshDirectory(destination);
  const originals = [];
  for (const name of names) {
    const file = await regularFile(source, name);
    originals.push({ path: name, ...(await digest(file)) });
  }
  await fs.mkdir(destination);
  const copiedRoot = path.join(destination, 'source');
  await fs.mkdir(copiedRoot);
  for (const record of originals) {
    const original = await regularFile(source, record.path);
    const copy = path.join(copiedRoot, ...record.path.split('/'));
    await copyChecked(original, copy);
    const copied = await digest(copy);
    if (copied.sha256 !== record.sha256 || copied.size !== record.size) fail(`copy changed: ${record.path}`);
  }
  for (const record of originals) {
    const current = await digest(await regularFile(source, record.path));
    if (current.sha256 !== record.sha256 || current.size !== record.size) fail(`source changed during capture: ${record.path}`);
  }
  const manifest = { version: 1, scope: 'local-source-only', excludes: 'datasets, dependencies, off-device backups, and clinical recovery', files: originals };
  await fs.writeFile(path.join(destination, manifestName), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  return manifest;
}

export async function verifySourceRecovery({ snapshotRoot }) {
  const snapshot = absolute(snapshotRoot, 'snapshotRoot');
  await checkExistingChain(snapshot, true);
  const manifestFile = await regularFile(snapshot, manifestName);
  if ((await fs.stat(manifestFile)).size > 10 * 1024 * 1024) fail('manifest too large');
  const manifest = JSON.parse(await fs.readFile(manifestFile, 'utf8'));
  const records = validateManifest(manifest);
  const actual = await listFiles(snapshot);
  const expectedDirectories = new Set(['source/']);
  for (const record of records) {
    const pieces = record.path.split('/');
    for (let i = 1; i < pieces.length; i++) expectedDirectories.add(`source/${pieces.slice(0, i).join('/')}/`);
  }
  const expected = [manifestName, ...expectedDirectories, ...records.map(record => `source/${record.path}`)].sort();
  if (actual.length !== expected.length || actual.some((file, i) => file !== expected[i])) fail('snapshot missing files or has extras');
  for (const record of records) {
    const file = await regularFile(path.join(snapshot, 'source'), record.path);
    const actualDigest = await digest(file);
    if (actualDigest.sha256 !== record.sha256 || actualDigest.size !== record.size) fail(`snapshot mismatch: ${record.path}`);
  }
  return manifest;
}

export async function restoreSourceRecovery({ snapshotRoot, destinationRoot }) {
  const snapshot = absolute(snapshotRoot, 'snapshotRoot');
  const destination = absolute(destinationRoot, 'destinationRoot');
  if (overlaps(snapshot, destination)) fail('snapshot and destination overlap');
  await requireFreshDirectory(destination);
  const manifest = await verifySourceRecovery({ snapshotRoot: snapshot });
  await fs.mkdir(destination);
  for (const record of manifest.files) {
    const original = await regularFile(path.join(snapshot, 'source'), record.path);
    const copy = path.join(destination, ...record.path.split('/'));
    await copyChecked(original, copy);
    const actual = await digest(copy);
    if (actual.sha256 !== record.sha256 || actual.size !== record.size) fail(`restore mismatch: ${record.path}`);
  }
  return manifest;
}
