import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-component-test-build.mjs';

const bundle = await build({
  stdin: {
    contents: [
      "export { SpecimenDepthNotes } from './app/specimen-depth-notes.tsx';",
      "export { SpecimenLearning } from './app/um-limb-learning.tsx';",
      "export { umCalfDepth } from './content/um-calf-depth.ts';",
      "export { limbDefinitions } from './lib/um-limb-studies.ts';",
    ].join('\n'),
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, format: 'cjs', platform: 'node',
  plugins: [{ name: 'scene-boundary', setup(api) {
    api.onLoad({ filter: /body-scene\.tsx$/ }, () => ({ loader: 'js', contents: 'export function BodyScene() { return null; }' }));
  } }],
});
const require = createRequire(import.meta.url);
const React = require('react');
const module = { exports: {} };
runInNewContext(bundle.outputFiles[0].text, {
  module, exports: module.exports, require, URL, console,
  process: { env: { NODE_ENV: 'test' } },
});
const { SpecimenDepthNotes, SpecimenLearning, umCalfDepth, limbDefinitions } = module.exports;
const render = (Component, props) => require('react-dom/server').renderToStaticMarkup(React.createElement(Component, props));
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
const visibleText = html => html.replace(/<[^>]*>/gu, ' ');
const slugs = [
  'tibialis-anterior', 'tibialis-posterior', 'flexor-digitorum-longus',
  'flexor-hallucis-longus', 'peroneus-longus', 'soleus',
  'gastrocnemius-medial', 'gastrocnemius-lateral', 'popliteus',
];
assert.deepEqual(Object.keys(umCalfDepth).sort(), slugs.sort());

for (const slug of slugs) {
  const depth = umCalfDepth[slug];
  for (const section of ['anatomy', 'clinical', 'review']) {
    const html = render(SpecimenDepthNotes, { depth, section });
    const text = visibleText(html);
    assert.match(html, /Model limit:/u, `${slug}/${section}: model limit`);
    assert.ok(html.includes(escape(depth.modelLimit)), `${slug}/${section}: actual limit`);
    assert.match(text, /specialist review pending/u, `${slug}/${section}: draft status`);
    assert.doesNotMatch(text, /https?:\/\//u, `${slug}/${section}: no raw URL in reading text`);
    assert.doesNotMatch(html, /<button\b/iu, `${slug}/${section}: no button`);
    assert.doesNotMatch(text, /(?:scan|image) (?:is )?registered|(?:clinically )?approved/iu, `${slug}/${section}: no registration or approval claim`);
    if (section === 'review') {
      assert.match(html, /<section aria-label="Calf depth to review">/u, `${slug}: review section`);
      assert.doesNotMatch(html, /<details\b/u, `${slug}: review always visible`);
      assert.ok(html.includes(escape(depth.revision)), `${slug}: revision visible`);
    } else {
      assert.match(html, /^<details\b/u, `${slug}/${section}: learner disclosure`);
      assert.doesNotMatch(html.match(/^<details[^>]*>/u)?.[0] ?? '', /\bopen\b/u, `${slug}/${section}: collapsed`);
    }
    for (const [topic, title] of [
      ['relationships', 'Relationships'], ['arterialSupply', 'Typical arterial supply'], ['clinicalPitfall', 'Clinical pitfall'],
    ]) {
      const expected = section === 'review' || (section === 'anatomy' ? topic !== 'clinicalPitfall' : topic === 'clinicalPitfall');
      assert.equal(html.includes(escape(depth[topic].body)), expected, `${slug}/${section}: ${topic} scope`);
      assert.equal(html.includes(`<h4>${title}</h4>`), expected, `${slug}/${section}: ${topic} title`);
      for (const ref of depth[topic].references) {
        if (expected) {
          assert.ok(html.includes(`href="${escape(ref.url)}"`), `${slug}/${section}: reading link`);
          assert.ok(html.includes(escape(ref.title)), `${slug}/${section}: readable source title`);
        }
      }
    }
  }
}

const whole = limbDefinitions.whole;
for (const slug of slugs) {
  const selected = whole.surfaces.find(surface => surface.slug === slug);
  assert.ok(selected, `${slug}: source selection`);
  for (const initialTopic of ['anatomy', 'clinical']) {
    const html = render(SpecimenLearning, { definition: whole, selected, initialTopic });
    assert.match(html, /^<details[^>]*\bopen=""/u, `${slug}/${initialTopic}: direct link opens Learn`);
    assert.ok(html.includes(escape(umCalfDepth[slug].modelLimit)), `${slug}/${initialTopic}: selected depth bound`);
    assert.ok(html.includes(escape(initialTopic === 'anatomy' ? umCalfDepth[slug].relationships.body : umCalfDepth[slug].clinicalPitfall.body)), `${slug}/${initialTopic}: selected mode rendered`);
    assert.ok(!html.includes(escape(initialTopic === 'anatomy' ? umCalfDepth[slug].clinicalPitfall.body : umCalfDepth[slug].relationships.body)), `${slug}/${initialTopic}: other mode hidden`);
  }
}
const other = whole.surfaces.find(surface => surface.slug === 'extensor-digitorum-longus');
assert.ok(other, 'untargeted source available');
const untargeted = render(SpecimenLearning, { definition: whole, selected: other, initialTopic: 'anatomy' });
assert.doesNotMatch(untargeted, /Calf depth to review|Relationships &amp; blood supply|Clinical depth · pitfall/u, 'untargeted source receives no depth');
const selected = whole.surfaces.find(surface => surface.slug === slugs[0]);
for (const initialTopic of ['anatomy', 'clinical']) {
  const unavailable = render(SpecimenLearning, { definition: whole, selected, initialTopic, resolveLesson: () => null });
  assert.match(unavailable, /Teaching unavailable for this source binding; no substitute was used\./u, 'null adapter stays unavailable');
  assert.doesNotMatch(unavailable, /Relationships &amp; blood supply|Clinical depth · pitfall/u, 'null adapter receives no depth');
}
console.log(`UM calf depth component: ${slugs.length * 3} mode cases, ${slugs.length * 2} integrated selections, untargeted/null adapter checked.`);
