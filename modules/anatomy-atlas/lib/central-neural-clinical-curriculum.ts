import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

type CentralNeuralClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
  category: 'organ' | 'space',
];
interface CentralNeuralClinicalGroup {
  key: string;
  identities: readonly CentralNeuralClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
/** Short original drafts; exact source identities, not inferred mirror copies. */
export const centralNeuralClinicalGroups: readonly CentralNeuralClinicalGroup[] =
  [
    {
      key: 'brain',
      identities: [
        [
          'FMA50801',
          'midline',
          'partof',
          [
            'FJ1730',
            'FJ1731',
            'FJ1732',
            'FJ1733',
            'FJ1738',
            'FJ1739',
            'FJ1740',
            'FJ1743',
            'FJ1744',
            'FJ1745',
            'FJ1746',
            'FJ1747',
            'FJ1748',
            'FJ1749',
            'FJ1750',
            'FJ1751',
            'FJ1758',
            'FJ1759',
            'FJ1760',
            'FJ1762',
            'FJ1767',
            'FJ1769',
            'FJ1770',
            'FJ1775',
            'FJ1779',
            'FJ1780',
            'FJ1781',
            'FJ1783',
            'FJ1784',
            'FJ1785',
            'FJ1786',
            'FJ1787',
            'FJ1788',
            'FJ1789',
            'FJ1790',
            'FJ1791',
            'FJ1792',
            'FJ1795',
            'FJ1797',
            'FJ1798',
            'FJ1800',
            'FJ1801',
            'FJ1806',
            'FJ1807',
            'FJ1808',
            'FJ1810',
            'FJ1814',
            'FJ1817',
            'FJ1822',
            'FJ1826',
            'FJ1828',
            'FJ1830',
            'FJ1831',
            'FJ1833',
            'FJ1834',
            'FJ1835',
            'FJ1836',
            'FJ1841',
            'FJ1842',
          ],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
      ],
      scope:
        'This is a 59-component PART-OF brain selection, not 59 clinically validated regions. It contains no patient lesion, vascular territory, perfusion measurement or registered scan.',
      pathology: {
        body: 'Stroke injures brain tissue through interrupted blood supply or bleeding. Symptoms depend on the affected pathways, so the outer shape of the brain cannot establish either mechanism.',
        bullets: [
          'A reference surface does not show an acute infarct, haemorrhage or viable tissue.',
        ],
      },
      clinical: {
        body: 'Sudden facial weakness, arm weakness or speech difficulty are familiar stroke warnings; sudden visual, balance or other neurological symptoms also matter.',
        bullets: [
          'In the UK, call 999 for suspected stroke, including recent symptoms that have resolved. Do not use this atlas or an apparently normal face/arm/speech pattern to rule stroke out.',
        ],
      },
      references: [
        'https://www.nhs.uk/conditions/stroke/causes/',
        'https://www.nhs.uk/conditions/stroke/symptoms/',
      ],
    },
    {
      key: 'central-canal',
      identities: [
        ['FMA78497', 'midline', 'isa', ['FJ1737'], 'spine', ['spine'], 'space'],
      ],
      scope:
        'Central canal space only, not the surrounding cord, sensory crossing fibres or spinal nerves. The rendered lumen does not prove normal adult patency.',
      pathology: {
        body: 'Syringomyelia is a fluid-filled cavity within spinal-cord tissue, which can injure surrounding neural pathways. It must not be diagnosed simply because a central-canal surface is visible.',
        bullets: [
          'Chiari malformation, trauma and other cord/CSF-flow disorders are relevant contexts; one mechanism does not explain every syrinx.',
        ],
      },
      clinical: {
        body: 'Relate possible weakness, sensory disturbance and pain to actual cord involvement, not to a simulated expansion of this canal.',
        bullets: [
          "Clinical assessment and appropriate MRI establish the cavity's extent and associated abnormalities. Neither a syrinx nor a complete cord is reconstructed here.",
        ],
      },
      references: [
        'https://www.ninds.nih.gov/health-information/disorders/syringomyelia',
        'https://neurosurgery.weillcornell.org/condition/syringomyelia/symptoms-syringomyelia',
      ],
    },
    {
      key: 'caudate',
      identities: [
        [
          'FMA72826',
          'right',
          'isa',
          ['FJ1802'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
        [
          'FMA72827',
          'left',
          'isa',
          ['FJ1754'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
      ],
      scope:
        'Each caudate keeps its source side. Microscopic striatal compartments, neuronal loss and longitudinal volume measurements are absent.',
      pathology: {
        body: 'Caudate and putaminal degeneration are characteristic features of Huntington disease, but it affects distributed brain systems rather than this nucleus alone.',
        bullets: [
          'A small-looking atlas surface cannot diagnose Huntington disease or establish an inherited variant.',
        ],
      },
      clinical: {
        body: "Use the caudate's position beside the lateral ventricle to orient yourself before studying real images of striatal atrophy.",
        bullets: [
          'Huntington disease assessment combines clinical findings with appropriate genetic evaluation and counselling; no predictive testing or individual-risk estimate is offered.',
        ],
      },
      references: ['https://www.ncbi.nlm.nih.gov/books/NBK1305/'],
    },
    {
      key: 'putamen',
      identities: [
        [
          'FMA72828',
          'right',
          'isa',
          ['FJ1823'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
        [
          'FMA72829',
          'left',
          'isa',
          ['FJ1776'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
      ],
      scope:
        'The putamen is distinct from the neighbouring pallidum. Dopaminergic terminals, receptor activity and motor loops are not visible in this mesh.',
      pathology: {
        body: 'Parkinson disease involves loss of dopamine-producing neurons in the substantia nigra, disrupting basal-ganglia function; it is not simply destruction of the putamen.',
        bullets: [
          'The same motor symptom can occur in different disorders. A normal-shaped putamen does not exclude Parkinson disease.',
        ],
      },
      clinical: {
        body: 'Distinguish a striatal target in a motor circuit from the neurons providing its dopaminergic input.',
        bullets: [
          'The atlas cannot measure dopamine, grade parkinsonism or select a medication or stimulation target.',
        ],
      },
      references: [
        'https://www.ninds.nih.gov/current-research/focus-disorders/parkinsons-disease-research/parkinsons-disease-challenges-progress-and-promise',
        'https://www.ncbi.nlm.nih.gov/books/NBK10988/',
      ],
    },
    {
      key: 'pallidum',
      identities: [
        [
          'FMA72830',
          'right',
          'isa',
          ['FJ1805'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
        [
          'FMA72831',
          'left',
          'isa',
          ['FJ1757'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
      ],
      scope:
        'Internal and external pallidal segments are not separated. Neither injury nor an electrode target is reconstructed.',
      pathology: {
        body: 'Carbon-monoxide poisoning can produce bilateral pallidal injury, often with abnormalities elsewhere in the brain. Bilateral pallidal abnormalities also have other causes.',
        bullets: [
          'Do not treat this association as a specific diagnosis from colour, symmetry or surface shape.',
        ],
      },
      clinical: {
        body: 'Interpret a pallidal finding alongside exposure history, neurological examination and actual imaging; systemic poisoning cannot be reduced to one structure.',
        bullets: [
          'Carbon-monoxide symptoms may be nonspecific and delayed neurological complications can occur. This model provides no exposure test, prognosis or treatment protocol.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC4294088/',
        'https://www.cdc.gov/carbon-monoxide/hcp/clinical-guidance/index.html',
      ],
    },
    {
      key: 'amygdala',
      identities: [
        [
          'FMA72832',
          'right',
          'isa',
          ['FJ1829'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
        [
          'FMA72833',
          'left',
          'isa',
          ['FJ1753'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
      ],
      scope:
        'The whole source-labelled amygdala is selected, not its nuclei or an epileptogenic zone. No electrical activity, EEG or connectivity is simulated.',
      pathology: {
        body: 'Some focal emotional seizures with fear or anxiety arise in mesial temporal networks that include the amygdala.',
        bullets: [
          'Fear alone does not diagnose epilepsy. Panic attacks and other experiences need distinction through clinical context.',
        ],
      },
      clinical: {
        body: 'Consider the sequence and stereotyped nature of an event, associated awareness change and wider temporal-lobe findings rather than assigning an emotion to one highlighted nucleus.',
        bullets: [
          'This is network-oriented teaching, not a seizure classifier, psychiatric diagnosis or surgical-localization tool.',
        ],
      },
      references: [
        'https://www.epilepsydiagnosis.org/seizure/emotional-overview.html',
      ],
    },
    {
      key: 'thalamus',
      identities: [
        [
          'FMA258714',
          'right',
          'isa',
          ['FJ1827'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
        [
          'FMA258716',
          'left',
          'isa',
          ['FJ1782'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
      ],
      scope:
        'Individual thalamic nuclei and their arterial territories are not segmented. The selected side is not a complete symptom or sensory map.',
      pathology: {
        body: 'Thalamic stroke may disturb sensation, cognition or other functions depending on its location. Central post-stroke pain develops in some patients, but is not inevitable.',
        bullets: [
          'A whole-thalamus highlight cannot specify the injured nucleus or distinguish pain from every peripheral cause.',
        ],
      },
      clinical: {
        body: 'Separate a central sensory disturbance from a peripheral nerve problem, while considering associated findings and actual lesion location.',
        bullets: [
          'New stroke-like symptoms require emergency assessment; an isolated or unfamiliar sensory presentation should not be dismissed because it lacks a classic motor deficit.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC8436465/',
        'https://pubmed.ncbi.nlm.nih.gov/22696587/',
        'https://www.nhs.uk/conditions/stroke/symptoms/',
      ],
    },
    {
      key: 'lateral-geniculate',
      identities: [
        [
          'FMA73303',
          'right',
          'isa',
          ['FJ1813'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
        [
          'FMA73304',
          'left',
          'isa',
          ['FJ1766'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
      ],
      scope:
        'The visual thalamic relay is shown without its layers, optic radiations or vascular subterritories. It is not the medial geniculate auditory relay.',
      pathology: {
        body: 'A unilateral lateral-geniculate lesion can produce homonymous visual-field loss; partial lesions may cause more restricted field defects.',
        bullets: [
          'Similar field loss can arise elsewhere behind the optic chiasm. A field pattern alone is not a unique lesion address.',
        ],
      },
      clinical: {
        body: 'Think in terms of the corresponding visual hemifield in both eyes, rather than loss of all vision in the eye on the selected side.',
        bullets: [
          'Formal visual fields and real imaging are needed; the atlas does not perform perimetry or generate a patient field defect.',
        ],
      },
      references: [
        'https://novel.utah.edu/collection-materials/jonathan-trobe/fingertips/Retrochiasmal_Disorders/Lateral_Geniculate_Body_Lesions.html',
      ],
    },
    {
      key: 'medial-geniculate',
      identities: [
        [
          'FMA73309',
          'right',
          'isa',
          ['FJ1816'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
        [
          'FMA73310',
          'left',
          'isa',
          ['FJ1816M'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
      ],
      scope:
        'Auditory thalamic relays only; the cochlea, complete brainstem pathways and auditory cortex are not connected by validated tracts in this view. FJ1816M is the indexed left source file, not an inferred right-to-left copy.',
      pathology: {
        body: 'Published human cases describe hearing difficulty after bilateral medial-geniculate infarction and altered sound perception after a unilateral lesion.',
        bullets: [
          'Rare reports illustrate possible central auditory effects, not the expected outcome of every thalamic lesion.',
        ],
      },
      clinical: {
        body: "Central sound processing is not equivalent to a single ear's peripheral hearing threshold. Do not turn left/right thalamic selection into a one-ear deafness rule.",
        bullets: [
          'Clinical audiology and neurological assessment are needed. This surface is not an audiogram, hearing simulation or proof of preserved auditory pathways.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC5242158/',
        'https://pubmed.ncbi.nlm.nih.gov/9818885/',
      ],
    },
    {
      key: 'fornix',
      identities: [
        [
          'FMA72924',
          'right',
          'isa',
          ['FJ1804'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
        [
          'FMA72925',
          'left',
          'isa',
          ['FJ1756'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
      ],
      scope:
        'These are the right and left fornix surfaces, not the separately held forniceal commissure. Axonal destinations and memory performance are not reconstructed.',
      pathology: {
        body: 'Fornix infarction is a reported cause of acute memory impairment. Both bilateral and small unilateral lesions have been described.',
        bullets: [
          "Case reports cannot predict a particular patient's severity, recovery or laterality of cognitive deficit.",
        ],
      },
      clinical: {
        body: 'Relate the fornix to a distributed memory circuit rather than treating it as a store of individual memories.',
        bullets: [
          'Sudden amnesia requires clinical evaluation; it should not automatically be labelled benign transient global amnesia. This model cannot identify an infarct or perform neuropsychological testing.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC11085788/',
        'https://pubmed.ncbi.nlm.nih.gov/19942341/',
      ],
    },
    {
      key: 'anterior-commissure',
      identities: [
        [
          'FMA61961',
          'midline',
          'isa',
          ['FJ1734'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
      ],
      scope:
        'A separate midline commissural surface, not the corpus callosum or the forniceal commissure. Crossing axons and developmental variants are not reconstructed.',
      pathology: {
        body: 'Anterior-commissure absence has been reported with other brain malformations even when the corpus callosum is present.',
        bullets: [
          'Such reports do not establish the consequences of an isolated absent commissure, or a universal compensatory role.',
        ],
      },
      clinical: {
        body: 'Distinguish neighbouring commissures individually when learning developmental anatomy; one visible commissure does not establish that another is present or normal.',
        bullets: [
          "This source is not a fetal scan, tractography result or forecast of a child's development.",
        ],
      },
      references: ['https://pubmed.ncbi.nlm.nih.gov/11971106/'],
    },
    {
      key: 'posterior-commissure',
      identities: [
        [
          'FMA62072',
          'midline',
          'isa',
          ['FJ1799'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
      ],
      scope:
        'Commissural fibres are distinct from the nucleus of the posterior commissure and nearby midbrain structures. This is not a complete vertical-gaze circuit.',
      pathology: {
        body: 'Dorsal-midbrain disorders can produce impaired upgaze with pupil and eyelid abnormalities. The posterior-commissure region participates in the relevant circuitry.',
        bullets: [
          'A clinical dorsal-midbrain syndrome is not evidence of an isolated lesion confined to this fibre bundle.',
        ],
      },
      clinical: {
        body: 'Compare supranuclear gaze control with a peripheral ocular-motor nerve palsy; multiple interacting structures contribute to the examination pattern.',
        bullets: [
          'No pupil reflex, gaze measurement or automatic Parinaud-syndrome localization is provided.',
        ],
      },
      references: [
        'https://neuro-ophthalmology.stanford.edu/2020/02/neuro-ophthalmology-illustrated-chapter-13-diplopia-11-vertical-eye-movements/',
      ],
    },
    {
      key: 'corpus-callosum',
      identities: [
        [
          'FMA86464',
          'midline',
          'isa',
          ['FJ1742'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
      ],
      scope:
        'Callosal subdivisions and cortical destinations are not independently segmented. Hiding this surface is a dissection action, not a simulation of congenital agenesis.',
      pathology: {
        body: 'Callosal agenesis is a developmental absence of all or part of the corpus callosum. Associated abnormalities and clinical outcomes vary considerably.',
        bullets: [
          'Complete callosal absence does not mean every interhemispheric connection is absent.',
        ],
      },
      clinical: {
        body: 'Distinguish congenital formation of commissural pathways from acquired loss of previously developed tissue.',
        bullets: [
          'The atlas cannot establish a fetal diagnosis, predict cognitive outcome or replace individual developmental assessment.',
        ],
      },
      references: [
        'https://www.nationwidechildrens.org/conditions/agenesis-of-the-corpus-callosum',
        'https://pubmed.ncbi.nlm.nih.gov/2736145/',
      ],
    },
    {
      key: 'choroid-plexus',
      identities: [
        [
          'FMA61934',
          'midline',
          'isa',
          ['FJ1755', 'FJ1803'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
      ],
      scope:
        'The source groups two cerebral choroid-plexus components under one midline identity; they are not separately selectable sides or a complete ventricular system.',
      pathology: {
        body: 'Choroid-plexus tumours include papilloma, atypical papilloma and carcinoma. They may accompany hydrocephalus through altered CSF production or obstruction.',
        bullets: [
          'These tumour types are not interchangeable; surface size or shape cannot establish histological grade.',
        ],
      },
      clinical: {
        body: 'Locate the CSF-producing tissue in its ventricular context before considering a real intraventricular mass and its effects.',
        bullets: [
          'No tumour, ventricular pressure or fluid flow is modelled. Tissue diagnosis and patient imaging cannot be replaced by this reference anatomy.',
        ],
      },
      references: [
        'https://www.cancer.gov/rare-brain-spine-tumor/tumors/choroid-plexus-tumors',
      ],
    },
    {
      key: 'mammillary',
      identities: [
        [
          'FMA74877',
          'midline',
          'isa',
          ['FJ1768', 'FJ1815'],
          'head-neck',
          ['head-neck'],
          'organ',
        ],
      ],
      scope:
        'Two mammillary components are grouped by the source identity, not individually labelled right and left. Memory pathways and MRI signal are not simulated.',
      pathology: {
        body: 'Mammillary-body abnormalities are described in Wernicke encephalopathy, a thiamine-deficiency disorder that can affect several brain regions.',
        bullets: [
          'It is not restricted to people with alcohol-use disorder, and mammillary appearance alone cannot diagnose it.',
        ],
      },
      clinical: {
        body: 'Connect this landmark to wider memory-related circuitry without reducing Wernicke-Korsakoff disorders to a single damaged structure.',
        bullets: [
          'Suspected Wernicke encephalopathy is a medical emergency. This lesson does not provide thiamine dosing, treatment sequencing or a prognosis.',
        ],
      },
      references: [
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC7051709/',
        'https://www.niaaa.nih.gov/publications/brochures-and-fact-sheets/wernicke-korsakoff-syndrome',
      ],
    },
  ];
const byFma = new Map(
  centralNeuralClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function centralNeuralClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if ((tab !== 'pathology' && tab !== 'clinical') || s.system !== 'nerves')
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
