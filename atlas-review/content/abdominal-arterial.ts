// Original teaching relationships; no imported table, figure, centreline or flow.
import type {
  ArterialDefinitions,
  ArterialRelationKind,
} from '../lib/regional-arterial';
const concept = (fmaIds: string[], note: string) => ({
  fmaIds,
  context: 'abdomen',
  note,
});
export const abdominalArterialReferences = {
  overview:
    'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-abdomen/',
  pancreatic:
    'https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html',
  hepaticVariation: 'https://pubmed.ncbi.nlm.nih.gov/20308464/',
  pancreaticVariation: 'https://pubmed.ncbi.nlm.nih.gov/35177332/',
  colicVariation: 'https://pubmed.ncbi.nlm.nih.gov/29196959/',
};
export const abdominalArterialConcepts = {
  aorta: concept(
    ['FMA3789'],
    'Listed visceral, renal and iliac routes only; this is not the complete aortic tree.',
  ),
  celiac: concept(
    ['FMA50737'],
    'The familiar three-branch pattern is an example, not a donor finding. The source selection contains two official components.',
  ),
  sma: concept(
    ['FMA14749'],
    'Available mesenteric and pancreatic routes are shown. Jejunal and ileal arcades are not individually mapped; this source selection has two components.',
  ),
  ima: concept(
    ['FMA14750'],
    'Left colic connections are available. Sigmoid and superior rectal selections are not added by this map.',
  ),
  commonHepatic: concept(
    ['FMA14771'],
    'Common and proper hepatic names are distinct. Variant origins and courses require individual imaging review; no variant is assigned to this model.',
  ),
  properHepatic: concept(
    ['FMA14772'],
    'The proper hepatic continuation is not a separate duplicate inflow. Right/left hepatic and cystic branches are not selectable in this root map.',
  ),
  splenic: concept(
    ['FMA14773'],
    'Four official components remain one source selection. Pancreatic branches are available; short gastric and gastro-omental routes are not mapped here.',
  ),
  leftGastric: concept(
    ['FMA14768'],
    'Left gastric is a named unpaired artery, not the left member of a mirrored gastric pair. Its right-gastric communication is not supplied here.',
  ),
  renal: concept(
    ['FMA14752', 'FMA14753'],
    'Each kidney has its own source arterial selection. Accessory arteries and segmental supply are not established by these surfaces.',
  ),
  gastroduodenal: concept(
    ['FMA76574'],
    'The source labels this selection as the gastroduodenal trunk. Do not expand it into a complete gastroduodenal tree.',
  ),
  anteriorSuperiorPD: concept(
    ['FMA14782'],
    'Anterior pancreaticoduodenal communication is distinct from the posterior arcade. No joined lumen or collateral adequacy is demonstrated.',
  ),
  posteriorSuperiorPD: concept(
    ['FMA14784'],
    'Posterior pancreaticoduodenal communication is distinct from the anterior arcade. Direction of flow is not assigned.',
  ),
  inferiorPD: concept(
    ['FMA14805'],
    'Inferior pancreaticoduodenal is not the similarly named inferior pancreatic artery. Branch origins can vary.',
  ),
  anteriorInferiorPD: concept(
    ['FMA70479'],
    'This source-labelled anterior branch is kept separate from the posterior branch; no missing arcade segment is drawn.',
  ),
  posteriorInferiorPD: concept(
    ['FMA70480'],
    'The posterior source branch has its own identity. A teaching connection is not evidence of continuous source geometry.',
  ),
  dorsalPancreatic: concept(
    ['FMA14787'],
    'The splenic-origin example is shown; other origins occur. No origin is inferred from a near-touching mesh.',
  ),
  inferiorPancreatic: concept(
    ['FMA14790'],
    'The teaching route passes through a dorsal-pancreatic branch that is not separately selectable. Do not confuse this with the inferior pancreaticoduodenal artery.',
  ),
  greatPancreatic: concept(
    ['FMA14792'],
    'Great pancreatic (pancreatica magna) remains an individual source selection, not the whole pancreatic arterial supply.',
  ),
  caudalPancreatic: concept(
    ['FMA14793'],
    'A splenic-origin example is shown. Other origins and multiple small pancreatic branches are not reconstructed.',
  ),
  middleColic: concept(
    ['FMA14810'],
    'The marginal connection is a collateral relationship, not a new downstream trunk or proof of a complete arcade.',
  ),
  rightColic: concept(
    ['FMA14811'],
    'The direct superior-mesenteric example is shown. Other origins or shared trunks are not assigned to this source.',
  ),
  ileocolic: concept(
    ['FMA14815'],
    'Only available neighbours are mapped. Source-numbered or ambiguously subdivided cecal/ileal branches are not silently assigned identities.',
  ),
  appendicular: concept(
    ['FMA14818'],
    'Its origin may be direct from ileocolic or through a cecal branch. The source does not resolve that route; it is not marked as a verified direct junction.',
  ),
  marginal: concept(
    ['FMA14824'],
    'The marginal colic artery represents communicating routes along the colon, not a guaranteed complete collateral channel or a supply-territory boundary.',
  ),
  leftColic: concept(
    ['FMA14826'],
    'Ascending and descending branches are distinct selections. Left/right colic names do not imply paired symmetric vessels.',
  ),
  ascendingLeftColic: concept(
    ['FMA14828'],
    'This branch remains part of the left-colic route. Exact anastomotic junctions and watershed boundaries are not mapped.',
  ),
  descendingLeftColic: concept(
    ['FMA14829'],
    'The source branch is preserved without inventing the missing sigmoid artery selections or their junctions.',
  ),
} satisfies ArterialDefinitions;
type Concept = keyof typeof abdominalArterialConcepts;
const relation = (
  from: Concept,
  to: Concept,
  kind: ArterialRelationKind,
  note: string,
) => ({ from, to, kind, note });
export const abdominalArterialRelations = [
  relation('aorta', 'celiac', 'branch', 'Celiac inflow example.'),
  relation('aorta', 'sma', 'branch', 'Superior mesenteric inflow.'),
  relation('aorta', 'ima', 'branch', 'Inferior mesenteric inflow.'),
  relation('aorta', 'renal', 'branch', 'Side-specific renal inflow.'),
  relation(
    'celiac',
    'commonHepatic',
    'branch',
    'Common hepatic route; variants not assigned.',
  ),
  relation('celiac', 'splenic', 'branch', 'Splenic route.'),
  relation('celiac', 'leftGastric', 'branch', 'Left gastric route.'),
  relation(
    'commonHepatic',
    'gastroduodenal',
    'branch',
    'Gastroduodenal branch.',
  ),
  relation(
    'commonHepatic',
    'properHepatic',
    'continuation',
    'Name changes after the gastroduodenal origin.',
  ),
  relation(
    'gastroduodenal',
    'anteriorSuperiorPD',
    'branch',
    'Anterior superior pancreaticoduodenal route.',
  ),
  relation(
    'gastroduodenal',
    'posteriorSuperiorPD',
    'branch',
    'Posterior superior pancreaticoduodenal route.',
  ),
  relation(
    'sma',
    'inferiorPD',
    'branch',
    'Inferior pancreaticoduodenal route.',
  ),
  relation('inferiorPD', 'anteriorInferiorPD', 'branch', 'Anterior division.'),
  relation(
    'inferiorPD',
    'posteriorInferiorPD',
    'branch',
    'Posterior division.',
  ),
  relation(
    'anteriorSuperiorPD',
    'anteriorInferiorPD',
    'anastomosis',
    'Anterior arcade; no flow direction or patency inferred.',
  ),
  relation(
    'posteriorSuperiorPD',
    'posteriorInferiorPD',
    'anastomosis',
    'Posterior arcade; no flow direction or patency inferred.',
  ),
  relation(
    'splenic',
    'dorsalPancreatic',
    'branch',
    'Splenic-origin example; origin varies.',
  ),
  relation('splenic', 'greatPancreatic', 'branch', 'Great pancreatic route.'),
  relation(
    'splenic',
    'caudalPancreatic',
    'branch',
    'Splenic-origin example; other origins are not drawn.',
  ),
  relation(
    'dorsalPancreatic',
    'inferiorPancreatic',
    'via-unmodelled',
    'Through a left branch not separately selectable here.',
  ),
  relation('sma', 'middleColic', 'branch', 'Middle colic route.'),
  relation(
    'sma',
    'rightColic',
    'branch',
    'Direct-origin example; shared-trunk variants are not assigned.',
  ),
  relation('sma', 'ileocolic', 'branch', 'Ileocolic route.'),
  relation(
    'ileocolic',
    'appendicular',
    'variant',
    'Direct or through an unmodelled cecal branch; the donor route is unresolved.',
  ),
  relation('ima', 'leftColic', 'branch', 'Left colic route.'),
  relation('leftColic', 'ascendingLeftColic', 'branch', 'Ascending branch.'),
  relation('leftColic', 'descendingLeftColic', 'branch', 'Descending branch.'),
  relation(
    'middleColic',
    'marginal',
    'anastomosis',
    'Via colic branches; complete continuity is not established.',
  ),
  relation(
    'rightColic',
    'marginal',
    'anastomosis',
    'Via colic branches; complete continuity is not established.',
  ),
  relation(
    'ileocolic',
    'marginal',
    'anastomosis',
    'Via its colic branch; no flow direction assigned.',
  ),
  relation(
    'leftColic',
    'marginal',
    'anastomosis',
    'Via its branches; the missing sigmoid routes are not drawn.',
  ),
] as const;
