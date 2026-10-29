import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const proposalRoot = fileURLToPath(new URL('../', import.meta.url));
const atlasRoot = resolve(process.env.VM_ATLAS_SOURCE_ROOT ?? proposalRoot);
const sourceRequire = createRequire(join(atlasRoot, 'package.json'));
const ts = sourceRequire('typescript');
const compile = path => ts.transpileModule(readFileSync(path, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const evaluate = (path, require) => {
  const module = { exports: {} };
  runInNewContext(compile(path), { module, exports: module.exports, require });
  return module.exports;
};
const canonicalModule = evaluate(join(atlasRoot, 'lib/body-source-additions.ts'), name => {
  if (name === './body-presentation-parts.ts') return { validBodyPresentationParts: () => true };
  throw Error(`Unexpected canonical dependency: ${name}`);
});
const tabs = evaluate(join(atlasRoot, 'lib/content-types.ts'), () => { throw Error('Unexpected tab dependency'); }).contentTabs;
const modules = [
  { name: 'cranial-arteries', method: 'cranialArteryLesson', count: 5,
    baselineHash: '503181d76e2a323134da111234bd3842c85026ecf8cae460138271b7279f3804',
    answer: s => s.fmaId === 'FMA50082' ? 'internal carotid artery'
      : ['FMA50519', 'FMA50520'].includes(s.fmaId) ? 'vertebral artery' : 'basilar artery' },
  { name: 'inferior-thyroid-arteries', method: 'inferiorThyroidLesson', count: 2,
    baselineHash: 'cd1a636fef9058321d3256fc6d2e444d3de6d79ab34069bda8706076df0349a0',
    answer: () => 'Thyrocervical trunk' },
  { name: 'subscapular-arteries', method: 'subscapularArteryLesson', count: 2,
    baselineHash: 'f2bf9dd0cfb5846221865f83fbb8bf1680ea38533b8aa562dd41f58249bb63db',
    answer: () => 'Circumflex scapular and thoracodorsal arteries' },
];
for (const entry of modules) {
  const beforePath = join(proposalRoot, `scripts/fixtures/${entry.name}.before.ts.txt`);
  assert.equal(createHash('sha256').update(readFileSync(beforePath)).digest('hex'), entry.baselineHash, `${entry.name} exact baseline`);
  entry.catalog = JSON.parse(readFileSync(join(atlasRoot, `public/models/bodyparts3d/${entry.name}/catalog.json`), 'utf8'));
  const dependency = name => {
    if (name.endsWith(`/${entry.name}/catalog.json`)) return { default: entry.catalog };
    if (name === './body-source-additions' || name === './body-source-additions.ts') return canonicalModule;
    throw Error(`Unexpected ${entry.name} dependency: ${name}`);
  };
  entry.before = evaluate(beforePath, dependency)[entry.method];
  entry.after = evaluate(join(proposalRoot, `lib/${entry.name}.ts`), dependency)[entry.method];
}

test('all real catalog selections have one explicit four-option answer and retain draft context', () => {
  let placements = 0;
  for (const entry of modules) {
    assert.equal(entry.catalog.structures.length, entry.count, entry.name);
    for (const structure of entry.catalog.structures) {
      placements++;
      const old = entry.before(structure, 'quiz');
      const lesson = entry.after(structure, 'quiz');
      const answer = entry.answer(structure);
      assert.equal(lesson.readiness, 'draft');
      assert.equal(lesson.title, old.title);
      assert.deepEqual(structuredClone(lesson.citations), structuredClone(old.citations));
      assert.equal(lesson.bullets.length, 4);
      assert.equal(new Set(lesson.bullets).size, 4);
      assert.equal(lesson.correctAnswer, answer);
      assert.equal(lesson.bullets.filter(choice => choice === answer).length, 1);
      assert(!lesson.body.includes(answer), `${entry.name} prompt reveals answer`);
      assert(lesson.explanation.toLowerCase().includes(answer.toLowerCase()));
      assert.match(lesson.explanation, /does not|not verify/);
      if (entry.name === 'cranial-arteries') {
        assert(lesson.note.startsWith(old.note));
        assert(lesson.note.includes(structure.coverageNote));
        assert(!lesson.bullets.includes(structure.coverageNote));
      } else assert.equal(lesson.note, old.note);
    }
  }
  assert.equal(placements, 9);
});

test('actual sourceCanonical guard refuses malformed and mutated records', () => {
  for (const entry of modules) {
    const pin = entry.catalog.structures[0];
    const changed = structuredClone(pin); changed.name += ' changed';
    assert.notEqual(canonicalModule.sourceCanonical(changed), canonicalModule.sourceCanonical(pin));
    for (const candidate of [{}, { id: pin.id }, { ...pin, id: 'other-source' }, changed])
      for (const tab of tabs) assert.equal(entry.after(candidate, tab), undefined, `${entry.name} / ${tab}`);
  }
});

test('every non-quiz output matches its exact baseline', () => {
  for (const entry of modules) for (const structure of entry.catalog.structures)
    for (const tab of tabs.filter(tab => tab !== 'quiz'))
      assert.deepEqual(structuredClone(entry.after(structure, tab)), structuredClone(entry.before(structure, tab)),
        `${entry.name} / ${structure.id} / ${tab}`);
});
