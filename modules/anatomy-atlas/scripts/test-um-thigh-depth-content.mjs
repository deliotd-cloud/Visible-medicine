import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { umThighDepth } from '../content/um-thigh-depth.ts';

const binding = JSON.parse(readFileSync(new URL('../content/um-limb-teaching-bindings.v1.json', import.meta.url), 'utf8'));
const slugs = [
  'rectus-femoris', 'vastus-intermedius', 'vastus-lateralis', 'vastus-medialis',
  'biceps-femoris-long-head', 'semitendinosus', 'semimembranosus',
  'adductor-longus', 'adductor-magnus', 'gluteus-medius',
];
const count = (text) => text.trim().split(/\s+/u).length;

test('ten exact source meshes have structured draft depth, bounded claims and source budgets', () => {
  const sourceSlugs = new Set(binding.bindings.filter(({ surface }) => surface.tissue === 'muscle' && surface.region === 'hip-thigh').map(({ surface }) => surface.slug));
  assert.deepEqual(Object.keys(umThighDepth).sort(), [...slugs].sort());
  const budgets = new Map();
  for (const [slug, lesson] of Object.entries(umThighDepth)) {
    assert.ok(sourceSlugs.has(slug), `${slug}: absent from source`);
    assert.deepEqual(Object.keys(lesson).sort(), ['arterialSupply', 'clinicalPitfall', 'modelLimit', 'relationships', 'revision', 'reviewScope', 'status'].sort(), slug);
    assert.equal(lesson.status, 'draft', slug);
    assert.equal(lesson.revision, 'um-thigh-depth-20261005-v1', slug);
    assert.equal(lesson.reviewScope, 'thigh-depth', slug);
    for (const topic of ['relationships', 'arterialSupply', 'clinicalPitfall']) {
      const entry = lesson[topic];
      assert.deepEqual(Object.keys(entry).sort(), ['body', 'references'], `${slug}/${topic}`);
      assert.ok(count(entry.body) >= 8 && count(entry.body) <= 45, `${slug}/${topic}: ${count(entry.body)} words`);
      assert.ok(entry.references.length > 0, `${slug}/${topic}: missing reference`);
      const urls = new Set();
      for (const ref of entry.references) {
        assert.deepEqual(Object.keys(ref).sort(), ['title', 'url'], `${slug}/${topic} reference`);
        assert.ok(ref.title.trim() && /^https:\/\/(?:www\.ncbi\.nlm\.nih\.gov|anatomy\.ttuhscep\.edu)\//u.test(ref.url), `${slug}/${topic}: named primary HTTPS reference`);
        assert.ok(!urls.has(ref.url), `${slug}/${topic}: duplicate reference`);
        urls.add(ref.url);
        budgets.set(ref.url, (budgets.get(ref.url) ?? 0) + count(entry.body));
      }
    }
    assert.ok(count(lesson.modelLimit) >= 14, `${slug}: explicit model limit`);
    assert.match(lesson.modelLimit, /(?:no |not |absent|cannot)/iu, `${slug}: limitation`);
    assert.match(lesson.modelLimit, /vessels/iu, `${slug}: vessels absent`);
    assert.match(lesson.modelLimit, /nerves?|neural/iu, `${slug}: nerves absent`);
    assert.match(lesson.modelLimit, /perfus/iu, `${slug}: perfusion not measured`);
  }
  const overBudget = [...budgets].filter(([, words]) => words > 200).map(([url, words]) => `${url}: ${words}`);
  assert.deepEqual(overBudget, [], `attribution over budget: ${overBudget.join('; ')}`);
  assert.match(umThighDepth['gluteus-medius'].relationships.body, /only its posterior portion is covered by gluteus maximus/iu);
  assert.doesNotMatch(JSON.stringify(umThighDepth), /(?:approved|validated) (?:anatomy|clinical|arterial|diagnosis)/iu);
  console.log(`UM thigh depth: ${slugs.length} draft source lessons; ${budgets.size} references within 200-word budgets.`);
});
