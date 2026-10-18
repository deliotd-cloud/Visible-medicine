import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

type ThoracicVesselClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
  category: 'vessel',
];
interface ThoracicVesselClinicalGroup {
  key: string;
  identities: readonly ThoracicVesselClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
// Original clinical teaching bound to exact represented source identities; no publisher media imported.
export const thoracicVesselClinicalGroups: readonly ThoracicVesselClinicalGroup[] =
  [
    {
      key: 'ascending-aorta',
      identities: [
        [
          'FMA3736',
          'midline',
          'isa',
          ['FJ3413'],
          'thorax',
          ['thorax'],
          'vessel',
        ],
      ],
      scope:
        'One ascending-aortic source surface; root, valve, coronary ostia, wall layers and pericardial blood are not independently resolved. No patient diameter or operative threshold.',
      pathology: {
        body: 'Aneurysm means abnormal aortic enlargement; dissection involves separation within the aortic wall. These are different processes, although they can coexist. Ascending-aortic disease matters because it lies close to the heart and coronary origins.',
        bullets: [
          'A smooth reference surface cannot exclude a wall tear or contained rupture.',
          'A cut through the model is not a dissection flap or a true/false-lumen view.',
        ],
      },
      clinical: {
        body: 'Sudden severe chest or back pain, collapse or other signs of a serious acute chest condition need emergency assessment. In the UK call 999; do not wait to compare symptoms with the model.',
        bullets: [
          'Specialist imaging determines the affected segment and complications.',
          'No repair selection, medication dose or safe observation period is provided.',
        ],
      },
      references: [
        'https://www.nhlbi.nih.gov/health/aortic-aneurysm',
        'https://www.nhlbi.nih.gov/health/aortic-aneurysm/symptoms',
        'https://www.nhlbi.nih.gov/health/aortic-aneurysm/living-with',
      ],
    },
    {
      key: 'aortic-arch',
      identities: [
        [
          'FMA3768',
          'midline',
          'isa',
          ['FJ3411'],
          'thorax',
          ['thorax'],
          'vessel',
        ],
      ],
      scope:
        'One arch identity, not separate wall layers or validated branch ostia. Adjacent airway, oesophageal and nerve relationships do not establish patient-specific compression.',
      pathology: {
        body: 'An arch aneurysm may enlarge without symptoms. When large enough, thoracic aortic disease can affect nearby structures, causing features such as hoarseness, swallowing difficulty or breathlessness; these symptoms also have many other causes.',
        bullets: [
          'An aneurysm and a dissection are not interchangeable labels.',
          'The source does not establish disease extension into the head-and-arm branches.',
        ],
      },
      clinical: {
        body: 'Use the arch as an orientation landmark when learning why aortic imaging must assess more than a single cross-section. The measured aortic segment and clinical context matter; size on this model is not a diagnostic measurement.',
        bullets: [
          'Sudden severe chest/back pain or collapse requires emergency help.',
          'No stent landing zone, branch-preservation plan or patient-specific risk estimate is modelled.',
        ],
      },
      references: [
        'https://www.nhlbi.nih.gov/health/aortic-aneurysm',
        'https://www.nhlbi.nih.gov/health/aortic-aneurysm/symptoms',
        'https://www.nhlbi.nih.gov/health/aortic-aneurysm/diagnosis',
      ],
    },
    {
      key: 'descending-thoracic-aorta',
      identities: [
        [
          'FMA87217',
          'unspecified',
          'isa',
          ['FJ1931'],
          'thorax',
          ['thorax'],
          'vessel',
        ],
      ],
      scope:
        'Unspecified source laterality is retained. A single thoracic segment does not validate intercostal branches, spinal cord supply, wall continuity or the entire thoracoabdominal aorta.',
      pathology: {
        body: 'Descending thoracic aortic aneurysm and dissection can threaten wall integrity and organ blood supply. Whether a disease process involves the ascending aorta or extends beyond the displayed segment must be established on clinical imaging.',
        bullets: [
          "The selected segment alone cannot classify a patient's full aortic disease.",
          'Reference geometry cannot measure growth or prove a vessel wall is intact.',
        ],
      },
      clinical: {
        body: 'Clinical follow-up may use CT, MRI or other appropriate imaging to measure change over time. Imaging choice and surveillance intervals are individual decisions, not values that can be inferred from an atlas.',
        bullets: [
          'Sudden severe chest/back pain or collapse warrants emergency assessment.',
          'No graft size, spinal-cord protection plan, wall stress or rupture prediction is supplied.',
        ],
      },
      references: [
        'https://www.nhlbi.nih.gov/health/aortic-aneurysm/living-with',
        'https://www.nhlbi.nih.gov/health/aortic-aneurysm/diagnosis',
        'https://www.nhlbi.nih.gov/health/aortic-aneurysm/symptoms',
      ],
    },
    {
      key: 'superior-vena-cava',
      identities: [
        [
          'FMA4720',
          'unspecified',
          'isa',
          ['FJ3645'],
          'thorax',
          ['thorax'],
          'vessel',
        ],
      ],
      scope:
        'One unspecified-side caval surface, not a lumen study, tumour segmentation or validated catheter-to-atrial route.',
      pathology: {
        body: 'Superior vena cava obstruction impairs upper-body venous return. Causes include external tumour compression and thrombosis, including clot associated with intravascular devices; obstruction is not synonymous with cancer.',
        bullets: [
          'Face, neck or arm swelling and breathlessness are clinically relevant clues, not an atlas-based diagnosis.',
          'Severity depends partly on the speed of obstruction and available alternative venous pathways.',
        ],
      },
      clinical: {
        body: 'New upper-body swelling with breathing difficulty requires prompt clinical assessment; severe breathing difficulty or collapse is an emergency. Examination and appropriate imaging identify the cause and level of obstruction.',
        bullets: [
          'Do not diagnose central obstruction from visible surface veins alone.',
          'The model cannot choose anticoagulation, stenting, cancer treatment or a central-line route.',
        ],
      },
      references: [
        'https://www.cancer.gov/about-cancer/treatment/side-effects/cardiopulmonary-pdq',
        'https://www.cancer.gov/about-cancer/treatment/side-effects/cardiopulmonary-hp-pdq',
      ],
    },
    {
      key: 'azygos-system',
      identities: [
        [
          'FMA4838',
          'unspecified',
          'isa',
          ['FJ3416'],
          'thorax',
          ['thorax'],
          'vessel',
        ],
        [
          'FMA4944',
          'midline',
          'isa',
          ['FJ3434'],
          'thorax',
          ['thorax'],
          'vessel',
        ],
      ],
      scope:
        'Azygos remains unspecified and hemiazygos remains midline in the source. No accessory hemiazygos, complete collateral circuit or validated venous junction is inferred.',
      pathology: {
        body: 'The azygos system can become an alternative venous pathway when central return is obstructed. Collateral enlargement is an adaptation to altered drainage, not proof that the obstruction is harmless or fully compensated.',
        bullets: [
          'Obstruction above versus below the azygos entry changes the available return pathways.',
          'A static surface does not demonstrate collateral direction, pressure or capacity.',
        ],
      },
      clinical: {
        body: 'Compare these veins with the caval system when studying central venous obstruction. In patients, the cause, level, time course and severity need clinical assessment and imaging rather than interpretation of the reference mesh.',
        bullets: [
          'The source sides are retained even where the usual course crosses the midline.',
          'No venous congestion, reflux, pressure measurement or functional bypass is simulated.',
        ],
      },
      references: [
        'https://www.cancer.gov/about-cancer/treatment/side-effects/cardiopulmonary-hp-pdq',
      ],
    },
    {
      key: 'brachiocephalic-artery',
      identities: [
        [
          'FMA3932',
          'midline',
          'isa',
          ['FJ3417'],
          'thorax',
          ['thorax', 'shoulder-arm', 'head-neck'],
          'vessel',
        ],
      ],
      scope:
        'One midline arterial trunk with thorax/shoulder-arm/head-neck memberships; no duplicated regional vessel or validated carotid/vertebral perfusion map.',
      pathology: {
        body: 'Brachiocephalic arterial stenosis or occlusion can affect the right arm and cerebral circulation. Published cases illustrate that arm perfusion findings and neurological symptoms may occur together, without establishing a universal symptom pattern.',
        bullets: [
          'This is an artery, not either brachiocephalic vein.',
          'A branch surface cannot determine stenosis severity or whether symptoms arise from this vessel.',
        ],
      },
      clinical: {
        body: 'Sudden facial weakness, arm weakness or speech difficulty should be treated as possible stroke and prompt an immediate 999 call. Do not delay because symptoms improve or because the model appears normal.',
        bullets: [
          'A pulse or blood-pressure difference is a clinical clue, not proof of a particular occlusion.',
          'No Doppler waveform, steal direction, collateral adequacy or revascularisation plan is modelled.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC8016668/',
        'https://www.nhs.uk/conditions/stroke/',
      ],
    },
    {
      key: 'subclavian-arteries',
      identities: [
        [
          'FMA3953',
          'right',
          'isa',
          ['FJ3579'],
          'thorax',
          ['thorax', 'shoulder-arm', 'head-neck'],
          'vessel',
        ],
        [
          'FMA4694',
          'left',
          'isa',
          ['FJ3479'],
          'thorax',
          ['thorax', 'shoulder-arm', 'head-neck'],
          'vessel',
        ],
      ],
      scope:
        'Independent right/left arterial identities and all three regional memberships retained; no positional compression or validated vertebral-artery connection.',
      pathology: {
        body: 'Subclavian arterial compression can be part of vascular thoracic outlet syndrome. Arterial, venous and nerve compression are different problems, even though symptoms can overlap around the same anatomical region.',
        bullets: [
          'A cold or discoloured hand does not by itself identify the cause.',
          'The right and left arteries have different usual origins; they are not interchangeable mirror copies.',
        ],
      },
      clinical: {
        body: 'Clinical assessment distinguishes vascular and neurological causes of arm symptoms. The atlas can show neighbouring structures but cannot reproduce posture-dependent narrowing or establish a safe manoeuvre.',
        bullets: [
          'Acutely worsening circulation or severe symptoms need urgent medical assessment.',
          'No provocative test result, arm-exercise treatment or measured vessel clearance is supplied.',
        ],
      },
      references: ['https://www.nhs.uk/conditions/thoracic-outlet-syndrome/'],
    },
    {
      key: 'brachiocephalic-veins',
      identities: [
        [
          'FMA4751',
          'right',
          'isa',
          ['FJ3583'],
          'thorax',
          ['thorax', 'shoulder-arm', 'head-neck'],
          'vessel',
        ],
        [
          'FMA4761',
          'left',
          'isa',
          ['FJ3482'],
          'thorax',
          ['thorax', 'shoulder-arm', 'head-neck'],
          'vessel',
        ],
      ],
      scope:
        'Separate right/left inlet veins, including the longer left-sided crossing; no mirrored geometry, validated confluence or complete collateral map.',
      pathology: {
        body: 'Obstruction of the central venous return can produce upstream congestion. When assessing swelling, the brachiocephalic veins and superior vena cava need to be distinguished; a named vein in an atlas does not identify where a blockage actually lies.',
        bullets: [
          'Compression and intravascular clot are different possible mechanisms.',
          'The two sides need not show identical clinical or imaging findings.',
        ],
      },
      clinical: {
        body: 'Use the paired veins to orient the pathway from the jugular–subclavian junctions toward the superior vena cava. Patient symptoms, device history and imaging are needed to localise impaired drainage.',
        bullets: [
          'New swelling with breathing difficulty warrants prompt assessment.',
          'No central-line insertion, device positioning or proof of lumen patency is provided.',
        ],
      },
      references: [
        'https://www.cancer.gov/about-cancer/treatment/side-effects/cardiopulmonary-pdq',
      ],
    },
    {
      key: 'subclavian-veins',
      identities: [
        [
          'FMA4755',
          'right',
          'isa',
          ['FJ3587'],
          'thorax',
          ['thorax', 'shoulder-arm', 'head-neck'],
          'vessel',
        ],
        [
          'FMA4763',
          'left',
          'isa',
          ['FJ3486'],
          'thorax',
          ['thorax', 'shoulder-arm', 'head-neck'],
          'vessel',
        ],
      ],
      scope:
        'Right/left venous surfaces with preserved inlet memberships; valves, clot and dynamic costoclavicular narrowing are not segmented.',
      pathology: {
        body: 'Venous thoracic outlet compression can be associated with an upper-limb blood clot. A swollen, painful, warm or discoloured arm is clinically different from an isolated nerve symptom, but the cause still requires assessment.',
        bullets: [
          'Do not transfer arterial oxygen-supply teaching to a venous selection.',
          'A vessel intersection in an exploded view is not evidence of actual compression.',
        ],
      },
      clinical: {
        body: 'New throbbing or cramping arm pain with swelling, redness or warmth warrants urgent GP/111 assessment. Sudden breathlessness with sharp chest pain or coughing blood can indicate an emergency; call 999.',
        bullets: [
          'History and investigations distinguish clot, compression and other causes.',
          'No anticoagulant regimen, clot extraction, catheter route or exercise-provocation protocol is supplied.',
        ],
      },
      references: [
        'https://www.nhs.uk/conditions/thoracic-outlet-syndrome/',
        'https://www.nhs.uk/conditions/pulmonary-embolism/',
      ],
    },
    {
      key: 'coronary-arteries',
      identities: [
        ['FMA3802', 'right', 'isa', ['FJ2723'], 'thorax', ['thorax'], 'vessel'],
        ['FMA3855', 'left', 'isa', ['FJ2737'], 'thorax', ['thorax'], 'vessel'],
        [
          'FMA3862',
          'left',
          'partof',
          [
            'FJ2631',
            'FJ2632',
            'FJ2633',
            'FJ2634',
            'FJ2635',
            'FJ2636',
            'FJ2637',
            'FJ2638',
            'FJ2639',
            'FJ2640',
            'FJ2641',
            'FJ2642',
            'FJ2643',
            'FJ2644',
            'FJ2645',
            'FJ2646',
            'FJ2647',
            'FJ2648',
          ],
          'thorax',
          ['thorax'],
          'vessel',
        ],
        [
          'FMA3895',
          'left',
          'isa',
          ['FJ2649', 'FJ2650', 'FJ2651', 'FJ2652', 'FJ2653', 'FJ2654'],
          'thorax',
          ['thorax'],
          'vessel',
        ],
      ],
      scope:
        'Right/left trunks, the 18-component part-of-tree LAD and six-component circumflex remain separate identities. Components are not lesion or branch counts; no coronary dominance/perfusion territory is certified.',
      pathology: {
        body: 'Coronary disease can reduce blood supply to heart muscle and cause angina or myocardial infarction. A narrowed or blocked coronary artery is not the same as an obstructed cardiac vein, and symptoms do not reliably identify one culprit branch.',
        bullets: [
          'The left coronary trunk, LAD and circumflex are not interchangeable names.',
          'A reference artery has no plaque, stenosis grade, collateral assessment or infarct overlay.',
        ],
      },
      clinical: {
        body: 'Suspected heart attack needs immediate emergency help: call 999. Chest discomfort with breathlessness, sweating, nausea or pain spreading elsewhere may be important; do not use the atlas to rule it out.',
        bullets: [
          'Diagnosis uses clinical assessment and appropriate investigations, not pain-to-mesh matching.',
          'No PCI strategy, bypass target choice, drug dose or individual survival estimate is supplied.',
        ],
      },
      references: [
        'https://www.nhs.uk/conditions/coronary-heart-disease/',
        'https://www.nhs.uk/conditions/coronary-heart-disease/symptoms/',
      ],
    },
    {
      key: 'great-cardiac-vein',
      identities: [
        [
          'FMA4707',
          'unspecified',
          'isa',
          ['FJ2656'],
          'thorax',
          ['thorax'],
          'vessel',
        ],
      ],
      scope:
        'One unspecified-side venous source, not the LAD, circumflex or a complete coronary sinus. Local artery–vein separation is unvalidated.',
      pathology: {
        body: 'Cardiac veins can be injured during cardiac interventions. A published case of great cardiac vein injury after circumflex intervention illustrates why a nearby artery and vein must not be treated as the same structure.',
        bullets: [
          'A case report shows a possible complication, not its frequency or the risk for every patient.',
          'The source surface does not show perforation, extravasation or pericardial fluid.',
        ],
      },
      clinical: {
        body: 'Recognising venous versus arterial anatomy helps interpret why a procedural complication needs dedicated assessment. This reference model cannot verify instrument position or the distance to adjacent coronary arteries.',
        bullets: [
          'Source laterality remains unspecified; course does not change the recorded identity.',
          'No catheter trajectory, ablation site, safe energy setting or procedural clearance is provided.',
        ],
      },
      references: ['https://pubmed.ncbi.nlm.nih.gov/37601229/'],
    },
    {
      key: 'middle-cardiac-vein',
      identities: [
        [
          'FMA4713',
          'unspecified',
          'isa',
          [
            'FJ2678',
            'FJ2679',
            'FJ2680',
            'FJ2681',
            'FJ2682',
            'FJ2683',
            'FJ2684',
            'FJ2685',
            'FJ2686',
            'FJ2687',
            'FJ2688',
            'FJ2689',
            'FJ2690',
            'FJ2691',
          ],
          'thorax',
          ['thorax'],
          'vessel',
        ],
      ],
      scope:
        'One unspecified-side identity with 14 source components. These are not 14 named tributaries, a verified continuous lumen or a ventricular chamber.',
      pathology: {
        body: 'A pacemaker lead inadvertently entering the middle cardiac vein can be mistaken for a ventricular location or apparent perforation. This is a reported device-position complication, not evidence that the selected reference vein is diseased.',
        bullets: [
          'Projection overlap is not proof that a lead is inside the ventricle.',
          'No pacemaker lead or perforation is modelled in this atlas.',
        ],
      },
      clinical: {
        body: "Use this vein's posterior cardiac course to understand why several sources of evidence may be needed to confirm device position. The atlas is an orientation aid, not a fluoroscopic simulator or a device-position test.",
        bullets: [
          'Do not infer a safe transvenous route from source fragments.',
          'No lead-placement instructions, electrical thresholds or extraction procedure is supplied.',
        ],
      },
      references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC9296805/'],
    },
    {
      key: 'pulmonary-arteries',
      identities: [
        [
          'FMA50872',
          'right',
          'isa',
          ['FJ3019'],
          'thorax',
          ['thorax'],
          'vessel',
        ],
        ['FMA50873', 'left', 'isa', ['FJ2924'], 'thorax', ['thorax'], 'vessel'],
      ],
      scope:
        'Two named pulmonary arterial surfaces; no validated lobar/segmental tree, intraluminal filling defect, pressure measurement or right-heart strain simulation.',
      pathology: {
        body: 'Pulmonary embolism obstructs pulmonary blood vessels, commonly after a clot travels from elsewhere. Pulmonary hypertension refers to raised pressure in the lung circulation and is not simply another name for an acute embolus.',
        bullets: [
          'These arteries normally carry relatively deoxygenated blood after birth; atlas red means artery, not oxygenation.',
          'A large-artery reference surface cannot exclude smaller emboli or diagnose pulmonary hypertension.',
        ],
      },
      clinical: {
        body: 'Sudden breathing difficulty or coughing blood needs urgent medical advice. Severe breathing difficulty, chest/upper-back pain, a very fast heartbeat or collapse needs emergency assessment; call 999.',
        bullets: [
          'Clinical investigations, not vessel colour or rendered diameter, establish the diagnosis.',
          'No CT pulmonary angiogram, clot burden, Doppler estimate or thrombolysis decision is supplied.',
        ],
      },
      references: [
        'https://www.nhs.uk/conditions/pulmonary-embolism/',
        'https://www.nhs.uk/conditions/pulmonary-hypertension/',
      ],
    },
    {
      key: 'pulmonary-veins',
      identities: [
        [
          'FMA49914',
          'right',
          'isa',
          ['FJ3020'],
          'thorax',
          ['thorax'],
          'vessel',
        ],
        [
          'FMA49916',
          'left',
          'isa',
          ['FJ2925', 'FJ2933'],
          'thorax',
          ['thorax'],
          'vessel',
        ],
        [
          'FMA49911',
          'right',
          'isa',
          ['FJ3040'],
          'thorax',
          ['thorax'],
          'vessel',
        ],
        [
          'FMA49913',
          'left',
          'isa',
          ['FJ2944', 'FJ2950', 'FJ2955'],
          'thorax',
          ['thorax'],
          'vessel',
        ],
      ],
      scope:
        'Four named selections, including two left-superior and three left-inferior source components. These do not independently identify ostia, lung segments or accessory veins.',
      pathology: {
        body: 'Pulmonary vein stenosis is a recognised complication after ablation for atrial fibrillation. It may present with breathlessness, cough or coughing blood; these nonspecific symptoms do not establish the diagnosis or select a particular vein.',
        bullets: [
          'Pulmonary venous narrowing is different from pulmonary arterial embolism.',
          'This is one clinically important example, not a complete list of pulmonary venous disorders.',
        ],
      },
      clinical: {
        body: 'Persistent or new respiratory symptoms after an ablation should be discussed promptly with the treating team; severe symptoms require emergency assessment. Dedicated clinical imaging is needed to evaluate the pulmonary veins.',
        bullets: [
          'Superior/inferior and right/left identities remain separate; component count is not ostial count.',
          'No ablation lesion set, measured ostial diameter, stent sizing or pulmonary venous flow is modelled.',
        ],
      },
      references: [
        'https://pubmed.ncbi.nlm.nih.gov/27793993/',
        'https://www.nhs.uk/conditions/pulmonary-embolism/',
      ],
    },
    {
      key: 'internal-thoracic-arteries',
      identities: [
        ['FMA3969', 'right', 'isa', ['FJ1937'], 'thorax', ['thorax'], 'vessel'],
        ['FMA4068', 'left', 'isa', ['FJ1972'], 'thorax', ['thorax'], 'vessel'],
      ],
      scope:
        'Separate right/left chest-wall arteries. No harvested graft, anastomosis, complete perforator tree or patient-specific sternal supply is represented.',
      pathology: {
        body: 'Internal thoracic artery injury can cause bleeding or a pseudoaneurysm after trauma or a procedure. A pseudoaneurysm is a contained arterial leak, not simply the normal artery appearing large in the viewer.',
        bullets: [
          'Case reports demonstrate possible injury patterns, not incidence.',
          'The artery is also called internal mammary; it is distinct from the internal thoracic vein.',
        ],
      },
      clinical: {
        body: 'Internal thoracic arteries are important coronary bypass conduits, especially the left artery in relation to the LAD. Whether a vessel is suitable and how it is used are patient-specific surgical decisions.',
        bullets: [
          'The original source surface is native anatomy, not a postoperative graft.',
          'No harvest plane, graft length, chest-wall healing assessment or bypass simulation is supplied.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC10802145/',
        'https://www.lhch.nhs.uk/coronary-artery-bypass-grafting',
      ],
    },
    {
      key: 'superior-epigastric-arteries',
      identities: [
        [
          'FMA3988',
          'right',
          'isa',
          ['FJ1936'],
          'thorax',
          ['thorax', 'abdomen'],
          'vessel',
        ],
        [
          'FMA4083',
          'left',
          'isa',
          ['FJ1971'],
          'thorax',
          ['thorax', 'abdomen'],
          'vessel',
        ],
      ],
      scope:
        'Paired superior epigastric selections retain thorax and abdomen membership. No rectus sheath layers, complete anastomoses or measured bleed extent.',
      pathology: {
        body: 'Bleeding from an epigastric vessel or a muscle injury can produce a rectus sheath haematoma. This abdominal-wall collection can mimic an intra-abdominal cause of pain; selecting the superior epigastric artery does not identify the actual bleeding source.',
        bullets: [
          'Superior, inferior and superficial epigastric arteries are different structures.',
          'The model cannot show active extravasation or distinguish an arterial bleed from other causes.',
        ],
      },
      clinical: {
        body: 'New severe abdominal pain, enlarging swelling or signs of circulatory compromise require medical assessment. Clinical imaging can localise an abdominal-wall collection and, where appropriate, identify active bleeding.',
        bullets: [
          'Recent trauma, strain, procedures and medicines are relevant history, not proof of causation.',
          'No embolisation, vessel ligation, abdominal access route or medication adjustment is supplied.',
        ],
      },
      references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC6000050/'],
    },
    {
      key: 'musculophrenic-arteries',
      identities: [
        [
          'FMA10692',
          'right',
          'isa',
          ['FJ1969'],
          'thorax',
          ['thorax', 'abdomen'],
          'vessel',
        ],
        [
          'FMA4077',
          'left',
          'isa',
          ['FJ1979'],
          'thorax',
          ['thorax', 'abdomen'],
          'vessel',
        ],
      ],
      scope:
        'Right/left arterial source segments retain thorax/abdomen membership. Not the phrenic nerve, inferior phrenic artery or complete diaphragmatic vascular network.',
      pathology: {
        body: 'Musculophrenic arterial injury is a reported cause of haemothorax after chest trauma. A delayed collection of blood can occur; a reference surface cannot exclude bleeding because it has no visible vessel discontinuity.',
        bullets: [
          'A haemothorax contains blood in the pleural space, not air alone.',
          'A single case establishes a possible injury, not its usual frequency.',
        ],
      },
      clinical: {
        body: 'Worsening breathlessness, chest pain or faintness after an injury warrants prompt assessment; severe breathing difficulty or collapse is an emergency. Imaging and the clinical course establish the injured structures.',
        bullets: [
          'An adjacent fractured rib in a patient does not justify inferring the same injury in every case.',
          'No drain location, needle path, ligation point or embolisation technique is supplied.',
        ],
      },
      references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC4810351/'],
    },
    {
      key: 'thoracoabdominal-wall-veins',
      identities: [
        ['FMA4758', 'right', 'isa', ['FJ1993'], 'thorax', ['thorax'], 'vessel'],
        [
          'FMA4772',
          'right',
          'isa',
          ['FJ1996'],
          'thorax',
          ['thorax', 'abdomen'],
          'vessel',
        ],
        [
          'FMA4786',
          'left',
          'isa',
          ['FJ1988'],
          'thorax',
          ['thorax', 'abdomen'],
          'vessel',
        ],
      ],
      scope:
        'Only the indexed right internal thoracic vein and paired musculophrenic veins are selected. No left internal thoracic vein is invented; exact right-sided termination and complete tributary joins remain unvalidated.',
      pathology: {
        body: 'Chest-wall venous prominence can accompany central venous obstruction, but the appearance of one superficial vein cannot diagnose the obstruction or identify one deep tributary as its cause. These selections represent venous return, not arterial supply.',
        bullets: [
          'An enlarged collateral pathway and a thrombosed vein are not equivalent findings.',
          'The model shows neither venous pressure nor the direction of collateral drainage.',
        ],
      },
      clinical: {
        body: 'Use the named deep wall veins as context when tracing venous return toward the central system. New upper-body swelling or breathing symptoms need assessment of the whole pathway, rather than attributing them to a selected small vein.',
        bullets: [
          'The source does not settle variation in venous termination.',
          'No central access route, venous pressure, clot assessment or guaranteed collateral connection is supplied.',
        ],
      },
      references: [
        'https://www.cancer.gov/about-cancer/treatment/side-effects/cardiopulmonary-hp-pdq',
      ],
    },
    {
      key: 'bronchial-arteries',
      identities: [
        [
          'FMA68109',
          'midline',
          'isa',
          ['FJ1933'],
          'thorax',
          ['thorax'],
          'vessel',
        ],
        [
          'FMA10704',
          'midline',
          'isa',
          ['FJ3418'],
          'thorax',
          ['thorax'],
          'vessel',
        ],
      ],
      scope:
        'Two indexed bronchial identities; FMA10704 remains explicitly variant-labelled. No complete bronchial tree, validated origin or spinal arterial connections; no duplicate FMA14177 alias is introduced.',
      pathology: {
        body: 'Bronchial systemic arteries are important potential sources of haemoptysis, particularly in diseased lung or airways. Bronchial bleeding and a pulmonary arterial embolus involve different vascular contexts; coughing blood alone does not localise the source.',
        bullets: [
          'Bronchial artery number and origins vary; a variant source is not a universal normal pattern.',
          'The displayed vessels do not prove the presence or absence of hazardous connections.',
        ],
      },
      clinical: {
        body: 'Coughing blood requires medical assessment. More than a few spots or streaks, or blood with breathing difficulty, chest pain or a very fast heartbeat, needs emergency help. The cause and source must be investigated.',
        bullets: [
          'Specialist embolisation aims to control bleeding, but this atlas provides no catheter route or embolic choice.',
          'Explode and cut controls do not identify a safe interventional target.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC9117352/',
        'https://www.nhs.uk/symptoms/coughing-up-blood/',
      ],
    },
    {
      key: 'oesophageal-arteries',
      identities: [
        [
          'FMA4149',
          'midline',
          'isa',
          ['FJ1934'],
          'thorax',
          ['thorax'],
          'vessel',
        ],
        [
          'FMA71537',
          'midline',
          'isa',
          ['FJ3431'],
          'thorax',
          ['thorax'],
          'vessel',
        ],
      ],
      scope:
        'One oesophageal artery and one grouped set-of-branches identity. Both remain midline; branch names/counts, full supply and submucosal networks are not inferred.',
      pathology: {
        body: 'Arterial bleeding from the oesophagus is distinct from bleeding oesophageal varices, which are venous. Clinical reports show that the responsible arterial source can differ by site; these two selections do not enumerate every contribution.',
        bullets: [
          'Oesophageal disease may involve mucosa, tumour or other tissues, not just a named vessel.',
          'A grouped source set is not a list of individually validated embolisation targets.',
        ],
      },
      clinical: {
        body: 'Vomiting blood always needs medical help. Vomiting blood with faintness, confusion, clammy skin, abdominal pain or black stools requires emergency assessment. Symptoms alone cannot locate the bleed to one displayed artery.',
        bullets: [
          'Clinical investigation distinguishes an oesophageal source from gastric, swallowed or other blood.',
          'No endoscopic target, arterial access route or embolisation protocol is provided.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC8289426/',
        'https://www.nhs.uk/symptoms/vomiting-blood/',
      ],
    },
  ];
const byFma = new Map(
  thoracicVesselClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function thoracicVesselClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if ((tab !== 'pathology' && tab !== 'clinical') || s.system !== 'vessels')
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
