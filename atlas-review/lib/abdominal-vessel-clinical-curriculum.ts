import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

type AbdominalVesselClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
  category: 'vessel',
];
interface AbdominalVesselClinicalGroup {
  key: string;
  identities: readonly AbdominalVesselClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
// Original clinical teaching bound to exact represented source identities; no publisher media imported.
export const abdominalVesselClinicalGroups: readonly AbdominalVesselClinicalGroup[] =
  [
    {
      key: 'abdominal-aorta',
      identities: [
        [
          'FMA3789',
          'midline',
          'isa',
          ['FJ1932'],
          'abdomen',
          ['abdomen', 'pelvis', 'thorax'],
          'vessel',
        ],
      ],
      scope:
        'One abdominal-aortic surface, with abdomen/pelvis/thorax navigation preserved. No wall layers, aneurysm sac, mural thrombus, validated branch levels or measured lumen.',
      pathology: {
        body: "An abdominal aortic aneurysm is an abnormal enlargement that may remain unnoticed until screening or other imaging. Rupture is a life-threatening complication; an aneurysm is not diagnosed by comparing the viewer's vessel size with a patient's abdomen.",
        bullets: [
          'A normal-looking reference model cannot exclude an aneurysm.',
          'The selected abdominal segment does not establish the state of the whole aorta.',
        ],
      },
      clinical: {
        body: 'Sudden severe abdominal or back pain, collapse or breathing difficulty can be an emergency; in the UK call 999. Clinical ultrasound and other appropriate investigations assess the aorta, not the rendering scale.',
        bullets: [
          "Surveillance and repair decisions depend on the patient's measurements and circumstances.",
          'No diameter threshold, graft sizing, rupture probability or follow-up schedule is supplied.',
        ],
      },
      references: ['https://www.nhs.uk/conditions/abdominal-aortic-aneurysm/'],
    },
    {
      key: 'inferior-vena-cava',
      identities: [
        [
          'FMA10951',
          'unspecified',
          'isa',
          ['FJ3441', 'FJ3659'],
          'abdomen',
          ['abdomen', 'pelvis', 'thorax'],
          'vessel',
        ],
      ],
      scope:
        'One unspecified-side caval identity with two ordered components, not separately named segments. No thrombus, tumour extension, filter or continuous-lumen validation.',
      pathology: {
        body: 'Inferior vena cava thrombosis is an uncommon form of venous thromboembolism. It can coexist with other venous disease; the presence of a clot must be established clinically rather than inferred from a gap or overlap in a reference surface.',
        bullets: [
          'Venous obstruction is different from an abdominal aortic blockage.',
          'A two-component source is not evidence of duplicated cava or clot.',
        ],
      },
      clinical: {
        body: 'Unexplained new leg swelling or pain needs medical assessment; severe breathlessness, chest pain or collapse requires emergency help. The cause and extent of impaired venous return need appropriate investigations.',
        bullets: [
          'An observational registry does not supply an individual treatment rule.',
          'No IVC filter indication, catheter route, anticoagulant regimen or drainage-pressure estimate is provided.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC9299483/',
        'https://www.nhs.uk/conditions/pulmonary-embolism/',
      ],
    },
    {
      key: 'celiac-artery',
      identities: [
        [
          'FMA50737',
          'unspecified',
          'isa',
          ['FJ1846', 'FJ2013'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
      ],
      scope:
        'Two source components under one unspecified-side celiac identity. No validated trifurcation, respiratory motion, compression severity or complete foregut collateral network.',
      pathology: {
        body: 'Celiac stenosis may be atherosclerotic or related to external compression. A compression appearance alone does not establish a symptomatic syndrome; other causes of abdominal symptoms must be considered.',
        bullets: [
          'Median arcuate ligament syndrome is not diagnosed from a static vessel shape.',
          'Source proximity to a ligament or diaphragm is not a measured physiological narrowing.',
        ],
      },
      clinical: {
        body: 'Meal-related abdominal pain and unintended weight loss merit clinical assessment, but are not specific to celiac disease. Evaluation considers symptoms, alternative causes and the wider mesenteric circulation together.',
        bullets: [
          "The selected artery does not establish the patient's collateral reserve.",
          'No ligament-release plan, respiratory manoeuvre, stenosis grade or stent target is supplied.',
        ],
      },
      references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC7226699/'],
    },
    {
      key: 'superior-mesenteric-artery',
      identities: [
        [
          'FMA14749',
          'midline',
          'isa',
          ['FJ1928', 'FJ2011'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
      ],
      scope:
        'Two source components, not named arcades or vasa recta. The midline identity and incomplete bowel perfusion map are retained; no measured aortomesenteric angle.',
      pathology: {
        body: 'Acute mesenteric ischaemia can result from arterial embolism or thrombosis, and bowel hypoperfusion can also occur without a large-vessel occlusion. Severe pain may precede obvious abdominal examination findings.',
        bullets: [
          'A visible artery does not prove adequate bowel perfusion.',
          'Arterial obstruction, venous thrombosis and non-occlusive ischaemia are different mechanisms.',
        ],
      },
      clinical: {
        body: 'New severe or rapidly worsening abdominal pain requires urgent emergency assessment. Clinical suspicion and appropriate imaging determine whether bowel blood supply is threatened; a reassuring atlas view cannot exclude it.',
        bullets: [
          'Neither pain location nor one blood test can select a culprit branch from this model.',
          'No clot extraction, revascularisation route, viable-bowel boundary or treatment protocol is supplied.',
        ],
      },
      references: ['https://pmc.ncbi.nlm.nih.gov/articles/9580452/'],
    },
    {
      key: 'inferior-mesenteric-artery',
      identities: [
        [
          'FMA14750',
          'unspecified',
          'isa',
          ['FJ3442'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
      ],
      scope:
        'One unspecified-side arterial source, not the inferior mesenteric vein. No validated complete left-colonic or rectal territory, marginal connection or lumen measurement.',
      pathology: {
        body: 'Colonic ischaemia means inadequate blood delivery to the colon and does not always require a visible blockage of the inferior mesenteric artery. Regional blood flow, small vessels and systemic circulation all matter.',
        bullets: [
          'Do not equate every episode of ischaemic colitis with an IMA occlusion.',
          'A patent-looking large vessel cannot certify normal bowel-wall perfusion.',
        ],
      },
      clinical: {
        body: 'Abdominal pain with rectal bleeding or bloody diarrhoea needs medical assessment; severe pain or collapse is an emergency. Infection, inflammation and other bleeding causes remain part of the clinical assessment.',
        bullets: [
          'The arterial label is an orientation aid, not a diagnosis or an exclusive territory map.',
          'No bowel-resection margin, perfusion guarantee or arterial ligation plan is supplied.',
        ],
      },
      references: [
        'https://acgcdn.gi.org/wp-content/uploads/2018/04/ACG-Colon-Ischemia-Guideline-Summary.pdf',
      ],
    },
    {
      key: 'hepatic-arterial-inflow',
      identities: [
        [
          'FMA14771',
          'midline',
          'isa',
          ['FJ3078'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
        [
          'FMA14772',
          'unspecified',
          'isa',
          ['FJ3081'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
      ],
      scope:
        'Common hepatic artery remains midline and proper hepatic artery unspecified. Two native selections, not a transplanted arterial anastomosis, portal vein or hepatic outflow.',
      pathology: {
        body: "Hepatic arterial thrombosis is an important vascular complication after liver transplantation and is associated with biliary complications. The liver's portal inflow does not make hepatic arterial integrity irrelevant.",
        bullets: [
          'Common and proper hepatic arteries remain distinct parts of the inflow route.',
          'Transplant-cohort findings are clinical context, not a disease state in these native source surfaces.',
        ],
      },
      clinical: {
        body: 'Post-transplant vascular concerns require assessment by the transplant team with appropriate clinical tests and imaging. This atlas can clarify arterial versus portal inflow, but cannot assess graft health or arterial patency.',
        bullets: [
          'Do not assign a fixed arterial/portal flow fraction or infer a normal biliary blood supply.',
          'No transplant reconstruction, anastomotic technique, Doppler threshold or rescue treatment is supplied.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC5295148/',
        'https://www.aasld.org/practice-guidelines/vascular-liver-disorders',
      ],
    },
    {
      key: 'splenic-artery',
      identities: [
        [
          'FMA14773',
          'unspecified',
          'isa',
          ['FJ2562', 'FJ3420', 'FJ3544', 'FJ3640'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
      ],
      scope:
        'Four components under one unspecified-side splenic-artery identity. Not four named branches, an aneurysm, the splenic vein or a certified collateral network.',
      pathology: {
        body: 'Splenic arterial aneurysms and pseudoaneurysms are different lesions: the latter involve a contained arterial-wall disruption. Pancreatitis-associated vascular injury is one important context for a pseudoaneurysm.',
        bullets: [
          'Tortuosity alone is not an aneurysm diagnosis.',
          'No wall layer, active leak or patient-specific risk is represented here.',
        ],
      },
      clinical: {
        body: 'An arterial lesion requires specialist assessment of its type, size, location and clinical context. Severe abdominal pain with faintness or collapse may indicate major bleeding and requires emergency help.',
        bullets: [
          "A published series or consensus document does not determine an individual patient's treatment.",
          'No embolic material, vessel-sacrifice decision, splenic viability estimate or repair threshold is supplied.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC10770226/',
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC6487818/',
      ],
    },
    {
      key: 'left-gastric-artery',
      identities: [
        [
          'FMA14768',
          'left',
          'isa',
          ['FJ3499'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
      ],
      scope:
        'One left gastric arterial source, not the left gastric vein or greater-curvature gastro-omental artery. No ulcer, gastric wall layers or complete anastomotic ring.',
      pathology: {
        body: 'The left gastric arterial territory can be relevant in non-variceal upper gastrointestinal bleeding. A named artery does not establish the lesion or prove that it is the source; gastric bleeding can have several causes and arterial contributors.',
        bullets: [
          'A gastric ulcer and a bleeding varix are not the same pathology.',
          'No active extravasation or collateral back-filling is shown.',
        ],
      },
      clinical: {
        body: 'Vomiting blood always needs medical help; vomiting blood with faintness, confusion, clammy skin, abdominal pain or black stools needs emergency assessment. Investigation localises the cause rather than matching symptoms to a vessel.',
        bullets: [
          'The clinical series cited is not a targeting protocol for this model.',
          'No endoscopic landmark, catheter path or gastric devascularisation plan is supplied.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC6510562/',
        'https://www.nhs.uk/symptoms/vomiting-blood/',
      ],
    },
    {
      key: 'portal-venous-inflow',
      identities: [
        [
          'FMA50735',
          'unspecified',
          'isa',
          ['FJ1853'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
      ],
      scope:
        'One unspecified-side portal vein selection. No liver sinusoids, intrahepatic segmental branches, thrombus, cavernous transformation or validated tributary confluence.',
      pathology: {
        body: 'Portal vein thrombosis affects venous inflow to the liver. Presentation varies, and extension into mesenteric veins can matter for bowel viability. Portal hypertension and portal thrombosis are related clinical concepts but are not interchangeable diagnoses.',
        bullets: [
          'Portal inflow is distinct from hepatic venous outflow.',
          'A blue vessel in this atlas does not establish flow direction, pressure or oxygen content.',
        ],
      },
      clinical: {
        body: 'Unexplained abdominal pain or new liver decompensation warrants clinical assessment. Imaging establishes clot extent and relevant features; the reference surface cannot distinguish benign thrombus, tumour involvement or an unobstructed lumen.',
        bullets: [
          'No portal-pressure estimate or guarantee of bowel/liver perfusion is provided.',
          'No anticoagulant dose, shunt route or transplant eligibility decision is supplied.',
        ],
      },
      references: [
        'https://www.aasld.org/liver-fellow-network/core-series/why-series/why-do-we-care-about-portomesenteric-venous-thrombosis',
        'https://www.aasld.org/practice-guidelines/vascular-liver-disorders',
      ],
    },
    {
      key: 'renal-arteries',
      identities: [
        [
          'FMA14752',
          'right',
          'isa',
          ['FJ2038'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
        [
          'FMA14753',
          'left',
          'isa',
          ['FJ2046'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
      ],
      scope:
        'Independent right/left renal arteries, preserving their asymmetric course. No accessory arteries, renal segment map, stenosis measurement, urine pathway or renal-function calculation.',
      pathology: {
        body: 'Renal artery stenosis narrows one or both renal arterial pathways and can contribute to high blood pressure and impaired kidney function. A narrowed artery is not the only cause of hypertension or reduced kidney function.',
        bullets: [
          'A renal artery carries blood; the ureter carries urine.',
          'One displayed artery does not exclude accessory supply or prove adequate perfusion.',
        ],
      },
      clinical: {
        body: 'Assessment combines blood pressure, kidney function and appropriate vascular investigations. Vessel colour, apparent diameter and the right–left distance difference in the viewer are not diagnostic tests.',
        bullets: [
          'A reference surface cannot measure Doppler velocity, resistance index or filtration.',
          'No blood-pressure target, drug change, stent indication or contrast-safety decision is supplied.',
        ],
      },
      references: [
        'https://www.niddk.nih.gov/health-information/kidney-disease/renal-artery-stenosis',
      ],
    },
    {
      key: 'hepatic-venous-outflow',
      identities: [
        [
          'FMA14338',
          'right',
          'isa',
          ['FJ2416'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
        [
          'FMA14339',
          'left',
          'isa',
          ['FJ2415'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
      ],
      scope:
        'Separate right and left hepatic veins. No complete middle hepatic vein, venous ostia, liver segment boundaries or measured caval/hepatic pressure.',
      pathology: {
        body: 'Hepatic venous outflow obstruction can cause liver congestion and injury; Budd–Chiari syndrome is a relevant example. This concerns blood leaving the liver, unlike portal or hepatic arterial inflow problems.',
        bullets: [
          'Outflow obstruction may involve hepatic veins or the hepatic portion of the inferior vena cava.',
          'A selected right/left surface does not establish the full extent or cause.',
        ],
      },
      clinical: {
        body: 'New abdominal swelling, pain or deteriorating liver health requires clinical evaluation rather than diagnosis by visual comparison. Appropriate imaging and laboratory assessment determine whether outflow is impaired.',
        bullets: [
          'No Doppler waveform, venous pressure or complete drainage territory is certified.',
          'No shunt placement, angioplasty, anticoagulant regimen or transplant decision is supplied.',
        ],
      },
      references: [
        'https://www.aasld.org/liver-fellow-network/core-series/clinical-pearls/tipsing-scales-against-portal-hypertension',
        'https://www.aasld.org/practice-guidelines/vascular-liver-disorders',
      ],
    },
    {
      key: 'mesenteric-veins',
      identities: [
        [
          'FMA14332',
          'unspecified',
          'isa',
          ['FJ3647'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
        [
          'FMA15391',
          'unspecified',
          'isa',
          ['FJ3443'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
        [
          'FMA15405',
          'unspecified',
          'isa',
          ['FJ3438'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
        [
          'FMA15406',
          'midline',
          'isa',
          ['FJ3543'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
        [
          'FMA15407',
          'right',
          'isa',
          ['FJ3591'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
      ],
      scope:
        'Five independent mesenteric/colic venous identities, not a reconstructed portal tree. Source side labels, individual fragments and the incomplete tributary network remain.',
      pathology: {
        body: 'Mesenteric venous thrombosis obstructs bowel drainage and can cause congestion and intestinal ischaemia. This differs from an arterial inflow occlusion even when both conditions cause abdominal pain.',
        bullets: [
          'A named colic vein does not identify which bowel segment is viable.',
          'One source fragment cannot establish clot extension into adjacent veins.',
        ],
      },
      clinical: {
        body: "Persistent or severe unexplained abdominal pain needs medical assessment; rapid deterioration is an emergency. Clinical imaging evaluates venous obstruction and bowel effects, not the atlas's surface continuity.",
        bullets: [
          'Keep superior/inferior mesenteric, ileal, middle colic and right colic identities separate.',
          'No thrombectomy path, anticoagulant regimen, collateral reserve or infarct boundary is supplied.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/9580452/',
        'https://www.aasld.org/liver-fellow-network/core-series/why-series/why-do-we-care-about-portomesenteric-venous-thrombosis',
      ],
    },
    {
      key: 'middle-and-right-colic-arteries',
      identities: [
        [
          'FMA14810',
          'midline',
          'isa',
          ['FJ3542'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
        [
          'FMA14811',
          'right',
          'isa',
          ['FJ3590'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
      ],
      scope:
        'Midline middle colic and right-sided right colic sources remain separate. No complete proximal colonic branching or validated bowel territories.',
      pathology: {
        body: 'The colonic arterial branches are relevant to ischaemia and bleeding, but the same symptoms can arise from different bowel disorders. The displayed middle and right colic arteries do not provide an exclusive map of affected bowel.',
        bullets: [
          'Right-sided colonic disease is not diagnosed by selecting a right-sided vessel.',
          'Large-vessel appearance cannot establish bowel-wall perfusion.',
        ],
      },
      clinical: {
        body: 'Clinical evaluation of abdominal pain or bowel bleeding uses the overall presentation and appropriate investigations. In surgical teaching, distinguish a named arterial branch from proof that a proposed bowel segment will remain perfused.',
        bullets: [
          'Branch origins and collateral connections vary.',
          'No colectomy margin, arterial ligation level or perfusion simulation is supplied.',
        ],
      },
      references: [
        'https://acgcdn.gi.org/wp-content/uploads/2018/04/ACG-Colon-Ischemia-Guideline-Summary.pdf',
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC7226699/',
      ],
    },
    {
      key: 'ileocolic-arterial-branches',
      identities: [
        [
          'FMA14815',
          'unspecified',
          'isa',
          ['FJ3439'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
        [
          'FMA14820',
          'unspecified',
          'isa',
          ['FJ3414'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
      ],
      scope:
        'Two unspecified-side identities: ileocolic artery and the exact ascending branch of its inferior branch. No shortened alias replaces the source name; held ileal alternatives remain absent.',
      pathology: {
        body: 'Ileocolic branches are part of the vascular context of distal small-bowel and proximal-colonic disease. Bowel inflammation, bleeding and ischaemia are not interchangeable, and symptoms do not establish injury to this particular branch.',
        bullets: [
          'The source segment is not a measured perfusion territory.',
          'Neither absent adjacent branches nor viewer gaps prove an occlusion.',
        ],
      },
      clinical: {
        body: 'Use these selections to recognise why bowel assessment must consider both the tissues and their blood supply. The source does not identify a safe segment to divide or a boundary between healthy and compromised bowel.',
        bullets: [
          'Selecting an ascending branch does not validate its downstream joins.',
          'No ileocolic resection plan, anastomotic viability test or embolisation target is supplied.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/9580452/',
        'https://acgcdn.gi.org/wp-content/uploads/2018/04/ACG-Colon-Ischemia-Guideline-Summary.pdf',
      ],
    },
    {
      key: 'appendicular-artery',
      identities: [
        [
          'FMA14818',
          'unspecified',
          'isa',
          ['FJ3410'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
      ],
      scope:
        'One unspecified-side appendicular arterial source, not the appendix, its lumen or a fully segmented mesoappendix. Accessory branches and exact course require review.',
      pathology: {
        body: 'Appendicitis is inflammation of the appendix, not simply a synonym for an appendicular artery clot. The nearby vascular anatomy matters, but the vessel surface cannot show luminal obstruction, tissue inflammation, perforation or abscess.',
        bullets: [
          'An anatomical supply label is not a diagnosis of the cause of pain.',
          'The source does not measure tissue viability or establish an end-artery variant.',
        ],
      },
      clinical: {
        body: "Suspected appendicitis needs prompt medical assessment. Symptoms, examination and investigations establish the diagnosis; the appendix's position in a reference atlas cannot rule the condition in or out.",
        bullets: [
          'Do not infer source laterality from the usual position of the appendix.',
          'No appendectomy route, vascular clip point or vessel-division instruction is supplied.',
        ],
      },
      references: [
        'https://www.niddk.nih.gov/health-information/digestive-diseases/appendicitis/definition-facts',
        'https://www.niddk.nih.gov/health-information/digestive-diseases/appendicitis/diagnosis',
      ],
    },
    {
      key: 'marginal-colic-artery',
      identities: [
        [
          'FMA14824',
          'midline',
          'isa',
          ['FJ2025'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
      ],
      scope:
        'One source-midline marginal artery, not a demonstrated continuous arcade or the more medial arcade of Riolan. No missing links are reconstructed.',
      pathology: {
        body: 'The marginal arterial pathway provides connections between colic territories. Its presence as a labelled surface does not prove that collateral flow will be sufficient after disease, low-flow states or interruption of another vessel.',
        bullets: [
          'A collateral connection and adequate collateral reserve are different claims.',
          'The atlas does not demonstrate a patent complete circuit.',
        ],
      },
      clinical: {
        body: 'This selection helps explain why an operation or vascular intervention cannot be planned from named arteries alone. Patient-specific assessment must consider actual perfusion and the wider vascular anatomy.',
        bullets: [
          'The rendering cannot simulate temporary clamping or predict anastomotic healing.',
          'No safe ligation point, bowel-survival boundary or collateral flow calculation is supplied.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC7226699/',
        'https://acgcdn.gi.org/wp-content/uploads/2018/04/ACG-Colon-Ischemia-Guideline-Summary.pdf',
      ],
    },
    {
      key: 'left-colic-branches',
      identities: [
        [
          'FMA14826',
          'left',
          'isa',
          ['FJ3494'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
        [
          'FMA14828',
          'left',
          'isa',
          ['FJ3399'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
        [
          'FMA14829',
          'left',
          'isa',
          ['FJ3428'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
      ],
      scope:
        'Left colic artery and its ascending/descending branch selections retain three exact left-sided identities. No watershed territory is newly segmented or clinically measured.',
      pathology: {
        body: 'Left-colonic ischaemia can occur when tissue perfusion falls, including without a demonstrable large-vessel blockage. The main left colic artery and its named branches are not interchangeable labels for the same source segment.',
        bullets: [
          'Abdominal pain and rectal bleeding are not specific to a single arterial lesion.',
          'A drawn branch boundary is not a patient-specific watershed zone.',
        ],
      },
      clinical: {
        body: 'Clinical examination and investigations distinguish colonic ischaemia from other causes of pain and bleeding. A reference branch can orient the discussion, but it cannot establish disease severity or viability.',
        bullets: [
          'The ascending and descending names must not be swapped during selection.',
          'No left-colon resection extent, guaranteed marginal connection or treatment algorithm is supplied.',
        ],
      },
      references: [
        'https://acgcdn.gi.org/wp-content/uploads/2018/04/ACG-Colon-Ischemia-Guideline-Summary.pdf',
      ],
    },
    {
      key: 'pancreaticoduodenal-arteries',
      identities: [
        [
          'FMA14782',
          'unspecified',
          'isa',
          ['FJ3409'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
        [
          'FMA14784',
          'unspecified',
          'isa',
          ['FJ3557'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
        [
          'FMA14805',
          'unspecified',
          'isa',
          ['FJ3446'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
        [
          'FMA70479',
          'unspecified',
          'isa',
          ['FJ3401'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
        [
          'FMA70480',
          'unspecified',
          'isa',
          ['FJ3546'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
      ],
      scope:
        'Five independent superior/inferior and anterior/posterior arterial selections. No fully connected arcade, validated celiac–SMA communication or demonstrated retrograde flow.',
      pathology: {
        body: 'Pancreaticoduodenal arterial aneurysms and pseudoaneurysms are distinct lesions. Inflammation and altered collateral haemodynamics are clinically relevant contexts, but source proximity or a near-contact cannot identify a lesion.',
        bullets: [
          'The inferior trunk and its anterior/posterior branches are not the same selection.',
          'No measured wall disruption or aneurysm size is represented.',
        ],
      },
      clinical: {
        body: 'Assessment of a suspected lesion considers the surrounding celiac and mesenteric circulation as well as the lesion itself. Unexpected severe pain or signs of major bleeding need urgent assessment.',
        bullets: [
          'A static loop-like appearance does not certify safe collateral supply.',
          'No embolisation route, vessel-sacrifice plan, coil sizing or pancreatic perfusion estimate is supplied.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC10770226/',
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC6487818/',
      ],
    },
    {
      key: 'gastroduodenal-artery',
      identities: [
        [
          'FMA76574',
          'unspecified',
          'isa',
          ['FJ3432'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
      ],
      scope:
        'One unspecified-side gastroduodenal trunk, not every pancreaticoduodenal/gastro-omental branch. No duodenal wall, ulcer, collateral back-flow or leak is simulated.',
      pathology: {
        body: 'Gastroduodenal arterial branches are important in some bleeding peptic ulcers. Published clinical series describe embolisation after unsuccessful endoscopic control; that treatment context is not proof that every ulcer bleeds from this trunk.',
        bullets: [
          'Arterial peptic-ulcer bleeding and portal-hypertensive variceal bleeding differ.',
          'A normal source surface cannot exclude bleeding nearby.',
        ],
      },
      clinical: {
        body: 'Vomiting blood requires medical help; associated faintness, confusion, clammy skin, abdominal pain or black stools needs emergency assessment. Clinical investigation must locate and characterise the bleed.',
        bullets: [
          'An intervention study does not validate this atlas as a targeting tool.',
          'No endoscopic clip position, catheter path, embolic choice or ulcer-treatment regimen is supplied.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC9235422/',
        'https://www.nhs.uk/symptoms/vomiting-blood/',
      ],
    },
    {
      key: 'pancreatic-body-tail-arteries',
      identities: [
        [
          'FMA14787',
          'unspecified',
          'isa',
          ['FJ3430'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
        [
          'FMA14790',
          'unspecified',
          'isa',
          ['FJ3444'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
        [
          'FMA14792',
          'unspecified',
          'isa',
          ['FJ3433'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
        [
          'FMA14793',
          'unspecified',
          'isa',
          ['FJ3419'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
      ],
      scope:
        'Dorsal, inferior, great and caudal pancreatic arterial sources remain distinct and unspecified-side. Great/caudal near-contact is unchanged, not converted into a proven anastomosis.',
      pathology: {
        body: 'Pancreatitis can damage nearby arterial walls and produce a pseudoaneurysm with potential bleeding. This is a regional clinical association; it does not establish that each named pancreatic branch has the same risk or is affected in a particular patient.',
        bullets: [
          'A pseudoaneurysm is not a pancreatic cyst or a normal arterial bend.',
          'The four source labels do not establish separate perfusion territories.',
        ],
      },
      clinical: {
        body: 'New bleeding or marked deterioration during pancreatitis requires clinical assessment. Appropriate investigation distinguishes vascular complications from other causes; the atlas cannot identify the responsible branch.',
        bullets: [
          "No individual branch's incidence or prognosis is inferred from a regional clinical series.",
          'No pancreatic resection plane, embolisation target or validated collateral circuit is supplied.',
        ],
      },
      references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC6487818/'],
    },
    {
      key: 'pancreaticoduodenal-vein',
      identities: [
        [
          'FMA15398',
          'unspecified',
          'isa',
          ['FJ3545', 'FJ3646', 'FJ3655'],
          'abdomen',
          ['abdomen'],
          'vessel',
        ],
      ],
      scope:
        'One unspecified-side source identity groups three ordered venous components. No invented tributary names, complete portal connection or clot segmentation.',
      pathology: {
        body: 'Pancreatitis can be associated with splanchnic venous thrombosis. This regional association does not prove a clot in the particular pancreaticoduodenal vein selection or make venous obstruction equivalent to an arterial pseudoaneurysm.',
        bullets: [
          'The cited cohort concerns splanchnic thrombosis, not a validation of these three components.',
          'No inflammatory spread or patient-specific venous extension is shown.',
        ],
      },
      clinical: {
        body: 'Vascular concerns during pancreatitis require clinical imaging of the relevant venous system and surrounding organs. This source group is useful for orientation, not for identifying an obstructed tributary or selecting treatment.',
        bullets: [
          'Component count is not tributary count or a measured thrombosis extent.',
          'No anticoagulant decision, venous intervention or guaranteed drainage route is supplied.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC13182131/',
        'https://www.aasld.org/practice-guidelines/vascular-liver-disorders',
      ],
    },
  ];
const byFma = new Map(
  abdominalVesselClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function abdominalVesselClinicalLesson(
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
