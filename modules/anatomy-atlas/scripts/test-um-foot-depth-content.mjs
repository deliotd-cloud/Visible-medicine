import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { umFootDepth } from '../content/um-foot-depth.ts';

const bindings = JSON.parse(readFileSync(new URL('../content/um-limb-teaching-bindings.v1.json', import.meta.url), 'utf8'));
const slugs = ['abductor-hallucis', 'abductor-digiti-minimi', 'flexor-digitorum-brevis',
  'quadratus-plantae', 'extensor-digitorum-brevis'];
const words = body => body.trim().split(/\s+/u).length;

test('five exact UM intrinsic-foot source surfaces have cited, bounded draft depth', () => {
  assert.deepEqual(Object.keys(umFootDepth).sort(), [...slugs].sort());
  const attribution = new Map();
  for (const slug of slugs) {
    const matches = bindings.bindings.filter(({ surface }) => surface.slug === slug);
    assert.equal(matches.length, 1, `${slug}: one source binding`);
    assert.equal(matches[0].surface.id, `vm:reference:um-5t6tz7-v1-2:lower-limb:${slug}`);
    assert.equal(matches[0].surface.region, 'foot');
    assert.equal(matches[0].surface.tissue, 'muscle');
    const lesson = umFootDepth[slug];
    assert.deepEqual(Object.keys(lesson).sort(), ['status', 'revision', 'reviewScope', 'relationships',
      'arterialSupply', 'clinicalPitfall', 'modelLimit'].sort(), slug);
    assert.equal(lesson.status, 'draft', slug);
    assert.equal(lesson.revision, 'um-foot-depth-20261005-v1', slug);
    assert.equal(lesson.reviewScope, 'foot-depth', slug);
    for (const topic of ['relationships', 'arterialSupply', 'clinicalPitfall']) {
      const entry = lesson[topic];
      assert.deepEqual(Object.keys(entry).sort(), ['body', 'references'], `${slug}/${topic}`);
      assert.ok(words(entry.body) >= 8 && words(entry.body) <= 45,
        `${slug}/${topic}: concise original prose (${words(entry.body)} words)`);
      assert.ok(entry.references.length > 0, `${slug}/${topic}: cited`);
      const seen = new Set();
      for (const { title, url } of entry.references) {
        assert.ok(title.trim(), `${slug}/${topic}: named source`);
        assert.match(url, /^https:\/\/(?:anatomy\.ttuhscep\.edu|www\.ncbi\.nlm\.nih\.gov|pubmed\.ncbi\.nlm\.nih\.gov)\//u);
        assert.ok(!seen.has(url), `${slug}/${topic}: no duplicate source`);
        seen.add(url);
        attribution.set(url, (attribution.get(url) ?? 0) + words(entry.body));
      }
    }
    for (const pattern of [/fascia|retinacul/iu, /nerves/iu, /vessels/iu,
      /perfus/iu, /load|loading/iu, /diagnos/iu])
      assert.match(lesson.modelLimit, pattern, `${slug}: model limit ${pattern}`);
  }
  for (const [url, count] of attribution)
    assert.ok(count <= 200, `${url}: ${count} attributed words exceeds 200`);

  assert.match(umFootDepth['abductor-hallucis'].relationships.body, /medial sole/iu);
  assert.match(umFootDepth['abductor-digiti-minimi'].relationships.body, /fifth toe/iu);
  assert.match(umFootDepth['abductor-digiti-minimi'].clinicalPitfall.body, /does not establish Baxter neuropathy/iu);
  assert.match(umFootDepth['flexor-digitorum-brevis'].relationships.body, /middle phalanges/iu);
  assert.match(umFootDepth['flexor-digitorum-brevis'].arterialSupply.body, /both medial and lateral plantar/iu);
  assert.match(umFootDepth['quadratus-plantae'].relationships.body, /not separate selections/iu);
  assert.match(umFootDepth['quadratus-plantae'].arterialSupply.body, /posterior tibial/iu);
  assert.match(umFootDepth['extensor-digitorum-brevis'].arterialSupply.body, /dorsalis pedis/iu);
  assert.match(umFootDepth['extensor-digitorum-brevis'].modelLimit, /Separate extensor hallucis brevis.*absent/iu);
  assert.doesNotMatch(JSON.stringify(umFootDepth), /(?:approved|validated) (?:anatomy|clinical|arterial|diagnosis)/iu);
  console.log(`UM foot depth: ${slugs.length} draft source lessons; ${attribution.size} cited sources within 200-word budgets.`);
});
