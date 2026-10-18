import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface RegionalVesselLesson {
  fmaId: string;
  side: 'right' | 'left' | 'midline';
  regions: readonly string[];
  anatomy: string;
  function: string;
  distinction: string;
  references: readonly string[];
}
function pair(
  ids: readonly [string, string],
  regions: readonly string[],
  anatomy: string | readonly [string, string],
  role: string,
  distinction: string,
  references: readonly string[],
): RegionalVesselLesson[] {
  return ids.map((fmaId, i) => ({
    fmaId,
    side: i === 0 ? 'right' : 'left',
    regions,
    anatomy: typeof anatomy === 'string' ? anatomy : anatomy[i],
    function: role,
    distinction,
    references,
  }));
}

// Original brief factual teaching; source membership does not prove vessel continuity.
export const regionalVesselLessons: readonly RegionalVesselLesson[] = [
  ...pair(
    ['FMA3941', 'FMA4058'],
    ['head-neck', 'thorax'],
    [
      'Usually arises from the brachiocephalic trunk and ascends in the carotid sheath to internal and external carotid divisions.',
      'Usually arises directly from the aortic arch and ascends in the carotid sheath to internal and external carotid divisions.',
    ],
    'Feeds the internal and external carotid pathways to head and neck tissues.',
    'The right and left origins differ. Bifurcation height varies; the segment does not identify every neck branch or a safe access site.',
    ['https://www.ncbi.nlm.nih.gov/books/NBK545238/'],
  ),
  ...pair(
    ['FMA3949', 'FMA4062'],
    ['head-neck', 'thorax'],
    'Ascends from the carotid bifurcation toward the temporal-bone carotid canal, normally without cervical branches.',
    'Provides a major route to cerebral and orbital arterial supply.',
    'Not the external carotid. The source does not independently label all angiographic segments or establish a complete intracranial tree.',
    ['https://www.ncbi.nlm.nih.gov/books/NBK556061/'],
  ),
  ...pair(
    ['FMA3958', 'FMA4066'],
    ['head-neck', 'thorax'],
    'Usually begins at the subclavian artery, ascends through cervical transverse foramina and enters the skull through the foramen magnum.',
    'Contributes to posterior cranial circulation through intracranial branches and the basilar system.',
    'Entry level, origin and dominance vary. No vertebral-artery segment boundaries, nerve clearance or dynamic compression are validated.',
    ['https://www.ncbi.nlm.nih.gov/books/NBK540995/'],
  ),
  ...pair(
    ['FMA4754', 'FMA4762'],
    ['head-neck', 'thorax'],
    'Continues from the sigmoid sinus at the jugular foramen, descends in the carotid sheath and joins the subclavian vein.',
    'Returns blood from intracranial and head/neck tributaries toward the brachiocephalic vein.',
    'Not the external jugular vein. Calibre, tributaries and artery–vein position require review; no venous-pressure measurement or cannulation corridor is shown.',
    ['https://www.ncbi.nlm.nih.gov/books/NBK513258/'],
  ),
  ...pair(
    ['FMA50029', 'FMA50030'],
    ['head-neck'],
    'Leaves the internal carotid artery toward the interhemispheric fissure, then courses around the corpus callosum.',
    'Supplies predominantly medial frontal/parietal territories, with additional deep branches.',
    'Territories overlap and variants exist. This is not a mapped motor homunculus, infarct prediction or independently segmented perforator tree.',
    ['https://pmc.ncbi.nlm.nih.gov/articles/PMC11161539/'],
  ),
  ...pair(
    ['FMA50584', 'FMA50585'],
    ['head-neck'],
    'Usually arises at the basilar termination and curves around the midbrain toward posterior cerebral territories.',
    'Supplies much of the occipital cortex and parts of the temporal lobe and deep brain.',
    'Each selection aggregates nine PART-OF files, not nine adjudicated branches. P1/P2 labels, fetal-type supply and territorial boundaries are not assigned to those files.',
    ['https://www.ncbi.nlm.nih.gov/books/NBK538474/'],
  ),
  ...pair(
    ['FMA50085', 'FMA50086'],
    ['head-neck'],
    'Links the internal carotid artery to the posterior cerebral artery within the basal cerebral arterial network.',
    'Provides a potential connection between anterior and posterior circulations.',
    'It does not arise from the middle cerebral artery. Calibre and configuration vary; a visible connection does not prove adequate collateral flow.',
    ['https://www.ncbi.nlm.nih.gov/books/NBK538474/'],
  ),
  ...pair(
    ['FMA70249', 'FMA70250'],
    ['thigh', 'pelvis', 'leg'],
    'Continues below the inguinal ligament from the external iliac artery; its distal course passes through the adductor hiatus into the popliteal artery.',
    'Conveys blood to thigh branches and onward toward the lower leg.',
    'Common and distal femoral terminology does not create separate source objects. The profunda branch is distinct; no puncture landmark is certified.',
    ['https://www.ncbi.nlm.nih.gov/books/NBK538262/'],
  ),
  ...pair(
    ['FMA20796', 'FMA20797'],
    ['thigh', 'pelvis', 'leg'],
    'The profunda femoris branches from the proximal femoral artery and passes deeply into the thigh.',
    'Supplies thigh tissues through perforating and circumflex pathways.',
    'Two PART-OF files per side are one selection, not two validated perforators. Circumflex origins vary and the selected aggregate is not the femoral trunk.',
    ['https://www.ncbi.nlm.nih.gov/books/NBK538262/'],
  ),
  ...pair(
    ['FMA21188', 'FMA21189'],
    ['thigh', 'pelvis', 'leg'],
    'Continues proximally from the popliteal vein through the adductor hiatus toward the common femoral and external iliac venous route.',
    'Returns deep lower-limb venous blood toward the pelvis.',
    'This is a deep vein: avoid the misleading label superficial femoral vein. Duplication, junctions, valves and thrombosis cannot be judged from an exterior surface.',
    ['https://pmc.ncbi.nlm.nih.gov/articles/PMC5381851/'],
  ),
  ...pair(
    ['FMA21379', 'FMA21380'],
    ['thigh', 'pelvis', 'leg'],
    'Ascends from the medial foot anterior to the medial malleolus, then along the medial limb toward the common femoral vein.',
    'Collects superficial venous return from medial lower-limb territories.',
    'Not the deep femoral vein or small saphenous route. Tributaries, fascial position and terminal junction need review; no reflux or graft suitability is inferred.',
    ['https://pmc.ncbi.nlm.nih.gov/articles/PMC3036282/'],
  ),
  ...pair(
    ['FMA77380', 'FMA77381'],
    ['leg', 'foot'],
    'Continues from the femoral artery behind the knee and usually divides into anterior tibial and tibioperoneal pathways.',
    'Distributes blood to knee branches and the distal leg.',
    'A tibioperoneal trunk is not omitted from the reference pathway. Its geometry, branching level and complete genicular network are not reconstructed here.',
    ['https://pmc.ncbi.nlm.nih.gov/articles/PMC5381852/'],
  ),
  ...pair(
    ['FMA43896', 'FMA43897'],
    ['leg', 'foot'],
    'Passes through the proximal interosseous membrane into the anterior leg, continuing across the ankle as dorsalis pedis.',
    'Supplies the anterior leg and conveys blood toward the dorsal foot.',
    'Not the posterior tibial course behind the medial malleolus. The membrane opening and adjacent deep fibular nerve are not independently validated.',
    ['https://www.ncbi.nlm.nih.gov/books/NBK532871/'],
  ),
  ...pair(
    ['FMA43898', 'FMA43899'],
    ['leg', 'foot'],
    'Descends from the tibioperoneal pathway through the posterior leg, passing behind the medial malleolus toward the plantar arteries.',
    'Supplies posterior leg tissues and contributes blood to the sole.',
    'Not dorsalis pedis. No tarsal-tunnel clearance, complete fibular branch or uninterrupted plantar connection is established.',
    ['https://pmc.ncbi.nlm.nih.gov/articles/PMC5381852/'],
  ),
  ...pair(
    ['FMA44328', 'FMA44329'],
    ['leg', 'foot'],
    'Collects deep calf veins behind the knee and continues through the adductor hiatus as the femoral vein.',
    'Channels deep venous return from the leg toward the thigh.',
    'Vein position relative to the artery changes with level and variants occur. The model cannot establish compressibility, patency or exclude thrombosis.',
    ['https://pmc.ncbi.nlm.nih.gov/articles/PMC5381851/'],
  ),
  ...pair(
    ['FMA44334', 'FMA44335'],
    ['leg', 'foot'],
    'Ascends behind the lateral malleolus along the posterior calf, commonly joining the popliteal vein.',
    'Collects superficial venous return from lateral foot and posterior calf territories.',
    'Termination and cranial extensions vary. Not the great saphenous course; no fixed junction height, sural-nerve clearance or reflux result is implied.',
    ['https://pmc.ncbi.nlm.nih.gov/articles/PMC3036282/'],
  ),
  ...pair(
    ['FMA43916', 'FMA43917'],
    ['foot'],
    'Continues from the anterior tibial artery onto the dorsum of the foot and gives branches toward dorsal and deep plantar routes.',
    'Contributes blood to dorsal foot tissues and communicating plantar pathways.',
    'Not the posterior tibial pulse site. Absence from a view does not diagnose an absent pulse, occlusion or inadequate foot perfusion.',
    ['https://www.ncbi.nlm.nih.gov/books/NBK532871/'],
  ),
  ...pair(
    ['FMA43929', 'FMA43930'],
    ['foot'],
    'A posterior tibial branch entering the medial sole.',
    'Supplies medial plantar tissues through local and digital connections.',
    'Not the principal continuation forming the plantar arch. Branch joins and exact digital territories remain unvalidated.',
    [
      'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-lower-limb/',
    ],
  ),
  ...pair(
    ['FMA43931', 'FMA43932'],
    ['foot'],
    'A posterior tibial branch crossing toward the lateral sole before continuing into the plantar arterial arch.',
    'Contributes blood to deep plantar tissues and digital pathways.',
    'The usual arch connects with the deep plantar branch of dorsalis pedis. A complete patent arch or exclusive toe territory is not established by the selection.',
    [
      'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-lower-limb/',
      'https://anatomy.ttuhscep.edu/musculoskeletal_system/leg_ans.html',
    ],
  ),
  {
    fmaId: 'FMA50542',
    side: 'midline',
    regions: ['head-neck'],
    anatomy:
      'Formed by the intracranial vertebral arteries, it runs along the ventral pons toward the posterior cerebral arteries.',
    function:
      'Distributes blood into pontine, cerebellar and posterior cerebral pathways.',
    distinction:
      'Two ISA source files form this single midline selection, not paired basilar arteries. No complete perforator tree, patent lumen or perfusion measurement is established.',
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK540995/'],
  },
  {
    fmaId: 'FMA50169',
    side: 'midline',
    regions: ['head-neck'],
    anatomy:
      'A short connection between the right and left anterior cerebral arteries near the base of the interhemispheric fissure.',
    function:
      'Provides a potential cross-connection between the two anterior cerebral circulations.',
    distinction:
      'Midline is the recorded source identity, not proof of a symmetric circle of Willis. Variant connections and adequate collateral flow require independent review.',
    references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC11161539/'],
  },
];
const byFma = new Map(regionalVesselLessons.map((l) => [l.fmaId, l]));
export function regionalVesselLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    s.system !== 'vessels' ||
    s.category !== 'vessel' ||
    (tab !== 'anatomy' && tab !== 'function')
  )
    return undefined;
  const l = byFma.get(s.fmaId);
  if (
    !l ||
    s.laterality !== l.side ||
    s.region !== l.regions[0] ||
    !l.regions.every((r) => s.regions.includes(r))
  )
    return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Course & connections' : 'Circulation & limits'} · draft`,
    body: l[tab],
    bullets: [
      l.distinction,
      ...(tab === 'anatomy'
        ? [
            'Red/blue denotes artery/vein, not oxygenation or measured flow. Shared regional navigation is not a segmented perfusion or drainage map.',
            `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}. Component counts are not branch counts; gaps are not reconstructed.`,
          ]
        : []),
    ],
    note: [
      'Independent anatomical and clinical review pending. Explode/cut views are not physiological displacement, vascular interiors, angiography or Doppler ultrasound.',
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
