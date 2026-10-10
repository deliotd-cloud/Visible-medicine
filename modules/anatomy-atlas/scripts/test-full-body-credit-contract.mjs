import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {summarizeFullBodyCredits, verifyFullBodyCredits, bodyPartsCredit, bodyPartsLicence} from './full-body-credit-contract.mjs';

const catalog = JSON.parse(await readFile(new URL('../public/models/bodyparts3d/full-body/catalog.json', import.meta.url), 'utf8'));
const html = await readFile(new URL('../public/models/bodyparts3d/credits.html', import.meta.url), 'utf8');

test('current original-source catalogue and visible notice agree without granting admission', () => {
  const result = verifyFullBodyCredits(catalog, html);
  assert.equal(result.entries, 1022);
  assert.equal(result.bundles, 86);
  assert.equal(result.bytes, 96645168);
  assert.deepEqual(result.systems, {skeleton:203, muscles:369, organs:80, nerves:54, vessels:227, connective:89});
  assert.equal(result.consistencyOnly, true);
  for (const flag of ['upstreamRightsProven','privacyCleared','sourceAdmission','clinicalApproval','deployment']) assert.equal(result[flag], false);
});

test('licence register and notices distinguish current inventory from historical milestones', async () => {
  const [register, notice, audit] = await Promise.all([
    readFile(new URL('../LICENSES/ASSET_REGISTER.md', import.meta.url), 'utf8'),
    readFile(new URL('../LICENSES/THIRD_PARTY_NOTICES.md', import.meta.url), 'utf8'),
    readFile(new URL('../LICENSES/BODYPARTS3D_FULL_BODY.md', import.meta.url), 'utf8'),
  ]);
  assert(register.includes('Current v4 catalogue: 1,022 source representations in 86 GLBs'));
  assert(notice.includes('current 1,022 source representations / 86 GLB bundles'));
  assert(audit.includes('**1,022 selectable source representations / 86 GLB bundles / 96,645,168 canonical bytes**'));
  assert(audit.includes('dated sections below retain their historical milestone counts'));
  assert(notice.includes('This notice does not itself admit held source paths'));
});

test('stale visible inventory, removed credit, wrong licence and missing source refuse', () => {
  const summary = summarizeFullBodyCredits(catalog).summary;
  for (const [name, altered] of [
    ['count', html.replace(summary, summary.replace('1,022', '924'))],
    ['credit', html.replace(`<p>${bodyPartsCredit}</p>`, '')],
    ['licence', html.replace(`href="${bodyPartsLicence}"`, 'href="https://creativecommons.org/licenses/by-nc/4.0/"')],
    ['source', html.replace('href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html"', '')],
    ['changes', html.replace('Colours were adapted for illustration', '')],
    ['clinical', html.replace('All anatomy remains unvalidated', '')],
    ['old-current', html + '<p>The expanded library contains 924 selectable entries</p>'],
  ]) assert.throws(() => verifyFullBodyCredits(catalog, altered), undefined, name);
});

test('inconsistent catalogue membership and mixed source licence refuse', () => {
  const cases = [
    c => c.structures.push(c.structures[0]),
    c => c.bundles.push(c.bundles[0]),
    c => c.bundles[0].structures++,
    c => c.structures[0].bundle = 'not-present',
    c => c.structures[0].provenance.license = 'CC-BY-SA-2.1-JP',
    c => c.structures[0].provenance.sourceVersion = '3.0',
    c => c.bundles[0].url = '/private/model.glb',
    c => c.structures[0].system = 'unknown',
    c => c.bundles[0].bytes = Number.MAX_SAFE_INTEGER,
  ];
  for (const mutate of cases) {
    const altered = structuredClone(catalog);
    mutate(altered);
    assert.throws(() => summarizeFullBodyCredits(altered));
  }
});
