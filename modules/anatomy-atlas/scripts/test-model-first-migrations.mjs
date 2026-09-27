// Exercise the actual validator's complete binding checks without running its
// unrelated markup build or writing its generated report. Never edit app source.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import {
  modelFirstHandlerMigrations,
  modelFirstCallbackMigrations,
  modelFirstPracticeCallbackMigration,
  modelFirstLateCallbackMigrations,
} from './model-first-migrations.mjs';

const validator = await fs.readFile('scripts/validate-model-first.mjs', 'utf8');
const boundary = validator.indexOf('// Execute the actual migrated slider callback');
assert(boundary > 0, 'Binding-check boundary exists');
const prefix = validator.slice(0, boundary);
const ast = ts.createSourceFile('validator.mjs', prefix, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
let executable = prefix;
for (const node of [...ast.statements].reverse()) {
  if (ts.isImportDeclaration(node))
    executable = executable.slice(0, node.getStart(ast)) + executable.slice(node.end);
}
const runChecks = new Function('fs', 'assert', 'execFileSync', 'createHash', 'ts',
  'modelFirstHandlerMigrations', 'modelFirstCallbackMigrations',
  'modelFirstPracticeCallbackMigration', 'modelFirstLateCallbackMigrations', 'runInNewContext', 'process',
  `return (async () => { ${executable} })();`);
const source = await fs.readFile('app/body-explorer.tsx', 'utf8');
async function validate(candidate) {
  const fixtureFs = {
    ...fs,
    readFile: (path, ...args) => path === 'app/body-explorer.tsx'
      ? Promise.resolve(candidate) : fs.readFile(path, ...args),
    writeFile: () => { throw new Error('Binding fixture must not write evidence'); },
  };
  return runChecks(fixtureFs, assert, execFileSync, createHash, ts,
    modelFirstHandlerMigrations, modelFirstCallbackMigrations,
    modelFirstPracticeCallbackMigration, modelFirstLateCallbackMigrations, runInNewContext, { argv: [] });
}
await validate(source);
const mutations = [
  ['Pinned handler drift', source.replace('function captureView(): StudyView {',
    'function captureView(): StudyView { const unexpectedDrift = true;')],
  ['Unrecognized handler', source + '\nfunction unexpectedHandler() { return true; }\n'],
  ['Pinned callback drift', source.replace('exam ? exitPractice() : startExam()',
    'exam ? exitPractice(false) : startExam()')],
  ['Callback multiplicity drift', source + '\nconst unexpectedCallback = <Button onClick={() => exitPractice()} />;\n'],
];
for (const [name, candidate] of mutations) {
  assert.notEqual(candidate, source, `${name} fixture changes source`);
  await assert.rejects(validate(candidate), error => {
    assert.equal(error.code, 'ERR_ASSERTION');
    assert.match(error.message,
      /Named handlers preserved|Retained callbacks and explicit navigation/);
    return true;
  }, name);
}
console.log({ passed: true, exactHistoricalReplays: 4, unchangedSourceAccepted: true,
  rejectedDriftCases: mutations.length, writes: 0 });
