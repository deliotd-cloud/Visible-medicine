import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface AbdominalVesselLesson {
  fmaId: string;
  side: BodyStructure['laterality'];
  regions: readonly BodyStructure['region'][];
  anatomy: string;
  function: string;
  distinction: string;
  references: readonly string[];
}
const books = 'https://www.ncbi.nlm.nih.gov/books/';
const abdomen = ['abdomen'] as const;
const central = ['abdomen', 'pelvis', 'thorax'] as const;
const branching =
  'Usual branching is teaching context, not a complete reconstructed vascular tree. Origins, collateral connections, supply boundaries and source continuity require independent review.';
function vessel(
  fmaId: string,
  side: AbdominalVesselLesson['side'],
  regions: AbdominalVesselLesson['regions'],
  anatomy: string,
  role: string,
  reference: string | readonly string[],
  distinction = branching,
): AbdominalVesselLesson {
  return {
    fmaId,
    side,
    regions,
    anatomy,
    function: role,
    distinction,
    references: typeof reference === 'string' ? [reference] : [...reference],
  };
}

// Original factual notes, not copied textbook prose, illustrations or datasets.
export const abdominalVesselLessons: readonly AbdominalVesselLesson[] = [
  vessel(
    'FMA3789',
    'midline',
    central,
    'The abdominal aorta continues below the diaphragm, anterior to the lumbar spine, and ends by dividing into the common iliac arteries. The inferior vena cava usually lies to its right.',
    'Distributes arterial blood through visceral and body-wall branches and onward toward the pelvis and lower limbs.',
    books + 'NBK525964/',
    'The selected abdominal segment is not the entire aorta. Thorax/pelvis memberships support navigation, not a claim that all branches, wall layers or vertebral levels are validated.',
  ),
  vessel(
    'FMA10951',
    'unspecified',
    central,
    'The inferior vena cava forms from the common iliac veins, ascends beside the spine and passes through the diaphragm to the right atrium.',
    'Returns systemic venous blood from the lower body. Portal-system blood reaches it after passing through the liver and hepatic venous outflow.',
    books + 'NBK482353/',
    'Its two source components are not independently labelled caval segments. Unspecified catalogue laterality is retained; duplication, interruption, tributaries and patency are not adjudicated.',
  ),
  vessel(
    'FMA50737',
    'unspecified',
    abdomen,
    'The celiac artery is a short anterior aortic branch whose usual major divisions are the left gastric, splenic and common hepatic arteries.',
    'Feeds foregut-related arterial pathways and the spleen through its branches.',
    [books + 'NBK459241/', books + 'NBK525959/'],
    'Supply territory does not imply a shared embryological origin: the spleen is not a gut derivative. Two source components do not establish a normal trifurcation or a clinically significant compression.',
  ),
  vessel(
    'FMA14749',
    'midline',
    abdomen,
    'The superior mesenteric artery arises below the celiac origin and passes anterior to the left renal vein and third part of the duodenum toward the small-bowel mesentery.',
    'Supplies midgut pathways, including jejunum, ileum and proximal colonic territories, through intestinal and colic branches.',
    books + 'NBK519560/',
    'The two-file selection does not resolve individual arcades or vasa recta. Aortomesenteric angle, compression and adequate collateral flow cannot be diagnosed from this source surface.',
  ),
  vessel(
    'FMA14750',
    'unspecified',
    abdomen,
    'The inferior mesenteric artery arises from the abdominal aorta below the superior mesenteric artery; its usual branches include left colic, sigmoid and superior rectal arteries.',
    'Contributes to distal transverse/descending and sigmoid colonic supply and the upper rectum.',
    books + 'NBK525959/',
    'Not the inferior mesenteric vein. Named bowel territories are approximate and overlapping, not segmented perfusion maps. The whole rectum is not exclusively supplied by this artery.',
  ),
  vessel(
    'FMA14771',
    'midline',
    abdomen,
    'The common hepatic artery usually arises from the celiac axis; beyond the gastroduodenal origin its hepatic continuation is termed the proper hepatic artery.',
    'Routes arterial blood toward the liver and gastroduodenal branch pathways.',
    books + 'NBK525959/',
    'Common and proper hepatic arteries are distinct selections. Replaced/accessory hepatic supply and variable gastric branches are not ruled out by the usual description; the liver is not supplied solely by arterial blood.',
  ),
  vessel(
    'FMA14772',
    'unspecified',
    abdomen,
    'The proper hepatic artery ascends in the hepatoduodenal ligament toward its right and left hepatic branches, accompanying the portal vein and bile duct.',
    'Provides arterial inflow to the liver, complementing portal venous inflow.',
    [books + 'NBK554488/', books + 'NBK525959/'],
    'This artery is an inflow route, not a hepatic vein or bile duct. No fixed arterial/portal flow fraction, branch completeness, portal-triad clearance or operative corridor is certified.',
  ),
  vessel(
    'FMA14773',
    'unspecified',
    abdomen,
    'The splenic artery usually arises from the celiac axis and travels along the superior pancreatic border behind the stomach toward the spleen.',
    'Supplies the spleen and contributes pancreatic and gastric branches.',
    books + 'NBK525959/',
    'Its four source components are not automatically named pancreatic, short-gastric or gastro-omental branches. Tortuosity, aneurysm, splenic territories and collateral sufficiency require separate evidence.',
  ),
  vessel(
    'FMA14768',
    'left',
    abdomen,
    'The left gastric artery normally arises from the celiac axis, gives lower-esophageal branches and follows the lesser gastric curvature toward the right gastric pathway.',
    'Contributes arterial supply to the lesser-curvature stomach and distal esophagus.',
    books + 'NBK459241/',
    'Not the left gastro-omental artery along the greater curvature. This surface does not demonstrate a patent gastric anastomosis or determine a variant hepatic branch.',
  ),
  vessel(
    'FMA50735',
    'unspecified',
    abdomen,
    'The hepatic portal vein usually forms behind the pancreatic neck where splenic and superior mesenteric veins unite, then travels toward the liver in the hepatoduodenal ligament.',
    'Delivers splanchnic venous blood to the hepatic sinusoidal circulation for processing; it is an inflow vessel despite being a vein.',
    books + 'NBK500014/',
    'Do not confuse portal inflow with hepatic venous outflow. This selected segment does not reveal all tributaries, liver segments, sinusoids, portal pressure or actual flow direction.',
  ),
  vessel(
    'FMA14752',
    'right',
    abdomen,
    'The right renal artery normally crosses from the aorta behind the inferior vena cava to the right renal hilum; its course is usually longer than on the left.',
    'Delivers blood to the right renal arterial network, supporting kidney perfusion and downstream filtration.',
    books + 'NBK572135/',
    'A blood vessel, not the ureter. Accessory arteries and segmental branches may be present; this surface neither excludes them nor measures renal blood flow, filtration or stenosis.',
  ),
  vessel(
    'FMA14753',
    'left',
    abdomen,
    'The left renal artery normally travels from the aorta toward the left renal hilum, posterior to the left renal vein.',
    'Delivers blood to the left renal arterial network, supporting kidney perfusion and downstream filtration.',
    books + 'NBK572135/',
    'Not a mirror copy of the right caval crossing. Accessory arteries, early branching and hilar relationships require review; no Doppler velocity, resistance index or renal function is inferred.',
  ),
  vessel(
    'FMA14338',
    'right',
    abdomen,
    'The right hepatic vein collects venous blood from right-sided liver regions and joins the inferior vena cava as part of hepatic outflow.',
    'Returns blood after hepatic sinusoidal passage toward the systemic venous circulation.',
    [books + 'NBK500014/', books + 'NBK482353/'],
    'Not the right portal branch: portal/arterial inflow and hepatic outflow differ. A single source file does not define a complete right-lobe drainage territory, segment boundary or venous waveform.',
  ),
  vessel(
    'FMA14339',
    'left',
    abdomen,
    'The left hepatic vein collects venous blood from left-sided liver regions and reaches the inferior vena cava through the hepatic venous outflow system.',
    'Returns blood after hepatic sinusoidal passage toward the systemic venous circulation.',
    [books + 'NBK500014/', books + 'NBK482353/'],
    'The exact confluence with other hepatic veins and individual drainage territories require review. Do not infer a separate ostium, a complete middle hepatic vein or liver segment boundaries from this selection.',
  ),
];
const byFma = new Map(abdominalVesselLessons.map((l) => [l.fmaId, l]));
export function abdominalVesselLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    s.system !== 'vessels' ||
    s.category !== 'vessel' ||
    s.region !== 'abdomen' ||
    (tab !== 'anatomy' && tab !== 'function')
  )
    return undefined;
  const l = byFma.get(s.fmaId);
  if (
    !l ||
    s.laterality !== l.side ||
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
            'Red/blue denotes artery/vein, not oxygenation or measured flow. Vascular surfaces do not establish wall layers, lumen patency or complete branch continuity.',
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
