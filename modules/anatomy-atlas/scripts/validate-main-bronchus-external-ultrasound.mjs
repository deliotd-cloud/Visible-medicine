import assert from 'node:assert/strict';
import pins from '../content/thoracoabdominal-organ-imaging-pins.json' with { type: 'json' };
import { contentContext } from './content-contract-tools.mjs';
import { authoringBeforeMainBronchusExternalUltrasound } from './main-bronchus-external-ultrasound-history.mjs';

const context = await contentContext();
const { api, catalog } = context;
const display = api.bodyDisplayCatalog(catalog);
const before = authoringBeforeMainBronchusExternalUltrasound(context).api;
const entries = pins.entries.filter(e => ['FMA7395', 'FMA7396'].includes(e.identity.fmaId));
assert.deepEqual(entries.map(e => e.identity.fmaId), ['FMA7395', 'FMA7396']);
for (const { identity, group } of entries) {
  assert.deepEqual(display.structures.find(s => s.id === identity.id), identity);
  const draft = api.thoracoabdominalOrganImagingLesson(identity, 'ultrasound');
  assert.deepEqual(api.bodyLesson(identity, 'ultrasound'), draft);
  assert.equal(draft.readiness, 'draft');
  assert.equal(before.bodyLesson(identity, 'ultrasound').readiness, 'pending');
  assert.match(draft.body, /external transthoracic ultrasound/);
  assert.match(draft.body, /rib shadows restrict/);
  assert.match(draft.bullets.join(' '), /Pleural artefacts.*(not direct|do not directly)/);
  assert.match(draft.bullets.join(' '), /cannot establish .*patency or distal branches/);
  assert.match(draft.bullets.join(' '), /endobronchial.*endoscopic ultrasound/);
  assert(draft.citations.includes('https://onlinelibrary.wiley.com/doi/10.1002/ajum.12163'));
  assert.deepEqual(api.bodyContent(identity, 'ultrasound'), (({ readiness: _r, ...content }) => content)(draft));
  assert.equal(api.thoracoabdominalOrganImagingGroups[group].focus.ultrasound !== undefined, true);
  const changed = structuredClone(identity);
  changed.bounds.min[0] += 0.01;
  assert.equal(api.thoracoabdominalOrganImagingLesson(changed, 'ultrasound'), undefined);
  assert.equal(api.bodyLesson(changed, 'ultrasound').readiness, 'pending');
}
assert.equal(before.thoracoabdominalOrganImagingGroups.esophagus.focus.ultrasound, undefined);
assert.equal(api.thoracoabdominalOrganImagingGroups.esophagus.focus.ultrasound !== undefined, true);
console.log(JSON.stringify({ externalMainBronchusDrafts: entries.length, exactSource: true, clinicalApproval: false }));
