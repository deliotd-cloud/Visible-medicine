import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import {fileURLToPath} from 'node:url';
import {join,resolve} from 'node:path';

// Transpile the actual TypeScript helper, using the already installed compiler.
const proposalRoot=fileURLToPath(new URL('../',import.meta.url));
const requireFromAtlas = createRequire(join(resolve(process.env.VM_ATLAS_SOURCE_ROOT ?? proposalRoot),'package.json'));
const ts = requireFromAtlas('typescript');
const source = await readFile(new URL('../lib/quick-check-choice-order.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
});
assert.deepEqual(compiled.diagnostics ?? [], [], 'TypeScript helper must transpile cleanly');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`;
const { orderQuickCheckChoices: order } = await import(moduleUrl);
const { orderQuickCheckChoices: freshOrder } = await import(`${moduleUrl}#fresh-render`);

function checkPermutation(question, choices) {
  const original = [...choices];
  const result = order(question, choices);
  assert.notStrictEqual(result, choices, 'returns a new array');
  assert.deepEqual(choices, original, 'does not mutate the input');
  assert.deepEqual([...result].sort(), [...original].sort(), 'preserves each exact label and multiplicity');
  assert.deepEqual(order(question, choices), result, 'repeat calls are stable');
  assert.deepEqual(freshOrder(question, choices), result, 'fresh module evaluation is stable');
  return result;
}

const frozen = Object.freeze(['  A  ', '', 'A', 'A', '🫀 心臓', 'e\u0301', 'é']);
checkPermutation('Which structure? \u0000 \"quoted\"', frozen);
checkPermutation('', Object.freeze([]));
checkPermutation('Single answer', Object.freeze(['  exact  ']));
checkPermutation('All duplicates', Object.freeze(['same', 'same', 'same']));
checkPermutation('Unicode labels', Object.freeze(['筋', '🧠', 'café', 'cafe\u0301']));

// In a representative synthetic bank whose authored correct choice is first,
// mixing should place that choice at multiple display positions.
const authoredChoices = Object.freeze(['authored correct', 'distractor B', 'distractor C', 'distractor D']);
const positions = new Set();
for (let index = 0; index < 32; index += 1) {
  const displayed = checkPermutation(`Synthetic prompt ${index}: identify the structure`, authoredChoices);
  positions.add(displayed.indexOf(authoredChoices[0]));
}
assert.ok(positions.size >= 3, `expected multiple displayed positions; got ${[...positions]}`);
assert.ok(positions.has(1) || positions.has(2) || positions.has(3), 'authored first choice must move');

console.log(JSON.stringify({ cases: 37, syntheticBank: 32, displayedPositions: [...positions].sort(), deterministic: true }));
