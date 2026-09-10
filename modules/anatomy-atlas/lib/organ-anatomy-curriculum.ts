import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';
import { isPancreasDisplayRecord } from './body-display-catalog';

interface OrganAnatomyDefinition {
  fmaId: string;
  side: 'unpaired' | 'right' | 'left';
  region: 'thorax' | 'abdomen' | 'pelvis';
  anatomy: string;
  distinction: string;
  references: readonly string[];
}
const thorax = 'https://anatomy.ttuhscep.edu/anatomytables/viscera_thorax.html';
const abdomen =
  'https://anatomy.ttuhscep.edu/anatomytables/viscera_abdomen.html';
const biliary = 'https://anatomy.ttuhscep.edu/schemes/liver_tables.html';
const digestive =
  'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works';
const urinary =
  'https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-tract-how-it-works';
const adrenal = 'https://www.cancer.gov/types/adrenocortical/childhood';
// Source identity, not display-name substrings or the historical route token in an ID.
export const organAnatomyLessons: readonly OrganAnatomyDefinition[] = [
  {
    fmaId: 'FMA7088',
    side: 'unpaired',
    region: 'thorax',
    anatomy:
      'Within the middle mediastinum, the heart is enclosed by the pericardial sac. Two atria receive blood; two ventricles lead to the pulmonary and systemic circulations.',
    distinction:
      'This is an aggregate selection. Component count does not establish individually selectable chambers, valves or a validated conduction system.',
    references: [thorax, 'https://www.nhlbi.nih.gov/health/heart/anatomy'],
  },
  {
    fmaId: 'FMA7309',
    side: 'right',
    region: 'thorax',
    anatomy:
      'The right lung has upper, middle and lower lobes. Its horizontal fissure separates upper from middle lobe; the oblique fissure separates the lower lobe from both.',
    distinction:
      'The many grouped surfaces are not a count of bronchopulmonary segments. Fissure completeness, pleural boundaries and distal airways require review.',
    references: [thorax],
  },
  {
    fmaId: 'FMA7310',
    side: 'left',
    region: 'thorax',
    anatomy:
      'The left lung has upper and lower lobes separated by an oblique fissure. The lingula belongs to the upper lobe, below the cardiac notch.',
    distinction:
      'The lingula is not a separate middle lobe. An aggregate selection does not validate segment boundaries or a complete airway tree.',
    references: [thorax],
  },
  {
    fmaId: 'FMA7197',
    side: 'unpaired',
    region: 'abdomen',
    anatomy:
      'The liver lies mainly beneath the right diaphragm, with right and left lobes. Its visceral surface relates to the gallbladder and the structures entering the porta hepatis.',
    distinction:
      'External lobes and grouped source components are not interchangeable with functional hepatic segments. This selection is not a validated segmental resection map.',
    references: [biliary],
  },
  {
    fmaId: 'FMA7198',
    side: 'unpaired',
    region: 'abdomen',
    anatomy:
      'The pancreas runs behind the stomach. Its head occupies the duodenal curve; its body extends toward a tail near the splenic hilum.',
    distinction:
      'The four source components do not certify four independently selectable anatomical divisions. Duct junctions, endocrine islets and tissue layers are not resolved by this selection.',
    references: [abdomen],
  },
  {
    fmaId: 'FMA7148',
    side: 'unpaired',
    region: 'abdomen',
    anatomy:
      'The stomach connects the esophagus to the duodenum. Its named regions include cardia, fundus, body and pyloric part, bounded by greater and lesser curvatures.',
    distinction:
      'This single surface does not separate mucosa, muscle layers or a functional sphincter. Filling-dependent shape is not simulated.',
    references: [abdomen, digestive],
  },
  {
    fmaId: 'FMA7200',
    side: 'unpaired',
    region: 'abdomen',
    anatomy:
      'Between stomach and large bowel, the small intestine comprises duodenum, jejunum and ileum in sequence. The terminal ileum reaches the cecum.',
    distinction:
      'The grouped loops are not individually validated bowel segments. The ileocecal junction has a separate selection; villi, wall layers and luminal continuity are not demonstrated.',
    references: [digestive],
  },
  {
    fmaId: 'FMA7201',
    side: 'unpaired',
    region: 'abdomen',
    anatomy:
      'The large intestine includes cecum and appendix, colon and rectum. The colon proceeds through ascending, transverse, descending and sigmoid portions toward the rectum.',
    distinction:
      'This display aggregate excludes the separately selectable rectum and ileocecal junction. The organ definition is broader than the currently selected surfaces.',
    references: [digestive, abdomen],
  },
  {
    fmaId: 'FMA7202',
    side: 'unpaired',
    region: 'abdomen',
    anatomy:
      'The gallbladder rests against the inferior liver surface. Its fundus and body narrow toward a neck that continues into the cystic duct.',
    distinction:
      'This single surface does not separate the named regions or validate duct patency and gallbladder wall layers.',
    references: [biliary],
  },
  {
    fmaId: 'FMA7204',
    side: 'right',
    region: 'abdomen',
    anatomy:
      'The right kidney is retroperitoneal on the posterior abdominal wall and usually sits lower than the left kidney.',
    distinction:
      'The selected surface does not separately resolve cortex, medulla, calyces or nephrons. Its position is a source specimen, not a normal measurement standard.',
    references: [abdomen, urinary],
  },
  {
    fmaId: 'FMA7205',
    side: 'left',
    region: 'abdomen',
    anatomy:
      'The left kidney lies against the posterior abdominal wall, behind the peritoneum, and usually extends higher than the right kidney.',
    distinction:
      'Internal renal compartments and the complete collecting system are not independently resolved in this selection. Left/right identity is anatomical, not the current screen side.',
    references: [abdomen, urinary],
  },
  {
    fmaId: 'FMA15900',
    side: 'unpaired',
    region: 'pelvis',
    anatomy:
      'The urinary bladder is a hollow muscular organ in the pelvis. The ureters bring urine from the kidneys; the urethra provides its outlet.',
    distinction:
      'The displayed surface is a static filling state, not a validated capacity, wall-thickness measurement or reconstruction of the trigone and sphincters.',
    references: [urinary],
  },
  {
    fmaId: 'FMA7131',
    side: 'unpaired',
    region: 'thorax',
    anatomy:
      'The esophagus connects pharynx and stomach, descending behind the trachea and passing through the diaphragm near the T10 level.',
    distinction:
      'The thorax route is a browsing category, not the full anatomical extent. This surface does not resolve wall layers or validate physiological narrowing.',
    references: [thorax],
  },
  {
    fmaId: 'FMA7394',
    side: 'unpaired',
    region: 'thorax',
    anatomy:
      'The trachea lies in front of the esophagus, continuing from the cricoid region to its division into right and left main bronchi.',
    distinction:
      'Its thorax browsing assignment does not exclude its cervical course. Rings, posterior membranous wall and a patent lumen are not independently established here.',
    references: [thorax],
  },
  {
    fmaId: 'FMA7196',
    side: 'unpaired',
    region: 'abdomen',
    anatomy:
      'The spleen occupies the upper left abdomen beneath the diaphragm and behind the stomach. Its tissue includes red pulp and white pulp.',
    distinction:
      'Those microscopic compartments are teaching concepts, not separately selectable tissue in this single-source surface. No splenic perfusion territory is validated.',
    references: [
      'https://training.seer.cancer.gov/anatomy/lymphatic/components/spleen.html',
    ],
  },
  {
    fmaId: 'FMA15629',
    side: 'right',
    region: 'abdomen',
    anatomy:
      'The right adrenal gland lies above and medial to the right kidney. An outer cortex surrounds an inner medulla.',
    distinction:
      'The gland is distinct from the kidney. Cortex and medulla are not separate selectable meshes; source shape alone cannot identify hormone-producing tissue.',
    references: [abdomen, adrenal],
  },
  {
    fmaId: 'FMA15630',
    side: 'left',
    region: 'abdomen',
    anatomy:
      'The left adrenal gland lies above and medial to the left kidney. It contains an outer cortical layer and central medulla.',
    distinction:
      'This is a separate endocrine organ, not renal tissue. Its internal zones and complete neurovascular connections are not reconstructed by the selected surface.',
    references: [abdomen, adrenal],
  },
  {
    fmaId: 'FMA7395',
    side: 'right',
    region: 'thorax',
    anatomy:
      'The right main bronchus leaves the tracheal bifurcation for the right lung. It is generally wider, shorter and more vertical than its left counterpart.',
    distinction:
      'These are general relationships, not validated dimensions of this mesh. The selected proximal segment is not the complete right bronchial tree.',
    references: [thorax],
  },
  {
    fmaId: 'FMA7396',
    side: 'left',
    region: 'thorax',
    anatomy:
      'The left main bronchus connects the tracheal bifurcation to the left lung, with a generally longer and less vertical course than the right main bronchus.',
    distinction:
      'The selected proximal segment does not establish lobar or segmental branching, airway-wall layers or luminal continuity.',
    references: [thorax],
  },
  {
    fmaId: 'FMA14539',
    side: 'unpaired',
    region: 'abdomen',
    anatomy:
      'The cystic duct links the gallbladder neck to the extrahepatic biliary route. Its union with the common hepatic duct forms the common bile duct.',
    distinction:
      'The cystic duct is not the common bile duct. Junction patterns vary; this surface is not a validated operative landmark or patent-lumen model.',
    references: [biliary],
  },
  {
    fmaId: 'FMA14668',
    side: 'unpaired',
    region: 'abdomen',
    anatomy:
      'The common hepatic duct begins where right and left hepatic ducts unite. After joining the cystic duct, the downstream channel is called the common bile duct.',
    distinction:
      'Common hepatic and common bile ducts are distinct identities. The selected surface does not prove complete intrahepatic branches, junction boundaries or continuity.',
    references: [biliary],
  },
];
const byFma = new Map(organAnatomyLessons.map((l) => [l.fmaId, l]));
export function organAnatomyLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  const l = byFma.get(s.fmaId);
  if (
    !l ||
    tab !== 'anatomy' ||
    s.system !== 'organs' ||
    s.category !== 'organ' ||
    s.laterality !== l.side ||
    s.region !== l.region ||
    !s.regions.includes(l.region)
  )
    return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · Location & relationships · draft`,
    body: l.anatomy,
    bullets: [
      isPancreasDisplayRecord(s)
        ? 'The display omits a near-coincident parenchymal alternative while preserving the four-file archive. Retained surfaces are not independently selectable anatomical divisions. Duct junctions, endocrine islets and tissue layers remain unresolved.'
        : l.distinction,
      `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}. Component counts are not anatomical subdivision counts; excluded components and absent tissue are not reconstructed.`,
    ],
    note: [
      'Independent anatomical and clinical review pending. Explode and clipping controls are teaching aids, not physiological motion, acquired imaging or procedure guidance.',
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
