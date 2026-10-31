import { createHash, randomUUID } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, realpathSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep, posix } from 'node:path';
import { builtinModules } from 'node:module';

const sha = value => createHash('sha256').update(value).digest('hex');
const hashFile = file => sha(readFileSync(file));
const inside = (parent, child) => child === parent || (!relative(parent, child).startsWith('..' + sep) && relative(parent, child) !== '..' && !isAbsolute(relative(parent, child)));
const clean = id => String(id).split('?')[0].split('#')[0].replace(/^\0+/, '');
const slash = value => value.replaceAll('\\', '/');
const safeOutput = name => typeof name === 'string' && !!name && !isAbsolute(name) && !/^[A-Za-z]:/.test(name) && !slash(name).split('/').some(part => part === '..' || part === '' || part === '.') && !name.includes('\0');
const builtins = new Set(builtinModules.map(name => name.replace(/^node:/, '')));

function canonicalProspective(path) {
  let cursor = path;
  const suffix = [];
  while (!existsSync(cursor)) {
    suffix.unshift(basename(cursor));
    const parent = dirname(cursor);
    if (parent === cursor) throw new Error('Audit destination has no existing ancestor');
    cursor = parent;
  }
  return resolve(realpathSync(cursor), ...suffix);
}

export function validateAuditDirectory(directory, projectRoot) {
  if (!isAbsolute(directory)) throw new Error('Audit directory must be absolute');
  if (directory.includes('\0')) throw new Error('Invalid audit directory');
  const project = realpathSync(projectRoot);
  const target = canonicalProspective(resolve(directory));
  if (inside(project, target)) throw new Error('Audit directory must be outside the website project');
  if (slash(target).split('/').some(part => /^(?:src|source|public|dist|node_modules)$/i.test(part))) {
    throw new Error('Audit directory cannot be a source, public, dist or node_modules location');
  }
  if (existsSync(target) && !lstatSync(target).isDirectory()) throw new Error('Audit destination is not a directory');
  return target;
}

function metadata(root) {
  const file = join(root, 'package.json');
  const parsed = JSON.parse(readFileSync(file, 'utf8'));
  // A nested module-format package.json is not an installed package owner.
  if (typeof parsed.name !== 'string' || !parsed.name || typeof parsed.version !== 'string' || !parsed.version) return null;
  const notices = [];
  for (const filename of ['LICENSE', 'LICENSE.txt', 'LICENSE.md', 'LICENCE', 'LICENCE.txt', 'NOTICE', 'NOTICE.txt', 'NOTICE.md']) {
    const candidate = join(root, filename);
    if (existsSync(candidate) && lstatSync(candidate).isFile()) notices.push({ name: filename, sha256: hashFile(candidate) });
  }
  return { name: parsed.name ?? null, version: parsed.version ?? null, packageJsonSha256: hashFile(file), rootSha256: sha(root), notices, noticeStatus: notices.length ? 'candidate-files-present-review-required' : 'no-root-notice-found' };
}

export function classifyModule(rawId, projectRoot) {
  const id = clean(rawId);
  if (!id || rawId.startsWith('\0') || /^(?:virtual:|vite:|rolldown:|rollup:)/.test(id)) return { kind: 'virtual-or-bundler', idSha256: sha(id) };
  const builtin = id.replace(/^node:/, '');
  if (builtins.has(builtin)) return { kind: 'platform-builtin', specifier: 'node:' + builtin };
  if (!isAbsolute(id)) return { kind: 'unresolved-or-external', idSha256: sha(id) };
  let file;
  try { file = realpathSync(id); } catch { return { kind: 'unresolved-file', idSha256: sha(id) }; }
  const project = realpathSync(projectRoot);
  let cursor = dirname(file);
  for (let depth = 0; depth < 32; depth++) {
    if (existsSync(join(cursor, 'package.json')) && slash(cursor).split('/').includes('node_modules')) {
      const owner = metadata(cursor);
      if (owner) return { kind: 'package', package: owner, pathInPackage: slash(relative(cursor, file)) };
    }
    const parent = dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  if (slash(file).split('/').includes('node_modules')) return { kind: 'package-owner-unknown', idSha256: sha(file) };
  if (inside(project, file)) return { kind: 'app', projectRelativePath: slash(relative(project, file)) };
  return { kind: 'external-file-unknown', idSha256: sha(file) };
}

function importRef(id, filenames, fromFile) {
  const cleanId = clean(id);
  if (safeOutput(cleanId) && filenames.has(cleanId)) return { kind: 'emitted-chunk', fileName: cleanId };
  if (cleanId.startsWith('.')) {
    const resolved = posix.normalize(posix.join(posix.dirname(slash(fromFile)), slash(cleanId)));
    if (safeOutput(resolved) && filenames.has(resolved)) return { kind: 'emitted-chunk', fileName: resolved };
  }
  const builtin = cleanId.replace(/^node:/, '');
  if (builtins.has(builtin)) return { kind: 'platform-builtin', specifier: 'node:' + builtin };
  return { kind: 'external-or-unresolved', specifierSha256: sha(cleanId) };
}

export function inventoryBundle(bundle, projectRoot, environment) {
  const filenames = new Set(Object.keys(bundle));
  return Object.values(bundle).filter(item => item.type === 'chunk').map(chunk => {
    if (!safeOutput(chunk.fileName)) throw new Error('Unsafe emitted chunk file name');
    return {
      fileName: chunk.fileName,
      generatedCodeSha256: sha(chunk.code ?? ''),
      facade: chunk.facadeModuleId == null ? null : classifyModule(chunk.facadeModuleId, projectRoot),
      isEntry: !!chunk.isEntry, isDynamicEntry: !!chunk.isDynamicEntry,
      imports: (chunk.imports ?? []).map(id => importRef(id, filenames, chunk.fileName)),
      dynamicImports: (chunk.dynamicImports ?? []).map(id => importRef(id, filenames, chunk.fileName)),
      modules: Object.entries(chunk.modules ?? {}).map(([id, info]) => ({
        module: classifyModule(id, projectRoot),
        renderedLength: info.renderedLength ?? null,
        renderedLengthIsZero: info.renderedLength === 0,
      })),
    };
  }).sort((a, b) => a.fileName.localeCompare(b.fileName));
}

export function websiteDistributionInventoryPlugin({ projectRoot, auditDirectory }) {
  const root = realpathSync(projectRoot);
  const target = validateAuditDirectory(auditDirectory, root);
  const runId = `${process.pid}-${randomUUID()}`;
  const pending = new Map();
  return {
    name: 'vm-website-distribution-inventory',
    apply: 'build',
    generateBundle(_options, bundle, isWrite) {
      // Rolldown also calls this hook for generate-only analysis. Only written
      // bundles have corresponding output bytes to hash in writeBundle.
      if (isWrite === false) return;
      const environment = this.environment?.name ?? 'unknown';
      if (pending.has(environment)) throw new Error(`Overlapping bundle inventory for ${environment}`);
      pending.set(environment, { generatedFileNames: Object.values(bundle).map(item => item.fileName) });
    },
    writeBundle(options, bundle) {
      const environment = this.environment?.name ?? 'unknown';
      const generated = pending.get(environment);
      if (!generated) throw new Error(`No generated bundle inventory for ${environment}`);
      // Later generateBundle hooks can prune or rename chunks. Attribute only
      // the final written bundle; preserve earlier-only names as non-shipped.
      const chunks = inventoryBundle(bundle, root, environment);
      const assets = Object.values(bundle).filter(item => item.type === 'asset').map(item => {
        if (!safeOutput(item.fileName)) throw new Error('Unsafe emitted asset file name');
        return { fileName: item.fileName, bundleSourceSha256: sha(item.source ?? '') };
      });
      const finalNames = new Set([...chunks, ...assets].map(item => item.fileName));
      const record = { chunks, assets, generatedOnlyFileNames: generated.generatedFileNames.filter(name => !finalNames.has(name)) };
      if (!options.dir) throw new Error('Expected output directory for audit');
      const output = realpathSync(resolve(root, options.dir));
      const files = [...record.chunks.map(c => c.fileName), ...record.assets.map(a => a.fileName)].map(fileName => {
        const file = realpathSync(join(output, fileName));
        if (!inside(output, file)) throw new Error('Emitted path escaped output directory');
        return { fileName, sha256: hashFile(file) };
      });
      const bindings = ['package.json', 'vite.config.ts', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'].filter(name => existsSync(join(root, name))).map(name => ({ name, sha256: hashFile(join(root, name)) }));
      const inventory = {
        schema: 'visible-medicine.website-distribution-inventory/1', runId, environment,
        plugin: { name: 'vm-website-distribution-inventory', implementationSha256: hashFile(new URL(import.meta.url)) },
        bindings, files, ...record,
        coverage: { expectedEnvironments: 'unknown-until-build-reconciliation', status: 'requires-manual-reconciliation',
          gaps: ['CSS transform attribution', 'copied public assets', 'worker sub-builds', 'generated runtime', 'nonliteral runtime imports', 'licence-term review'] },
      };
      const bytes = Buffer.from(JSON.stringify(inventory, null, 2) + '\n');
      mkdirSync(target, { recursive: true });
      const safeEnvironment = environment.replace(/[^A-Za-z0-9_-]/g, '_');
      const filename = `${runId}-${safeEnvironment}-${randomUUID()}.json`;
      writeFileSync(join(target, filename), bytes, { flag: 'wx' });
      pending.delete(environment);
    },
  };
}
