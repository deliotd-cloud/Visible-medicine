// Static, immutable-tree input audit for one pinned renderer revision generator.
// It never executes repository source or reads the generated revision record.
import {createHash} from 'node:crypto';
import {posix} from 'node:path';
import ts from 'typescript';

const PROGRAM = 'scripts/body-renderer-revisions.mjs';
const PROGRAM_SHA256 = '6a297c3c75b427d275e3c63dc5a275b880430667237b1b3fa0f1991b9a4f4baf';
const COMMAND = 'node scripts/body-renderer-revisions.mjs';
const DESTINATION = 'content/body-renderer-revision.json';
const ENTRYPOINTS = [
  'app/body-explorer.tsx', 'app/layout.tsx', 'app/globals.css', 'vite.config.ts',
  'package.json', 'package-lock.json', 'scripts/compress-model-delivery.mjs',
  'scripts/glb-lossless-codec.mjs',
];
const SUFFIXES = ['', '.ts', '.tsx', '.mjs', '.js', '.json', '.css', '/index.ts', '/index.tsx'];
const MAX_FILES = 10000;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const issue = (code, path, detail) => ({code, path, ...(detail === undefined ? {} : {detail})});
const safePath = path => typeof path === 'string' && path.length > 0 &&
  !path.includes('\\') && !path.includes(':') && !path.startsWith('/') &&
  !path.includes('\0') && path.split('/').every(part => part && part !== '.' && part !== '..');
const regular = row => row && row.type === 'blob' &&
  (row.mode === '100644' || row.mode === '100755') &&
  Number.isSafeInteger(row.bytes) && row.bytes >= 0 && /^[0-9a-f]{40}$/.test(row.gitBlob);
const gitBlob = bytes => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');

export async function auditRendererInputs({path, sha256: programSha256, invocations, rows, readCode, add}) {
  if (path !== PROGRAM || programSha256 !== PROGRAM_SHA256 ||
      !Array.isArray(invocations) || invocations.length !== 1 || invocations[0] !== COMMAND) return null;
  const issues = [];
  const dependencies = new Map();
  const visited = new Set();
  const report = () => {
    const ordered = [...dependencies.values()].sort((a, b) => a.path.localeCompare(b.path));
    const graphComplete = issues.length === 0;
    const normalizedDependenciesSha256 = graphComplete ? sha256(JSON.stringify(
      ordered.map(({path, normalizedSha256}) => ({path, sha256: normalizedSha256})))) : null;
    return {sourceProgramSha256: PROGRAM_SHA256, buildInvocation: COMMAND,
      entrypoints: [...ENTRYPOINTS], dependencies: ordered, issues, graphComplete,
      normalizedDependenciesSha256, sourceExecutionObserved: false,
      installedToolIdentityVerified: false};
  };
  if (!(rows instanceof Map) || typeof readCode !== 'function' || typeof add !== 'function') {
    issues.push(issue('INVALID_CALLBACKS', PROGRAM));
    return report();
  }

  async function visit(candidate, reason) {
    if (!safePath(candidate)) { issues.push(issue('UNSAFE_PATH', candidate)); return; }
    if (candidate === DESTINATION) { issues.push(issue('CIRCULAR_METADATA', candidate)); return; }
    if (visited.has(candidate)) return;
    if (visited.size >= MAX_FILES) { issues.push(issue('FILE_LIMIT', candidate)); return; }
    visited.add(candidate);
    // The policy gate precedes every byte read, even for a missing or nonregular row.
    let allowed;
    try { allowed = add(candidate, reason); }
    catch { issues.push(issue('ADD_ERROR', candidate)); return; }
    const row = rows.get(candidate);
    if (!allowed) { issues.push(issue(row ? 'HELD_INPUT' : 'MISSING_INPUT', candidate)); return; }
    if (!row) { issues.push(issue('MISSING_INPUT', candidate)); return; }
    if (!regular(row) || row.path !== candidate) { issues.push(issue('NONREGULAR_GIT_INPUT', candidate)); return; }
    let bytes;
    try { bytes = await readCode(candidate, row); }
    catch { issues.push(issue('READ_ERROR', candidate)); return; }
    if (!Buffer.isBuffer(bytes)) { issues.push(issue('READ_UNRESOLVED', candidate)); return; }
    if (bytes.length !== row.bytes || gitBlob(bytes) !== row.gitBlob) {
      issues.push(issue('BLOB_MISMATCH', candidate)); return;
    }
    const source = bytes.toString('utf8').replace(/\r\n/g, '\n');
    dependencies.set(candidate, {path: candidate, gitBlob: row.gitBlob, bytes: row.bytes,
      rawSha256: sha256(bytes), normalizedSha256: sha256(source)});
    let imports = [];
    if (/\.[cm]?[jt]sx?$/.test(candidate)) {
      try {
        imports = ts.preProcessFile(source, true, true).importedFiles.map(ref => ref.fileName);
        const ast = ts.createSourceFile(candidate, source, ts.ScriptTarget.Latest, true);
        if (ast.parseDiagnostics.length) issues.push(issue('SOURCE_PARSE', candidate));
        const checkDynamic = node => {
          if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword &&
              (!node.arguments.length || !ts.isStringLiteral(node.arguments[0])))
            issues.push(issue('COMPUTED_IMPORT', candidate));
          ts.forEachChild(node, checkDynamic);
        };
        checkDynamic(ast);
      } catch { issues.push(issue('SOURCE_PARSE', candidate)); }
    } else if (posix.extname(candidate) === '.css') {
      imports = [...source.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)].map(match => match[1]);
    }
    for (const name of imports) {
      if (name.includes('\\') || name.startsWith('/') || /^[a-zA-Z]:/.test(name)) {
        issues.push(issue('UNSAFE_LOCAL_IMPORT', candidate, name)); continue;
      }
      if (!name.startsWith('.') && !name.startsWith('@/')) continue;
      const base = name.startsWith('@/') ? name.slice(2) : posix.join(posix.dirname(candidate), name);
      const normalized = posix.normalize(base);
      if (!safePath(normalized)) { issues.push(issue('UNSAFE_LOCAL_IMPORT', candidate, name)); continue; }
      let found;
      for (const suffix of SUFFIXES) {
        const option = normalized + suffix;
        if (option === DESTINATION) { found = option; break; }
        if (rows.has(option)) { found = option; break; }
      }
      if (!found) { issues.push(issue('UNRESOLVED_LOCAL_IMPORT', candidate, name)); continue; }
      await visit(found, `renderer import from ${candidate}`);
    }
  }
  for (const entry of ENTRYPOINTS) await visit(entry, 'renderer fixed entrypoint');
  return report();
}
