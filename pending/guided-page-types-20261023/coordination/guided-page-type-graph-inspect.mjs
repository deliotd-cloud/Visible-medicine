import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const site = 'F:/VisibleMedicine/staging/20261023-guided-region-website/website';
const stage = 'F:/VisibleMedicine/staging/20261023-guided-region-website';
const output = 'F:/VisibleMedicine/staging/20261023-guided-page-type-graph/REPORT.json';
const ts = createRequire(path.join(site, 'package.json'))('typescript');
const configPath = path.join(site, 'tsconfig.json');
const loaded = ts.readConfigFile(configPath, ts.sys.readFile);
if (loaded.error) throw Error(ts.flattenDiagnosticMessageText(loaded.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(loaded.config, ts.sys, site);
if (parsed.errors.length) throw Error('tsconfig parse errors: ' + parsed.errors.length);
const norm = p => path.resolve(p).replaceAll('\\', '/');
const roots = [
  ['page', norm(path.join(site, 'app/atlas/guided-learning/page.tsx'))],
  ['regional', norm(path.join(site, 'components/RegionalLearningCatalogue.tsx'))],
  ...parsed.fileNames.filter(p => p.endsWith('.d.ts')).map((p, i) => [`ambient-${i + 1}`, norm(p)]),
];
for (const name of loaded.config.compilerOptions?.types ?? []) {
  const r = ts.resolveTypeReferenceDirective(name, configPath, parsed.options, ts.sys);
  if (r.resolvedTypeReferenceDirective) roots.push([`types:${name}`, norm(r.resolvedTypeReferenceDirective.resolvedFileName)]);
}
const libdir = path.dirname(ts.getDefaultLibFilePath(parsed.options));
for (const lib of loaded.config.compilerOptions?.lib ?? []) {
  const p = norm(path.join(libdir, `lib.${lib.toLowerCase()}.d.ts`));
  if (fs.existsSync(p)) roots.push([`lib:${lib}`, p]);
}
const queue = [];
const seen = new Map();
const edges = [];
const unresolved = [];
const LIMIT_FILES = 12000;
const LIMIT_TEXT_BYTES = 8 * 1024 * 1024;
const sha = p => {
  const h = createHash('sha256');
  const fd = fs.openSync(p, 'r');
  const buf = Buffer.allocUnsafe(65536);
  try { for (;;) { const n = fs.readSync(fd, buf, 0, buf.length, null); if (!n) break; h.update(buf.subarray(0, n)); } }
  finally { fs.closeSync(fd); }
  return h.digest('hex');
};
const enqueue = (p, from, spec, kind) => {
  p = norm(p);
  if (!seen.has(p)) {
    if (seen.size >= LIMIT_FILES) throw Error(`graph exceeded ${LIMIT_FILES} files`);
    if (!fs.existsSync(p) || !fs.statSync(p).isFile()) { unresolved.push({ from, spec, kind, reason: 'resolved path absent' }); return; }
    const bytes = fs.statSync(p).size;
    seen.set(p, { path: p, bytes, sha256: sha(p), kind: p.includes('/node_modules/') ? 'dependency' : p.startsWith(norm(site) + '/') ? 'site' : 'external' });
    queue.push(p);
  }
  if (from) edges.push({ from, to: p, spec, kind });
};
for (const [label, p] of roots) enqueue(p, null, label, 'root');
const interesting = p => /\.(?:[cm]?[jt]sx?|json)$/i.test(p) && !p.endsWith('.json');
for (let i = 0; i < queue.length; i++) {
  const p = queue[i];
  const row = seen.get(p);
  if (!interesting(p)) continue;
  if (row.bytes > LIMIT_TEXT_BYTES) { row.scanSkipped = 'text file over 8 MiB'; continue; }
  const source = fs.readFileSync(p, 'utf8');
  const info = ts.preProcessFile(source, true, true);
  for (const ref of info.importedFiles) {
    const r = ts.resolveModuleName(ref.fileName, p, parsed.options, ts.sys).resolvedModule;
    if (r) enqueue(r.resolvedFileName, p, ref.fileName, 'module');
    else if (!/\.(?:css|scss|svg|png|jpe?g|webp|woff2?)$/i.test(ref.fileName)) unresolved.push({ from: p, spec: ref.fileName, kind: 'module' });
  }
  for (const ref of info.referencedFiles) {
    const to = norm(path.resolve(path.dirname(p), ref.fileName));
    if (fs.existsSync(to)) enqueue(to, p, ref.fileName, 'path-reference');
    else unresolved.push({ from: p, spec: ref.fileName, kind: 'path-reference' });
  }
  for (const ref of info.typeReferenceDirectives) {
    const r = ts.resolveTypeReferenceDirective(ref.fileName, p, parsed.options, ts.sys).resolvedTypeReferenceDirective;
    if (r) enqueue(r.resolvedFileName, p, ref.fileName, 'type-reference');
    else unresolved.push({ from: p, spec: ref.fileName, kind: 'type-reference' });
  }
  for (const ref of info.libReferenceDirectives) {
    const to = norm(path.join(libdir, `lib.${ref.fileName.toLowerCase()}.d.ts`));
    if (fs.existsSync(to)) enqueue(to, p, ref.fileName, 'lib-reference');
    else unresolved.push({ from: p, spec: ref.fileName, kind: 'lib-reference' });
  }
}
const byFrom = new Map();
for (const e of edges) { if (!byFrom.has(e.from)) byFrom.set(e.from, []); byFrom.get(e.from).push(e); }
const reach = label => {
  const start = roots.find(x => x[0] === label)?.[1];
  const paths = new Map([[start, []]]), todo = [start];
  for (let i = 0; i < todo.length; i++) for (const e of byFrom.get(todo[i]) ?? []) if (!paths.has(e.to)) {
    paths.set(e.to, [...paths.get(todo[i]), { from: e.from, spec: e.spec, to: e.to }]); todo.push(e.to);
  }
  return paths;
};
const page = reach('page'), regional = reach('regional');
const files = [...seen.values()].sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));
const json = files.filter(f => f.path.endsWith('.json'));
const jsonPaths = json.map(f => ({ ...f, viaPage: page.get(f.path) ?? null, viaRegional: regional.get(f.path) ?? null }));
const rootStats = roots.map(([label, p]) => ({ label, path: p, reachableFiles: reach(label).size }));
const report = {
  schema: 'visible-medicine.guided-page-import-metadata/1', at: new Date().toISOString(),
  sourceReceipt: norm(path.join(stage, 'SOURCE_BOUND.json')), sourceReceiptSha256: sha(path.join(stage, 'SOURCE_BOUND.json')),
  site: norm(site), config: norm(configPath), configSha256: sha(configPath), typescriptVersion: ts.version,
  method: 'tsconfig parse, TypeScript preProcessFile, resolveModuleName and type-reference resolution only; no Program or diagnostics',
  limits: { maxFiles: LIMIT_FILES, maxTextBytes: LIMIT_TEXT_BYTES },
  roots: rootStats, totals: { files: files.length, edges: edges.length, bytes: files.reduce((n, f) => n + f.bytes, 0), jsonFiles: json.length,
    pageReachable: page.size, regionalReachable: regional.size, unresolved: unresolved.length, skippedText: files.filter(f => f.scanSkipped).length },
  files, jsonInputs: jsonPaths, largestFiles: files.slice(0, 30), unresolved,
  limitations: ['Metadata import graph is not a TypeScript Program, semantic check, or heap attribution.',
    'Does not expand nonliteral dynamic imports, CommonJS require, framework generated roots, CSS or asset imports.',
    'Only the two named source roots, parsed ambient declarations, configured types and configured libs seed traversal; whole-project include roots are excluded.',
    'A module resolver may choose declaration/type paths rather than the runtime implementation; skipped oversized text files are listed.']
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ report: output, totals: report.totals, topJson: jsonPaths.slice(0, 5).map(x => ({ path: x.path, bytes: x.bytes, page: !!x.viaPage, regional: !!x.viaRegional })) }));
