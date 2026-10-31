// Test-only inverse of the four d9-successor draft sections and one scope sentence.
// No source, review decision, or approval is migrated.
import assert from 'node:assert/strict';

export const cerebralLobarOriginalUltrasoundBodies = {"frontal": "Neonatal orientation: through an open anterior fontanelle, compare coronal and sagittal views. Where the central sulcus is visible, the precentral gyrus lies immediately in front of it. The sulcus may be absent from a more anterior orbitofrontal image; one frame cannot establish the entire lobe. Visibility depends on the window and technique. This grouped 3D surface is not a neonatal segmentation, a complete frontal lobe or a registered ultrasound image.", "parietal": "Neonatal orientation: a coronal view towards the vertex through the anterior fontanelle can show the postcentral gyrus behind the central sulcus. The marginal branch of the cingulate sulcus is a nearby landmark that can help locate that sulcus. This does not delineate every parietal boundary; the superficial convexity can be difficult to assess. The grouped 3D surface is not a neonatal segmentation, a complete parietal lobe or a registered ultrasound image.", "temporal": "Neonatal ultrasound: through the open anterior fontanelle, locate the Sylvian fissure on coronal views; temporal tissue lies below. Compare adjacent planes. This compound excludes separate superior temporal and hippocampal surfaces.", "occipital": "Neonatal ultrasound: on medial sagittal views, distinguish the parieto-occipital and calcarine sulci. The cuneus lies above the calcarine sulcus; the lingual gyrus below. Posterior-fontanel views may improve occipital assessment."};
export const cerebralLobarConciseUltrasoundBodies = {"frontal": "On neonatal coronal views, find precentral cortex anterior to the central sulcus. Check adjacent planes; this sulcus may lie outside an anterior orbitofrontal view.", "parietal": "On neonatal coronal views near the vertex, locate postcentral cortex behind the central sulcus. The marginal cingulate sulcus helps orientation; inspect neighbouring planes.", "temporal": "On neonatal coronal views through the anterior fontanelle, temporal tissue lies below the Sylvian fissure. Compare adjacent planes.", "occipital": "On neonatal medial sagittal views, cuneus lies above the calcarine sulcus and lingual gyrus below. A posterior fontanelle window can help."};
// Restore only four exact wording changes before older neonatal/posterior inverses.
export function lobarBeforeCerebralDetailConcise(api) {
  const ids = Object.keys(cerebralLobarOriginalUltrasoundBodies);
  for (const id of ids) {
    const matches = api.nestedConcepts.filter(c => c.id === 'cerebral-' + id);
    assert.equal(matches.length, 1, 'Four unique lobar concepts required');
    assert.deepEqual(JSON.parse(JSON.stringify(matches[0].imaging?.ultrasound)), {
      body: cerebralLobarConciseUltrasoundBodies[id],
      references: ['cerebralNeonatalUS', 'cerebralNeonatalUSWindow'], readiness: 'draft',
    }, 'Exact concise lobar section required');
  }
  return {...api, nestedConcepts: api.nestedConcepts.map(c => {
    const id = c.id.startsWith('cerebral-') ? c.id.slice('cerebral-'.length) : '';
    if (!ids.includes(id)) return c;
    return {...c, imaging: {...c.imaging, ultrasound: {...c.imaging.ultrasound,
      body: cerebralLobarOriginalUltrasoundBodies[id]}}};
  })};
}

export const cerebralDetailIds = ["cerebral-insula", "cerebral-hippocampus", "cerebral-superior-temporal-anterior", "cerebral-superior-temporal-posterior"];
export const cerebralDetailSections = {
  'cerebral-insula': {body: 'On neonatal coronal and far-lateral sagittal views, find the insula deep to the lateral sulcus. Access and probe angle affect visibility.', references: ['cerebralNeonatalUS', 'cerebralNeonatalUSWindow'], readiness: 'draft'},
  'cerebral-hippocampus': {body: 'On neonatal coronal views, orient to hippocampal tissue bulging into the temporal horn. Conventional ultrasound does not reliably separate its internal subfields.', references: ['cerebralNeonatalUS', 'cerebralNeonatalUSWindow'], readiness: 'draft'},
  'cerebral-superior-temporal-anterior': {body: 'On neonatal coronal views, superior temporal cortex lies below the lateral sulcus. The model\'s anterior division is not an ultrasound boundary.', references: ['cerebralNeonatalUS', 'cerebralNeonatalUSWindow'], readiness: 'draft'},
  'cerebral-superior-temporal-posterior': {body: 'Follow neonatal temporal cortex below the lateral sulcus across adjacent planes. Ultrasound does not establish this posterior model division or its language function.', references: ['cerebralNeonatalUS', 'cerebralNeonatalUSWindow'], readiness: 'draft'},
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
  const beforeDetail = {...api, nestedConcepts: api.nestedConcepts.map(concept => {
    if (!ids.has(concept.id)) return concept;
    const {ultrasound: _draft, ...imaging} = concept.imaging;
    return concept.id === 'cerebral-hippocampus'
      ? {...concept, imaging, modelLimit: hippocampalScopeBeforeCerebralDetail}
      : {...concept, imaging};
  })};
  return lobarBeforeCerebralDetailConcise(beforeDetail);
}
