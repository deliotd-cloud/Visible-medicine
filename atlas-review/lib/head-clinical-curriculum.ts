import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

type HeadClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
];
interface HeadClinicalGroup {
  key: string;
  identities: readonly HeadClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
/** Short original drafts; exact source identities, not inferred mirror copies. */
export const headClinicalGroups: readonly HeadClinicalGroup[] = [
  {
    key: 'medial-rectus',
    identities: [
      ['FMA49057', 'left', 'isa', ['FJ1308'], 'head-neck', ['head-neck']],
      ['FMA49056', 'right', 'isa', ['FJ1359'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Static reference surface: gaze positions, nerve conduction, tendon restriction and patient findings are not simulated.',
    pathology: {
      body: 'An adduction deficit is not necessarily a medial-rectus injury. Internuclear ophthalmoplegia arises from a central connection between eye-movement nuclei.',
      bullets: [
        'Impaired adduction on horizontal gaze with nystagmus of the other, abducting eye suggests a different localisation from an isolated muscle lesion. Convergence may be preserved.',
      ],
    },
    clinical: {
      body: 'Compare muscle action with the pathway producing coordinated horizontal gaze; this selection cannot establish the cause of double vision.',
      bullets: [
        'Sudden double vision, or double vision with eye pain, needs urgent assessment. In the UK seek urgent GP advice or NHS 111.',
      ],
    },
    references: [
      'https://www.msdmanuals.com/professional/neurologic-disorders/neuro-ophthalmologic-and-cranial-nerve-disorders/internuclear-ophthalmoplegia?ruleredirectid=749',
      'https://www.nhs.uk/symptoms/double-vision/',
    ],
  },
  {
    key: 'lateral-rectus',
    identities: [
      ['FMA49055', 'left', 'isa', ['FJ1304'], 'head-neck', ['head-neck']],
      ['FMA49054', 'right', 'isa', ['FJ1355'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Static reference surface: gaze positions, nerve conduction, tendon restriction and patient findings are not simulated.',
    pathology: {
      body: 'Sixth-nerve weakness can reduce abduction and allow the affected eye to turn inward.',
      bullets: [
        'Horizontal double vision may increase when looking toward the affected side. The appearance does not identify the underlying cause.',
      ],
    },
    clinical: {
      body: 'Relate lateral rectus to cranial nerve VI; an inward deviation is not proof that the muscle itself is torn.',
      bullets: [
        'A new eye-movement deficit requires assessment, not a watch-and-wait recommendation from the atlas. Children may not describe double vision.',
      ],
    },
    references: ['https://www.aapos.org/glossary/sixth-nerve-palsy'],
  },
  {
    key: 'superior-rectus',
    identities: [
      ['FMA49045', 'left', 'isa', ['FJ1323'], 'head-neck', ['head-neck']],
      ['FMA49044', 'right', 'isa', ['FJ1374'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Static reference surface: gaze positions, nerve conduction, tendon restriction and patient findings are not simulated.',
    pathology: {
      body: 'Third-nerve disease can affect several eye muscles and the upper lid together; impaired elevation alone does not localise a superior-rectus lesion.',
      bullets: [
        'A dilated pupil with double vision or blurred vision, or double vision with a severe headache, needs emergency assessment; in the UK call 999 or attend A&E.',
      ],
    },
    clinical: {
      body: 'The superior division of III supplies both superior rectus and levator palpebrae. Compare globe movement with eyelid elevation.',
      bullets: [
        'Pupil size is part of a broader examination: the atlas cannot exclude an aneurysm or declare a pupil-sparing palsy safe.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK519565/',
      'https://www.nanosweb.org/ANISOCORIA/',
      'https://www.nhs.uk/symptoms/double-vision/',
    ],
  },
  {
    key: 'inferior-rectus',
    identities: [
      ['FMA49047', 'left', 'isa', ['FJ1295'], 'head-neck', ['head-neck']],
      ['FMA49046', 'right', 'isa', ['FJ1346'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Static reference surface: gaze positions, nerve conduction, tendon restriction and patient findings are not simulated.',
    pathology: {
      body: 'After an orbital-floor fracture, restricted eye movement may reflect trapped orbital tissue rather than an isolated nerve palsy.',
      bullets: [
        'CT herniation of inferior rectus does not by itself prove clinical entrapment; absence of muscle herniation does not exclude restriction.',
      ],
    },
    clinical: {
      body: 'Keep restriction and weakness separate when relating the floor, inferior rectus and globe.',
      bullets: [
        'Double vision after a head injury needs emergency assessment; in the UK call 999 or attend A&E. Explode separation is not a fracture test.',
      ],
    },
    references: [
      'https://eyewiki.org/Orbital_Floor_Fractures',
      'https://www.nhs.uk/symptoms/double-vision/',
    ],
  },
  {
    key: 'superior-oblique',
    identities: [
      ['FMA49053', 'left', 'isa', ['FJ1322'], 'head-neck', ['head-neck']],
      ['FMA49052', 'right', 'isa', ['FJ1373'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Static reference surface: gaze positions, nerve conduction, tendon restriction and patient findings are not simulated.',
    pathology: {
      body: 'Fourth-nerve weakness may cause vertical misalignment, double vision and a compensatory head tilt.',
      bullets: [
        'A head tilt is not diagnostic on its own. Congenital and acquired causes require different clinical context.',
      ],
    },
    clinical: {
      body: 'Link superior oblique to IV, not III. Its tendon changes direction at the trochlea.',
      bullets: [
        'A nerve palsy and restricted tendon movement are different mechanisms; the source surface does not model either examination.',
      ],
    },
    references: [
      'https://www.aapos.org/glossary/fourth-nerve-palsy',
      'https://www.ncbi.nlm.nih.gov/books/NBK519565/',
    ],
  },
  {
    key: 'inferior-oblique',
    identities: [
      ['FMA49051', 'left', 'isa', ['FJ1294'], 'head-neck', ['head-neck']],
      ['FMA49050', 'right', 'isa', ['FJ1345'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Static reference surface: gaze positions, nerve conduction, tendon restriction and patient findings are not simulated.',
    pathology: {
      body: 'Limited elevation while the eye is adducted can occur in Brown syndrome from superior-oblique tendon restriction; it is not automatically inferior-oblique weakness.',
      bullets: [
        'This is a differential-localisation lesson, not a diagnosis produced by selecting inferior oblique.',
      ],
    },
    clinical: {
      body: 'Compare a muscle that would elevate the adducted eye with an opposing mechanical restriction.',
      bullets: [
        'The atlas does not contain a validated trochlear pulley, forced-duction test or dynamic tendon simulation.',
      ],
    },
    references: ['https://aapos.org/glossary/brown-syndrome'],
  },
  {
    key: 'levator-palpebrae',
    identities: [
      ['FMA49049', 'left', 'isa', ['FJ1306'], 'head-neck', ['head-neck']],
      ['FMA49048', 'right', 'isa', ['FJ1357'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Static reference surface: gaze positions, nerve conduction, tendon restriction and patient findings are not simulated.',
    pathology: {
      body: 'Ptosis can have muscular, neural, neuromuscular-junction or mechanical causes; a drooping lid is not synonymous with levator paralysis.',
      bullets: [
        'Myasthenia, third-nerve palsy and Horner syndrome are distinct possibilities, not interchangeable labels.',
      ],
    },
    clinical: {
      body: 'Levator raises the upper eyelid rather than rotating the globe. Its III supply is distinct from sympathetic eyelid control.',
      bullets: [
        'Painful new Horner features require emergency assessment because carotid dissection is a possible cause. The superior tarsal muscle is not separately validated by this selection.',
      ],
    },
    references: [
      'https://www.aapos.org/glossary/ptosis',
      'https://www.ncbi.nlm.nih.gov/books/NBK519565/',
      'https://www.nanosweb.org/ANISOCORIA/',
    ],
  },
  {
    key: 'digastric',
    identities: [
      [
        'FMA46293',
        'left',
        'isa',
        ['FJ1555', 'FJ1560', 'FJ1578'],
        'head-neck',
        ['head-neck'],
      ],
      [
        'FMA46292',
        'right',
        'isa',
        ['FJ1556', 'FJ1579'],
        'head-neck',
        ['head-neck'],
      ],
    ],
    scope:
      'The left source has three components and the right two; file count is not a count of bellies. A separately validated intermediate tendon is not supplied.',
    pathology: {
      body: 'Pain or swelling below the jaw cannot be assigned to digastric from its location alone.',
      bullets: [
        'The selected mesh cannot distinguish a muscle problem from adjacent dental, glandular or deep-space disease.',
      ],
    },
    clinical: {
      body: 'The anterior and posterior bellies do not share one motor supply: compare V3-mediated anterior function with VII-mediated posterior function.',
      bullets: [
        'Do not use one combined surface to claim an isolated belly palsy or to plan surgery.',
      ],
    },
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK544352/'],
  },
  {
    key: 'mylohyoid',
    identities: [
      ['FMA46322', 'left', 'isa', ['FJ1562'], 'head-neck', ['head-neck']],
      ['FMA46321', 'right', 'isa', ['FJ1583'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Reference muscle only; coordinated swallowing, pressure, nerve injury and operative planes are not simulated.',
    pathology: {
      body: 'Ludwig angina is a potentially dangerous floor-of-mouth infection, not simply mylohyoid inflammation.',
      bullets: [
        'Floor-of-mouth swelling with breathing difficulty is an emergency. No source surface can exclude airway compromise.',
      ],
    },
    clinical: {
      body: 'Mylohyoid helps distinguish the sublingual space above from the submandibular space below; communication around its posterior edge matters for spread.',
      bullets: [
        'A coloured muscle boundary is not a sealed infection barrier or a drainage guide.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK545293/',
      'https://ncbi.nlm.nih.gov/books/NBK482354/',
    ],
  },
  {
    key: 'geniohyoid',
    identities: [
      ['FMA46327', 'left', 'isa', ['FJ1559'], 'head-neck', ['head-neck']],
      ['FMA46326', 'right', 'isa', ['FJ1580'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Reference muscle only; coordinated swallowing, pressure, nerve injury and operative planes are not simulated.',
    pathology: {
      body: 'Reduced hyoid movement during swallowing does not establish isolated geniohyoid weakness.',
      bullets: [
        'Swallowing impairment can involve coordination and multiple structures; this static atlas cannot verify aspiration.',
      ],
    },
    clinical: {
      body: 'Geniohyoid receives C1 fibres travelling with XII. Fibre origin and the nerve carrying them are different concepts.',
      bullets: [
        'Do not label this as a muscle supplied by the hypoglossal nucleus merely because the fibres accompany XII.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK532869/',
      'https://www.asha.org/practice-portal/clinical-topics/adult-dysphagia/',
    ],
  },
  {
    key: 'stylohyoid',
    identities: [
      ['FMA45827', 'left', 'isa', ['FJ1576'], 'head-neck', ['head-neck']],
      ['FMA45826', 'right', 'isa', ['FJ1598'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Reference muscle only; coordinated swallowing, pressure, nerve injury and operative planes are not simulated.',
    pathology: {
      body: 'Eagle syndrome concerns an elongated styloid process or an ossified stylohyoid ligament complex; it is not a synonym for stylohyoid muscle disease.',
      bullets: [
        'Symptoms and patient imaging are needed to judge significance. A normal reference model cannot establish symptomatic compression.',
      ],
    },
    clinical: {
      body: 'Keep muscle, ligament and styloid process separate when exploring the styloid-to-hyoid region.',
      bullets: [
        'Do not measure an explode gap as ligament length or use it to diagnose Eagle syndrome.',
      ],
    },
    references: ['https://ncbi.nlm.nih.gov/books/NBK430789/?report=printable'],
  },
  {
    key: 'omohyoid',
    identities: [
      ['FMA13349', 'left', 'isa', ['FJ1565'], 'head-neck', ['head-neck']],
      ['FMA13348', 'right', 'isa', ['FJ1586'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Each side is one admitted source component; the two bellies and intermediate tendon are not separately validated selections.',
    pathology: {
      body: 'A neck contour or swallowing complaint does not demonstrate an omohyoid lesion.',
      bullets: [
        'This atlas does not model a dynamic neck mass or establish a muscle-specific cause of dysphagia.',
      ],
    },
    clinical: {
      body: 'Use the oblique strap-muscle course as a regional landmark, while keeping the unsegmented tendon and neighbouring structures distinct.',
      bullets: [
        'No procedural corridor or safe surgical margin is implied by isolation.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK538319/',
      'https://www.asha.org/practice-portal/clinical-topics/adult-dysphagia/',
    ],
  },
  {
    key: 'sternohyoid',
    identities: [
      ['FMA13347', 'left', 'isa', ['FJ1574'], 'head-neck', ['head-neck']],
      ['FMA13346', 'right', 'isa', ['FJ1596'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Reference muscle only; coordinated swallowing, pressure, nerve injury and operative planes are not simulated.',
    pathology: {
      body: 'Swallowing symptoms after neck surgery are not proof of an isolated sternohyoid injury.',
      bullets: [
        'Patient history and functional assessment remain necessary; a reference surface cannot identify the symptomatic tissue.',
      ],
    },
    clinical: {
      body: 'Follow this strap to the hyoid and distinguish it from sternothyroid, which ends on laryngeal cartilage.',
      bullets: [
        'Selection and hide controls provide orientation, not a surgical dissection plane.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK547693/',
      'https://www.asha.org/practice-portal/clinical-topics/adult-dysphagia/',
    ],
  },
  {
    key: 'sternothyroid',
    identities: [
      ['FMA13351', 'left', 'isa', ['FJ1575'], 'head-neck', ['head-neck']],
      ['FMA13350', 'right', 'isa', ['FJ1597'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Reference muscle only; coordinated swallowing, pressure, nerve injury and operative planes are not simulated.',
    pathology: {
      body: 'Voice change after neck surgery may involve laryngeal nerve or vocal-fold dysfunction; it cannot be assigned to the overlying strap muscle by location.',
      bullets: [
        'Hoarseness and a muscle surface are insufficient to diagnose vocal-fold paralysis.',
      ],
    },
    clinical: {
      body: 'The name refers to attachment on thyroid cartilage, not insertion into the thyroid gland.',
      bullets: [
        'Keep thyroid gland, cartilage and intrinsic voice muscles conceptually separate.',
      ],
    },
    references: [
      'https://www.nidcd.nih.gov/health/vocal-fold-paralysis',
      'https://www.ncbi.nlm.nih.gov/books/NBK538136/',
    ],
  },
  {
    key: 'thyrohyoid',
    identities: [
      ['FMA13353', 'left', 'isa', ['FJ1577'], 'head-neck', ['head-neck']],
      ['FMA13352', 'right', 'isa', ['FJ1599'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Reference muscle only; coordinated swallowing, pressure, nerve injury and operative planes are not simulated.',
    pathology: {
      body: 'Reduced laryngeal elevation is a functional finding, not evidence of isolated thyrohyoid injury.',
      bullets: [
        'Aspiration cannot be confirmed or excluded by inspecting this model.',
      ],
    },
    clinical: {
      body: 'Like geniohyoid, thyrohyoid receives C1 fibres carried with XII; do not treat it as an ordinary ansa-cervicalis strap branch.',
      bullets: [
        'The effect of contraction depends on which attachment is stabilised; explode motion is not muscle contraction.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK532869/',
      'https://www.asha.org/practice-portal/clinical-topics/adult-dysphagia/',
    ],
  },
  {
    key: 'genioglossus',
    identities: [
      ['FMA46702', 'left', 'isa', ['FJ2738'], 'head-neck', ['head-neck']],
      ['FMA46698', 'right', 'isa', ['FJ2750'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Reference tongue muscle only; denervation, atrophy, fasciculation and tongue movement are not animated.',
    pathology: {
      body: 'A unilateral lower-motor-neuron XII lesion can weaken one side of the tongue; protrusion may deviate toward that weaker side.',
      bullets: [
        'This rule must not be applied indiscriminately to supranuclear lesions or to the resting tongue.',
      ],
    },
    clinical: {
      body: 'Assess the movement pattern and wider neurological findings rather than infer a lesion from a single selected muscle.',
      bullets: [
        'The model cannot determine whether a lesion is nuclear, peripheral or central, or whether asymmetry is pathological.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK532869/',
      'https://pubmed.ncbi.nlm.nih.gov/27429166/',
    ],
  },
  {
    key: 'hyoglossus',
    identities: [
      ['FMA46704', 'left', 'isa', ['FJ2739'], 'head-neck', ['head-neck']],
      ['FMA46703', 'right', 'isa', ['FJ2751'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Only the admitted extrinsic muscle surface is represented; intrinsic tongue layers and diseased nerve territories are not reconstructed.',
    pathology: {
      body: 'Hypoglossal dysfunction can affect several tongue muscles, so dysarthria or dysphagia is not specific for hyoglossus injury.',
      bullets: [
        'Tongue asymmetry needs clinical interpretation; a source mesh is not a patient examination.',
      ],
    },
    clinical: {
      body: 'Compare this extrinsic selection with genioglossus without treating either as the entire tongue.',
      bullets: [
        'A motor-nerve lesson is distinct from sensory loss, taste and a surgical access route.',
      ],
    },
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK532869/'],
  },
  {
    key: 'levator-veli',
    identities: [
      ['FMA46729', 'left', 'isa', ['FJ2741'], 'head-neck', ['head-neck']],
      ['FMA46728', 'right', 'isa', ['FJ2753'], 'head-neck', ['head-neck']],
    ],
    scope:
      'The surface does not reconstruct a cleft, mucosal seal or dynamic velopharyngeal closure.',
    pathology: {
      body: 'Velopharyngeal dysfunction can cause hypernasality; structural differences and impaired motor control are distinct mechanisms.',
      bullets: ['Hypernasality is not proof of an isolated levator lesion.'],
    },
    clinical: {
      body: 'Relate the palatal elevator to a coordinated closure mechanism rather than treat the palate as a simple hinged flap.',
      bullets: [
        'Speech assessment and, when indicated, instrumental evaluation address function that this static model cannot measure.',
      ],
    },
    references: [
      'https://www.asha.org/practice-portal/clinical-topics/resonance-disorders/',
    ],
  },
  {
    key: 'tensor-veli',
    identities: [
      ['FMA46732', 'left', 'isa', ['FJ2748'], 'head-neck', ['head-neck']],
      ['FMA46731', 'right', 'isa', ['FJ2760'], 'head-neck', ['head-neck']],
    ],
    scope:
      'No validated tendon pulley, palatal aponeurosis layers, tube lumen or pressure simulation is supplied.',
    pathology: {
      body: 'Tensor dysfunction can contribute to poor auditory-tube opening, but middle-ear disease has multiple possible mechanisms.',
      bullets: [
        'An effusion is not evidence that this muscle alone is abnormal.',
      ],
    },
    clinical: {
      body: 'Distinguish V3-supplied tensor veli from the vagally supplied palatal muscles; its tendon turns around the pterygoid hamulus.',
      bullets: [
        'This selection cannot demonstrate tube ventilation or prescribe an intervention.',
      ],
    },
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK544302/'],
  },
  {
    key: 'uvular',
    identities: [
      ['FMA46733', 'midline', 'isa', ['FJ2762'], 'head-neck', ['head-neck']],
    ],
    scope:
      'This midline catalog entry is one grouped surface, not separately validated left/right muscle bellies or the complete mucosal uvula.',
    pathology: {
      body: 'Velopharyngeal dysfunction cannot be diagnosed from the shape of this uvular-muscle selection.',
      bullets: [
        'A modelled midline structure does not exclude a cleft or establish normal speech resonance.',
      ],
    },
    clinical: {
      body: 'Distinguish the muscle selection from the visible mucosal uvula and from the whole closure mechanism.',
      bullets: [
        'Clinical assessment must consider the palate and pharyngeal walls together.',
      ],
    },
    references: [
      'https://www.asha.org/practice-portal/clinical-topics/resonance-disorders/',
    ],
  },
  {
    key: 'superior-constrictor',
    identities: [
      ['FMA46632', 'left', 'isa', ['FJ2747'], 'head-neck', ['head-neck']],
      ['FMA46631', 'right', 'isa', ['FJ2759'], 'head-neck', ['head-neck']],
    ],
    scope:
      'The middle constrictors and pharyngeal raphe are withheld; visible upper and lower surfaces do not form a complete validated swallowing tube.',
    pathology: {
      body: 'Poor pharyngeal clearance may involve weakness or incoordination; it is not synonymous with an isolated superior-constrictor lesion.',
      bullets: [
        'A bedside observation or static mesh cannot verify aspiration.',
      ],
    },
    clinical: {
      body: 'Distinguish circular constriction from longitudinal elevation of the pharynx.',
      bullets: [
        'Reference separation does not represent bolus transit, tissue compliance or a measured lumen.',
      ],
    },
    references: [
      'https://www.asha.org/practice-portal/clinical-topics/adult-dysphagia/',
      'https://anatomy.ttuhscep.edu/schemes/larynx_tables.html',
    ],
  },
  {
    key: 'inferior-constrictor',
    identities: [
      ['FMA46636', 'left', 'isa', ['FJ2740'], 'head-neck', ['head-neck']],
      ['FMA46635', 'right', 'isa', ['FJ2752'], 'head-neck', ['head-neck']],
    ],
    scope:
      'The selected surface does not independently segment cricopharyngeus, a diverticulum, sphincter pressure or the Killian region.',
    pathology: {
      body: 'Zenker diverticulum is a mucosa/submucosa pouch through a posterior weak region between thyropharyngeal and cricopharyngeal portions.',
      bullets: [
        'It is not a full-thickness muscle pouch or an explode gap. Dysphagia and regurgitation require patient-specific assessment.',
      ],
    },
    clinical: {
      body: 'Use the inferior constrictor to orient the pharyngoesophageal transition, not to diagnose an upper-esophageal opening disorder.',
      bullets: [
        'The atlas cannot show a pouch filling, retained food or aspiration, and provides no endoscopic treatment route.',
      ],
    },
    references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC3773964/'],
  },
  {
    key: 'stylopharyngeus',
    identities: [
      ['FMA46668', 'left', 'isa', ['FJ2746'], 'head-neck', ['head-neck']],
      ['FMA46667', 'right', 'isa', ['FJ2758'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Reference muscle only; coordinated swallowing, pressure, nerve injury and operative planes are not simulated.',
    pathology: {
      body: 'Swallowing impairment cannot be localised to stylopharyngeus from symptoms alone.',
      bullets: ['A selected muscle does not supply a validated IX lesion map.'],
    },
    clinical: {
      body: 'Stylopharyngeus is the glossopharyngeal (IX) motor exception among the pharyngeal muscles; compare it with the vagally supplied group.',
      bullets: [
        'Its role in elevation differs from that of the constrictors. Do not infer gag-reflex integrity from this selection.',
      ],
    },
    references: [
      'https://anatomy.ttuhscep.edu/schemes/larynx_tables.html',
      'https://www.asha.org/practice-portal/clinical-topics/adult-dysphagia/',
    ],
  },
  {
    key: 'palatopharyngeus',
    identities: [
      ['FMA46672', 'left', 'isa', ['FJ2743'], 'head-neck', ['head-neck']],
      ['FMA46671', 'right', 'isa', ['FJ2755'], 'head-neck', ['head-neck']],
    ],
    scope:
      'No complete mucosal arch, closure seal, swallowing sequence or patient lesion is rendered.',
    pathology: {
      body: 'Abnormal speech resonance and swallowing can arise from coordinated palatal/pharyngeal dysfunction, not just one muscle.',
      bullets: [
        'A surface selection cannot distinguish a structural defect from a motor-control problem.',
      ],
    },
    clinical: {
      body: 'Compare longitudinal elevation with circumferential constriction and with palatal closure.',
      bullets: [
        'The neighbouring muscle surfaces are orientation aids, not a functional assessment.',
      ],
    },
    references: [
      'https://www.asha.org/practice-portal/clinical-topics/resonance-disorders/',
      'https://anatomy.ttuhscep.edu/schemes/larynx_tables.html',
    ],
  },
  {
    key: 'salpingopharyngeus',
    identities: [
      ['FMA46670', 'left', 'isa', ['FJ2745'], 'head-neck', ['head-neck']],
      ['FMA46669', 'right', 'isa', ['FJ2757'], 'head-neck', ['head-neck']],
    ],
    scope:
      'No auditory-tube lumen, salpingopharyngeal mucosal fold or pressure model is supplied.',
    pathology: {
      body: 'A swallowing complaint does not establish a salpingopharyngeus lesion, and its proximity to the auditory tube does not diagnose ear disease.',
      bullets: [
        'Do not transfer tensor-veli tube-opening pathology to this selection as though the muscles were interchangeable.',
      ],
    },
    clinical: {
      body: 'Keep this longitudinal pharyngeal muscle distinct from the nearby tensor and levator of the palate.',
      bullets: [
        'Anatomical proximity is not proof of a shared clinical deficit.',
      ],
    },
    references: [
      'https://anatomy.ttuhscep.edu/schemes/larynx_tables.html',
      'https://www.ncbi.nlm.nih.gov/books/NBK544302/',
    ],
  },
  {
    key: 'posterior-cricoarytenoid',
    identities: [
      ['FMA46578', 'left', 'isa', ['FJ2782'], 'head-neck', ['head-neck']],
      ['FMA46577', 'right', 'isa', ['FJ2800'], 'head-neck', ['head-neck']],
    ],
    scope:
      'No mucosal vibration, glottic seal, nerve lesion, laryngeal electromyography or patient endoscopy is simulated.',
    pathology: {
      body: 'Bilateral vocal-fold paralysis can compromise breathing; it is not simply a more severe version of a hoarse voice.',
      bullets: [
        'Breathing difficulty is an emergency. The atlas cannot assess whether a patient airway is safe.',
      ],
    },
    clinical: {
      body: 'Posterior cricoarytenoid abducts the vocal folds; compare opening with the action of the adductors.',
      bullets: [
        'A stationary reference surface cannot diagnose paralysis or distinguish it from fixation.',
      ],
    },
    references: [
      'https://www.nidcd.nih.gov/health/vocal-fold-paralysis',
      'https://anatomy.ttuhscep.edu/schemes/larynx_tables.html',
    ],
  },
  {
    key: 'laryngeal-adductors',
    identities: [
      ['FMA46581', 'left', 'isa', ['FJ2778'], 'head-neck', ['head-neck']],
      ['FMA46580', 'right', 'isa', ['FJ2796'], 'head-neck', ['head-neck']],
      ['FMA46585', 'left', 'isa', ['FJ2780'], 'head-neck', ['head-neck']],
      ['FMA46584', 'right', 'isa', ['FJ2798'], 'head-neck', ['head-neck']],
      ['FMA46582', 'midline', 'isa', ['FJ2809'], 'head-neck', ['head-neck']],
    ],
    scope:
      'Includes lateral cricoarytenoid, oblique arytenoid and one midline transverse-arytenoid entry. They are distinct selections, not interchangeable muscle labels. No mucosal vibration, glottic seal, nerve lesion, laryngeal electromyography or patient endoscopy is simulated.',
    pathology: {
      body: 'Vocal-fold paralysis can affect voice and swallowing as well as breathing; observed fold position requires clinical interpretation.',
      bullets: ['A weak voice does not identify which adductor is affected.'],
    },
    clinical: {
      body: 'These muscles contribute to adduction, in contrast to posterior-cricoarytenoid opening.',
      bullets: [
        'Recurrent-laryngeal motor supply is a teaching relationship, not a reconstructed nerve-injury map.',
      ],
    },
    references: [
      'https://www.nidcd.nih.gov/health/vocal-fold-paralysis',
      'https://anatomy.ttuhscep.edu/schemes/larynx_tables.html',
    ],
  },
  {
    key: 'thyroarytenoid',
    identities: [
      [
        'FMA46590',
        'left',
        'isa',
        ['FJ2784', 'FJ2785'],
        'head-neck',
        ['head-neck'],
      ],
      [
        'FMA46589',
        'right',
        'isa',
        ['FJ2802', 'FJ2803'],
        'head-neck',
        ['head-neck'],
      ],
    ],
    scope:
      'Two source files on each side do not identify separate vocalis, vocal-fold mucosal layers or validated thyroepiglottic subdivisions. No mucosal vibration, glottic seal, nerve lesion, laryngeal electromyography or patient endoscopy is simulated.',
    pathology: {
      body: 'Nerve injury may impair vocal-fold function, but hoarseness alone is insufficient to diagnose thyroarytenoid paralysis.',
      bullets: [
        'Clinical evaluation can include viewing vocal-fold movement; the rendered surface cannot replace it.',
      ],
    },
    clinical: {
      body: 'Relate this muscle to vocal-fold body mechanics without treating it as the complete layered vocal fold.',
      bullets: [
        'Explode displacement is an illustration setting, not phonation or a test of muscle tension.',
      ],
    },
    references: [
      'https://www.nidcd.nih.gov/health/vocal-fold-paralysis',
      'https://anatomy.ttuhscep.edu/schemes/larynx_tables.html',
    ],
  },
  {
    key: 'vocalis',
    identities: [
      ['FMA46593', 'left', 'isa', ['FJ2788'], 'head-neck', ['head-neck']],
      ['FMA46592', 'right', 'isa', ['FJ2806'], 'head-neck', ['head-neck']],
    ],
    scope:
      'No mucosal vibration, glottic seal, nerve lesion, laryngeal electromyography or patient endoscopy is simulated.',
    pathology: {
      body: 'Voice symptoms do not establish a vocalis lesion or separate muscle disease from a problem of the overlying vocal-fold tissues.',
      bullets: [
        'No nodule, scar or mucosal-wave abnormality is supplied by this normal reference selection.',
      ],
    },
    clinical: {
      body: 'Keep the vocalis muscle distinct from the connective vocal ligament and the mucosal surface.',
      bullets: [
        'The atlas cannot measure pitch, vibration or vocal-fold closure.',
      ],
    },
    references: [
      'https://anatomy.ttuhscep.edu/schemes/larynx_tables.html',
      'https://www.nidcd.nih.gov/health/vocal-fold-paralysis',
    ],
  },
];

const byFma = new Map(
  headClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function headClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'pathology' && tab !== 'clinical') ||
    s.system !== 'muscles' ||
    s.category !== 'muscle'
  )
    return undefined;
  const match = byFma.get(s.fmaId);
  if (!match) return undefined;
  const [, side, tree, files, region, regions] = match.identity;
  if (
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
