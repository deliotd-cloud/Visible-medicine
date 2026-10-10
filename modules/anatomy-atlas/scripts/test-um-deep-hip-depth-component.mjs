import assert from 'node:assert/strict';
import {umDeepHipDepthMilestonePlugin,umDeepHipDepthMilestone} from './um-deep-hip-depth-history.mjs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { readFileSync } from 'node:fs';
import { build } from './workspace-component-test-build.mjs';

const bundle = await build({
  stdin: {
    contents: [
      "export { SpecimenDepthNotes } from './app/specimen-depth-notes.tsx';",
      "export { SpecimenLearning } from './app/um-limb-learning.tsx';",
      "export { umDeepHipDepth } from './content/um-deep-hip-depth.ts';",
      "export { limbDefinitions } from './lib/um-limb-studies.ts';",
    ].join('\n'), resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, format: 'cjs', platform: 'node',
  plugins: [umDeepHipDepthMilestonePlugin(), { name: 'scene-boundary', setup(api) {
    api.onLoad({ filter: /body-scene\.tsx$/ }, () => ({ loader: 'js', contents: 'export function BodyScene() { return null; }' }));
  } }],
});
const require = createRequire(import.meta.url), React = require('react'), module = { exports: {} };
runInNewContext(bundle.outputFiles[0].text, {
  module, exports: module.exports, require, URL, console,
  process: { env: { NODE_ENV: 'test' } },
});
const { SpecimenDepthNotes, SpecimenLearning, umDeepHipDepth, limbDefinitions } = module.exports;
const render = (Component, props) => require('react-dom/server').renderToStaticMarkup(React.createElement(Component, props));
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
const visibleText = html => html.replace(/<[^>]*>/gu, ' ');
const slugs = ['piriformis','superior-gemellus','inferior-gemellus','obturator-internus','obturator-externus','quadratus-femoris'];
assert.deepEqual(Object.keys(umDeepHipDepth).sort(), [...slugs].sort());
let integrated = 0;
for (const slug of slugs) {
  const depth = umDeepHipDepth[slug];
  for (const section of ['anatomy', 'clinical', 'review']) {
    const html = render(SpecimenDepthNotes, { depth, section }), text = visibleText(html);
    assert.ok(html.includes(escape(depth.modelLimit)), `${slug}/${section}: actual limit`);
    assert.match(text, /specialist review pending/u);
    assert.doesNotMatch(text, /https?:\/\//u);
    assert.doesNotMatch(html, /<button\b/iu);
    assert.doesNotMatch(text, /(?:scan|image) (?:is )?registered|(?:clinically )?approved/iu);
    if (section === 'review') {
      assert.match(html, /<section aria-label="Hip\/thigh depth to review">/u);
      assert.doesNotMatch(html, /<details\b/u);
      assert.ok(html.includes(escape(depth.revision)));
      assert.doesNotMatch(html, /Calf depth to review/u);
    } else {
      assert.match(html, /^<details\b/u);
      assert.doesNotMatch(html.match(/^<details[^>]*>/u)?.[0] ?? '', /\bopen\b/u);
    }
    for (const [topic, title] of [['relationships', 'Relationships'], ['arterialSupply', 'Typical arterial supply'], ['clinicalPitfall', 'Clinical pitfall']]) {
      const expected = section === 'review' || (section === 'anatomy' ? topic !== 'clinicalPitfall' : topic === 'clinicalPitfall');
      assert.equal(html.includes(escape(depth[topic].body)), expected, `${slug}/${section}/${topic}`);
      assert.equal(html.includes(`<h4>${title}</h4>`), expected);
      for (const ref of depth[topic].references) if (expected) {
        assert.ok(html.includes(`href="${escape(ref.url)}"`));
        assert.ok(html.includes(escape(ref.title)));
      }
    }
  }
  const selected = limbDefinitions.whole.surfaces.find(surface => surface.slug === slug);
  assert.ok(selected);
  for (const initialTopic of ['anatomy', 'clinical']) {
    const html = render(SpecimenLearning, { definition: limbDefinitions.whole, selected, initialTopic });
    assert.match(html, /^<details[^>]*\bopen=""/u);
    assert.ok(html.includes(escape(depth.modelLimit)));
    assert.ok(html.includes(escape(initialTopic === 'anatomy' ? depth.relationships.body : depth.clinicalPitfall.body)));
    assert.ok(!html.includes(escape(initialTopic === 'anatomy' ? depth.clinicalPitfall.body : depth.relationships.body)));
    integrated++;
  }
}
const whole = limbDefinitions.whole, selected = whole.surfaces.find(surface => surface.slug === slugs[0]);
const other = whole.surfaces.find(surface => surface.slug === 'sartorius');
assert.ok(other);
assert.doesNotMatch(render(SpecimenLearning, { definition: whole, selected: other, initialTopic: 'anatomy' }), /Hip\/thigh depth to review|Relationships &amp; blood supply|Clinical depth · pitfall/u);
for (const initialTopic of ['anatomy', 'clinical']) {
  const unavailable = render(SpecimenLearning, { definition: whole, selected, initialTopic, resolveLesson: () => null });
  assert.match(unavailable, /Teaching unavailable for this source binding; no substitute was used\./u);
  assert.doesNotMatch(unavailable, /Relationships &amp; blood supply|Clinical depth · pitfall/u);
}
for (const patch of [{ revision: 'foreign' }, { reviewScope: 'calf-depth' }, { reviewScope: undefined }, { reviewScope: 'foreign' }, { status: 'approved' }]) {
  for (const section of ['anatomy', 'clinical', 'review']) {
    const html = render(SpecimenDepthNotes, { depth: { ...umDeepHipDepth[slugs[0]], ...patch }, section });
    assert.match(html, /unavailable for this source\/revision scope; no other region was substituted/u);
    assert.doesNotMatch(html, /<details|depth to review|Typical arterial supply/u);
  }
}
const css = readFileSync('app/um-knee-study.css', 'utf8');
assert.match(css, /\.um-limb-learning \[data-slot="tabs-list"\][^{]*\{[^}]*flex-wrap:\s*wrap/u);
assert.match(css, /\.um-limb-learning \[data-slot="tabs-trigger"\][^{]*\{[^}]*white-space:\s*nowrap;[^}]*word-break:\s*normal;[^}]*overflow-wrap:\s*normal/u);
assert.equal(integrated, 12);
console.log(`UM deep-hip depth: ${slugs.length * 3} actual mode cases, ${integrated} integrated selected modes; untargeted/null/foreign depth refused. CSS contract only, not browser or GPU acceptance.`);
