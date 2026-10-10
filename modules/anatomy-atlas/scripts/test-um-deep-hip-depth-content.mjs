import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { umDeepHipDepth } from '../content/um-deep-hip-depth.ts';

const binding = JSON.parse(readFileSync(new URL('../content/um-limb-teaching-bindings.v1.json', import.meta.url), 'utf8'));
const slugs = ['piriformis', 'superior-gemellus', 'inferior-gemellus',
  'obturator-internus', 'obturator-externus', 'quadratus-femoris'];
const count = text => text.trim().split(/\s+/u).length;

test('six exact source deep-hip muscles have bounded, cited and review-scoped draft depth', () => {
  assert.deepEqual(Object.keys(umDeepHipDepth).sort(), [...slugs].sort());
  const budgets = new Map();
  for (const slug of slugs) {
    const source = binding.bindings.filter(({ surface }) => surface.slug === slug);
    assert.equal(source.length, 1, `${slug}: one pinned source surface`);
    assert.equal(source[0].surface.id, `vm:reference:um-5t6tz7-v1-2:lower-limb:${slug}`);
    assert.equal(source[0].surface.region, 'hip-thigh');
    assert.equal(source[0].surface.tissue, 'muscle');
    const lesson = umDeepHipDepth[slug];
    assert.deepEqual(source[0].lesson.depth, lesson, `${slug}: exact current source pin`);
    assert.deepEqual(Object.keys(lesson).sort(), ['arterialSupply', 'clinicalPitfall', 'modelLimit',
      'relationships', 'revision', 'reviewScope', 'status'].sort(), slug);
    assert.equal(lesson.status, 'draft', slug);
    assert.equal(lesson.revision, 'um-deep-hip-depth-20261005-v1', slug);
    assert.equal(lesson.reviewScope, 'thigh-depth', slug);
    for (const topic of ['relationships', 'arterialSupply', 'clinicalPitfall']) {
      const entry = lesson[topic];
      assert.deepEqual(Object.keys(entry).sort(), ['body', 'references'], `${slug}/${topic}`);
      assert.ok(count(entry.body) >= 8 && count(entry.body) <= 45,
        `${slug}/${topic}: ${count(entry.body)} words`);
      assert.ok(entry.references.length > 0, `${slug}/${topic}: missing primary reference`);
      const urls = new Set();
      for (const ref of entry.references) {
        assert.deepEqual(Object.keys(ref).sort(), ['title', 'url'], `${slug}/${topic} reference`);
        assert.ok(ref.title.trim() && /^https:\/\/(?:www\.ncbi\.nlm\.nih\.gov|pubmed\.ncbi\.nlm\.nih\.gov|pmc\.ncbi\.nlm\.nih\.gov|anatomy\.ttuhscep\.edu|rad\.uw\.edu|www\.elsevier\.com)\//u.test(ref.url),
          `${slug}/${topic}: named primary HTTPS reference`);
        assert.ok(!urls.has(ref.url), `${slug}/${topic}: duplicate reference`);
        urls.add(ref.url);
        budgets.set(ref.url, (budgets.get(ref.url) ?? 0) + count(entry.body));
      }
    }
    assert.ok(count(lesson.modelLimit) >= 14, `${slug}: explicit model limit`);
    for (const pattern of [/vessels/iu, /nerves/iu, /perfus/iu, /diagnos/iu])
      assert.match(lesson.modelLimit, pattern, `${slug}: limit ${pattern}`);
    assert.match(lesson.modelLimit, /(?:no |not |absent)/iu);
  }
  assert.deepEqual([...budgets].filter(([, words]) => words > 200), [], 'source attribution under 200 words each');
  assert.match(umDeepHipDepth.piriformis.relationships.body, /greater sciatic foramen/iu);
  assert.match(umDeepHipDepth['obturator-internus'].relationships.body, /lesser sciatic foramen/iu);
  assert.match(umDeepHipDepth['obturator-externus'].relationships.body, /behind the femoral neck/iu);
  for (const slug of ['superior-gemellus', 'inferior-gemellus'])
    assert.match(umDeepHipDepth[slug].relationships.body, /tendon/iu);
  assert.match(umDeepHipDepth['quadratus-femoris'].clinicalPitfall.body, /ischiofemoral impingement/iu);
  for (const slug of ['quadratus-femoris', 'inferior-gemellus']) {
    assert.match(umDeepHipDepth[slug].arterialSupply.body, /inferior gluteal/iu);
    assert.match(umDeepHipDepth[slug].arterialSupply.body, /medial circumflex femoral/iu);
  }
  assert.doesNotMatch(JSON.stringify(umDeepHipDepth), /(?:approved|validated) (?:anatomy|clinical|arterial|diagnosis)/iu);
  console.log(`UM deep-hip depth: ${slugs.length} source-bound draft lessons; ${budgets.size} primary references within 200-word budgets.`);
});
