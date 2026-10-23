import ts from 'typescript';
import assert from 'node:assert/strict';

const loaded = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
assert(!loaded.error);
const config = ts.parseJsonConfigFileContent(loaded.config, ts.sys, process.cwd());
assert.equal(config.errors.length, 0);
assert.equal(config.options.strict, true, 'Use the actual strict project configuration');
const roots = ['lib/hip-relationships-reasoning.ts', 'lib/reasoning-questions.ts'];
const program = ts.createProgram(roots, { ...config.options, noEmit: true, incremental: false });
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getCanonicalFileName: f => f,
  getNewLine: () => '\n',
}));
console.log(JSON.stringify({ roots, sourceFiles: program.getSourceFiles().length, diagnostics: diagnostics.length, fullProject: false, actualStrictConfiguration: true }));
assert.equal(diagnostics.length, 0);
