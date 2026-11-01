import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {copyFile, mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath, pathToFileURL} from 'node:url';
import ts from 'typescript';
import {build} from 'esbuild';
import {catalogPath, declarationPath, declarationFor, generateCatalogTypes,
  schemaPaths, validateCatalogContract} from './native-catalog-types.mjs';

const root = path.resolve(process.env.VM_ATLAS_ROOT ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const at = (base, relative) => path.join(base, ...relative.split('/'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const compact = catalog => ({...catalog, structures: catalog.structures.slice(0, 1),
  bundles: catalog.bundles.slice(0, 1), regions: catalog.regions.slice(0, 1),
  excluded: catalog.excluded.slice(0, 1)});

test('actual catalog and compact malformed variants satisfy or reject the complete contract', async () => {
  const original = await readFile(at(root, catalogPath), 'utf8');
  assert.equal(validateCatalogContract(original, root).validated, true);
  const base = compact(JSON.parse(original));
  assert.equal(validateCatalogContract(JSON.stringify(base), root).validated, true);
  const cases = [
    ['required top-level field', value => { delete value.coverage; }],
    ['coordinate member', value => { value.coordinateSystem.sourceToSceneColumnMajor[0] = 'zero'; }],
    ['coordinate scale', value => { value.coordinateSystem.unitsPerMillimetre = 'one'; }],
    ['structure bound', value => { delete value.structures[0].bounds.min; }],
    ['structure system union', value => { value.structures[0].system = 'invented'; }],
    ['nested source hash', value => { value.structures[0].sources[0].sha256 = 7; }],
    ['optional provenance literal', value => { value.structures[0].provenance = {method: 'invented', license: '', sourceVersion: '', recovered: false}; }],
    ['optional validation literal', value => { value.structures[0].validation = {status: 'unvalidated', anatomicalReview: true}; }],
    ['bundle field', value => { delete value.bundles[0].sha256; }],
    ['coverage field', value => { value.coverage.nerves = 3; }],
    ['exclusion reason', value => { value.excluded[0].reason = 3; }],
  ];
  for (const [label, mutate] of cases) {
    const changed = structuredClone(base);
    mutate(changed);
    assert.throws(() => validateCatalogContract(JSON.stringify(changed), root), /BodyCatalog/, label);
  }
});

test('fixture generation is deterministic, fresh, and never rewrites runtime JSON', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'vm-native-catalog-types-'));
  try {
    for (const relative of [catalogPath, ...schemaPaths, 'tsconfig.json']) {
      await mkdir(path.dirname(at(fixture, relative)), {recursive: true});
      await copyFile(at(root, relative), at(fixture, relative));
    }
    const small = Buffer.from(JSON.stringify(compact(JSON.parse(await readFile(at(fixture, catalogPath), 'utf8')))));
    await writeFile(at(fixture, catalogPath), small);
    const first = generateCatalogTypes({atlasRoot: fixture});
    assert.equal(first.catalogSha256, sha(small));
    assert.equal(first.path, declarationPath);
    assert.equal(generateCatalogTypes({atlasRoot: fixture, check: true}).checked, true);
    const declaration = await readFile(at(fixture, declarationPath), 'utf8');
    assert.equal(declaration, declarationFor(first.catalogSha256, first.schemaSha256));
    assert.match(declaration, /BodyCatalog/);
    assert.doesNotMatch(declaration, /\b(?:any|unknown)\b/);
    assert(declaration.length < 1000);
    assert.deepEqual(await readFile(at(fixture, catalogPath)), small);
    await writeFile(at(fixture, declarationPath), declaration + '// tampered\n');
    assert.throws(() => generateCatalogTypes({atlasRoot: fixture, check: true}), /Stale native catalog declaration/);
    generateCatalogTypes({atlasRoot: fixture});
    await writeFile(at(fixture, catalogPath), Buffer.concat([small, Buffer.from(' ')]));
    assert.throws(() => generateCatalogTypes({atlasRoot: fixture, check: true}), /Stale native catalog declaration/);
    await writeFile(at(fixture, catalogPath), small);
    for (const relative of schemaPaths) {
      const before = await readFile(at(fixture, relative), 'utf8');
      await writeFile(at(fixture, relative), before + '\n// contract revision\n');
      assert.throws(() => generateCatalogTypes({atlasRoot: fixture, check: true}), /Stale native catalog declaration/);
      await writeFile(at(fixture, relative), before);
    }
    const typeSource = await readFile(at(fixture, 'app/body-types.ts'), 'utf8');
    await writeFile(at(fixture, 'lib/extra-contract.ts'), 'export type Marker = string;\n');
    await writeFile(at(fixture, 'app/body-types.ts'), typeSource +
      "\nimport type {Marker} from '../lib/extra-contract';\nexport type ExtraContractMarker = Marker;\n");
    assert.throws(() => generateCatalogTypes({atlasRoot: fixture, check: true}), /Catalog type dependency changed/);
    await writeFile(at(fixture, 'app/body-types.ts'), typeSource);
    await writeFile(at(fixture, declarationPath), declaration.replace('BodyCatalog', 'Object'));
    assert.throws(() => generateCatalogTypes({atlasRoot: fixture, check: true}), /Stale native catalog declaration/);
  } finally {
    const temp = path.resolve(os.tmpdir()), resolved = path.resolve(fixture);
    assert(resolved.startsWith(temp + path.sep) && path.basename(resolved).startsWith('vm-native-catalog-types-'));
    await rm(resolved, {recursive: true, force: true});
  }
});

test('TypeScript resolves the typed companion and retains required-field errors', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'vm-native-catalog-types-'));
  try {
    for (const relative of [catalogPath, ...schemaPaths, 'tsconfig.json']) {
      await mkdir(path.dirname(at(fixture, relative)), {recursive: true});
      await copyFile(at(root, relative), at(fixture, relative));
    }
    const jsonBefore = await readFile(at(fixture, catalogPath));
    await writeFile(at(fixture, catalogPath), JSON.stringify(compact(JSON.parse(jsonBefore.toString('utf8')))));
    generateCatalogTypes({atlasRoot: fixture});
    const options = {module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022, strict: true, noEmit: true, types: [],
      lib: ['lib.es2022.d.ts'], resolveJsonModule: true, allowArbitraryExtensions: true};
    const entry = at(fixture, '__native_catalog_resolution__.ts');
    const source = `import catalog from './${catalogPath}';\n` +
      'import type {BodyCatalog} from "./app/body-types";\n' +
      'const accepted: BodyCatalog = catalog;\nvoid accepted;\n' +
      'const {coverage, ...incomplete} = catalog;\n' +
      'const missing: BodyCatalog = incomplete;\nvoid missing;\n';
    const host = ts.createCompilerHost(options), originalGet = host.getSourceFile.bind(host);
    host.getSourceFile = (file, language, onError, fresh) => path.resolve(file) === entry
      ? ts.createSourceFile(file, source, language, true)
      : originalGet(file, language, onError, fresh);
    const program = ts.createProgram([entry], options, host);
    const files = program.getSourceFiles().map(file => path.normalize(file.fileName));
    assert(files.includes(path.normalize(at(fixture, declarationPath))));
    assert(!files.includes(path.normalize(at(fixture, catalogPath))));
    const diagnosticCodes = ts.getPreEmitDiagnostics(program).map(diagnostic => diagnostic.code);
    assert.deepEqual(diagnosticCodes, [2741]);
    const resolved = ts.resolveModuleName('./' + catalogPath, entry, options, ts.sys).resolvedModule;
    assert.equal(path.normalize(resolved.resolvedFileName), path.normalize(at(fixture, declarationPath)));
    assert.equal(JSON.parse(await readFile(at(fixture, catalogPath), 'utf8')).structures.length, 1);
    const loaded = await import(pathToFileURL(at(fixture, catalogPath)).href, {with: {type: 'json'}});
    assert.equal(loaded.default.structures.length, 1);
  } finally {
    const temp = path.resolve(os.tmpdir()), resolved = path.resolve(fixture);
    assert(resolved.startsWith(temp + path.sep) && path.basename(resolved).startsWith('vm-native-catalog-types-'));
    await rm(resolved, {recursive: true, force: true});
  }
});

test('the actual catalog has identical runtime bundle bytes before and after its companion', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'vm-native-catalog-types-'));
  try {
    const original = await readFile(at(root, catalogPath));
    await mkdir(path.dirname(at(fixture, catalogPath)), {recursive: true});
    await writeFile(at(fixture, catalogPath), original);
    const bundle = async () => (await build({
      stdin: {contents: `export {default} from './${catalogPath}';`, resolveDir: fixture, sourcefile: 'catalog-runtime.ts', loader: 'ts'},
      bundle: true, write: false, platform: 'browser', format: 'esm', tsconfigRaw: {},
    })).outputFiles[0].contents;
    const before = await bundle();
    await writeFile(at(fixture, declarationPath), await readFile(at(root, declarationPath)));
    const after = await bundle();
    assert.deepEqual(after, before);
    assert.deepEqual(await readFile(at(fixture, catalogPath)), original);
  } finally {
    const temp = path.resolve(os.tmpdir()), resolved = path.resolve(fixture);
    assert(resolved.startsWith(temp + path.sep) && path.basename(resolved).startsWith('vm-native-catalog-types-'));
    await rm(resolved, {recursive: true, force: true});
  }
});
