// Test-only inverse of the four d9-successor draft sections and one scope sentence.
// No source, review decision, or approval is migrated.
import assert from 'node:assert/strict';

export const cerebralDetailIds = ["cerebral-insula", "cerebral-hippocampus", "cerebral-superior-temporal-anterior", "cerebral-superior-temporal-posterior"];
export const cerebralDetailSections = {
  'cerebral-insula': {body: 'Through the open anterior fontanelle, follow the lateral sulcus on coronal views; the insula is deep to it. A far-lateral sagittal view can help orientation. Window and angle limit visibility. This source surface is diagrammatic, not a validated neonatal boundary or registered scan.', references: ['cerebralNeonatalUS', 'cerebralNeonatalUSWindow'], readiness: 'draft'},
  'cerebral-hippocampus': {body: 'Hippocampal tissue bulges toward the temporal horn on neonatal coronal ultrasound. Use the horn as an orientation landmark, then compare nearby planes. Internal subfields and fibre structures are not readily distinguished; acoustic access varies. This coarse source surface is not a validated neonatal boundary or registered scan.', references: ['cerebralNeonatalUS', 'cerebralNeonatalUSWindow'], readiness: 'draft'},
  'cerebral-superior-temporal-anterior': {body: 'Below the lateral sulcus, orient to superior temporal cortex on neonatal coronal ultrasound. This anterior source part is a diagrammatic subdivision; its edge is not a visible or validated neonatal boundary, nor an auditory function map. Anterior-fontanelle access and plane limit assessment.', references: ['cerebralNeonatalUS', 'cerebralNeonatalUSWindow'], readiness: 'draft'},
  'cerebral-superior-temporal-posterior': {body: 'Follow the lateral sulcus and temporal tissue beneath it across neonatal coronal planes. The posterior source part is diagrammatic: ultrasound does not establish its exact edge, language territory or individual function. Visibility varies with fontanelle access and probe angle; no scan is registered here.', references: ['cerebralNeonatalUS', 'cerebralNeonatalUSWindow'], readiness: 'draft'},
};
export const hippocampalScopeBeforeCerebralDetail = 'Two source-labelled coarse surfaces, not separately validated hippocampal subfields or the complete hippocampal formation. No dentate/subicular boundary, alveus/fimbria segmentation, microscopic architecture, pathology, normative volumetry or patient-image registration is established. X-ray and ultrasound lessons remain pending.';
export const hippocampalScopeWithCerebralDetail = 'Two source-labelled coarse surfaces, not separately validated hippocampal subfields or the complete hippocampal formation. No dentate/subicular boundary, alveus/fimbria segmentation, microscopic architecture, pathology, normative volumetry or patient-image registration is established. X-ray remains pending; ultrasound orientation is draft.';

export function nestedBeforeCerebralDetailUltrasound(api) {
  const ids = new Set(cerebralDetailIds);
  const matches = api.nestedConcepts.filter(c => ids.has(c.id));
  assert.equal(matches.length, 4, 'Four unique cerebral detail concepts required');
  assert.equal(new Set(matches.map(c => c.id)).size, 4, 'Duplicate or missing cerebral detail concept');
  for (const concept of matches) {
    assert.deepEqual(JSON.parse(JSON.stringify(concept.imaging?.ultrasound)), cerebralDetailSections[concept.id],
      'Cerebral detail ultrasound section must match the exact authored draft');
    if (concept.id === 'cerebral-hippocampus')
      assert.equal(concept.modelLimit, hippocampalScopeWithCerebralDetail, 'Exact updated hippocampal scope required');
  }
  return {...api, nestedConcepts: api.nestedConcepts.map(concept => {
    if (!ids.has(concept.id)) return concept;
    const {ultrasound: _draft, ...imaging} = concept.imaging;
    return concept.id === 'cerebral-hippocampus'
      ? {...concept, imaging, modelLimit: hippocampalScopeBeforeCerebralDetail}
      : {...concept, imaging};
  })};
}
