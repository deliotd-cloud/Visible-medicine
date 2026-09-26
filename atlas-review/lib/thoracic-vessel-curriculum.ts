import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface ThoracicVesselLesson {
  bindings: readonly (readonly [string, BodyStructure['laterality']])[];
  regions: readonly BodyStructure['region'][];
  anatomy: string;
  function: string;
  distinction: string;
  references: readonly string[];
}
const books = 'https://www.ncbi.nlm.nih.gov/books/';
const aorta = books + 'NBK538140/';
const cava = books + 'NBK545255/';
const azygos = books + 'NBK554430/';
const coronary = books + 'NBK470522/';
const cardiacVeins = books + 'NBK549786/';
const pulmonaryArteries = books + 'NBK534812/';
const pulmonaryVeins = books + 'NBK545205/';
const internalThoracic = books + 'NBK537337/';
const thoraxTables =
  'https://anatomy.ttuhscep.edu/cardiovascular_system/sup_med_tables.html';
const thorax = ['thorax'] as const;
const inlet = ['thorax', 'shoulder-arm', 'head-neck'] as const;
const wall = ['thorax', 'abdomen'] as const;
const variation =
  'Typical anatomical relationships vary. Branch origins, joins and neighbouring structures are teaching context, not verified connections in this source surface.';
const coronaryLimit =
  'Coronary dominance and supply territories vary; this selection does not establish a complete coronary tree, perfusion territory, stenosis or collateral adequacy.';
const pulmonaryLimit =
  'The named vessel is not a validated lobar or segmental tree. Compound source components are not independently assigned to lung segments or atrial ostia; branching and ostial variants need review.';
function vessel(
  bindings: ThoracicVesselLesson['bindings'],
  regions: ThoracicVesselLesson['regions'],
  anatomy: string,
  role: string,
  reference: string,
  distinction = variation,
): ThoracicVesselLesson {
  return {
    bindings,
    regions,
    anatomy,
    function: role,
    distinction,
    references: [reference],
  };
}

// Brief original factual teaching; no publisher prose, images or vascular assets imported.
export const thoracicVesselLessons: readonly ThoracicVesselLesson[] = [
  vessel(
    [['FMA3736', 'midline']],
    thorax,
    'The ascending aorta connects the left ventricular outflow to the arch; the coronary origins belong to its proximal root region.',
    'Conveys left ventricular output into systemic circulation.',
    aorta,
    'The selected segment does not independently resolve valve cusps, sinuses, coronary ostia or aortic wall layers.',
  ),
  vessel(
    [['FMA3768', 'midline']],
    thorax,
    'The arch bridges ascending and descending aorta, curving toward the left and posteriorly. Its usual branches are the brachiocephalic, left common carotid and left subclavian arteries.',
    'Distributes systemic flow to the arch branches while continuing into the descending aorta.',
    aorta,
  ),
  vessel(
    [['FMA87217', 'unspecified']],
    thorax,
    'The descending thoracic aorta continues from the arch through the posterior mediastinum to the diaphragmatic aortic hiatus.',
    'Feeds thoracic branches and conducts blood onward to the abdominal aorta.',
    aorta,
    'The catalogue laterality remains unspecified. Regional course does not certify vertebral levels, branch completeness, lumen diameter or aortic wall integrity.',
  ),
  vessel(
    [['FMA4720', 'unspecified']],
    thorax,
    'The superior vena cava is formed by the brachiocephalic veins and descends to the right atrium, usually receiving the azygos arch.',
    'Returns upper-body systemic venous blood to the right atrium.',
    cava,
    'This is not the pulmonary venous return to the left atrium. Catalogue laterality remains unspecified; caval variants and atrial entry need independent review.',
  ),
  vessel(
    [['FMA4838', 'unspecified']],
    thorax,
    'The azygos vein usually ascends beside the right thoracic vertebral column and arches over the right lung root to reach the superior vena cava.',
    'Collects posterior thoracic venous return and participates in connections between caval drainage pathways.',
    azygos,
    'Typical right-sided course does not overwrite unspecified catalogue laterality. Neither a complete collateral circuit nor its flow capacity is demonstrated.',
  ),
  vessel(
    [['FMA4944', 'midline']],
    thorax,
    'The hemiazygos pathway ascends on the lower left side of the thoracic spine and crosses to the azygos system; crossing patterns vary.',
    'Transfers lower-left posterior thoracic venous return toward the azygos system.',
    azygos,
    'The source is recorded as midline, which is retained for this crossing vessel. It is not relabelled as the accessory hemiazygos vein or treated as its complete drainage territory.',
  ),
  vessel(
    [['FMA3932', 'midline']],
    inlet,
    'The brachiocephalic artery normally arises first from the arch and divides into right common carotid and right subclavian arteries.',
    'Routes arterial blood toward the right head/neck and upper limb.',
    aorta,
    'An arterial trunk, not either brachiocephalic vein. Its midline source identity and thorax/shoulder/head-neck navigation memberships are retained; variants are not reconstructed.',
  ),
  vessel(
    [['FMA3953', 'right']],
    inlet,
    'The right subclavian artery usually begins at the brachiocephalic division, passes behind anterior scalene and becomes axillary at the lateral first-rib border.',
    'Supplies the right upper limb and contributes branches to the neck and thorax.',
    books + 'NBK539736/',
  ),
  vessel(
    [['FMA4694', 'left']],
    inlet,
    'The left subclavian artery usually arises directly from the arch, then passes behind anterior scalene toward its axillary continuation.',
    'Supplies the left upper limb and contributes branches to the neck and thorax.',
    books + 'NBK539736/',
  ),
  vessel(
    [['FMA4751', 'right']],
    inlet,
    'The right internal jugular and subclavian veins unite into the relatively short right brachiocephalic vein, which joins its left counterpart.',
    'Channels right upper-body venous return toward the superior vena cava.',
    cava,
  ),
  vessel(
    [['FMA4761', 'left']],
    inlet,
    'The left brachiocephalic vein forms at the left jugular–subclavian junction and normally crosses behind the manubrium toward the right-sided caval junction.',
    'Channels left upper-body venous return toward the superior vena cava.',
    cava,
    'Usually longer and more transverse than the right vein, not its mirrored equivalent. This source does not validate crossing clearances or congenital variants.',
  ),
  vessel(
    [
      ['FMA4755', 'right'],
      ['FMA4763', 'left'],
    ],
    inlet,
    'The subclavian vein continues from the axillary vein and normally lies anterior to anterior scalene, joining the internal jugular vein at the venous angle.',
    'Returns upper-limb venous blood to the brachiocephalic vein on the selected side.',
    books + 'NBK532885/',
    'Artery and vein have different scalene relationships. No catheter path, safe clearance, valve state or posture-dependent compression is established by this surface.',
  ),
  vessel(
    [['FMA3802', 'right']],
    thorax,
    'The right coronary trunk begins at the aortic root and enters the right atrioventricular groove.',
    'Delivers blood to its myocardial branches, including those serving the right heart.',
    coronary,
    coronaryLimit,
  ),
  vessel(
    [['FMA3855', 'left']],
    thorax,
    'The left coronary trunk connects its aortic origin to the usual anterior interventricular and circumflex divisions.',
    'Feeds the major left coronary branch pathways.',
    coronary,
    coronaryLimit,
  ),
  vessel(
    [['FMA3862', 'left']],
    thorax,
    'The anterior interventricular artery, also called LAD, descends in the anterior interventricular groove and gives septal and diagonal branches.',
    'Supplies anterior ventricular and septal myocardium through its branches.',
    coronary,
    coronaryLimit,
  ),
  vessel(
    [['FMA3895', 'left']],
    thorax,
    'The circumflex branch follows the left atrioventricular groove toward the posterior heart.',
    'Supplies lateral and posterolateral left ventricular myocardium through its branches.',
    coronary,
    coronaryLimit,
  ),
  vessel(
    [['FMA4707', 'unspecified']],
    thorax,
    'The great cardiac vein ascends in the anterior interventricular groove, then turns into the left atrioventricular groove toward the coronary sinus.',
    'Carries myocardial venous return into the coronary sinus pathway.',
    cardiacVeins,
    'Not the accompanying LAD artery. Catalogue laterality remains unspecified; exact artery–vein crossings and the sinus junction are unvalidated.',
  ),
  vessel(
    [['FMA4713', 'unspecified']],
    thorax,
    'The middle cardiac vein follows the posterior interventricular groove toward the coronary sinus.',
    'Returns venous blood from its myocardial tributaries to the coronary sinus.',
    cardiacVeins,
    'Not the great cardiac vein in the anterior groove. Its multi-component source does not establish continuous lumen, individual tributary identities or venous dominance.',
  ),
  vessel(
    [['FMA50872', 'right']],
    thorax,
    'The right pulmonary artery branches from the pulmonary trunk and normally passes behind the ascending aorta and anterior to the right main bronchus.',
    'Carries relatively deoxygenated blood toward the right lung for gas exchange in usual postnatal circulation.',
    pulmonaryArteries,
    pulmonaryLimit,
  ),
  vessel(
    [['FMA50873', 'left']],
    thorax,
    'The left pulmonary artery branches from the pulmonary trunk and normally lies superior to the left main bronchus.',
    'Carries relatively deoxygenated blood toward the left lung for gas exchange in usual postnatal circulation.',
    pulmonaryArteries,
    pulmonaryLimit,
  ),
  vessel(
    [['FMA49914', 'right']],
    thorax,
    'The right superior pulmonary vein usually collects upper- and middle-lobe venous return and enters the left atrium.',
    'Returns oxygenated blood from these lung regions in usual postnatal circulation.',
    pulmonaryVeins,
    pulmonaryLimit,
  ),
  vessel(
    [['FMA49916', 'left']],
    thorax,
    'The left superior pulmonary vein usually collects upper-lobe return, including the lingula, and enters the left atrium.',
    'Returns oxygenated blood from these lung regions in usual postnatal circulation.',
    pulmonaryVeins,
    pulmonaryLimit,
  ),
  vessel(
    [['FMA49911', 'right']],
    thorax,
    'The right inferior pulmonary vein usually collects lower-lobe return and lies inferiorly at the right hilum before reaching the left atrium.',
    'Returns oxygenated right lower-lobe blood in usual postnatal circulation.',
    pulmonaryVeins,
    pulmonaryLimit,
  ),
  vessel(
    [['FMA49913', 'left']],
    thorax,
    'The left inferior pulmonary vein usually collects lower-lobe return and lies inferiorly at the left hilum before reaching the left atrium.',
    'Returns oxygenated left lower-lobe blood in usual postnatal circulation.',
    pulmonaryVeins,
    pulmonaryLimit,
  ),
  vessel(
    [
      ['FMA3969', 'right'],
      ['FMA4068', 'left'],
    ],
    thorax,
    'The internal thoracic artery descends from the subclavian along the deep anterior chest wall beside the sternum, usually dividing into superior epigastric and musculophrenic branches.',
    'Supplies anterior thoracic tissues through its branches.',
    internalThoracic,
  ),
  vessel(
    [
      ['FMA3988', 'right'],
      ['FMA4083', 'left'],
    ],
    wall,
    'The superior epigastric artery continues from the internal thoracic into the anterior abdominal wall toward the rectus region.',
    'Supplies the upper anterior abdominal wall and connects with inferior epigastric branches.',
    books + 'NBK537156/',
    'Distinct from inferior and superficial epigastric arteries. Thorax/abdomen membership is retained; a patent anastomosis or safe abdominal access route is not established.',
  ),
  vessel(
    [
      ['FMA10692', 'right'],
      ['FMA4077', 'left'],
    ],
    wall,
    'The musculophrenic artery branches from the internal thoracic and follows the costal margin toward the diaphragm.',
    'Contributes arterial supply to the diaphragm and lower anterior thoracic wall.',
    internalThoracic,
  ),
  vessel(
    [['FMA4758', 'right']],
    thorax,
    'The internal thoracic venous pathway receives superior epigastric, musculophrenic and anterior intercostal tributaries along the deep anterior chest wall.',
    'Returns blood from the anterior thoracoabdominal wall toward the central venous system.',
    thoraxTables,
    'Right-sided termination descriptions differ among references; the selected source does not adjudicate brachiocephalic versus direct caval entry. The left counterpart is not created by mirroring.',
  ),
  vessel(
    [
      ['FMA4772', 'right'],
      ['FMA4786', 'left'],
    ],
    wall,
    'The musculophrenic vein is a tributary of the internal thoracic venous pathway near the thoracoabdominal margin.',
    'Contributes local venous return to the internal thoracic system.',
    thoraxTables,
    'Not the accompanying artery. Selected source segments do not establish all tributaries, a complete diaphragmatic drainage territory or a patent central connection.',
  ),
];
const byFma = new Map(
  thoracicVesselLessons.flatMap((lesson) =>
    lesson.bindings.map(([fma, side]) => [fma, { lesson, side }] as const),
  ),
);
export function thoracicVesselLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    s.system !== 'vessels' ||
    s.category !== 'vessel' ||
    s.region !== 'thorax' ||
    (tab !== 'anatomy' && tab !== 'function')
  )
    return undefined;
  const match = byFma.get(s.fmaId);
  if (
    !match ||
    s.laterality !== match.side ||
    !match.lesson.regions.every((r) => s.regions.includes(r))
  )
    return undefined;
  const l = match.lesson;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Course & connections' : 'Circulation & limits'} · draft`,
    body: l[tab],
    bullets: [
      l.distinction,
      ...(tab === 'anatomy'
        ? [
            'Red/blue denotes artery/vein, not oxygenation. Source surfaces do not resolve wall layers, lumen patency, flow direction or measured haemodynamics.',
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
