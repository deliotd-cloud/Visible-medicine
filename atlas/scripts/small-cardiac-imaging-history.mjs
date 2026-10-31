// Exact inverse for the two draft lessons proposed after the sinus X-ray epoch.
// The historical source comparison must still run after this inverse.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const plain = value => JSON.parse(JSON.stringify(value));
const sha = value => createHash('sha256').update(JSON.stringify(plain(value))).digest('hex');
export const expectedSmallCardiac = Object.freeze({
  xray: {sha256: '492f7b35270bc5cd0d19d26a638b6a0091bd3277001fcdd789203dbcc77cd1a5', references: ['smallCardiacVenographyCase'], url: 'https://pubmed.ncbi.nlm.nih.gov/30473972/'},
  ultrasound: {sha256: 'db668a3f25020429f7be6e72eb99e05cec1a4dd00b2eba6e480ebec82b6cdf51', references: ['smallCardiacEchoCase'], url: 'https://doi.org/10.1002/jcu.23993'},
  references: {
    smallCardiacVenographyCase: {sha256: 'ac3d1c673056fd20e6ca586e06b4df57c6dbbb136a9c7bc64e6739c6781c6c3b'},
    smallCardiacEchoCase: {sha256: 'b6e2700a191fb7be1182594f2d424b5aff58f461719ffbf2cb74a00187dc7d91'},
  },
});

export function beforeSmallCardiacImaging(concepts, references) {
  const priorConcepts = plain(concepts), priorReferences = plain(references);
  const matches = priorConcepts.filter(c => c.id === 'small-cardiac-vein');
  assert.equal(matches.length, 1, 'One small cardiac vein concept required');
  const concept = matches[0];
  assert.equal(concept.study, 'coronary-venous');
  assert.deepEqual(concept.fmaIds, ['FMA4714']);
  for (const tab of ['xray', 'ultrasound']) {
    const expected = expectedSmallCardiac[tab], section = concept.imaging?.[tab];
    assert(section, `Missing small cardiac vein ${tab} draft`);
    assert.deepEqual(Object.keys(section).sort(), ['body','readiness','references']);
    assert.equal(section.readiness, 'draft');
    assert.deepEqual(section.references, expected.references);
    assert.equal(sha(section), expected.sha256, `Changed small cardiac vein ${tab} draft`);
    const key = expected.references[0], reference = priorReferences[key];
    assert(reference, `Missing ${key}`);
    assert.deepEqual(Object.keys(reference).sort(), ['scopedToConcept','title','url']);
    assert.equal(reference.scopedToConcept, true);
    assert.equal(reference.url, expected.url);
    assert.equal(sha(reference), expectedSmallCardiac.references[key].sha256, `Changed ${key}`);
    delete concept.imaging[tab];
    delete priorReferences[key];
  }
  return {concepts: priorConcepts, references: priorReferences};
}
