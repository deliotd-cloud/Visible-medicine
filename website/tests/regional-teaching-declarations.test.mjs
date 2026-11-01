import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const entry = path.join(root, 'atlas-review/lib/regional-teaching-imports.ts');
const snapshots = path.join(root, 'atlas-review/content/regional-teaching');
const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
assert.equal(config.error, undefined);
const converted = ts.convertCompilerOptionsFromJson(config.config.compilerOptions, root);
assert.deepEqual(converted.errors, []);
const options = {
  ...converted.options, noEmit: true, incremental: false,
  types: [], lib: ['lib.es2022.d.ts'],
};

test('imported teaching snapshots use unknown declarations with the website compiler', () => {
  assert.equal(options.allowArbitraryExtensions, true);
  const program = ts.createProgram([entry], options);
  assert.deepEqual(ts.getPreEmitDiagnostics(program).map(d => ts.flattenDiagnosticMessageText(d.messageText, ' ')), []);
  const modules = program.getSourceFiles().filter(s => /content[/\\]regional-teaching[/\\]/.test(s.fileName));
  const expected = fs.readdirSync(snapshots).filter(p => p.endsWith('.json')).map(p => p.replace(/\.json$/, '.d.json.ts')).sort();
  assert.equal(expected.length, 11);
  assert.deepEqual(modules.map(s => path.basename(s.fileName)).sort(), expected);
  const checker = program.getTypeChecker();
  for (const source of modules) {
    const exported = checker.getExportsOfModule(checker.getSymbolAtLocation(source)).find(s => s.name === 'default');
    assert(exported);
    assert.equal(checker.getTypeOfSymbolAtLocation(exported, source).flags, ts.TypeFlags.Unknown, source.fileName);
  }
});

test('turning off the required compiler option is detected', () => {
  const program = ts.createProgram([entry], { ...options, allowArbitraryExtensions: false });
  assert(ts.getPreEmitDiagnostics(program).some(d => d.code === 6263));
});

test('all imported regional snapshots still load their exact runtime JSON', async () => {
  const { regionalTeachingImports } = await import(pathToFileURL(entry).href);
  assert.equal(Object.keys(regionalTeachingImports).length, 11);
  for (const [region, load] of Object.entries(regionalTeachingImports)) {
    assert.deepEqual((await load()).default, JSON.parse(fs.readFileSync(path.join(snapshots, region + '.json'), 'utf8')), region);
  }
});
