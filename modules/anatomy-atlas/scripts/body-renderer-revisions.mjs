import assert from 'node:assert/strict';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { resolve, dirname, relative, extname } from 'node:path';
import { createHash } from 'node:crypto';
import ts from 'typescript';

const root = process.cwd();
const destination = 'content/body-renderer-revision.json';
const entries = [
  'app/body-explorer.tsx',
  'app/layout.tsx',
  'app/globals.css',
  'vite.config.ts',
  'package.json',
  'package-lock.json',
  'scripts/compress-model-delivery.mjs',
  'scripts/glb-lossless-codec.mjs',
];
const files = new Map();
const sha = (v) => createHash('sha256').update(v).digest('hex');
async function visit(path) {
  const normalized = relative(root, path).replaceAll('\\', '/');
  assert(
    !normalized.startsWith('..') && !normalized.includes(':'),
    'Renderer dependency escaped checkout',
  );
  assert.notEqual(
    normalized,
    destination,
    'Circular review metadata import into renderer; redesign before generating',
  );
  if (files.has(normalized)) return;
  const text = (await readFile(path, 'utf8')).replace(/\r\n/g, '\n');
  files.set(normalized, sha(text));
  let imports = [];
  if (/\.[cm]?[jt]sx?$/.test(path)) {
    imports = ts
      .preProcessFile(text, true, true)
      .importedFiles.map((r) => r.fileName);
    const ast = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
    const checkDynamic = (node) => {
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword
      )
        assert(
          node.arguments.length && ts.isStringLiteral(node.arguments[0]),
          `Computed dynamic import needs explicit revision coverage: ${normalized}`,
        );
      ts.forEachChild(node, checkDynamic);
    };
    checkDynamic(ast);
  } else if (extname(path) === '.css') {
    imports = [...text.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)].map(
      (r) => r[1],
    );
  }
  for (const name of imports) {
    if (!name.startsWith('.') && !name.startsWith('@/')) continue; // External versions are covered by the exact lockfile.
    const base = name.startsWith('@/')
      ? resolve(root, name.slice(2))
      : resolve(dirname(path), name);
    let found;
    for (const suffix of [
      '',
      '.ts',
      '.tsx',
      '.mjs',
      '.js',
      '.json',
      '.css',
      '/index.ts',
      '/index.tsx',
    ]) {
      try {
        if ((await stat(base + suffix)).isFile()) {
          found = base + suffix;
          break;
        }
      } catch (e) {
        if (e.code !== 'ENOENT' && e.code !== 'ENOTDIR') throw e;
      }
    }
    assert(
      found,
      `Unresolved local renderer dependency: ${normalized} -> ${name}`,
    );
    await visit(found);
  }
}
for (const entry of entries) await visit(resolve(root, entry));
const dependencies = [...files]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, sha256]) => ({ path, sha256 }));
const report = {
  schemaVersion: 1,
  scope: 'root-body-renderer',
  entrypoints: entries,
  dependencies,
  sha256: sha(JSON.stringify(dependencies)),
};
const output = JSON.stringify(report, null, 2) + '\n';
if (process.argv.includes('--check'))
  assert.equal(
    (await readFile(destination, 'utf8')).replace(/\r\n/g, '\n'),
    output,
    'Body renderer revision is stale; regenerate and require re-review',
  );
else await writeFile(destination, output);
console.log(
  JSON.stringify({
    rendererFiles: dependencies.length,
    sha256: report.sha256,
    mode: process.argv.includes('--check') ? 'checked' : 'generated',
  }),
);
