import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const home = {href: '/workspace/atlas-review', name: null};
const revision = '56cf325c006a00e4349a6b45844797800a11c005448d32a08f40e64664288b44';
const atlasRevision = 'e3a901e103e9fb495a18d9bd1622190dfc0d034b';
// This is a separate current-source theorem. The original d143 whole root
// and its exact historical assertion remain unchanged in their own source file.
const importedAtlasRevision = 'a01ea4a00740dee0905204a33893761b8ae1ff1e';
function assertCurrentReferenceDelivery(){
  const current=validateCurrentAtlasDelivery();
  assert.equal(current.source,importedAtlasRevision);
  assert.equal(current.sourceTree,'362941c8dd6348d985622c4a21686bbf14c135f7');
  assert.equal(current.reviewSourceFiles,1614);
  assert.equal(current.viewerFiles,54);assert.equal(current.viewerPackages,24);
  for(const kind of ['head-neck','shoulder','lower-limb','female-pelvis'])assert.equal(current.runtimeSources[kind],importedAtlasRevision);
}

async function loadRealReview() {
  const result = await build({
    stdin: {contents: `
      export {parseWebsiteFdaSelection} from './lib/clinical-review-reference-selection';
      export {reviewModelHref,reviewModelPreviewHref} from './lib/clinical-review-links';
      export {clinicalReviewReturn} from './lib/clinical-review-return';
      export {clinicalReviewEntries} from './atlas-review/lib/clinical-review-index';
      export {fdaSpecimenReviewMaterial} from './atlas-review/lib/fda-specimen-review-material';
      export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';
      export {specimenReviewMaterial} from './atlas-review/lib/specimen-review-material';
    `, resolveDir: process.cwd(), loader: 'ts'},
    bundle: true, write: false, platform: 'node', format: 'esm',
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('current delivery: all six real source packets map, preview and return to their own FDA worksheet', {timeout: 120000}, async () => {
  assertCurrentReferenceDelivery();
  assert.equal(JSON.parse(readFileSync('atlas-review/manifest.json', 'utf8')).revision, importedAtlasRevision);
  const registry = JSON.parse(readFileSync('lib/clinical-review-reference-assets.json', 'utf8'));
  assert.equal(registry.references.length, 1);
  assert.equal(registry.references[0].atlasRevision, atlasRevision);
  assert.equal(registry.references[0].revision, revision);
  const api = await loadRealReview();
  const entries = api.clinicalReviewEntries.filter(entry => entry.scope === 'specimens' &&
    new URL(entry.href, 'https://review.invalid').searchParams.get('specimen') === 'fda-shoulder-fc9f3e56');
  assert.equal(entries.length, 6);
  for (const entry of entries) {
    const packet = await api.fdaSpecimenReviewMaterial('fda-shoulder-fc9f3e56', entry.id);
    assert(packet, entry.id);
    assert.equal(packet.atlasPath, '/specimens/fda-shoulder');
    const mapped = api.reviewModelHref(packet.atlasLink);
    const params = Object.fromEntries(new URL(mapped, 'https://review.invalid').searchParams);
    assert.equal(new URL(mapped, 'https://review.invalid').pathname, '/workspace/atlas-review/model');
    assert.deepEqual(Object.keys(params).sort(), ['kind', 'referenceRevision', 'region', 'structure']);
    assert.deepEqual(api.parseWebsiteFdaSelection(params), {
      selectedId: entry.id, expectedRevision: revision,
      assetBase: '/api/atlas-delivery/references/fda-shoulder-fc9f3e56/' + revision,
    });
    assert.equal(api.reviewModelPreviewHref(packet.atlasLink), '/workspace/atlas-review/model/embedded' + new URL(mapped, 'https://review.invalid').search);
    assert.equal(api.reviewModelPreviewHref(mapped), '/workspace/atlas-review/model/embedded' + new URL(mapped, 'https://review.invalid').search);
    assert.deepEqual(await api.clinicalReviewReturn(params), {href: entry.href, name: entry.name});
    for (const [key, value] of Object.entries(params)) {
      assert.deepEqual(await api.clinicalReviewReturn({...params, [key]: [value, value]}), home, 'duplicate ' + key);
      assert.deepEqual(await api.clinicalReviewReturn({...params, [key]: value + '-foreign'}), home, 'changed ' + key);
    }
    for (const extra of [{sourceFrame: 'unitless-normalized-source-assembly'}, {redirect: 'https://foreign.invalid'}])
      assert.deepEqual(await api.clinicalReviewReturn({...params, ...extra}), home);
  }
  const oldEntries = [
    api.clinicalReviewEntries.find(entry => entry.scope === 'shoulder'),
    api.clinicalReviewEntries.find(entry => entry.scope === 'body'),
    api.clinicalReviewEntries.find(entry => entry.scope === 'specimens' &&
      new URL(entry.href, 'https://review.invalid').searchParams.get('specimen') !== 'fda-shoulder-fc9f3e56'),
  ];
  for (const entry of oldEntries) {
    assert(entry);
    const query = new URL(entry.href, 'https://review.invalid').searchParams;
    const source = entry.scope === 'shoulder' ? '/shoulder?structure=' + encodeURIComponent(entry.id) :
      entry.scope === 'body' ? (await api.bodyReviewMaterial(entry.id)).atlasLink :
      (await api.specimenReviewMaterial(query.get('specimen'), entry.id)).atlasLink;
    const params = Object.fromEntries(new URL(api.reviewModelHref(source), 'https://review.invalid').searchParams);
    assert.deepEqual(await api.clinicalReviewReturn(params), {href: entry.href, name: entry.name}, entry.key);
  }
});

test('current delivery: FDA source and embedded entry reject stale, held, foreign and forged links', {timeout: 120000}, async () => {
  assertCurrentReferenceDelivery();
  const api = await loadRealReview();
  const first = api.clinicalReviewEntries.find(entry => entry.scope === 'specimens' &&
    new URL(entry.href, 'https://review.invalid').searchParams.get('specimen') === 'fda-shoulder-fc9f3e56');
  assert(first);
  const source = (await api.fdaSpecimenReviewMaterial('fda-shoulder-fc9f3e56', first.id)).atlasLink;
  const mapped = api.reviewModelHref(source);
  const bad = [
    source.replace(revision, '0'.repeat(64)),
    source.replace(encodeURIComponent(first.id), encodeURIComponent('vm:reference:fda-shoulder-fc9f3e56:gcart')),
    source.replace(encodeURIComponent(first.id), encodeURIComponent('vm:reference:foreign:ac-ligament')),
    source + '&kind=fda-shoulder', source + '&region=shoulder',
    source + '&structure=' + encodeURIComponent(first.id), source + '&extra=1', source + '#fragment',
    source.replace('/specimens/', '//foreign.invalid/specimens/'),
    'https://foreign.invalid' + source, source.replace('/specimens/', '/\\specimens/'),
  ];
  for (const href of bad) {
    assert.equal(api.reviewModelHref(href), home.href, href);
    assert.equal(api.reviewModelPreviewHref(href), null, href);
  }
  for (const href of [mapped + '&extra=1', mapped + '&kind=fda-shoulder', mapped + '#fragment',
    mapped.replace('kind=fda-shoulder', 'kind=body'), mapped.replace('region=shoulder', 'region=pelvis'),
    mapped.replace('referenceRevision=', 'wrongRevision='), mapped.replace(revision, '0'.repeat(64)),
    mapped.replace(encodeURIComponent(first.id), encodeURIComponent('vm:reference:fda-shoulder-fc9f3e56:gcart'))])
    assert.equal(api.reviewModelPreviewHref(href), null, href);
  assert.equal(api.reviewModelPreviewHref('/workspace/atlas-review/model?kind=fda-shoulder&region=shoulder'), null);
  assert.equal(api.parseWebsiteFdaSelection({kind: 'fda-shoulder', region: 'shoulder', referenceRevision: revision}), null);
});
