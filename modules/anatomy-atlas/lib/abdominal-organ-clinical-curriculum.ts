import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

type AbdominalOrganClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
  category: 'organ',
];
interface AbdominalOrganClinicalGroup {
  key: string;
  identities: readonly AbdominalOrganClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
/** Short original drafts; exact source identities, not inferred mirror copies. */
export const abdominalOrganClinicalGroups: readonly AbdominalOrganClinicalGroup[] =
  [
    {
      key: 'liver',
      identities: [
        [
          'FMA7197',
          'unpaired',
          'partof',
          [
            'FJ1883',
            'FJ1893',
            'FJ1913',
            'FJ1914',
            'FJ1916',
            'FJ2386',
            'FJ2404',
            'FJ2405',
            'FJ2409',
            'FJ2816',
            'FJ2818',
            'FJ2819',
            'FJ2820',
            'FJ2821',
            'FJ2822',
            'FJ2823',
            'FJ2824',
            'FJ3071',
            'FJ3072',
            'FJ3073',
            'FJ3074',
            'FJ3075',
            'FJ3076',
            'FJ3077',
            'FJ3083',
            'FJ3086',
            'FJ3088',
            'FJ3089',
            'FJ3090',
            'FJ3091',
            'FJ3092',
            'FJ3093',
            'FJ3095',
            'FJ3096',
            'FJ3102',
            'FJ3103',
            'FJ3104',
            'FJ3105',
            'FJ3106',
            'FJ3107',
            'FJ3108',
            'FJ3109',
            'FJ3110',
            'FJ3111',
            'FJ3112',
            'FJ3113',
            'FJ3114',
            'FJ3115',
            'FJ3116',
            'FJ3117',
            'FJ3122',
            'FJ3123',
            'FJ3124',
            'FJ3125',
            'FJ3126',
            'FJ3127',
            'FJ3128',
          ],
          'abdomen',
          ['abdomen'],
          'organ',
        ],
      ],
      scope:
        'One 57-component liver aggregate excludes three separately selectable hepatic vessel surfaces. Surface shape, file count and explode spacing do not validate liver segments, fibrosis grade, blood flow or functional reserve.',
      pathology: {
        body: 'Cirrhosis replaces healthy liver tissue with permanent scarring. The changes can both obstruct blood flow through the liver and reduce its ability to function; portal hypertension and liver failure describe different consequences.',
        bullets: [
          'Portal hypertension may lead to ascites or varices. These complications are not represented by a normal-looking reference surface.',
          'The separately selectable hepatic veins and hepatic artery proper retain their own identities; selecting the liver does not select every vessel inside it.',
        ],
      },
      clinical: {
        body: 'Distinguish structural liver anatomy from liver performance. History, examination, laboratory results and appropriate imaging are needed to assess suspected cirrhosis; early disease may produce few symptoms.',
        bullets: [
          'Use the existing vessel selections to study relationships, not to infer portal pressure or vascular patency.',
          'This draft provides no severity score, transplant assessment or patient-specific prognosis.',
        ],
      },
      references: [
        'https://www.niddk.nih.gov/health-information/liver-disease/cirrhosis/definition-facts',
        'https://www.niddk.nih.gov/health-information/liver-disease/cirrhosis/diagnosis',
      ],
    },
    {
      key: 'pancreas',
      identities: [
        [
          'FMA7198',
          'unpaired',
          'partof',
          ['FJ1895', 'FJ1896', 'FJ2629', 'FJ2630'],
          'abdomen',
          ['abdomen'],
          'organ',
        ],
      ],
      scope:
        'Four source components remain one pancreas selection. No pancreatic enzyme activity, duct patency, endocrine function, necrosis or validated internal tissue layers are simulated.',
      pathology: {
        body: 'Pancreatitis is inflammation of the pancreas. Gallstones are a common cause of acute pancreatitis; alcohol exposure, genetic conditions, medicines and other causes also matter, and sometimes no cause is found.',
        bullets: [
          'Acute and chronic pancreatitis are not interchangeable labels. A symptom-free surface cannot exclude either condition.',
          'The model does not show a blocked duct or distinguish oedematous from necrotic tissue.',
        ],
      },
      clinical: {
        body: 'Pain in the upper abdomen may extend towards the back, but this pattern alone does not establish pancreatitis. Relate the pancreatic position to the stomach and nearby biliary anatomy while keeping the clinical diagnosis separate.',
        bullets: [
          'Severe or worsening abdominal pain, especially with vomiting, fever or jaundice, needs urgent medical assessment.',
          'There is no severity classification, treatment protocol or patient-specific fluid or nutrition advice in this lesson.',
        ],
      },
      references: [
        'https://www.niddk.nih.gov/health-information/digestive-diseases/pancreatitis/symptoms-causes',
      ],
    },
    {
      key: 'stomach',
      identities: [
        [
          'FMA7148',
          'unpaired',
          'partof',
          ['FJ2564'],
          'abdomen',
          ['abdomen'],
          'organ',
        ],
      ],
      scope:
        'One reference stomach surface does not expose validated mucosa, an ulcer crater, histology or a measured lumen. Its cutaway is a display aid, not an endoscopic view.',
      pathology: {
        body: 'Peptic ulcer disease involves damage to the lining of the stomach or duodenum. Helicobacter pylori infection and non-steroidal anti-inflammatory medicines are common causes; a gastric ulcer and a duodenal ulcer occupy different anatomical sites.',
        bullets: [
          "Meal-related discomfort is not a reliable way to determine an ulcer's location or cause.",
          'An intact-looking outer stomach surface cannot exclude disease of its lining.',
        ],
      },
      clinical: {
        body: 'Upper abdominal discomfort, nausea or early fullness may occur, but these symptoms are not specific to an ulcer. Keep the selected stomach distinct from the duodenal portion of the small-intestine aggregate.',
        bullets: [
          'Clinical assessment is needed to establish the cause; this reference model supplies no infection test or endoscopic diagnosis.',
          'No medicine changes, eradication regimen or procedural recommendation are provided.',
        ],
      },
      references: [
        'https://www.niddk.nih.gov/health-information/digestive-diseases/peptic-ulcers-stomach-ulcers',
        'https://www.niddk.nih.gov/health-information/digestive-diseases/peptic-ulcers-stomach-ulcers/symptoms-causes',
      ],
    },
    {
      key: 'small-intestine',
      identities: [
        [
          'FMA7200',
          'unpaired',
          'partof',
          [
            'FJ2573',
            'FJ2574',
            'FJ2575',
            'FJ2576',
            'FJ2577',
            'FJ2578',
            'FJ2579',
            'FJ2580',
            'FJ2581',
            'FJ2582',
            'FJ2583',
            'FJ2584',
            'FJ2585',
            'FJ2586',
            'FJ2587',
            'FJ2588',
            'FJ2589',
            'FJ2590',
            'FJ2591',
            'FJ2592',
            'FJ2593',
            'FJ2594',
            'FJ2595',
            'FJ2596',
            'FJ2597',
            'FJ2598',
            'FJ2600',
            'FJ2601',
            'FJ2602',
            'FJ2603',
            'FJ2604',
            'FJ2605',
            'FJ2606',
            'FJ2607',
            'FJ2608',
            'FJ2609',
            'FJ2610',
            'FJ2611',
            'FJ2612',
            'FJ2613',
            'FJ2614',
            'FJ2615',
            'FJ2616',
            'FJ2617',
            'FJ2618',
            'FJ2619',
            'FJ2620',
            'FJ2621',
            'FJ2622',
            'FJ2623',
            'FJ2624',
            'FJ2625',
            'FJ2626',
            'FJ2627',
            'FJ2628',
          ],
          'abdomen',
          ['abdomen'],
          'organ',
        ],
      ],
      scope:
        'A 55-component bowel aggregate excludes the separately selectable ileocecal junction. Component count is not validated bowel length, layer count or a set of independently confirmed intestinal segments.',
      pathology: {
        body: "Small-bowel obstruction limits onward passage through the intestine. Adhesions are a common cause, particularly after abdominal surgery, but are not the only cause. Obstruction can be partial or complete and may compromise the bowel's blood supply.",
        bullets: [
          'Postoperative adhesions may become clinically relevant long after an operation; they are not simulated by the spaces between exploded meshes.',
          'Neither luminal patency nor bowel viability can be inferred from this reference surface.',
        ],
      },
      clinical: {
        body: 'Abdominal pain, distension, vomiting and difficulty passing stool or gas can accompany obstruction and require urgent assessment. The model cannot identify a transition point or exclude a dangerous complication.',
        bullets: [
          'Use isolation and explode to study relationships only; moving a structure does not release an adhesion.',
          'The ileocecal junction has its own selection and remains excluded from this aggregate to avoid duplicate rendering.',
        ],
      },
      references: [
        'https://www.niddk.nih.gov/health-information/digestive-diseases/abdominal-adhesions',
      ],
    },
    {
      key: 'large-intestine',
      identities: [
        [
          'FMA7201',
          'unpaired',
          'partof',
          ['FJ2566', 'FJ2567', 'FJ2568', 'FJ2569', 'FJ2570', 'FJ2572'],
          'abdomen',
          ['abdomen'],
          'organ',
        ],
      ],
      scope:
        'Six source components form this display aggregate; the rectum and ileocecal junction remain separately selectable. No complete colonic lumen, mucosal layer or diverticulum is reconstructed.',
      pathology: {
        body: 'Diverticulosis describes pouches in the colon wall, often in the sigmoid region. Many people have no symptoms. Diverticulitis means that a pouch is inflamed; the two terms should not be used as synonyms.',
        bullets: [
          "The selected colon's outline does not identify diverticula or show their inflammation.",
          "A regional highlight is an orientation aid, not a map of a patient's disease extent.",
        ],
      },
      clinical: {
        body: 'Relate the sigmoid region to the wider colon without assuming that all lower abdominal pain is diverticulitis. Clinical findings and appropriate investigations distinguish inflammation from other causes.',
        bullets: [
          'Keep the separate rectum and ileocecal junction selections visible when studying continuity.',
          'This lesson does not infer a bowel-wall abnormality from clipping, transparency or colour.',
        ],
      },
      references: [
        'https://www.niddk.nih.gov/health-information/digestive-diseases/diverticulosis-diverticulitis/definition-facts',
      ],
    },
    {
      key: 'gallbladder',
      identities: [
        [
          'FMA7202',
          'unpaired',
          'partof',
          ['FJ2817'],
          'abdomen',
          ['abdomen'],
          'organ',
        ],
      ],
      scope:
        'One gallbladder surface, not a stone, functioning reservoir or complete biliary tree. Its stable pelvis-coded ID is retained for compatibility; its browsing region is abdomen.',
      pathology: {
        body: 'Gallstones may remain silent or cause symptoms when they obstruct bile flow. The presence of a stone is not the same as acute inflammation of the gallbladder, and the atlas contains no patient-specific stones.',
        bullets: [
          'Separate the gallbladder from its cystic duct and the ducts draining the liver.',
          'No stone size, wall thickening or obstruction is measurable from this mesh.',
        ],
      },
      clinical: {
        body: 'A gallbladder attack can cause pain in the right upper abdomen. Pain lasting hours, fever, vomiting or jaundice needs prompt medical assessment rather than attribution to an incidental stone.',
        bullets: [
          'Symptoms overlap with other abdominal conditions; selecting the gallbladder does not establish their cause.',
          'This is anatomical teaching, not a decision about whether an individual needs an operation.',
        ],
      },
      references: [
        'https://www.niddk.nih.gov/health-information/digestive-diseases/gallstones/symptoms-causes',
      ],
    },
    {
      key: 'kidneys',
      identities: [
        [
          'FMA7204',
          'right',
          'partof',
          ['FJ3147'],
          'abdomen',
          ['abdomen'],
          'organ',
        ],
        [
          'FMA7205',
          'left',
          'partof',
          ['FJ3145'],
          'abdomen',
          ['abdomen'],
          'organ',
        ],
      ],
      scope:
        'Each kidney is an independently indexed single surface with its original side. No microscopic filtration units, renal function, collecting-system pressure or patient-specific obstruction are modelled.',
      pathology: {
        body: 'Chronic kidney disease concerns persistent kidney damage or impaired function, not simply an abnormal-looking kidney. Filtration and leakage of albumin into urine provide different kinds of evidence.',
        bullets: [
          'Reference shape is not a measure of kidney function.',
          'The adrenal gland and ureter remain separate structures.',
        ],
      },
      clinical: {
        body: 'Blood-based filtration estimates and urine albumin tests help assess kidney disease. Model size or colour cannot replace these tests or establish a disease stage.',
        bullets: [
          'Check the selected side before following the associated ureter.',
          'No numerical diagnostic threshold, prognosis or treatment target is inferred from this mesh.',
        ],
      },
      references: [
        'https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/tests-diagnosis',
      ],
    },
    {
      key: 'spleen',
      identities: [
        [
          'FMA7196',
          'unpaired',
          'isa',
          ['FJ2561'],
          'abdomen',
          ['abdomen'],
          'organ',
        ],
      ],
      scope:
        'One reference spleen surface in the left upper abdomen. There is no traumatic lesion, vascular leakage, haematoma, injury grade or age-specific anatomy in this selection.',
      pathology: {
        body: 'Trauma can damage or rupture the spleen, causing internal bleeding. Rupture may occur immediately or after a delay, so an interval since injury does not by itself exclude serious splenic injury.',
        bullets: [
          'The atlas shows neither an injury nor its severity.',
          'Clipping the surface cannot distinguish viable spleen from injured tissue.',
        ],
      },
      clinical: {
        body: "Use the spleen's relationship to the left ribs and stomach for orientation. Suspected splenic rupture is a medical emergency; a reassuring atlas image must never delay emergency assessment after an injury.",
        bullets: [
          'This fixed reference cannot exclude bleeding or estimate blood loss.',
          'It provides no operative, embolisation or return-to-sport recommendation.',
        ],
      },
      references: [
        'https://www.nhs.uk/tests-and-treatments/spleen-problems-and-spleen-removal/',
      ],
    },
    {
      key: 'adrenals',
      identities: [
        [
          'FMA15629',
          'right',
          'isa',
          ['FJ3130'],
          'abdomen',
          ['abdomen'],
          'organ',
        ],
        [
          'FMA15630',
          'left',
          'isa',
          ['FJ3129'],
          'abdomen',
          ['abdomen'],
          'organ',
        ],
      ],
      scope:
        'Two separately indexed adrenal surfaces retain their actual sides. Cortex, medulla, hormone production and regulatory feedback are not represented as independently validated structures or functions.',
      pathology: {
        body: "Primary adrenal insufficiency (Addison's disease) originates in the adrenal glands. Secondary insufficiency reflects inadequate pituitary stimulation; these are different causes of reduced cortisol production.",
        bullets: [
          'Adrenal insufficiency is not kidney failure.',
          'A reference surface cannot establish hormone deficiency.',
        ],
      },
      clinical: {
        body: 'Distinguish an adrenal disorder from a problem higher in its hormonal control pathway. Clinical and laboratory assessment, rather than gland shape in this atlas, establishes the cause.',
        bullets: [
          'Select each gland separately to study its side and relation to the kidney.',
          'No hormone dose, medicine withdrawal advice or endocrine test interpretation is supplied.',
        ],
      },
      references: [
        'https://www.niddk.nih.gov/health-information/endocrine-diseases/adrenal-insufficiency-addisons-disease/definition-facts',
      ],
    },
    {
      key: 'ureters',
      identities: [
        [
          'FMA15571',
          'right',
          'partof',
          ['FJ3146'],
          'abdomen',
          ['abdomen', 'pelvis'],
          'organ',
        ],
        [
          'FMA15572',
          'left',
          'partof',
          ['FJ3144'],
          'abdomen',
          ['abdomen', 'pelvis'],
          'organ',
        ],
      ],
      scope:
        'Each single ureter surface spans abdomen and pelvis with unchanged laterality and source coordinates. Luminal calibre, wall layers, urinary flow and device routes are unvalidated.',
      pathology: {
        body: 'A urinary stone can cause pain as it travels or obstructs drainage. Pain may occur in waves and extend from the side or back towards the lower abdomen or groin.',
        bullets: [
          'This surface does not demonstrate a stone or an obstruction.',
          'Keep the ureter distinct from the urethra.',
        ],
      },
      clinical: {
        body: 'Stone-like pain with fever, chills or difficulty passing urine needs prompt medical assessment; the symptoms may reflect a more serious condition.',
        bullets: [
          'Follow the selected side across the abdomen and pelvis without assigning a new ID.',
          'No measured lumen, stent route or treatment decision is provided.',
        ],
      },
      references: [
        'https://www.niddk.nih.gov/health-information/urologic-diseases/kidney-stones/symptoms-causes',
      ],
    },
    {
      key: 'cystic-duct',
      identities: [
        [
          'FMA14539',
          'unpaired',
          'isa',
          ['FJ3080'],
          'abdomen',
          ['abdomen'],
          'organ',
        ],
      ],
      scope:
        'One source-labelled cystic duct is not a validated lumen or a complete biliary tree. Its continuity and surgical relationships require independent review.',
      pathology: {
        body: 'A gallstone blocking the cystic duct can trap bile in the gallbladder and trigger acute cholecystitis. This is a gallbladder outflow problem, not an interchangeable label for every form of bile-duct obstruction.',
        bullets: [
          'Gallstones do not always produce inflammation or symptoms.',
          'A narrow-looking mesh does not diagnose obstruction.',
        ],
      },
      clinical: {
        body: 'Distinguish the cystic duct, which connects the gallbladder, from the common hepatic duct draining the liver. Persistent right upper abdominal pain may indicate acute cholecystitis and needs medical assessment.',
        bullets: [
          'The atlas cannot establish duct patency, prove a stone or identify an individual anatomical variant.',
          'No operative safe plane, clip position or procedural landmark is validated here.',
        ],
      },
      references: [
        'https://www.nhs.uk/conditions/acute-cholecystitis/',
        'https://my.clevelandclinic.org/health/body/24523-bile-duct',
      ],
    },
    {
      key: 'common-hepatic-duct',
      identities: [
        [
          'FMA14668',
          'unpaired',
          'isa',
          ['FJ3079'],
          'abdomen',
          ['abdomen'],
          'organ',
        ],
      ],
      scope:
        'One source-labelled common hepatic duct, distinct from the cystic duct and common bile duct. A complete biliary lumen, branching variants and surgical continuity are not validated.',
      pathology: {
        body: 'A biliary stricture is a narrowing that can impede bile drainage. Obstruction of an extrahepatic duct may produce jaundice and can be complicated by infection; the cause cannot be determined from this reference shape.',
        bullets: [
          'A duct lesion is not synonymous with gallbladder inflammation.',
          'The atlas does not simulate a stricture or distinguish benign from malignant narrowing.',
        ],
      },
      clinical: {
        body: 'Use the common hepatic duct as the upstream hepatic drainage segment before the cystic-duct junction, rather than renaming it the common bile duct. Clinical assessment is needed to localise and explain a real obstruction.',
        bullets: [
          'The level of obstruction matters, but neither a coloured segment nor explode spacing establishes it in a patient.',
          'No drainage technique, instrument path or surgical plan is provided.',
        ],
      },
      references: [
        'https://my.clevelandclinic.org/health/diseases/15796-biliary-stricture',
        'https://my.clevelandclinic.org/health/body/24523-bile-duct',
      ],
    },
    {
      key: 'appendix',
      identities: [
        [
          'FMA14542',
          'unpaired',
          'isa',
          ['FJ2565'],
          'abdomen',
          ['abdomen', 'pelvis'],
          'organ',
        ],
      ],
      scope:
        'One reference appendix surface retains abdomen and pelvis membership. Its wall layers and variable position are unvalidated; the separately represented mesoappendix is not part of this selection.',
      pathology: {
        body: 'Appendicitis is inflammation of the appendix and may progress to rupture if untreated. Several mechanisms can contribute, including blockage at its opening; a single cause is not established in every case.',
        bullets: [
          'An appendix surface does not show its wall inflammation or luminal contents.',
          'Atypical symptoms do not exclude appendicitis.',
        ],
      },
      clinical: {
        body: 'Pain may begin centrally and later localise towards the lower right abdomen, but this pattern is not universal, especially in children. Suspected appendicitis requires urgent medical assessment.',
        bullets: [
          "Reference position does not predict every patient's appendix location.",
          'The model cannot supply a diagnostic sign, operative route or decision to remove the appendix.',
        ],
      },
      references: [
        'https://www.niddk.nih.gov/health-information/digestive-diseases/appendicitis/symptoms-causes',
        'https://www.niddk.nih.gov/health-information/digestive-diseases/appendicitis/definition-facts',
      ],
    },
    {
      key: 'ileocecal-junction',
      identities: [
        [
          'FMA11338',
          'unpaired',
          'isa',
          ['FJ2599'],
          'abdomen',
          ['abdomen'],
          'organ',
        ],
      ],
      scope:
        'This source surface is excluded from both bowel aggregates to prevent duplicate rendering. Its cecal and ileal-wall aliases do not make it a validated complete cecum, valve, bowel wall or surgical plane.',
      pathology: {
        body: "Crohn's disease commonly affects the small intestine and beginning of the large intestine, although it can occur elsewhere in the digestive tract. This makes their junction a useful orientation point, not a diagnosis-specific structure.",
        bullets: [
          'The source alias does not prove that inflamed terminal ileal mucosa or a functioning ileocecal valve is represented.',
          'A whole-surface highlight cannot show disease distribution, tissue damage or a stricture.',
        ],
      },
      clinical: {
        body: "Relate the small-intestine and large-intestine selections through this separately owned junction. Diagnosis of Crohn's disease requires clinical assessment and investigations that establish inflammation and exclude other causes.",
        bullets: [
          'The visible surface is a reference boundary, not an endoscopic or histological finding.',
          "No Crohn's severity score, bowel-wall measurement or patient scan registration is provided.",
        ],
      },
      references: [
        'https://www.niddk.nih.gov/health-information/digestive-diseases/crohns-disease/definition-facts',
        'https://www.niddk.nih.gov/health-information/digestive-diseases/crohns-disease/diagnosis',
      ],
    },
  ];
const byFma = new Map(
  abdominalOrganClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function abdominalOrganClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if ((tab !== 'pathology' && tab !== 'clinical') || s.system !== 'organs')
    return undefined;
  const match = byFma.get(s.fmaId);
  if (!match) return undefined;
  const [, side, tree, files, region, regions, category] = match.identity;
  if (
    s.category !== category ||
    s.laterality !== side ||
    s.sourceTree !== tree ||
    s.region !== region ||
    !same(s.regions, regions) ||
    !same(
      s.sources.map((p) => p.file),
      files,
    )
  )
    return undefined;
  const { group } = match,
    topic = group[tab];
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'pathology' ? 'Injury & disease' : 'Clinical context'} · draft`,
    body: topic.body,
    bullets: [...topic.bullets, group.scope],
    note: [
      'Draft teaching; independent anatomical and clinical review pending. Educational context, not a patient diagnosis or treatment plan.',
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...group.references],
  };
}
