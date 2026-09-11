import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
const source = await build({ stdin: { contents: "export * from './content/um-limb-clinical.ts'; export * from './lib/um-limb-teaching.ts'; export * from './lib/um-limb-navigation.ts'; export * from './lib/specimen-links.ts'; export { limbDefinitions } from './lib/um-limb-studies.ts';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node' });
const api = await import('data:text/javascript;base64,' + Buffer.from(source.outputFiles[0].text).toString('base64'));
const { specimenClinicalLessons, specimenClinicalReferences, specimenTeachingFor, availableSpecimenTopics, limbDefinitions, specimenTopics, parseSpecimenLink, makeSpecimenLink, resolveSpecimenLink } = api;
const whole = limbDefinitions.whole, counts = Object.fromEntries(specimenTopics.slice(2).map(t => [t, 0]));
let checks = 0, markupCases = 0, deepLinks = 0;
const same = (a, b, message) => { checks++; assert.deepEqual(a, b, message); };
const clone = value => JSON.parse(JSON.stringify(value));
const fromHref = href => Object.fromEntries(new URL(href, 'https://atlas.example').searchParams);
const expected = ['acl', 'pcl', 'mcl', 'lcl', 'meniscus-group', 'quadriceps-tendon', 'patellar-ligament', 'achilles-tendon', 'talus', 'calcaneus',
  'femur', 'femoral-head-cartilage', 'gluteus-medius', 'gluteus-minimus', 'iliacus', 'psoas-major', 'adductor-longus', 'rectus-femoris', 'semimembranosus', 'semitendinosus', 'biceps-femoris-long-head', 'biceps-femoris-short-head'];
same(Object.keys(specimenClinicalLessons).sort(), expected.sort());
const referenceWords = {}, knownURLs = new Set(Object.values(specimenClinicalReferences).map(r => r.url));
function references(text, refs) {
  for (const url of refs) {
    same(knownURLs.has(url), true);
    referenceWords[url] = (referenceWords[url] ?? 0) + text.trim().split(/\s+/).length;
  }
}
for (const selected of whole.surfaces) {
  const lesson = specimenTeachingFor(whole, selected), extended = specimenClinicalLessons[selected.slug];
  same(lesson.extended, extended);
  same(availableSpecimenTopics(whole, selected.id), specimenTopics.filter(t => ['anatomy', 'function'].includes(t) || extended?.topics[t]));
  if (!extended) continue;
  same(extended.modelLimit.length > 40, true);
  for (const [topic, note] of Object.entries(extended.topics)) {
    counts[topic]++;
    same(note.readiness, 'draft'); same(note.body.trim().length > 50, true); same(note.references.length > 0, true);
    references(note.body, note.references);
  }
  same(extended.selfCheck.question.endsWith('?'), true); same(extended.selfCheck.answer.length > 35, true);
  references(extended.selfCheck.question + ' ' + extended.selfCheck.answer, extended.selfCheck.references);
  const forged = clone(selected); forged.sources[0].sha256 = 'changed';
  same(specimenTeachingFor(whole, forged), null);
  lesson.extended.topics.clinical.body = 'mutated';
  same(specimenTeachingFor(whole, selected).extended, extended);
}
same(counts, { clinical: 22, pathology: 22, ct: 4, mri: 17, xray: 19, ultrasound: 12 });
const hipTopics = {
  femur: ['clinical', 'pathology', 'xray', 'ct', 'mri'],
  'femoral-head-cartilage': ['clinical', 'pathology', 'xray'],
  'gluteus-medius': ['clinical', 'pathology', 'mri', 'ultrasound'],
  'gluteus-minimus': ['clinical', 'pathology', 'mri', 'ultrasound'],
  iliacus: ['clinical', 'pathology', 'xray', 'ultrasound'],
  'psoas-major': ['clinical', 'pathology', 'xray', 'ultrasound'],
  'adductor-longus': ['clinical', 'pathology', 'mri', 'xray', 'ultrasound'],
  'rectus-femoris': ['clinical', 'pathology', 'mri', 'xray', 'ultrasound'],
  semimembranosus: ['clinical', 'pathology', 'mri', 'xray', 'ultrasound'],
  semitendinosus: ['clinical', 'pathology', 'mri', 'xray'],
  'biceps-femoris-long-head': ['clinical', 'pathology', 'mri', 'xray'],
  'biceps-femoris-short-head': ['clinical', 'pathology', 'mri'],
};
for (const [slug, topics] of Object.entries(hipTopics)) {
  same(Object.keys(specimenClinicalLessons[slug].topics).sort(), topics.sort(), `Exact hip/thigh topic coverage: ${slug}`);
  same(Object.values(limbDefinitions).some(def => def.key.endsWith(':hip-thigh') && def.surfaces.some(s => s.slug === slug)), true);
}
// Keep original summaries brief; no reference text/tables/diagrams are imported.
for (const [url, words] of Object.entries(referenceWords)) same(words <= 200, true, `Excessive reliance on one reference: ${url} (${words})`);
for (const def of Object.values(limbDefinitions)) for (const selected of def.surfaces) {
  const available = availableSpecimenTopics(def, selected.id);
  for (const topic of specimenTopics.slice(2)) {
    const href = makeSpecimenLink(def, { selectedId: selected.id, view: 'anterior', topic });
    if (available.includes(topic)) {
      same(!!href, true); const resolved = resolveSpecimenLink(parseSpecimenLink(fromHref(href)));
      same(resolved.status, 'ready'); same(resolved.topic, topic); same(resolved.selectedId, selected.id); deepLinks++;
    } else {
      same(href, null);
      const params = fromHref(makeSpecimenLink(def, { selectedId: selected.id, view: 'anterior' }));
      same(resolveSpecimenLink(parseSpecimenLink({ ...params, specimenTopic: topic })).reason, 'topic-unavailable');
    }
  }
}
const component = await componentBuild({ entryPoints: ['app/um-limb-learning.tsx', 'app/specimen-study-link.tsx'], outdir: 'unused', bundle: true, write: false, format: 'cjs', platform: 'node', plugins: [{ name: 'scene-boundary', setup(api) {
  api.onLoad({ filter: /body-scene\.tsx$/ }, () => ({ loader: 'js', contents: 'export function BodyScene(){ return null; }' }));
} }] });
const require = createRequire(import.meta.url), React = require('react');
const mods = {};
for (const output of component.outputFiles) {
  const mod = { exports: {} };
  runInNewContext(output.text, { module: mod, exports: mod.exports, require, URL, URLSearchParams, console, process: { env: { NODE_ENV: 'test' } } });
  Object.assign(mods, mod.exports);
}
const render = (name, props) => require('react-dom/server').renderToStaticMarkup(React.createElement(mods[name], props));
const escape = t => t.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
for (const selected of whole.surfaces.filter(s => specimenClinicalLessons[s.slug])) {
  const extended = specimenClinicalLessons[selected.slug];
  for (const [topic, note] of Object.entries(extended.topics)) {
    const html = render('SpecimenLearning', { definition: whole, selected, initialTopic: topic }); markupCases++;
    same(html.includes(escape(note.body)), true); same(html.includes(escape(extended.modelLimit)), true);
    same(html.includes('Education, not diagnosis or treatment.'), true);
    const group = ['clinical', 'pathology'].includes(topic) ? 'Clinical' : 'Imaging';
    same(new RegExp(`<button\\b(?=[^>]*aria-selected="true")[^>]*>${group}</button>`).test(html), true);
    for (const ref of note.references) same(html.includes(escape(ref)), true);
  }
  for (const topic of specimenTopics.slice(2).filter(t => !extended.topics[t])) {
    const html = render('SpecimenLearning', { definition: whole, selected, initialTopic: topic }); markupCases++;
    same(html.includes('teaching is pending for this source selection'), true);
  }
  const forged = clone(selected); forged.bounds.min[0] += 1;
  same(render('SpecimenLearning', { definition: whole, selected: forged, initialTopic: 'clinical' }).includes('Teaching unavailable for this source binding'), true);
}
const linkSource = await readFile('app/specimen-study-link.tsx', 'utf8');
same(linkSource.includes('availableSpecimenTopics(definition, selectedId)'), true);
same(linkSource.includes('topics.map('), true);
console.log(JSON.stringify({ checks, exactExtendedSelections: expected.length, draftTopics: counts, clinicalSelfChecks: expected.length, markupCases, sourceBoundTopicLinks: deepLinks, referenceWords, clinicalOrBrowserAcceptance: false }));
