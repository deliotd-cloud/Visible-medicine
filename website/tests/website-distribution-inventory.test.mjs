import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { classifyModule, inventoryBundle, validateAuditDirectory, websiteDistributionInventoryPlugin } from '../scripts/website-distribution-inventory.mjs';

function fixture(t) {
  const base = mkdtempSync(join(tmpdir(), 'vm-distribution-'));
  t.after(() => {
    assert.equal(isAbsolute(base), true);
    assert.equal(resolve(base), base);
    assert.equal(dirname(base), resolve(tmpdir()));
    assert.match(basename(base), /^vm-distribution-/);
    rmSync(base, { recursive: true, force: true });
  });
  const root = join(base, 'website');
  const audit = join(base, 'audit');
  const output = join(root, 'dist');
  mkdirSync(join(root, 'app'), { recursive: true });
  mkdirSync(join(root, 'node_modules', 'alpha', 'node_modules', 'beta'), { recursive: true });
  mkdirSync(output, { recursive: true });
  const app = join(root, 'app', 'main.js');
  const alpha = join(root, 'node_modules', 'alpha');
  const beta = join(alpha, 'node_modules', 'beta');
  writeFileSync(app, 'secret source text');
  for (const [dir, name, version] of [[alpha, 'alpha', '1.0.0'], [beta, 'beta', '2.0.0']]) {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, version }));
    writeFileSync(join(dir, 'index.js'), 'package source secret');
    writeFileSync(join(dir, 'LICENSE'), 'licence text');
  }
  writeFileSync(join(root, 'vite.config.ts'), 'config');
  writeFileSync(join(root, 'package.json'), '{"name":"fixture-website","version":"0.0.1"}');
  return { root, audit, output, app, alpha, beta };
}

test('classifies project, nested package owners, builtins and virtual IDs without source text', t => {
  const f = fixture(t);
  assert.deepEqual(classifyModule(f.app + '?token=do-not-leak', f.root), { kind: 'app', projectRelativePath: 'app/main.js' });
  const one = classifyModule(join(f.alpha, 'index.js'), f.root);
  const two = classifyModule(join(f.beta, 'index.js') + '?secret', f.root);
  assert.equal(one.package.version, '1.0.0');
  assert.equal(two.package.version, '2.0.0');
  assert.equal(two.package.notices[0].name, 'LICENSE');
  assert.equal(classifyModule('node:async_hooks', f.root).kind, 'platform-builtin');
  assert.equal(classifyModule('\0virtual:private-payload', f.root).kind, 'virtual-or-bundler');
  assert.equal(classifyModule('missing:secret', f.root).kind, 'unresolved-or-external');
  assert.doesNotMatch(JSON.stringify(two), /package source secret|secret\?/);
});

test('captures bundled, external, dynamic and zero-length module attribution; writes only to audit directory', t => {
  const f = fixture(t);
  const code = 'generated bundle';
  writeFileSync(join(f.output, 'entry.js'), code);
  const bundle = { 'entry.js': { type: 'chunk', fileName: 'entry.js', code,
    facadeModuleId: f.app, isEntry: true, isDynamicEntry: false,
    imports: ['node:async_hooks', 'external:secret?query-token'], dynamicImports: ['lazy.js'],
    modules: { [f.app + '?query-token']: { renderedLength: 10 }, [join(f.beta, 'index.js')]: { renderedLength: 0 }, '\0virtual:secret': { renderedLength: 2 } } } };
  const seen = inventoryBundle(bundle, f.root, 'client');
  assert.equal(seen[0].modules[1].renderedLengthIsZero, true);
  assert.equal(seen[0].dynamicImports[0].kind, 'external-or-unresolved');
  assert.equal(seen[0].imports[0].kind, 'platform-builtin');
  const plugin = websiteDistributionInventoryPlugin({ projectRoot: f.root, auditDirectory: f.audit });
  assert.equal(plugin.apply, 'build');
  assert.equal(readdirSync(f.root).includes('audit'), false);
  plugin.generateBundle.call({ environment: { name: 'client' } }, {}, bundle);
  plugin.writeBundle.call({ environment: { name: 'client' } }, { dir: f.output }, bundle);
  const data = readFileSync(join(f.audit, readdirSync(f.audit)[0]), 'utf8');
  const audit = JSON.parse(data);
  assert.equal(audit.environment, 'client');
  assert.equal(audit.files[0].fileName, 'entry.js');
  assert.equal(audit.chunks[0].modules[1].module.package.version, '2.0.0');
  assert.ok(audit.bindings.some(binding => binding.name === 'package.json'));
  assert.doesNotMatch(data, /query-token|secret source text|package source secret|virtual:secret|external:secret|vm-distribution-/);
});

test('rejects unsafe destination and output paths', t => {
  const f = fixture(t);
  for (const dir of ['relative', join(f.root, 'dist', 'audit'), join(f.root, 'public'), join(f.root, 'node_modules')]) {
    assert.throws(() => validateAuditDirectory(dir, f.root));
  }
  assert.throws(() => inventoryBundle({ bad: { type: 'chunk', fileName: '../escape.js', modules: {} } }, f.root, 'client'));
});

test('resolves emitted dynamic chunk edges separately from external imports', t => {
  const f = fixture(t);
  const bundle = {
    'entry.js': { type: 'chunk', fileName: 'entry.js', code: 'entry', modules: {}, imports: ['bare:unknown'], dynamicImports: ['./lazy.js'] },
    'lazy.js': { type: 'chunk', fileName: 'lazy.js', code: 'lazy', modules: {}, imports: [], dynamicImports: [] },
  };
  const entry = inventoryBundle(bundle, f.root, 'client').find(chunk => chunk.fileName === 'entry.js');
  assert.deepEqual(entry.dynamicImports, [{ kind: 'emitted-chunk', fileName: 'lazy.js' }]);
  assert.equal(entry.imports[0].kind, 'external-or-unresolved');
});

test('generate-only pass does not reserve a pending environment or emit an audit', t => {
  const f = fixture(t);
  writeFileSync(join(f.output, 'entry.js'), 'written output');
  const bundle = { 'entry.js': { type: 'chunk', fileName: 'entry.js', code: 'written output', modules: {} } };
  const context = { environment: { name: 'client' } };
  const plugin = websiteDistributionInventoryPlugin({ projectRoot: f.root, auditDirectory: f.audit });
  plugin.generateBundle.call(context, {}, bundle, false);
  assert.equal(readdirSync(f.root).includes('audit'), false);
  plugin.generateBundle.call(context, {}, bundle, true);
  plugin.writeBundle.call(context, { dir: f.output }, bundle);
  assert.equal(readdirSync(f.audit).length, 1);
});

test('nested type-only package metadata defers to the versioned owner', t => {
  const f = fixture(t);
  const nested = join(f.beta, 'esm');
  mkdirSync(nested);
  writeFileSync(join(nested, 'package.json'), '{"type":"module","exports":"./entry.js"}');
  const entry = join(nested, 'entry.js');
  writeFileSync(entry, 'nested source');
  const result = classifyModule(entry, f.root);
  assert.equal(result.kind, 'package');
  assert.equal(result.package.name, 'beta');
  assert.equal(result.package.version, '2.0.0');
  assert.equal(result.pathInPackage, 'esm/entry.js');
});

test('opt-in is absent from configuration when env is unset and ignored in dev', t => {
  const config = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');
  assert.match(config, /command === 'build' \? process\.env\.VM_WEBSITE_DISTRIBUTION_AUDIT_DIR : undefined/);
  assert.match(config, /distributionAuditDirectory \? \[websiteDistributionInventoryPlugin/);
  const f = fixture(t);
  assert.equal(readdirSync(f.root).includes('audit'), false);
});

test('attributes final renamed output and excludes chunks pruned after generateBundle', t => {
  const f = fixture(t), plugin = websiteDistributionInventoryPlugin({ projectRoot:f.root, auditDirectory:f.audit });
  const context = { environment:{ name:'rsc' } };
  const chunk = fileName => ({type:'chunk',fileName,code:'final code',modules:{[f.app]:{renderedLength:10}},imports:[],dynamicImports:[]});
  plugin.generateBundle.call(context, {}, {'old.js':chunk('old.js'),'pruned.js':chunk('pruned.js')}, true);
  writeFileSync(join(f.output,'final.js'),'final code');
  plugin.writeBundle.call(context,{dir:f.output},{'final.js':chunk('final.js')});
  const audit=JSON.parse(readFileSync(join(f.audit,readdirSync(f.audit)[0]),'utf8'));
  assert.deepEqual(audit.files.map(file=>file.fileName),['final.js']);
  assert.deepEqual(audit.chunks.map(file=>file.fileName),['final.js']);
  assert.deepEqual(audit.generatedOnlyFileNames,['old.js','pruned.js']);
});
