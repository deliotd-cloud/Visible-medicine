// Compiler-only companions for two generated source catalogs. Runtime imports,
// bytes, provenance and independent runtime/Review bindings remain unchanged.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

import {catalogPaths, schemaPaths, declarationFor} from './atlas-catalog-declaration-template.mjs';
export {catalogPaths, declarationFor};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const ownRoot = fileURLToPath(new URL('../', import.meta.url));

/** Check the complete existing TypeScript contract in an isolated program.
 * Do not read the website's giant inferred JSON types into its normal program.
 * This proves structural type compatibility only, not clinical correctness.
 */
export function validateCatalogContract(catalogText, websiteRoot = ownRoot) {
  if (typeof catalogText !== 'string') throw Error('Expected catalog JSON text');
  const parsed = JSON.parse(catalogText);
  if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object')
    throw Error('Expected a catalog object');
  const root = path.resolve(websiteRoot);
  const entry = path.join(root, '__atlas_catalog_contract__.ts');
  const text = `import type {BodyCatalog} from './atlas-review/app/body-types';\n` +
    `type DeepReadonly<T> = T extends object ? { readonly [P in keyof T]: DeepReadonly<T[P]> } : T;\n` +
    `const source = ${JSON.stringify(parsed)} as const;\n` +
    `const checked: DeepReadonly<BodyCatalog> = source;\nvoid checked;\n`;
  const options = {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true, noEmit: true, types: [], lib: ['lib.es2022.d.ts'],
    skipLibCheck: false, incremental: false,
  };
  const host = ts.createCompilerHost(options), originalGet = host.getSourceFile.bind(host);
  host.getSourceFile = (file, language, onError, fresh) => path.resolve(file) === entry
    ? ts.createSourceFile(file, text, language, true)
    : originalGet(file, language, onError, fresh);
  const program = ts.createProgram([entry], options, host);
  // A new transitive schema dependency requires an explicit generator update;
  // otherwise a declaration could survive a changed type contract unnoticed.
  const actualSchema = program.getSourceFiles()
    .filter(file => !program.isSourceFileDefaultLibrary(file) && path.resolve(file.fileName) !== entry)
    .map(file => path.relative(root, file.fileName).split(path.sep).join('/')).sort();
  assert.deepEqual(actualSchema, [...schemaPaths].sort(), 'Catalog type dependency changed');
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) {
    // Do not print raw catalog contents or values; report only diagnostic codes.
    throw Error('Catalog does not satisfy BodyCatalog: ' + [...new Set(diagnostics.map(d => 'TS' + d.code))].join(', '));
  }
  return {schemaPaths: [...schemaPaths], validated: true};
}


export function generateCatalogTypes({websiteRoot = ownRoot, check = false} = {}) {
  const root = path.resolve(websiteRoot);
  const config = JSON.parse(fs.readFileSync(path.join(root, 'tsconfig.json'), 'utf8'));
  assert.equal(config.compilerOptions?.allowArbitraryExtensions, true, 'Enable catalog declaration resolution');
  const source = JSON.parse(fs.readFileSync(path.join(root, 'atlas-review/manifest.json'), 'utf8'));
  const runtime = JSON.parse(fs.readFileSync(path.join(root, 'public/atlas-runtime/head-neck/manifest.json'), 'utf8'));
  const schema = schemaPaths.map(relative => ({path: relative, sha256: sha(fs.readFileSync(path.join(root, relative)))}));
  const schemaSha256 = sha(JSON.stringify(schema));
  const validated = new Set(), outputs = [];
  for (const relative of catalogPaths) {
    const bytes = fs.readFileSync(path.join(root, relative)), hash = sha(bytes);
    const imported = relative.startsWith('atlas-review/');
    const manifestPath = imported ? relative.slice('atlas-review/'.length) : relative.slice('public/atlas-runtime/head-neck/'.length);
    const matches = (imported ? source : runtime).files.filter(file => file.path === manifestPath);
    assert.equal(matches.length, 1, 'Catalog must have one source manifest entry');
    if (imported) {
      assert.equal(matches[0].sourceSha256, hash, 'Imported catalog source changed');
      assert.equal(matches[0].importedSha256, hash, 'Imported catalog bytes changed');
    } else assert.equal(matches[0].sha256, hash, 'Runtime catalog bytes changed');
    if (!validated.has(hash)) {
      validateCatalogContract(bytes.toString('utf8'), root);
      validated.add(hash);
    }
    const name = relative.replace(/\.json$/, '.d.json.ts');
    const expected = declarationFor(relative, hash, schemaSha256);
    if (check) assert.equal(fs.readFileSync(path.join(root, name), 'utf8'), expected, 'Stale catalog declaration: ' + name);
    outputs.push({path: name, sourcePath: relative, catalogSha256: hash, schemaSha256, content: expected});
  }
  // Validate both sources before writing either output. Do not rewrite JSON,
  // manifests, revisions, permissions or any existing runtime module.
  if (!check) for (const output of outputs)
    fs.writeFileSync(path.join(root, output.path), output.content);
  return {checked: check, validatedCatalogs: validated.size, files: outputs.map(({content, ...record}) => record)};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== '--check'))
    throw Error('Usage: atlas-catalog-types.mjs [--check]');
  console.log(JSON.stringify(generateCatalogTypes({websiteRoot: process.env.VM_WEBSITE_ROOT ?? ownRoot, check: args[0] === '--check'})));
}
