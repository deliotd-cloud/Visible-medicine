import assert from 'node:assert/strict';
import { umCalfDepth } from '../content/um-calf-depth.ts';

const slugs = [
  'tibialis-anterior', 'tibialis-posterior', 'flexor-digitorum-longus',
  'flexor-hallucis-longus', 'peroneus-longus', 'soleus',
  'gastrocnemius-medial', 'gastrocnemius-lateral', 'popliteus',
];
const count = text => text.trim().split(/\s+/u).length;
assert.deepEqual(Object.keys(umCalfDepth).sort(), slugs.sort(), 'exactly the nine admitted source slugs');

const referenceBudgets = new Map();
for (const [slug, lesson] of Object.entries(umCalfDepth)) {
  assert.deepEqual(Object.keys(lesson).sort(), ['arterialSupply', 'clinicalPitfall', 'modelLimit', 'relationships', 'revision', 'status'].sort(), slug);
  assert.equal(lesson.status, 'draft', slug);
  assert.equal(lesson.revision, 'um-calf-depth-20261005-v1', slug);
  for (const [topic, min, max] of [
    ['relationships', 24, 40], ['arterialSupply', 10, 20], ['clinicalPitfall', 20, 35],
  ]) {
    const entry = lesson[topic];
    assert.deepEqual(Object.keys(entry).sort(), ['body', 'references'], `${slug}/${topic}`);
    assert.ok(count(entry.body) >= min && count(entry.body) <= max, `${slug}/${topic}: ${count(entry.body)} words`);
    assert.ok(entry.references.length > 0, `${slug}/${topic}: source required`);
    const urls = new Set();
    for (const ref of entry.references) {
      assert.deepEqual(Object.keys(ref).sort(), ['title', 'url'], `${slug}/${topic} reference`);
      assert.ok(ref.title.trim() && /^https:\/\//u.test(ref.url), `${slug}/${topic}: named HTTPS reference`);
      assert.ok(!urls.has(ref.url), `${slug}/${topic}: duplicate reference`);
      urls.add(ref.url);
      referenceBudgets.set(ref.url, (referenceBudgets.get(ref.url) ?? 0) + count(entry.body));
    }
  }
  assert.match(lesson.modelLimit, /fascia|retinacul|capsul/u, `${slug}: absent covering`);
  assert.match(lesson.modelLimit, /vessels/u, `${slug}: absent vessels`);
  assert.match(lesson.modelLimit, /nerves/u, `${slug}: absent nerves`);
  assert.match(lesson.modelLimit, /perfus/u, `${slug}: no measured perfusion`);
  assert.match(lesson.modelLimit, /cannot|no |not |absent/iu, `${slug}: limitation`);
}
for (const [url, words] of referenceBudgets) assert.ok(words <= 200, `${url}: ${words} attributed words`);
assert.match(umCalfDepth.popliteus.arterialSupply.body, /variably/u);
assert.match(umCalfDepth['gastrocnemius-lateral'].clinicalPitfall.body, /does not establish a lateral-head injury frequency/u);
assert.match(umCalfDepth['peroneus-longus'].relationships.body, /Fibularis longus/u);
console.log(`UM calf depth: ${slugs.length} draft source lessons; ${referenceBudgets.size} references within 200-word budgets.`);
