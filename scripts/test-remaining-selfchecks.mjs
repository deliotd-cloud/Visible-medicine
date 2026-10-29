import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const proposal = fileURLToPath(new URL('../', import.meta.url));
const atlas = resolve(process.env.VM_ATLAS_SOURCE_ROOT ?? proposal);
const ts = createRequire(join(atlas, 'package.json'))('typescript');
const fixtureHashes = {
  'corpus-spongiosum.before.ts.txt': 'e8160f2ae0be2de646b4cebba199b67ea8e96f98f2809c877c70022c27da4972',
  'circumflex-femoral.before.ts.txt': '71313635f2ae5a4fa5f7726adf6f6e92fb48a4ae2e43fd7a721860c062a7ccf4',
  'anterior-cardiac-vein.before.ts.txt': '65e542313743aa1b81e0bd6b131dd3bd9492830043631504ee59e4ff7cd5ff49',
  'foot-sesamoid-teaching.before.ts.txt': '3fff1e3731ad28496af251623c2719a9ac49317a899a8b3e6c6d1df552b99bef',
  'foot-sesamoid-content.before.ts.txt': 'd25249c8f585bdf706c187c0e013342322ca85c073a3439a2efa187dcfcc6b7a',
};
const compile = path => ts.transpileModule(readFileSync(path, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const evaluate = (path, dependencies) => {
  const module = { exports: {} };
  runInNewContext(compile(path), { module, exports: module.exports, require: dependencies });
  return module.exports;
};
const unexpected = name => { throw Error(`Unexpected dependency: ${name}`); };
const canonical = evaluate(join(atlas, 'lib/body-source-additions.ts'), name => {
  if (name === './body-presentation-parts.ts') return { validBodyPresentationParts: () => true };
  return unexpected(name);
});
const tabs = evaluate(join(atlas, 'lib/content-types.ts'), unexpected).contentTabs;
const catalog = name => JSON.parse(readFileSync(join(atlas, `public/models/bodyparts3d/${name}/catalog.json`), 'utf8'));
const pins = JSON.parse(readFileSync(join(atlas, 'content/foot-sesamoid-teaching-pins.json'), 'utf8'));
const content = (before) => evaluate(before
  ? join(proposal, 'scripts/fixtures/foot-sesamoid-content.before.ts.txt')
  : join(proposal, 'content/foot-sesamoid-teaching.ts'), unexpected).footSesamoidLessons;
const cases = [
  { name: 'corpus-spongiosum', fn: 'corpusSpongiosumLesson', fixture: 'corpus-spongiosum.before.ts.txt',
    structures: catalog('corpus-spongiosum').structures, answer: () => 'Corpus spongiosum',
    citations: ['https://training.seer.cancer.gov/anatomy/reproductive/male/penis.html'] },
  { name: 'circumflex-femoral', fn: 'circumflexFemoralLesson', fixture: 'circumflex-femoral.before.ts.txt',
    structures: catalog('circumflex-femoral').structures, answer: () => 'Lateral circumflex femoral artery',
    citations: ['https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-lower-limb/'] },
  { name: 'anterior-cardiac-vein', fn: 'anteriorCardiacVeinLesson', fixture: 'anterior-cardiac-vein.before.ts.txt',
    structures: catalog('anterior-cardiac-vein').structures, answer: () => 'Right atrium',
    citations: ['https://pubmed.ncbi.nlm.nih.gov/1163193/', 'https://pubmed.ncbi.nlm.nih.gov/12645157/',
      'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-thorax/'] },
  { name: 'foot-sesamoid-teaching', fn: 'footSesamoidLesson', fixture: 'foot-sesamoid-teaching.before.ts.txt',
    structures: pins.entries.map(e => e.identity),
    answer: () => 'Bipartition is favoured; injury still requires clinical and imaging correlation.',
    citations: ['https://www.orthoinfo.org/diseases--conditions/sesamoiditis/',
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC3781258/'] },
];
const load = (entry, before) => {
  const path = before ? join(proposal, 'scripts/fixtures', entry.fixture) : join(proposal, 'lib', `${entry.name}.ts`);
  return evaluate(path, name => {
    if (name === './body-source-additions' || name === './body-source-additions.ts') return canonical;
    if (name === '../content/foot-sesamoid-teaching') return { footSesamoidLessons: content(before) };
    if (name === '../content/corpus-clinical') return evaluate(join(atlas, 'content/corpus-clinical.ts'), unexpected);
    if (name === '../content/foot-sesamoid-teaching-pins.json') return { default: pins };
    if (name === `../public/models/bodyparts3d/${entry.name}/catalog.json`) return { default: catalog(entry.name) };
    return unexpected(name);
  })[entry.fn];
};
const plain = value => structuredClone(value);

test('fixtures are pinned to the exact saved baseline', () => {
  for (const [file, hash] of Object.entries(fixtureHashes)) {
    assert.equal(createHash('sha256').update(readFileSync(join(proposal, 'scripts/fixtures', file))).digest('hex'), hash);
  }
  assert.deepEqual(cases.map(x => x.structures.length), [1, 2, 1, 2]);
  assert.deepEqual(cases.flatMap(x => x.structures.map(s => s.fmaId)),
    ['FMA19617','FMA21422','FMA21423','FMA76767','FMA45097','FMA45098']);
});

test('six actual draft placements have four exclusive choices and source-backed feedback', () => {
  for (const entry of cases) {
    const before = load(entry, true), after = load(entry, false);
    for (const structure of entry.structures) {
      const old = before(structure, 'quiz'), lesson = after(structure, 'quiz');
      assert.equal(lesson.readiness, 'draft');
      assert.equal(lesson.title, old.title);
      assert.equal(lesson.note.includes('review'), true);
      assert.match(lesson.note, /draft|review pending|radiologist review/i);
      assert.equal(lesson.bullets.length, 4);
      assert.equal(new Set(lesson.bullets).size, 4);
      assert.equal(lesson.correctAnswer, entry.answer(structure));
      assert.equal(lesson.bullets.filter(x => x === lesson.correctAnswer).length, 1);
      assert(!lesson.body.toLowerCase().includes(lesson.correctAnswer.toLowerCase()));
      assert(lesson.explanation.length > 80);
      assert.deepEqual(plain(lesson.citations), entry.citations);
      assert.deepEqual(Object.keys(lesson).sort(), ['body','bullets','citations','correctAnswer','explanation','note','readiness','title'].sort());
      assert.equal(lesson.note.includes('source selection is a generic side-specific'), entry.name === 'foot-sesamoid-teaching');
    }
  }
});

test('non-quiz outputs remain exact, including own keys and readiness', () => {
  for (const entry of cases) {
    const before = load(entry, true), after = load(entry, false);
    for (const structure of entry.structures) for (const tab of tabs.filter(x => x !== 'quiz')) {
      assert.deepEqual(plain(after(structure, tab)), plain(before(structure, tab)), `${entry.name} ${structure.id} ${tab}`);
    }
  }
});

test('identity, side, source and geometry changes fail closed', () => {
  for (const entry of cases) {
    const after = load(entry, false);
    for (const structure of entry.structures) {
      const mutations = [
        { ...structure, id: `${structure.id}:wrong` },
        { ...structure, name: `${structure.name} changed` },
        { ...structure, laterality: structure.laterality === 'left' ? 'right' : 'left' },
        { ...structure, sourceSha256: '0'.repeat(64) },
        { ...structure, coverageNote: 'changed' },
      ];
      if (structure.sources?.length) mutations.push({
        ...structure, sources: structure.sources.map((source, index) => index ? source : { ...source, sha256: '0'.repeat(64) }),
      });
      for (const mutation of mutations) {
        assert.notEqual(canonical.sourceCanonical(mutation), canonical.sourceCanonical(structure));
        for (const tab of tabs) assert.equal(after(mutation, tab), undefined, `${entry.name} ${tab}`);
      }
    }
  }
});
