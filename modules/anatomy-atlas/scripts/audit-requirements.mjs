import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-test-build.mjs';
import { renderRequirementSummary } from './requirement-summary.mjs';
import { limbVascularStudySets, limbVascularSourceIds } from '../content/limb-vascular-studies.ts';
import { armVascularStudies, armVascularSourceIds } from '../content/arm-vascular-studies.ts';
import { upperVesselImagingGroups, upperVesselImagingTopics } from '../content/upper-vessel-imaging.ts';
import { lowerArterialImagingGroups, lowerArterialImagingTopics } from '../content/lower-arterial-imaging.ts';
import { limbBoneImagingGroups, limbBoneImagingTopics } from '../content/limb-bone-imaging.ts';
import { thoracicBoneImagingGroups, thoracicBoneImagingTopics } from '../content/thoracic-bone-imaging.ts';
import { abdominalOrganImagingGroups, abdominalOrganImagingTopics } from '../content/abdominal-organ-imaging.ts';
import { genicularStudy, genicularStudySourceIds } from '../content/genicular-study.ts';
import { deferentDuctStudy } from '../content/deferent-duct-study.ts';
import { inferiorEpigastricStudy } from '../content/inferior-epigastric-study.ts';
import { pelvicVeinStudy } from '../content/pelvic-vein-study.ts';
import { pelvicVeinTeaching } from '../content/pelvic-vein-teaching.ts';
import { limbicLandmarkStudy } from '../content/limbic-landmark-study.ts';
import { footBoneFmas, footJoints } from '../content/foot-joints.ts';
import { handBoneFmas, handJoints } from '../content/hand-joints.ts';

// This inventory executes the real content resolver. It measures displayed copy,
// not medical correctness, complete lessons, browser acceptance or approval.
const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root));
const json = async (path) => JSON.parse(await read(path));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const bundled = await build({
  stdin: {
    contents: `export { hraPelvisDefinition } from './lib/hra-pelvis.ts';
export { hraPelvicTeaching, hraPelvicPractice } from './lib/hra-pelvis-teaching.ts';
export { hraRenalDefinition } from './lib/hra-renal.ts';
export { hraRenalTeaching, hraRenalPractice } from './lib/hra-renal-teaching.ts';
export { limbDefinitions } from './lib/um-limb-studies.ts';
export { specimenTeachingFor } from './lib/um-limb-teaching.ts';
export { specimenMotorGroups } from './lib/um-limb-motor.ts';
export { upperLimbMotorGroups } from './lib/upper-limb-motor.ts';
export { upperLimbMotorRegions } from './content/upper-limb-motor.ts';
export { lowerLimbMotorGroups } from './lib/lower-limb-motor.ts';
export { lowerLimbMotorRegions } from './content/lower-limb-motor.ts';
export { arterialNeighbours } from './lib/arterial.ts';
export { systemicVenousNeighbours } from './lib/systemic-venous.ts';
export { portalVenousNeighbours } from './lib/portal-drainage.ts';
export { makeSpecimenLink, resolveSpecimenLink } from './lib/um-limb-navigation.ts';
export { parseSpecimenLink, specimenTopics } from './lib/specimen-links.ts';
export { bodyContent, bodyLesson } from './app/body-content.ts';
export { vesselVisibilityGroups } from './lib/vessel-visibility.ts';
export { upperVesselImagingLesson } from './lib/upper-vessel-imaging.ts';
export { lowerArterialImagingLesson } from './lib/lower-arterial-imaging.ts';
export { limbBoneImagingLesson } from './lib/limb-bone-imaging.ts';
export { thoracicBoneImagingLesson } from './lib/thoracic-bone-imaging.ts';
export { abdominalOrganImagingLesson } from './lib/abdominal-organ-imaging.ts';
export { regionalTours } from './lib/regional-tours.ts';
export { shoulderTour } from './lib/shoulder-tours.ts';
export { structures } from './app/anatomy-data.ts';
export { dissectionProfiles } from './app/dissection-data.ts';
export { reasoningConcepts, reasoningConceptFor } from './lib/reasoning-questions.ts';
export { createLearningRegistry, parseLearningDocument, learningResourceKinds } from './lib/learning-resources.ts';
export { allLearningAnatomyRepresentations } from './lib/nested-learning-anatomy.ts';
export { bodyDisplayCatalog } from './lib/body-display-catalog.ts';
export { nestedStudyTargets } from './lib/nested-anatomy.ts';
export { cerebralCatalog } from './lib/cerebral.ts';
export { nestedReviewRows } from './lib/nested-review-material.ts';
export { nestedTeachingFor, nestedTopicLesson } from './lib/nested-teaching.ts';
export { nestedConcepts, nestedTeachingReferences } from './content/nested-teaching.ts';
export { ventricularRelationshipsFor } from './lib/ventricular-relationships.ts';
export { visualRelationshipsFor, visualSellarSource } from './lib/visual-pathway-context.ts';
export { renalRelationshipsFor } from './lib/renal-relationships.ts';
export { hepaticBiliaryRelationshipsFor, hepaticBiliarySource } from './lib/hepatic-biliary-context.ts';
export { cardiacRelationshipsFor, cardiacVesselSource } from './lib/cardiac-context.ts';
export { abdominalWallDefinition } from './lib/abdominal-wall.ts';
export { backLayersDefinition } from './lib/back-layers.ts';
export { backLayersTeachingFor, backLayersPractice } from './lib/back-layers-teaching.ts';
export { abdominalWallPractice } from './lib/abdominal-wall-practice.ts';
export { abdominalTeachingFor } from './lib/abdominal-wall-teaching.ts';`,
    resolveDir: fileURLToPath(root),
    sourcefile: 'requirements-audit-entry.ts',
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const {
  hraPelvisDefinition,
  hraPelvicTeaching,
  hraPelvicPractice,
  hraRenalDefinition,
  hraRenalTeaching,
  hraRenalPractice,
  abdominalWallDefinition,
  backLayersDefinition,
  backLayersTeachingFor,
  backLayersPractice,
  abdominalWallPractice,
  abdominalTeachingFor,
  limbDefinitions,
  specimenTeachingFor,
  specimenMotorGroups,
  upperLimbMotorGroups,
  upperLimbMotorRegions,
  lowerLimbMotorGroups,
  lowerLimbMotorRegions,
  arterialNeighbours,
  systemicVenousNeighbours,
  portalVenousNeighbours,
  makeSpecimenLink,
  resolveSpecimenLink,
  parseSpecimenLink,
  specimenTopics,
  bodyContent,
  vesselVisibilityGroups,
  bodyLesson,
  upperVesselImagingLesson,
  lowerArterialImagingLesson,
  limbBoneImagingLesson,
  thoracicBoneImagingLesson,
  abdominalOrganImagingLesson,
  regionalTours,
  shoulderTour,
  structures: shoulder,
  dissectionProfiles,
  reasoningConcepts,
  reasoningConceptFor,
  createLearningRegistry,
  parseLearningDocument,
  learningResourceKinds,
  allLearningAnatomyRepresentations,
  bodyDisplayCatalog,
  nestedStudyTargets,
  cerebralCatalog,
  nestedReviewRows,
  nestedTeachingFor,
  nestedTopicLesson,
  nestedConcepts,
  nestedTeachingReferences,
  ventricularRelationshipsFor,
  visualRelationshipsFor,
  visualSellarSource,
  renalRelationshipsFor,
  hepaticBiliaryRelationshipsFor,
  hepaticBiliarySource,
  cardiacRelationshipsFor,
  cardiacVesselSource,
} = await import(
  'data:text/javascript;base64,' +
    Buffer.from(bundled.outputFiles[0].text).toString('base64')
);
const catalogPath = 'public/models/bodyparts3d/full-body/catalog.json';
const archivalCatalog = await json(catalogPath);
const catalog = bodyDisplayCatalog(archivalCatalog);
const manifest = await json('public/models/bodyparts3d/manifest.json');
const eyeLayers = await json(
  'public/models/bodyparts3d/eye-layers/catalog.json',
);
const ventricular = await json(
  'public/models/bodyparts3d/ventricles/catalog.json',
);
const brainstem = await json(
  'public/models/bodyparts3d/brainstem/catalog.json',
);
const collicularBrachia = await json('public/models/bodyparts3d/collicular-brachia/catalog.json');
const cubitalVeins = await json('public/models/bodyparts3d/cubital-veins/catalog.json');
const genicularArteries = await json('public/models/bodyparts3d/genicular-arteries/catalog.json');
const genicularAudit = await json('docs/genicular-artery-source-audit.json');
const inferiorThyroid = await json('public/models/bodyparts3d/inferior-thyroid-arteries/catalog.json');
const subscapular = await json('public/models/bodyparts3d/subscapular-arteries/catalog.json');
const subscapularAudit = await json('docs/subscapular-artery-source-audit.json');
const circumflexFemoral = await json('public/models/bodyparts3d/circumflex-femoral/catalog.json');
const circumflexFemoralAudit = await json('docs/circumflex-femoral-source-audit.json');
const deferentDucts = await json('public/models/bodyparts3d/deferent-ducts/catalog.json');
const deferentDuctAudit = await json('docs/deferent-duct-source-audit.json');
const inferiorEpigastric = await json('public/models/bodyparts3d/inferior-epigastric-vessels/catalog.json');
const pelvicVeins = await json('public/models/bodyparts3d/pelvic-veins/catalog.json');
const limbicLandmarks = await json('public/models/bodyparts3d/limbic-landmarks/catalog.json');
const limbicAudit = await json('docs/limbic-landmark-source-audit.json');
const pelvicVeinAudit = await json('docs/pelvic-vein-source-audit.json');
const inferiorEpigastricAudit = await json('docs/inferior-epigastric-source-audit.json');
const musclePartCondition = await json('docs/muscle-part-condition-audit.json');
const cubitalVeinAudit = await json('docs/cubital-vein-source-audit.json');
const collicularBrachiaAudit = await json('docs/collicular-brachia-source-audit.json');
const cerebral = cerebralCatalog;
const cardiac = await json('public/models/bodyparts3d/cardiac/catalog.json');
const hepatic = await json('public/models/bodyparts3d/hepatic/catalog.json');
const renal = await json('public/models/bodyparts3d/renal/catalog.json');
const pancreatic = await json('public/models/bodyparts3d/pancreatic/catalog.json');
const cricothyroid = await json('public/models/bodyparts3d/cricothyroid/catalog.json');
const femoralComponents = await json('public/models/bodyparts3d/femoral-components/catalog.json');
const independentKnee = await json('public/models/um-knee/catalog.json');
const independentLimb = await json('public/models/um-limb/catalog.json');
const abdominalWall = await json('public/models/bodyparts3d-v3/abdominal-wall/catalog.json');
const visualPathway = await json(
  'public/models/bodyparts3d/visual-pathway/catalog.json',
);
const pulmonary = await json(
  'public/models/bodyparts3d/pulmonary/catalog.json',
);
const pulmonaryContext = await json(
  'public/models/bodyparts3d/pulmonary/airway-context.json',
);
const pulmonaryRoles = await json('public/models/bodyparts3d/pulmonary/branch-types.json');
const learning = parseLearningDocument(
  await json('content/learning-resources.v1.json'),
);
assert(learning, 'Invalid learning-resource contract');
const learningTargets = allLearningAnatomyRepresentations(
  catalog,
  manifest,
  shoulder,
);
createLearningRegistry(learning, learningTargets);
const revisions = await json('content/review-revisions.json');
const licenses = await json('LICENSES/dependency-license-audit.json');
const lock = await json('package-lock.json');
const lockedPackages = Object.entries(lock.packages).filter(([path]) => path);
assert.equal(
  licenses.packageCount,
  lockedPackages.length,
  'Run licenses:audit for the current lockfile.',
);
for (const [path, metadata] of lockedPackages) {
  const name = metadata.name ?? path.replace(/^.*node_modules\//, '');
  assert(
    licenses.packages.some(
      (entry) =>
        entry.name === name &&
        entry.version === metadata.version &&
        (!metadata.license || entry.license === metadata.license) &&
        entry.developmentOnly === (metadata.dev === true) &&
        entry.optional === (metadata.optional === true),
    ),
    'Licence inventory does not describe current package: ' + path,
  );
}
const tabs = [
  'anatomy',
  'function',
  'ct',
  'mri',
  'xray',
  'ultrasound',
  'pathology',
  'clinical',
  'quiz',
];
const statusNames = [
  'specificDraft',
  'identityOnly',
  'pending',
  'generatedIdentification',
];
const readinessCategories = {
  draft: 'specificDraft',
  'identity-only': 'identityOnly',
  pending: 'pending',
  'generated-identification': 'generatedIdentification',
};
function classify(section, readiness) {
  assert.equal(typeof section.body, 'string');
  assert(section.body.trim(), 'Empty displayed section');
  assert(
    Object.hasOwn(readinessCategories, readiness),
    'Missing explicit topic readiness',
  );
  return readinessCategories[readiness];
}
const contentRows = catalog.structures.map((entry) => ({
  entry,
  sections: Object.fromEntries(
    tabs.map((tab) => [tab, bodyContent(entry, tab)]),
  ),
  readiness: Object.fromEntries(
    tabs.map((tab) => [tab, bodyLesson(entry, tab).readiness]),
  ),
}));
function summarize(rows) {
  return Object.fromEntries(
    tabs.map((tab) => {
      const counts = Object.fromEntries(statusNames.map((name) => [name, 0]));
      for (const row of rows)
        counts[classify(row.sections[tab], row.readiness[tab])]++;
      assert.equal(
        Object.values(counts).reduce((a, b) => a + b, 0),
        rows.length,
      );
      return [tab, counts];
    }),
  );
}
const displayCatalog = bodyDisplayCatalog(catalog);
const nestedGeometryOnly = [];
const nestedRows = nestedStudyTargets(displayCatalog).map((target) => {
  const parent = displayCatalog.structures.find(
    (s) => s.id === target.parentId,
  );
  const concept = nestedTeachingFor(parent, target.study, target.structure);
  // The existing cranial partition study deliberately exposes unnamed source
  // pieces, not independent anatomical segments with inherited parent lessons.
  // Count that gap explicitly; retain the failure for any other missing binding.
  if (target.study === 'cranial-artery-components') {
    assert.equal(concept, null, 'Unnamed cranial pieces must not inherit teaching');
    nestedGeometryOnly.push({id:target.structureId,parentId:target.parentId,study:target.study});
    const sections = Object.fromEntries(tabs.map(tab=>[tab,{readiness:'pending',title:'Unnamed source piece',body:'No independently authored anatomical teaching or clinical identity is assigned to this source partition.'}]));
    return {sections,readiness:Object.fromEntries(tabs.map(tab=>[tab,'pending']))};
  }
  assert(
    concept,
    'Missing source-bound nested teaching: ' + target.structureId,
  );
  const sections = Object.fromEntries(
    tabs.map((tab) => [tab, nestedTopicLesson(concept, tab)]),
  );
  return {
    sections,
    readiness: Object.fromEntries(
      tabs.map((tab) => [tab, sections[tab].readiness]),
    ),
  };
});
const countsBySystem = Object.fromEntries(
  ['skeleton', 'muscles', 'nerves', 'organs', 'vessels', 'connective'].map(
    (system) => [
      system,
      catalog.structures.filter((entry) => entry.system === system).length,
    ],
  ),
);
const profiles = Object.values(dissectionProfiles);
const sourceHashes = {};
for (const path of [
  'lib/root-education-api.ts',
  'app/body-education-link.ts',
  'integration/shoulder/education-api.ts',
  'lib/regional-framing.ts',
  'lib/dissection-scope.ts',
  'app/dissection-data.ts',
  'app/body-explorer.tsx',
  'lib/lower-venous-imaging.ts',
  'lib/iliac-venous-imaging.ts',
  'lib/forearm-arterial-imaging.ts',
  'lib/iliac-arterial-imaging.ts',
  'lib/tract-plantar-imaging.ts',
  'lib/genicular-imaging.ts',
  'lib/regional-branch-imaging.ts',
  'content/regional-branch-imaging.ts',
  'content/cubital-studies.ts',
  'content/cubital-study-pins.json',
  'content/cubital-study-transition.json',
  'lib/cubital-studies.ts',
  'content/portal-hepatic-study.ts',
  'content/portal-hepatic-study-pins.json',
  'content/portal-hepatic-study-transition.json',
  'lib/portal-hepatic-study.ts',
  'content/regional-branch-imaging-pins.json',
  'content/regional-branch-imaging.transition.json',
  'content/genicular-imaging.ts',
  'content/genicular-imaging-pins.json',
  'content/genicular-imaging.transition.json',
  'content/tract-plantar-imaging.ts',
  'content/tract-plantar-imaging-pins.json',
  'content/tract-plantar-imaging.transition.json',
  'content/iliac-arterial-imaging.ts',
  'content/iliac-arterial-imaging-pins.json',
  'content/iliac-arterial-imaging.transition.json',
  'content/forearm-arterial-imaging.ts',
  'content/forearm-arterial-imaging-pins.json',
  'content/forearm-arterial-imaging.transition.json',
  'content/iliac-venous-imaging.ts',
  'content/iliac-venous-imaging-pins.json',
  'content/iliac-venous-imaging.transition.json',
  'content/lower-venous-imaging.ts',
  'content/lower-venous-imaging-pins.json',
  'content/lower-venous-imaging.transition.json',
  'docs/colonic-components-source-audit.json',
  'scripts/audit-colonic-components.mjs',
  'lib/bowel-components.ts',
  'app/bowel-components.tsx',
  'content/bowel-component-pins.json',
  'lib/vessel-visibility.ts',
  'app/vessel-system-control.tsx',
  'app/vessel-system-control.css',
  catalogPath,
  'public/models/bodyparts3d/manifest.json',
  'public/models/bodyparts3d/eye-layers/catalog.json',
  'public/models/bodyparts3d/eye-layers/display-correction.json',
  'public/models/bodyparts3d/pancreas/display-correction.json',
  'public/models/bodyparts3d/celiac-display/display-correction.json',
  'content/celiac-display-transition.json',
  'scripts/validate-celiac-display-correction.mjs',
  'scripts/validate-celiac-display-integration.mjs',
  'lib/body-display-catalog.ts',
  'lib/brachial-veins.ts',
  'lib/tentorium.ts',
  'lib/deep-leg-veins.ts',
  'lib/portal-veins.ts',
  'lib/hepatic-veins.ts',
  'lib/longus-colli.ts',
  'content/longus-colli-studies.ts',
  'content/longus-colli-recipe-transition.json',
  'public/models/bodyparts3d/longus-colli/catalog.json',
  'docs/longus-colli-source-audit.json',
  'public/models/bodyparts3d/hepatic-veins/catalog.json',
  'docs/hepatic-vein-source-audit.json',
  'lib/portal-drainage.ts',
  'lib/venous-drainage.ts',
  'public/models/bodyparts3d/portal-veins/catalog.json',
  'docs/portal-vein-source-audit.json',
  'lib/limb-vascular-studies.ts',
  'lib/arm-vascular-studies.ts',
  'content/arm-vascular-studies.ts',
  'content/arm-vascular-study-pins.json',
  'content/limb-vascular-studies.ts',
  'content/limb-vascular-study-pins.json',
  'public/models/bodyparts3d/deep-leg-veins/catalog.json',
  'docs/deep-leg-vein-source-audit.json',
  'lib/body-source-additions.ts',
  'content/tentorium-studies.ts',
  'public/models/bodyparts3d/tentorium/catalog.json',
  'docs/tentorium-source-audit.json',
  'public/models/bodyparts3d/brachial-veins/catalog.json',
  'docs/brachial-vein-source-audit.json',
  'lib/elbow-studies.ts',
  'content/elbow-studies.ts',
  'content/elbow-study-pins.json',
  'lib/xray-teaching.ts',
  'lib/upper-limb-motor.ts',
  'lib/regional-motor.ts',
  'lib/limb-motor.ts',
  'lib/lower-limb-motor.ts',
  'lib/lower-limb-arterial.ts',
  'lib/upper-limb-arterial.ts',
  'lib/regional-arterial.ts',
  'lib/limb-arterial.ts',
  'lib/arterial.ts',
  'lib/abdominal-arterial.ts',
  'content/abdominal-arterial.ts',
  'content/abdominal-arterial-pins.json',
  'content/upper-limb-arterial.ts',
  'content/upper-limb-arterial-pins.json',
  'content/lower-limb-arterial.ts',
  'content/lower-limb-arterial-pins.json',
  'app/arterial-connections.tsx',
  'lib/systemic-venous.ts',
  'content/systemic-venous.ts',
  'content/systemic-venous-pins.json',
  'app/venous-drainage.tsx',
  'content/lower-limb-motor.ts',
  'content/lower-limb-motor-pins.json',
  'content/upper-limb-motor.ts',
  'content/upper-limb-motor-pins.json',
  'app/upper-limb-motor.tsx',
  'app/upper-limb-motor.css',
  'lib/spine-imaging.ts',
  'lib/hip-imaging.ts',
  'lib/wrist-imaging.ts',
  'lib/tarsal-imaging.ts',
  'lib/upper-vessel-imaging.ts',
  'lib/lower-arterial-imaging.ts',
  'lib/limb-bone-imaging.ts',
  'lib/thoracic-bone-imaging.ts',
  'lib/abdominal-organ-imaging.ts',
  'content/abdominal-organ-imaging.ts',
  'content/abdominal-organ-imaging-pins.json',
  'content/thoracic-bone-imaging.ts',
  'content/thoracic-bone-imaging-pins.json',
  'content/limb-bone-imaging.ts',
  'content/limb-bone-imaging-pins.json',
  'content/lower-arterial-imaging.ts',
  'content/lower-arterial-imaging-pins.json',
  'content/upper-vessel-imaging.ts',
  'content/upper-vessel-imaging-pins.json',
  'content/tarsal-imaging-concepts.ts',
  'content/tarsal-imaging-pins.json',
  'content/wrist-imaging-concepts.ts',
  'content/wrist-imaging-pins.json',
  'content/hip-imaging-concepts.ts',
  'content/hip-imaging-pins.json',
  'content/spine-imaging-concepts.ts',
  'content/spine-imaging-pins.json',
  'content/shoulder-xray-bindings.json',
  'docs/pancreatic-source-audit.json',
  'lib/eye-layer-state.ts',
  'lib/ventricles.ts',
  'app/eye-layers.tsx',
  'public/models/bodyparts3d/ventricles/catalog.json',
  'public/models/bodyparts3d/brainstem/catalog.json',
  'public/models/bodyparts3d/collicular-brachia/catalog.json',
  'public/models/bodyparts3d/cubital-veins/catalog.json',
  'public/models/bodyparts3d/genicular-arteries/catalog.json',
  'docs/genicular-artery-source-audit.json',
  'lib/genicular-arteries.ts',
  'public/models/bodyparts3d/inferior-thyroid-arteries/catalog.json',
  'public/models/bodyparts3d/subscapular-arteries/catalog.json',
  'docs/subscapular-artery-source-audit.json',
  'lib/subscapular-arteries.ts',
  'public/models/bodyparts3d/circumflex-femoral/catalog.json',
  'docs/circumflex-femoral-source-audit.json',
  'lib/circumflex-femoral.ts',
  'docs/inferior-thyroid-source-audit.json',
  'docs/muscle-part-condition-audit.json',
  'content/inferior-thyroid-context-pins.json',
  'lib/inferior-thyroid-arteries.ts',
  'public/models/bodyparts3d/deferent-ducts/catalog.json',
  'docs/deferent-duct-source-audit.json',
  'lib/deferent-ducts.ts',
  'content/deferent-duct-study.ts',
  'content/deferent-duct-study-transition.json',
  'public/models/bodyparts3d/inferior-epigastric-vessels/catalog.json',
  'public/models/bodyparts3d/pelvic-veins/catalog.json',
  'public/models/bodyparts3d/limbic-landmarks/catalog.json',
  'docs/limbic-landmark-source-audit.json',
  'lib/limbic-landmarks.ts',
  'content/limbic-landmark-study.ts',
  'content/limbic-landmark-study-transition.json',
  'docs/pelvic-vein-source-audit.json',
  'lib/pelvic-veins.ts',
  'content/pelvic-vein-study.ts',
  'content/pelvic-vein-teaching.ts',
  'content/pelvic-vein-study-transition.json',
  'docs/inferior-epigastric-source-audit.json',
  'lib/inferior-epigastric-vessels.ts',
  'content/inferior-epigastric-study.ts',
  'content/inferior-epigastric-study-transition.json',
  'content/genicular-study.ts',
  'content/genicular-study-pins.json',
  'lib/genicular-study.ts',
  'scripts/current-source-holds.mjs',
  'docs/cubital-vein-source-audit.json',
  'lib/cubital-veins.ts',
  'docs/collicular-brachia-source-audit.json',
  'lib/brainstem.ts',
  'content/collicular-brachia-teaching.ts',
  'public/models/bodyparts3d/cerebral/catalog.json',
  'public/models/bodyparts3d/hippocampi/catalog.json',
  'lib/hippocampi.ts',
  'scripts/validate-hippocampi.mjs',
  'scripts/validate-hippocampal-teaching.mjs',
  'content/hippocampal-teaching.ts',
  'public/models/bodyparts3d/cardiac/catalog.json',
  'lib/cardiac.ts',
  'lib/hepatic.ts',
  'lib/renal.ts',
  'lib/pancreatic.ts',
  'lib/cricothyroid.ts',
  'lib/femoral-components.ts',
  'app/femoral-components.tsx',
  'content/femoral-component-teaching.ts',
  'content/femoral-component-teaching-bindings.v1.json',
  'public/models/bodyparts3d/femoral-components/catalog.json',
  'docs/femoral-component-source-audit.json',
  'content/cricothyroid-teaching.ts',
  'public/models/bodyparts3d/cricothyroid/catalog.json',
  'content/pancreatic-teaching.ts',
  'public/models/bodyparts3d/pancreatic/catalog.json',
  'lib/renal-relationships.ts',
  'content/renal-teaching.ts',
  'public/models/bodyparts3d/renal/catalog.json',
  'docs/renal-vascular-source-audit.json',
  'lib/visual-pathway.ts',
  'lib/visual-pathway-context.ts',
  'public/models/bodyparts3d/visual-pathway/sellar-context.json',
  'content/visual-pathway-teaching.ts',
  'content/brain-imaging-teaching.ts',
  'content/eye-imaging-teaching.ts',
  'public/models/bodyparts3d/visual-pathway/catalog.json',
  'docs/visual-pathway-source-audit.json',
  'public/models/bodyparts3d/hepatic/catalog.json',
  'docs/hepatic-source-audit.json',
  'lib/pulmonary.ts',
  'lib/pulmonary-context.ts',
  'lib/pulmonary-roles.ts',
  'public/models/bodyparts3d/pulmonary/branch-types.json',
  'scripts/export-pulmonary-roles.mjs',
  'public/models/bodyparts3d/pulmonary/airway-context.json',
  'public/models/bodyparts3d/pulmonary/catalog.json',
  'docs/pulmonary-source-audit.json',
  'content/cerebral-supplement-audit.json',
  'content/nested-teaching.ts',
  'content/nested-review-bindings.json',
  'lib/nested-review.ts',
  'lib/nested-review-key.ts',
  'lib/nested-review-links.ts',
  'lib/nested-review-material.ts',
  'lib/nested-review-api.ts',
  'lib/nested-review-store.ts',
  'lib/nested-review-client.ts',
  'app/review/nested/page.tsx',
  'app/review/nested/workspace.tsx',
  'app/api/nested-review/route.ts',
  'content/cardiac-teaching.ts',
  'content/cardiac-xray-teaching.ts',
  'content/coronary-venous-teaching.ts',
  'content/hepatic-teaching.ts',
  'content/pulmonary-teaching.ts',
  'content/cerebral-teaching.ts',
  'content/superior-temporal-mri.ts',
  'content/nested-teaching-bindings.v1.json',
  'lib/nested-anatomy.ts',
  'lib/nested-teaching.ts',
  'app/nested-teaching.tsx',
  'app/nested-teaching.css',
  'package-lock.json',
  'content/schema/anatomy-structure.schema.json',
  'content/review-revisions.json',
  'content/learning-resources.v1.json',
  'lib/learning-resource-types.ts',
  'lib/learning-resources.ts',
  'lib/learning-anatomy.ts',
  'lib/nested-learning-anatomy.ts',
  'lib/ventricular-relationships.ts',
  'lib/cardiac-context.ts',
  'public/models/bodyparts3d/cardiac/great-vessel-context.json',
  'app/ventricles.tsx',
  'app/ventricular-relationships.css',
  'app/body-scene.tsx',
  'app/body-batch.tsx',
  'lib/body-batching.ts',
  'docs/body-batching-baseline.json',
  'scripts/glb-lossless-codec.mjs',
  'scripts/compress-model-delivery.mjs',
  'app/um-knee-study.tsx',
  'app/um-knee-study.css',
  'app/um-knee-entry.css',
  'lib/um-knee-study.ts',
  'lib/um-limb-studies.ts',
  'lib/trunk-reasoning.ts',
  'lib/upper-arm-reasoning.ts',
  'lib/upper-limb-bone-reasoning.ts',
  'lib/um-limb-teaching.ts',
  'content/um-limb-teaching.ts',
  'content/um-limb-clinical.ts',
  'content/um-hip-thigh-clinical.ts',
  'content/um-calf-foot-clinical.ts',
  'content/um-hip-muscle-clinical.ts',
  'content/um-bone-cartilage-clinical.ts',
  'content/um-limb-motor.ts',
  'lib/um-limb-motor.ts',
  'app/um-limb-motor.tsx',
  'content/um-limb-teaching-bindings.v1.json',
  'lib/specimen-links.ts',
  'lib/um-limb-navigation.ts',
  'content/um-limb-navigation.v1.json',
  'app/specimen-study-link.tsx',
  'app/specimens/lower-limb/page.tsx',
  'app/specimens/lower-limb/specimen-linked-page.tsx',
  'app/um-limb-learning.tsx',
  'lib/independent-specimen.ts',
  'lib/abdominal-wall.ts',
  'lib/back-layers.ts',
  'lib/back-layers-teaching.ts',
  'content/back-layers-teaching.ts',
  'content/back-layers-clinical.ts',
  'content/back-bone-teaching.ts',
  'app/back-layers-study.tsx',
  'app/specimens/back-layers/page.tsx',
  'public/models/bodyparts3d-v3/back-layers/catalog.json',
  'public/models/bodyparts3d-v3/back-layers/NOTICE.md',
  'lib/abdominal-wall-practice.ts',
  'lib/abdominal-wall-binding.ts',
  'lib/abdominal-wall-teaching.ts',
  'content/abdominal-wall-teaching.ts',
  'lib/specimen-identification.ts',
  'scripts/exclude-source-recovery.mjs',
  'app/abdominal-wall-study.tsx',
  'app/hra-pelvis-study.tsx',
  'app/hra-renal-study.tsx',
  'app/specimens/kidneys/page.tsx',
  'lib/hra-renal.ts',
  'lib/hra-renal-teaching.ts',
  'content/hra-renal-teaching.ts',
  'content/hra-renal-clinical.ts',
  'public/models/hra-renal/catalog.json',
  'public/models/hra-renal/NOTICE.md',
  'content/sources/hra-renal/metadata.json',
  'content/sources/hra-renal/crosswalk.csv',
  'docs/hra-renal-source-audit.json',
  'app/specimens/female-pelvis/page.tsx',
  'lib/hra-pelvis.ts',
  'lib/hra-pelvis-teaching.ts',
  'content/hra-pelvic-teaching.ts',
  'public/models/hra-pelvis/catalog.json',
  'public/models/hra-pelvis/NOTICE.md',
  'content/sources/hra-pelvis/metadata.json',
  'content/sources/hra-pelvis/crosswalk.csv',
  'docs/hra-pelvic-source-audit.json',
  'app/um-knee-study.tsx',
  'app/specimens/abdominal-wall/page.tsx',
  'public/models/bodyparts3d-v3/abdominal-wall/catalog.json',
  'public/models/bodyparts3d-v3/abdominal-wall/NOTICE.md',
  'app/um-limb-study.tsx',
  'public/models/um-limb/catalog.json',
  'public/models/um-knee/catalog.json',
  'lib/origin-guides.ts',
  'lib/learning-entitlements.ts',
  'public/brand/visible-medicine-lockup-dark.png',
  'public/brand/visible-medicine-lockup-light.png',
])
  sourceHashes[path] = hash(await read(path));
// Hash resolved data, not generated module comments that contain checkout paths.
// This remains portable and binds the result to actual displayed copy/recipes.
sourceHashes.resolvedContentAndRecipeData = hash(
  JSON.stringify({
    body: contentRows.map(({ entry, sections }) => ({
      id: entry.id,
      sections,
    })),
    shoulder,
    dissectionProfiles,
  }),
);
sourceHashes.explicitTopicReadiness = hash(
  JSON.stringify(
    contentRows.map(({ entry, readiness }) => ({
      id: entry.id,
      readiness,
    })),
  ),
);
sourceHashes.reasoningQuestionData = hash(JSON.stringify(reasoningConcepts));
sourceHashes.guidedLearningData = hash(JSON.stringify({ regionalTours, shoulderTour }));
for (const path of [
  'app/volume-image.tsx', 'app/review/mri-import/page.tsx',
  'lib/regional-tours.ts', 'lib/shoulder-tours.ts', 'lib/chest-wall-tour.ts',
  'lib/orbital-tour.ts', 'lib/intrinsic-larynx-tour.ts', 'lib/male-duct-tour.ts', 'lib/deep-brain-tour.ts',
])
  sourceHashes[path] = hash(await read(path));
// Include resolved nested text and references, including separately imported
// organ modules. Coverage counts alone do not detect an altered paragraph.
sourceHashes.nestedTeachingData = hash(
  JSON.stringify({
    concepts: nestedConcepts,
    references: nestedTeachingReferences,
  }),
);
const publicFiles = [];
async function inventory(directory) {
  for (const entry of await readdir(new URL(directory, root), {
    withFileTypes: true,
  })) {
    const path = directory + '/' + entry.name;
    if (entry.isDirectory()) await inventory(path);
    else if (entry.isFile()) publicFiles.push(path);
    else throw Error('Unexpected non-file public asset: ' + path);
  }
}
await inventory('public');
publicFiles.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
const extensions = {};
for (const path of publicFiles) {
  const extension = path.split('.').at(-1).toLowerCase();
  extensions[extension] = (extensions[extension] ?? 0) + 1;
}
const independentNavigation = Object.values(limbDefinitions).map(definition => {
  const roundTrip = (selectedId, studyId) => {
    const href = makeSpecimenLink(definition, { selectedId, studyId, view: 'anterior', topic: 'anatomy' });
    assert(href, 'Missing independent specimen link');
    const parsed = parseSpecimenLink(Object.fromEntries(new URL(href, 'https://example.invalid').searchParams));
    const resolved = resolveSpecimenLink(parsed);
    assert.equal(resolved.status, 'ready');
    assert.equal(resolved.selectedId, selectedId);
    return 1;
  };
  return { id: definition.key,
    structureLinks: definition.surfaces.reduce((n, s) => n + roundTrip(s.id, null), 0),
    studyMemberLinks: definition.studies.reduce((n, s) => n + s.ids.reduce((m, id) => m + roundTrip(id, s.id), 0), 0),
  };
});
const arterialEntries = catalog.structures.filter(s=>s.system==='vessels').map(s=>arterialNeighbours(catalog,'whole-body','both',s.id)).filter(Boolean);
const venousEntries = catalog.structures.filter(s=>s.system==='vessels').map(s=>systemicVenousNeighbours(catalog,'whole-body','both',s.id)).filter(Boolean);
const report = {
  schemaVersion: 1,
  method:
    'Offline source and displayed-copy inventory; no clinical or browser certification.',
  sourceHashes,
  rendering: { bodyBatching: await json('docs/body-batching-baseline.json'), gpuAcceptance: false },
  anatomy: {
    circumflexFemoralBranches: {
      selections: circumflexFemoral.structures.length,
      originalTriangles: circumflexFemoralAudit.groups.filter(g => g.status === 'candidate').reduce((n,g) => n + g.topology.triangles, 0),
      alreadyGroupedParents: circumflexFemoralAudit.groups.filter(g => g.status === 'already-in-deep-femoral-aggregate').length,
      preservedRootRecords: circumflexFemoralAudit.screened.length,
      clinicalApproval: false,
      continuousLumenClaimed: false,
    },
    subscapularArteries: {
      selections: subscapular.structures.length,
      originalTriangles: subscapularAudit.groups.reduce((n,g) => n + g.topology.triangles, 0),
      contextSelections: subscapular.contextRecords.length,
      originalSourcePreserved: true,
      clinicalApproval: false,
      continuousLumenClaimed: false,
    },
    limbicLandmarks: {
      sourceSelections: limbicLandmarks.structures.length,
      originalTriangles: limbicAudit.groups.filter(g=>g.status==='candidate').reduce((n,g)=>n+g.topology.triangles,0),
      contextSelections: limbicLandmarks.contextRecords.length,
      heldSources: limbicAudit.groups.filter(g=>g.status==='held').map(g=>g.id),
      focusRecipe: limbicLandmarkStudy.id,
      focusRegions: limbicLandmarkStudy.regions,
      clinicalApproval: false,
      continuousTractClaimed: false,
    },
    pelvicVeins: {
      sourceSelections: pelvicVeins.structures.length,
      originalTriangles: pelvicVeinAudit.groups.filter(g=>g.status!=='held').reduce((sum,g)=>sum+g.topology.triangles,0),
      heldSources: pelvicVeinAudit.groups.filter(g=>g.status==='held').map(g=>g.id),
      contextSelections: pelvicVeins.contextRecords.length,
      focusRecipe: pelvicVeinStudy.id,
      focusRegions: pelvicVeinStudy.regions,
      extendedDraftPlacements: Object.fromEntries(['function','clinical','pathology','ct','mri','ultrasound'].map(tab=>[tab,pelvicVeins.structures.filter(s=>bodyLesson(s,tab).readiness==='draft').length])),
      distinctExtendedTexts: new Set(Object.values(pelvicVeinTeaching).flatMap(group=>Object.values(group).map(topic=>topic.body))).size,
      clinicalApproval: false,
      continuousLumenClaimed: false,
    },
    inferiorEpigastricVessels: {
      sourceSelections: inferiorEpigastric.structures.length,
      originalTriangles: inferiorEpigastricAudit.groups.reduce((sum, g) => sum + g.topology.triangles, 0),
      contextSelections: inferiorEpigastric.contextRecords.length,
      focusRecipe: inferiorEpigastricStudy.id,
      focusRegions: inferiorEpigastricStudy.regions,
      exactSourceFacesRetained: true,
      continuousLumenClaimed: false,
      clinicalApproval: false,
    },
    deferentDucts: {
      sourceSelections: deferentDucts.structures.length,
      originalTriangles: deferentDuctAudit.groups.reduce((sum, g) => sum + g.topology.triangles, 0),
      contextSelections: deferentDucts.contextRecords.length,
      focusRecipe: deferentDuctStudy.id,
      focusRegions: deferentDuctStudy.regions,
      exactSourceFacesRetained: true,
      continuousLumenClaimed: false,
      clinicalApproval: false,
    },
    inferiorThyroidArteries: {
      sourceSelections: inferiorThyroid.structures.length,
      originalTriangles: 962,
      neckContextBones: 8,
      clinicalApproval: false,
      sourceOnlyMuscleCandidates: musclePartCondition.rows.length,
      muscleCandidatesAdmitted: 0,
    },
    genicularArteries: {
      focusRecipe: genicularStudy.id,
      focusRegions: genicularStudy.regions,
      focusSourceSelections: genicularStudySourceIds.length,
      cameraOnlyCloseUp: true,
      sourceSelections: genicularArteries.structures.length,
      originalTriangles: genicularAudit.groups.reduce((sum,g)=>sum+g.topology.triangles,0),
      sourceComponents: genicularAudit.groups.reduce((sum,g)=>sum+g.topology.components.length,0),
      exactSourceFacesRetained: true,
      completeAnastomosisClaimed: false,
      clinicalApproval: false,
    },
    cubitalVeins: {
      sourceSelections: cubitalVeins.structures.length,
      originalTriangles: cubitalVeinAudit.groups.reduce((sum, g) => sum + g.topology.triangles, 0),
      sourceFiles: cubitalVeins.structures.reduce((sum, s) => sum + s.sources.length, 0),
      exactSourceFacesRetained: true,
      clinicalApproval: false,
      connectedLumenClaimed: false,
    },
    longusColli: {
      sourceSelections: catalog.structures.filter(s=>s.bundle==='longus-colli').length,
      originalTriangles: 7162, sourceFiles: 3, clinicalApproval: false,
      laterality: 'left only', focusRegions: ['head-neck', 'spine', 'whole-body'],
      exactSourceFacesRetained: true, rightCounterpartGenerated: false,
    },
    hepaticVeins: {
      sourceSelections: catalog.structures.filter(s=>s.bundle==='hepatic-veins').length,
      originalTriangles: 13984, sourceFiles: 10, sourceComponents: 13,
      exactSourceFacesRetained: true, clinicalApproval: false, connectedTreeClaimed: false,
    },
    portalVeins: {
      sourceSelections: catalog.structures.filter(s=>s.bundle==='portal-veins').length,
      originalTriangles: 3892, sourceFiles: 5,
      mappedSelections: catalog.structures.filter(s=>portalVenousNeighbours(catalog,'whole-body','both',s.id)).length,
      mappedRelationships: catalog.structures.reduce((n,s)=>n+(portalVenousNeighbours(catalog,'whole-body','both',s.id)?.rows.filter(r=>r.direction==='outlet').length??0),0),
      exactSourceFacesRetained: true, clinicalApproval: false, flowSimulated: false,
    },
    limbVascularStudies: {
      studies: limbVascularStudySets.length,
      sourceSelections: catalog.structures.filter(s=>limbVascularSourceIds.includes(s.fmaId)).length,
      regions: [...new Set(limbVascularStudySets.flatMap(s=>s.regions))],
      sourceAndFrameChecked: true, geometryChanged: false, clinicalApproval: false,
    },
    armVascularStudies: {
      studies: armVascularStudies.length,
      sourceSelections: catalog.structures.filter(s=>armVascularSourceIds.includes(s.fmaId)).length,
      regions: [...new Set(armVascularStudies.flatMap(s=>s.regions))],
      sourceAndFrameChecked: true, geometryChanged: false, clinicalApproval: false,
    },
    upperVesselImaging: {
      selections: catalog.structures.filter(s=>Object.values(upperVesselImagingGroups).flat().includes(s.fmaId)).length,
      groups: Object.keys(upperVesselImagingGroups).length,
      distinctTopicTexts: Object.values(upperVesselImagingTopics).reduce((n,g)=>n+Object.keys(g).length,0),
      modalities: Object.fromEntries(['ct','mri','ultrasound'].map(tab=>[tab,catalog.structures.filter(s=>upperVesselImagingLesson(s,tab)?.readiness==='draft').length])),
      geometryChanged: false, clinicalApproval: false,
    },
    lowerArterialImaging: {
      selections: catalog.structures.filter(s=>Object.values(lowerArterialImagingGroups).flat().includes(s.fmaId)).length,
      groups: Object.keys(lowerArterialImagingGroups).length,
      distinctTopicTexts: Object.values(lowerArterialImagingTopics).reduce((n,g)=>n+Object.keys(g).length,0),
      modalities: Object.fromEntries(['ct','mri','ultrasound'].map(tab=>[tab,catalog.structures.filter(s=>lowerArterialImagingLesson(s,tab)?.readiness==='draft').length])),
      geometryChanged: false, clinicalApproval: false,
    },
    abdominalOrganImaging: {
      selections: catalog.structures.filter(s=>Object.values(abdominalOrganImagingGroups).flat().includes(s.fmaId)).length,
      landmarkGroups: Object.keys(abdominalOrganImagingGroups).length,
      distinctTopicTexts: new Set(Object.values(abdominalOrganImagingTopics).flatMap(g=>Object.values(g).map(t=>JSON.stringify(t)))).size,
      modalities: Object.fromEntries(['xray','ct','mri','ultrasound'].map(tab=>[tab,catalog.structures.filter(s=>abdominalOrganImagingLesson(s,tab)?.readiness==='draft').length])),
      geometryChanged: false, clinicalApproval: false,
    },
    thoracicBoneImaging: {
      selections: catalog.structures.filter(s=>Object.values(thoracicBoneImagingGroups).flat().includes(s.fmaId)).length,
      landmarkGroups: Object.keys(thoracicBoneImagingGroups).length,
      distinctTopicTexts: Object.values(thoracicBoneImagingTopics).reduce((n,g)=>n+Object.keys(g).length,0),
      modalities: Object.fromEntries(['xray','ct','mri','ultrasound'].map(tab=>[tab,catalog.structures.filter(s=>thoracicBoneImagingLesson(s,tab)?.readiness==='draft').length])),
      geometryChanged: false, clinicalApproval: false,
    },
    limbBoneImaging: {
      selections: catalog.structures.filter(s=>Object.values(limbBoneImagingGroups).flat().includes(s.fmaId)).length,
      groups: Object.keys(limbBoneImagingGroups).length,
      distinctTopicTexts: Object.values(limbBoneImagingTopics).reduce((n,g)=>n+Object.keys(g).length,0),
      modalities: Object.fromEntries(['xray','ct','mri'].map(tab=>[tab,catalog.structures.filter(s=>limbBoneImagingLesson(s,tab)?.readiness==='draft').length])),
      geometryChanged: false, clinicalApproval: false,
    },
    deepLegVeins: {
      sourceSelections: catalog.structures.filter(s=>s.bundle==='deep-leg-veins').length,
      originalTriangles: 71522, sourceFiles: 8, heldFibularGroups: 2,
      exactSourceFacesRetained: true, completeCompanionVeins: false,
      sourceAndFrameChecked: true, clinicalApproval: false,
    },
    venousDrainage: {
      selections: venousEntries.length,
      groups: new Set(venousEntries.map(e=>e.group)).size,
      relationships: venousEntries.reduce((n,e)=>n+e.rows.filter(r=>r.direction==='outlet').length,0),
      variableOutlets: venousEntries.reduce((n,e)=>n+e.rows.filter(r=>r.direction==='outlet'&&r.kind==='variable').length,0),
      sourceAndFrameChecked: true, geometryAdded: false, flowSimulated: false, clinicalApproval: false,
    },
    arterialConnections: {
      selections: arterialEntries.length,
      concepts: new Set(arterialEntries.map(e=>e.territory+'|'+e.concept)).size,
      territories: Object.fromEntries(['lower-limb','upper-limb','abdominal','abdominal and lower-limb'].map(t=>[t, arterialEntries.filter(e=>e.territory===t).length])),
      alternativeRelationships: new Set(arterialEntries.flatMap(e=>e.rows.filter(r=>r.kind==='variant').map(r=>[e.selected.id,r.structure.id].sort().join('|')))).size,
      relationships: new Set(arterialEntries.flatMap(e=>e.rows.map(r=>[e.selected.id,r.structure.id].sort().join('|')))).size,
      sourceAndFrameChecked: true, geometryAdded: false, flowSimulated: false, clinicalApproval: false,
    },
    lowerLimbMotor: {
      regions: lowerLimbMotorRegions,
      groups: new Set(lowerLimbMotorRegions.flatMap(r => lowerLimbMotorGroups(catalog, r).map(g => g.key))).size,
      muscleSelections: new Set(lowerLimbMotorRegions.flatMap(r => lowerLimbMotorGroups(catalog, r).flatMap(g => g.targets.map(t => t.structure.id)))).size,
      relationships: new Set(lowerLimbMotorRegions.flatMap(r => lowerLimbMotorGroups(catalog, r).flatMap(g => g.targets.map(t => g.key + '|' + t.structure.id)))).size,
      sourceAndFrameChecked: true, nerveGeometryAdded: false, clinicalApproval: false,
    },
    upperLimbMotor: {
      regions: upperLimbMotorRegions,
      groups: new Set(upperLimbMotorRegions.flatMap(r => upperLimbMotorGroups(catalog, r).map(g => g.key))).size,
      muscleSelections: new Set(upperLimbMotorRegions.flatMap(r => upperLimbMotorGroups(catalog, r).flatMap(g => g.targets.map(t => t.structure.id)))).size,
      relationships: upperLimbMotorRegions.reduce((n,r) => n + upperLimbMotorGroups(catalog,r).reduce((m,g) => m + g.targets.length,0),0),
      sourceAndFrameChecked: true, nerveGeometryAdded: false, clinicalApproval: false,
    },
    renalSpecimen: {
      id: hraRenalDefinition.key, route: '/specimens/kidneys',
      representations: hraRenalDefinition.surfaces.length,
      triangles: hraRenalDefinition.surfaces.reduce((n,s)=>n+s.triangles,0),
      studies: hraRenalDefinition.studies.length,
      anatomyFunctionDrafts: hraRenalDefinition.surfaces.filter(s=>hraRenalTeaching(hraRenalDefinition,s)).length,
      distinctAnatomyConcepts: new Set(hraRenalDefinition.surfaces.map(s=>hraRenalTeaching(hraRenalDefinition,s)?.anatomy).filter(Boolean)).size,
      practiceTargets: hraRenalPractice.eligibleIds(hraRenalDefinition,hraRenalDefinition.surfaces.map(s=>s.id)).length,
      heldGroups: 3,
      clinicalImagingDrafts: hraRenalDefinition.surfaces.reduce((n,s)=>n+Object.keys(hraRenalTeaching(hraRenalDefinition,s)?.extended?.topics??{}).length,0),
      uniqueClinicalImagingTexts: new Set(hraRenalDefinition.surfaces.flatMap(s=>Object.values(hraRenalTeaching(hraRenalDefinition,s)?.extended?.topics??{}).map(t=>t.body))).size,
      extendedByTopic: Object.fromEntries(['clinical','pathology','ct','mri','xray','ultrasound'].map(topic=>[topic,hraRenalDefinition.surfaces.filter(s=>hraRenalTeaching(hraRenalDefinition,s)?.extended?.topics[topic]).length])),
      clinicalSelfChecks: hraRenalDefinition.surfaces.filter(s=>hraRenalTeaching(hraRenalDefinition,s)?.extended?.selfCheck).length,
      distinctClinicalSelfChecks: new Set(hraRenalDefinition.surfaces.map(s=>hraRenalTeaching(hraRenalDefinition,s)?.extended?.selfCheck.question).filter(Boolean)).size,
      source: hraRenalDefinition.source,
      registeredToCurrentBody: false, realImaging: false, clinicalApproval: false, countedAsRootTeaching: false,
    },
    femalePelvicSpecimen: {
      id: hraPelvisDefinition.key, route: '/specimens/female-pelvis',
      representations: hraPelvisDefinition.surfaces.length,
      triangles: hraPelvisDefinition.surfaces.reduce((n,s)=>n+s.triangles,0),
      studies: hraPelvisDefinition.studies.length,
      anatomyFunctionDrafts: hraPelvisDefinition.surfaces.filter(s=>hraPelvicTeaching(hraPelvisDefinition,s)).length,
      pendingTeaching: hraPelvisDefinition.surfaces.filter(s=>!hraPelvicTeaching(hraPelvisDefinition,s)).length,
      practiceTargets: hraPelvicPractice.eligibleIds(hraPelvisDefinition,hraPelvisDefinition.surfaces.map(s=>s.id)).length,
      distinctAnatomyConcepts: new Set(hraPelvisDefinition.surfaces.map(s=>hraPelvicTeaching(hraPelvisDefinition,s)?.anatomy).filter(Boolean)).size,
      extendedTopicDrafts: hraPelvisDefinition.surfaces.reduce((n,s)=>n+Object.keys(hraPelvicTeaching(hraPelvisDefinition,s)?.extended?.topics??{}).length,0),
      extendedByTopic: Object.fromEntries(['clinical','pathology','ct','mri','xray','ultrasound'].map(topic=>[topic,hraPelvisDefinition.surfaces.filter(s=>hraPelvicTeaching(hraPelvisDefinition,s)?.extended?.topics[topic]).length])),
      clinicalSelfChecks: hraPelvisDefinition.surfaces.filter(s=>hraPelvicTeaching(hraPelvisDefinition,s)?.extended?.selfCheck).length,
      source: hraPelvisDefinition.source, heldGroups: 6,
      registeredToCurrentBody: false, realImaging: false, clinicalApproval: false, countedAsRootTeaching: false,
    },
    abdominalWallSpecimen: {
      id: abdominalWall.specimenId, route: '/specimens/abdominal-wall',
      representations: abdominalWall.structures.length,
      muscleSurfaces: abdominalWall.structures.filter(s => s.tissue === 'muscle').length,
      skeletalContext: abdominalWall.structures.filter(s => s.tissue === 'skeleton').length,
      triangles: abdominalWall.structures.reduce((n,s) => n + s.triangles,0),
      license: abdominalWall.source.license, source: abdominalWall.source.archive,
      registeredToCurrentBody: false, clinicalApproval: false, countedAsRootTeaching: false,
      detailedTeaching: {
        anatomyFunctionDrafts: abdominalWallDefinition.surfaces.filter(s => abdominalTeachingFor(abdominalWallDefinition, s)).length,
        attachmentDrafts: abdominalWallDefinition.surfaces.filter(s => abdominalTeachingFor(abdominalWallDefinition, s)?.attachments).length,
        extendedTopicDrafts: abdominalWallDefinition.surfaces.reduce((n,s) => n + Object.keys(abdominalTeachingFor(abdominalWallDefinition, s)?.extended?.topics ?? {}).length, 0),
        clinicalSelfChecks: abdominalWallDefinition.surfaces.filter(s => abdominalTeachingFor(abdominalWallDefinition, s)?.extended?.selfCheck).length,
        sourceAndFrameChecked: true, clinicalApproval: false, realImaging: false,
      },
      identificationPractice: {
        muscleTargets: abdominalWallPractice.eligibleIds(abdominalWallDefinition, abdominalWall.structures.map(s => s.id)).length,
        studies: abdominalWallDefinition.studies.map(s => ({ id: s.id, questions: abdominalWallPractice.createRound(abdominalWallDefinition, s.ids, () => .5)?.questions.length ?? 0 })),
        clinicalCertification: false, sourceAndFrameChecked: true, sourceLabelsOnly: true,
      },
      note: 'Separate v3 source specimen with layer studies; six muscle identities absent from v4 become inspectable without merging source frames. No complete sheath or neurovascular plane.',
    },
    backLayersSpecimen: {
      id: backLayersDefinition.key, route: '/specimens/back-layers',
      representations: backLayersDefinition.surfaces.length,
      muscleSurfaces: backLayersDefinition.surfaces.filter(s=>s.tissue==='muscle').length,
      skeletalContext: backLayersDefinition.surfaces.filter(s=>s.tissue==='skeleton').length,
      triangles: backLayersDefinition.surfaces.reduce((n,s)=>n+s.triangles,0),
      studies: backLayersDefinition.studies.length,
      anatomyFunctionDrafts: backLayersDefinition.surfaces.filter(s=>backLayersTeachingFor(backLayersDefinition,s)).length,
      attachmentMotorDrafts: backLayersDefinition.surfaces.filter(s=>backLayersTeachingFor(backLayersDefinition,s)?.attachments).length,
      extendedTopicDrafts: Object.fromEntries(['clinical','pathology','ct','mri','xray','ultrasound'].map(topic => [topic, backLayersDefinition.surfaces.filter(s=>backLayersTeachingFor(backLayersDefinition,s)?.extended?.topics[topic]).length])),
      clinicalSelfChecks: backLayersDefinition.surfaces.filter(s=>backLayersTeachingFor(backLayersDefinition,s)?.extended?.selfCheck).length,
      distinctExtendedTopicTexts: new Set(backLayersDefinition.surfaces.flatMap(s => Object.values(backLayersTeachingFor(backLayersDefinition,s)?.extended?.topics ?? {}).map(t => t.body))).size,
      distinctClinicalSelfChecks: new Set(backLayersDefinition.surfaces.map(s=>backLayersTeachingFor(backLayersDefinition,s)?.extended?.selfCheck.question).filter(Boolean)).size,
      practiceTargets: backLayersPractice.eligibleIds(backLayersDefinition,backLayersDefinition.surfaces.map(s=>s.id)).length,
      source: backLayersDefinition.source, registeredToCurrentBody: false, countedAsRootTeaching: false,
      realImaging: false, clinicalApproval: false,
    },
    independentSpecimens: [{
      id: independentLimb.specimenId,
      representations: new Set([...independentKnee.structures, ...independentLimb.structures].map((s) => s.id)).size,
      kneeRepresentationsIncluded: independentKnee.structures.length,
      regionalStudies: Object.values(limbDefinitions).map((d) => ({ id: d.key, selections: d.surfaces.length, studies: d.studies.length })),
      source: independentKnee.source.doi,
      license: independentKnee.source.license,
      registeredToBodyParts3D: independentKnee.registeredToBodyParts3D,
      clinicalApproval: [...independentKnee.structures, ...independentLimb.structures].every((s) => s.validation.anatomicalReview),
      navigation: { route: '/specimens/lower-limb', sourceAndRecipePinned: true,
        scopes: independentNavigation, topics: specimenTopics, exactDraftRequired: true, grantsAccessOrRegistration: false },
      detailedTeaching: {
        motorExplorer: {
          groups: specimenMotorGroups(limbDefinitions.whole).length,
          muscleSelections: new Set(specimenMotorGroups(limbDefinitions.whole).flatMap(g => g.targets.map(t => t.surface.id))).size,
          relationships: specimenMotorGroups(limbDefinitions.whole).reduce((n, g) => n + g.targets.length, 0),
          nerveMeshesAdded: 0, donorInnervationConfirmed: false,
        },
        anatomyFunctionDrafts: limbDefinitions.whole.surfaces.filter(s => specimenTeachingFor(limbDefinitions.whole, s)).length,
        muscleAttachmentDrafts: limbDefinitions.whole.surfaces.filter(s => specimenTeachingFor(limbDefinitions.whole, s)?.attachments).length,
        identificationPractice: 'up to 10 visible pinned source selections per round; first-try/reveal/retry-missed',
        extendedTopics: Object.fromEntries(specimenTopics.slice(2).map(topic => {
          const draft = limbDefinitions.whole.surfaces.filter(s => specimenTeachingFor(limbDefinitions.whole, s)?.extended?.topics[topic]?.readiness === 'draft').length;
          return [topic, { draft, pending: limbDefinitions.whole.surfaces.length - draft }];
        })),
        clinicalSelfChecks: limbDefinitions.whole.surfaces.filter(s => specimenTeachingFor(limbDefinitions.whole, s)?.extended?.selfCheck).length,
        clinicalPathologyImaging: 'introductory drafts for selected structures; no clinical approval, scan registration or lecture entitlement',
        countedAsRootOrNestedTeaching: false,
      },
    }],
    displayCorrections: displayCatalog.structures
      .filter(
        (s) => archivalCatalog.structures.some(original => original.id === s.id && JSON.stringify(s) !== JSON.stringify(original)),
      )
      .map((s) => ({
        fmaId: s.fmaId,
        bundle: s.bundle,
        retainedSources: s.sources.length,
      })),
    archivalBodyRepresentations: archivalCatalog.structures.length,
    displayAdditions: catalog.structures.filter(s => !archivalCatalog.structures.some(original => original.id === s.id)).map(s => ({fmaId:s.fmaId, bundle:s.bundle, clinicalApproval:false})),
    bodyRepresentations: catalog.structures.length,
    bodyBundles: catalog.bundles.length,
    bodyBundleBytes: catalog.bundles.reduce(
      (total, bundle) => total + bundle.bytes,
      0,
    ),
    systems: countsBySystem,
    regions: catalog.regions.map(({ id, name }) => ({
      id,
      name,
      entries: catalog.structures.filter((entry) => entry.regions.includes(id))
        .length,
    })),
    shoulderRepresentations: shoulder.length,
    shoulderSourceParts: manifest.parts.length,
    nestedDissections: {
      eyeComponents: eyeLayers.structures.length,
      ventricularSpaces: ventricular.ventricularIds.length,
      ventricularContext: ventricular.contextIds.length,
      brainstemCompounds: brainstem.selectableIds.length,
      collicularBrachiaSelections: collicularBrachia.selectableIds.length,
      collicularBrachiaOriginalTriangles: collicularBrachiaAudit.groups.filter(g => g.status === 'candidate').reduce((sum, g) => sum + g.topology.triangles, 0),
      collicularBrachiaLateralityHolds: collicularBrachiaAudit.groups.filter(g => g.status === 'held').length,
      brainstemContext: brainstem.contextIds.length,
      cerebralSelections: cerebral.selectableIds.length,
      cerebralParentSubdivisions:
        cerebral.selectableIds.length - cerebral.supplementalIds.length,
      cerebralAdditionalSourceParts: cerebral.supplementalIds.length,
      cerebralContext: cerebral.contextIds.length,
      cardiacCavities: cardiac.selectableIds.length,
      cardiacContextWalls: cardiac.contextIds.length,
      hepaticBranchGroups: hepatic.selectableIds.length,
      hepaticSourceFiles: hepatic.structures.reduce(
        (n, s) => n + s.sources.length,
        0,
      ),
      hepaticValidatedSegments: 0,
      pulmonaryBranchGroups: pulmonary.selectableIds.length,
      pulmonarySourceFiles: pulmonary.structures.reduce(
        (n, s) => n + s.sources.length,
        0,
      ),
      pulmonaryLobeSurfaces: 0,
      renalVascularGroups: renal.selectableIds.length,
      renalParentViews: renal.parents.length,
      renalSourceFiles: renal.structures.reduce(
        (n, s) => n + s.sources.length,
        0,
      ),
      renalInternalTissueParts: 0,
      pancreaticDuctSelections: pancreatic.selectableIds.length,
      pancreaticReferenceSurfaces: pancreatic.contextIds.length,
      pancreaticSourceFiles: pancreatic.structures.reduce((n, s) => n + s.sources.length, 0),
      pancreaticValidatedLumens: 0,
      cricothyroidMuscleParts: cricothyroid.selectableIds.length,
      cricothyroidCartilageLandmarks: cricothyroid.contextRecords.length,
      cricothyroidRemovedArtifactFaces: cricothyroid.structures.reduce((n, s) => n + s.derivative.removedSourceFaces.length, 0),
      cricothyroidClinicalApproval: false,
      femoralSourceComponents: femoralComponents.structures.length,
      femoralSourceParentViews: femoralComponents.parents.length,
      femoralSourceNewWholeArteries: 0,
      femoralSourceClinicalApproval: false,
      visualPathwayGroups: visualPathway.selectableIds.length,
      visualPathwaySourceFiles: visualPathway.structures.reduce(
        (n, s) => n + s.sources.length,
        0,
      ),
      visualPathwayContextLandmarks: new Set(
        [...visualPathway.contextRecords, ...visualSellarSource.structures].map(
          (s) => s.id,
        ),
      ).size,
      additionalUniqueWholeBodyAnatomy:
        cerebral.supplementalIds.length +
        renal.structures.length +
        visualPathway.structures.length +
        cricothyroid.structures.length,
      limitation:
        'Nested selections generally subdivide existing parents. Four superior temporal source parts, seven renal/suprarenal vascular groups, three optic-chiasm/tract surfaces and four cricothyroid muscle parts add source-defined anatomy in nested studies; context reuses existing structures. Kidney and thyroid-cartilage associations are navigation, not tissue membership. Visual surfaces do not depict continuous fibres. Nested teaching is counted separately from the root-body inventory. The unchanged archival catalogue excludes these alternate display assets and additions.',
    },
    regionalMembershipsOverlap: true,
    shoulderAndBodyRepresentationsOverlap: true,
    anatomicalCompletenessMeasured: false,
  },
  study: {
    guidedLearning: {
      regionalTours: regionalTours.length,
      regionalStops: regionalTours.reduce((total, tour) => total + tour.steps.length, 0),
      shoulderTours: 1,
      shoulderStops: shoulderTour.steps.length,
      readiness: 'draft',
    },
    vesselVisibilityGroups: vesselVisibilityGroups(catalog.structures, []).map(({kind,total}) => ({kind,total})),
    wristHandPartnerBones: Object.values(handBoneFmas).flat().length,
    wristHandOrdinaryPairsPerSide: handJoints.filter(j => j.kind !== 'variable').length,
    wristHandVariablePairsPerSide: handJoints.filter(j => j.kind === 'variable').length,
    ankleFootPartnerBones: Object.values(footBoneFmas).flat().length,
    ankleFootOrdinaryPairsPerSide: footJoints.filter(j => j.kind !== 'variable').length,
    ankleFootVariablePairsPerSide: footJoints.filter(j => j.kind === 'variable').length,
    hepaticBiliaryLandmarks: hepaticBiliarySource.structures.length,
    hepaticBiliaryRelationshipPresets: hepaticBiliaryRelationshipsFor(hepaticBiliarySource.parent).length,
    renalRelationshipPresets: renal.parents.reduce(
      (total, parent) => total + renalRelationshipsFor(parent).length,
      0,
    ),
    visualPathwayRelationshipPresets: visualRelationshipsFor(
      visualPathway.parent,
    ).length,
    cardiacVesselLandmarks: cardiacVesselSource.structures.length,
    cardiacRelationshipPresets: cardiacRelationshipsFor(cardiac.parent).length,
    pulmonaryAirwayLandmarks: pulmonaryContext.structures.length,
    pulmonaryAirwayContexts: pulmonaryContext.bindings.length,
    pulmonaryBranchTypeDisplaySubsets: pulmonaryRoles.subsets.length,
    pulmonaryBranchTypeOptionalBundles: pulmonaryRoles.bundles.length,
    ventricularRelationshipPresets: ventricularRelationshipsFor(
      ventricular.parent,
    ).length,
    stages: profiles.reduce(
      (total, profile) => total + profile.stages.length,
      0,
    ),
    focuses: profiles.reduce(
      (total, profile) => total + profile.focuses.length,
      0,
    ),
  },
  practice: {
    identificationModes: ['find', 'name'],
    reasoning: {
      concepts: reasoningConcepts.length,
      exactRepresentations:
        catalog.structures.filter(reasoningConceptFor).length,
      regions: [
        ...new Set(
          catalog.structures
            .filter(reasoningConceptFor)
            .flatMap((s) => s.regions),
        ),
      ],
      readiness: 'draft',
      limitation:
        'Separate from Quiz-tab notes. Authored anatomical-reasoning pilot, not educator-approved or a validated assessment.',
    },
  },
  learningIntegration: {
    contractVersion: learning.schemaVersion,
    supportedDocumentVersions: [1, 2],
    availableRepresentations: learningTargets.length,
    nestedRepresentations: learningTargets.filter((t) => t.scope === 'nested')
      .length,
    supportedKinds: learningResourceKinds,
    configuredResources: learning.resources.length,
    configuredCorrespondences: learning.links.length,
    configurationScope: 'Atlas content/learning-resources.v1.json only; not the separate website host configuration',
    implementedCapabilities: {
      educationSelectionPort: 'lib/root-education-api.ts',
      optionalDecodedCtMriViewer: 'app/volume-image.tsx',
      privateNativeMriQa: 'app/review/mri-import/page.tsx',
    },
    externalWebsiteEvidence: {
      reference: 'Canonical website docs/master-plan.md, mapped in the coordination WORKSPACE_MAP.md',
      scope: 'Separate website records Didanix Education integration and completed native MRI synthetic QA; this Atlas-only inventory does not inspect its runtime, clearance or deployment.',
    },
    limitation:
      'Implemented host adapters and image viewers are distinct from configured resources. Registry counts measure only the Atlas static document. Host-provided records, acquired-case privacy/rights clearance, independent entitlements, validated correspondences and revision-bound clinical acceptance are separate gates.',
  },
  teaching: {
    classification: {
      specificDraft:
        'Explicitly draft authored copy, possibly shared across a source group. Not necessarily complete, cited or clinically reviewed.',
      identityOnly:
        'Generic source identity or vascular-segment disclaimer, not a structure-specific anatomy/function lesson.',
      pending: 'Explicit pending-content fallback.',
      generatedIdentification:
        'Generated find-this-structure prompt, not an authored clinical question.',
    },
    classificationLimit:
      'Explicit readiness from authoring branches; not inferred from titles and not clinical approval. Legacy shoulder topics are draft; new X-ray authoring explicitly distinguishes draft and pending.',
    body: summarize(contentRows),
    nested: {
      representations: nestedRows.length,
      geometryOnlyRepresentations: nestedGeometryOnly,
      concepts: nestedConcepts.length,
      references: Object.keys(nestedTeachingReferences).length,
      topics: summarize(nestedRows),
      limitation:
        'Original, source-pinned introductory drafts and unscored recall questions. Not complete disease teaching, specialist approval, a scored exam, an imaging connection or paid-lecture entitlement. Counts overlap existing parent anatomy.',
    },
    shoulder: summarize(
      shoulder.map((entry) => ({
        sections: entry.sections,
        readiness: Object.fromEntries(tabs.map((tab) => [tab, entry.sections[tab].readiness ?? 'draft'])),
      })),
    ),
    byRegion: Object.fromEntries(
      catalog.regions.map(({ id }) => [
        id,
        summarize(
          contentRows.filter(({ entry }) => entry.regions.includes(id)),
        ),
      ]),
    ),
    clinicallyApproved:
      'Not determined: no private review database is read by this script.',
  },
  assetsAndRights: {
    publicFileExtensions: extensions,
    publicFontFiles: publicFiles.filter((path) =>
      /\.(woff2?|ttf|otf)$/i.test(path),
    ),
    dependencyEntries: licenses.packageCount,
    dependencyClassification: licenses.result,
    unclassifiedDependencies: licenses.flagged.length,
    limitation:
      'Lockfile declarations and existing notices, not legal clearance of every distributed binary or a fee guarantee. GLB/source rights remain separate from code; brand rights remain reserved.',
  },
  review: {
    revisionIdentities: Object.keys(revisions.revisions).length,
    hasPrivateReviews: false,
    status:
      `Revision fingerprints are not approvals. Separate private stores support the nine-structure shoulder pilot, ${catalog.structures.length} displayed root-body selections, nine independent specimen/region scopes (356 scoped records / 267 distinct source IDs), and ${nestedReviewRows.reduce((n,r)=>n+r.surfaces.length,0)} nested selections in ${nestedReviewRows.length} parent/study scopes. Exact source/frame identity and navigation are bound; no decisions transfer across scopes. The 1,022-record archival catalogue is retained. This inventory reads no personal review records. Acquired imaging review remains unavailable; source implementation does not prove hosted migration or clinical sign-off.`,
  },
  boundaries: {
    scope: 'Current source implementation, not operations performed by this inventory script',
    importedNewAnatomy: cricothyroid.selectableIds.length > 0,
    importedScans: false,
    clinicalValidation: false,
    browserInteractionTesting: false,
    remoteDeliveryVerified: false,
  },
};
const destination = new URL('docs/requirement-audit.json', root);
const output = JSON.stringify(report, null, 2) + '\n';
const summaryPath = new URL('docs/CURRENT_STATUS.md', root);
const summary = renderRequirementSummary(report);
if (process.argv.includes('--check')) {
  assert.equal(
    await readFile(destination, 'utf8'),
    output,
    'Requirement inventory is stale; rerun requirements:audit and review its conclusions.',
  );
  assert.equal(
    await readFile(summaryPath, 'utf8'),
    summary,
    'Current status summary is stale; run requirements:audit.',
  );
  console.log(
    'Requirement inventory matches current source and displayed content.',
  );
} else {
  await writeFile(destination, output);
  await writeFile(summaryPath, summary);
  console.log(
    JSON.stringify(
      {
        anatomy: report.anatomy,
        teaching: report.teaching.body,
        study: report.study,
        review: report.review,
      },
      null,
      2,
    ),
  );
}
