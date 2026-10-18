// Original teaching synthesis, not publisher prose, figures, scans or protocols.
import type {
  SpecimenClinicalLesson,
  SpecimenTopicDraft,
} from './um-limb-clinical';

export const backLayersClinicalReferences = {
  latissimus: {
    title: 'Pardiwala et al. · Latissimus injury (case report)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7205911/',
  },
  field: {
    title:
      'Isolated teres major rupture · Dedicated MRI coverage (case report)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4861626/',
  },
  rhomboid: {
    title: 'Furuhata et al. · Rhomboid major tear (case report)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10729626/',
  },
  dorsalScapular: {
    title: 'Dorsal scapular entrapment neuropathy · Ultrasound case report',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8008197/',
  },
  accessory: {
    title:
      'Li et al. · MRI findings in spinal accessory neuropathy (12 patients)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/26787069/',
  },
  multifidusFactors: {
    title:
      'Ballatori et al. · Multifidus fat and patient-specific factors (cohort)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36601370/',
  },
  paraspinal: {
    title:
      'Khil et al. · CT/MRI of paraspinal muscles in asymptomatic volunteers',
    url: 'https://link.springer.com/article/10.1186/s12891-020-03432-w',
  },
  multifidusUS: {
    title: 'Rummens et al. · Multifidus ultrasound/MRI volume comparison',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10941570/',
  },
  minor: {
    title: 'Loyola · Rhomboid minor anatomy',
    url: 'https://www.meddean.luc.edu/lumen/meded/grossanatomy/dissector/muscles/rhmn.htm',
  },
  mskMRI: {
    title: 'RSNA/ACR · Musculoskeletal MRI and radiograph limits',
    url: 'https://www.radiologyinfo.org/en/info/muscmr',
  },
  mskUltrasound: {
    title: 'RSNA/ACR · Musculoskeletal ultrasound and depth limits',
    url: 'https://www.radiologyinfo.org/en/info/musculous',
  },
  accessoryUS: {
    title: 'Spinal accessory nerve ultrasound · Original case report',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7603778/',
  },
} as const;
type Ref = keyof typeof backLayersClinicalReferences;
const references = (...keys: Ref[]) =>
  keys.map((key) => backLayersClinicalReferences[key].url);
const draft = (body: string, ...keys: Ref[]): SpecimenTopicDraft => ({
  readiness: 'draft',
  body,
  references: references(...keys),
});
const selfCheck = (question: string, answer: string, ...keys: Ref[]) => ({
  question,
  answer,
  references: references(...keys),
});

export const backLayersClinical: Record<string, SpecimenClinicalLesson> = {
  latissimus: {
    modelLimit:
      'This whole surface has no separately validated tendon, tear margin or retraction measurement. Teres major is absent from this specimen. Explode changes display position, not tendon integrity.',
    topics: {
      clinical: draft(
        'A reported latissimus tendon avulsion produced posterior axillary pain, contour change and weakness with resisted adduction. These findings illustrate a possible injury pattern, not a diagnostic test or a prediction from this normal-source surface.',
        'latissimus',
      ),
      pathology: draft(
        'Distinguish a tendon avulsion at the humerus from a myotendinous injury. A published isolated avulsion spared teres major; neighbouring muscles must not be assumed injured together. No pathological mesh or treatment recommendation is supplied.',
        'latissimus',
      ),
      ct: draft(
        'If CT already covers the posterior axilla, orient the humeral attachment and look for gross asymmetry or a collection, while recognising that CT does not define a small tendon discontinuity as reliably as dedicated soft-tissue imaging. The published avulsion is case evidence, not a CT performance standard.',
        'latissimus', 'mskMRI',
      ),
      mri: draft(
        'Check that the examination covers the posterior axillary muscle–tendon unit and humeral attachment; a routine shoulder field can omit relevant tissue. Follow continuity and any fluid-signal gap or retraction on acquired images. The atlas cannot measure these findings.',
        'field',
        'latissimus',
      ),
      xray: draft(
        'Radiographs show the adjacent humerus and shoulder girdle, not the full latissimus tendon course or a subtle myotendinous tear. A normal bone image cannot exclude the reported posterior axillary soft-tissue injury; assess that question on appropriately covered acquired soft-tissue imaging.',
        'latissimus', 'mskMRI',
      ),
      ultrasound: draft(
        'In one reported avulsion, dynamic ultrasound confirmed the detached latissimus tendon beside a haematoma. This is case evidence, not a validated sensitivity estimate or scanning protocol. Atlas rotation and separation do not reproduce a dynamic examination.',
        'latissimus',
      ),
    },
    selfCheck: selfCheck(
      'A shoulder MRI is reported normal, but the painful posterior axillary muscle–tendon unit was outside its field. Has a latissimus injury been excluded?',
      'No. Normal findings in the acquired field do not assess omitted tissue. Check coverage of the relevant muscle–tendon unit and humeral attachment; the atlas cannot resolve the missing patient evidence.',
      'field',
    ),
  },
  multifidus: {
    modelLimit:
      'The source groups span many levels and contain disconnected fragments. They are not separately mapped fascicles, measurement regions or a normal size/fat standard. Nerves, discs and complete fascial boundaries are absent.',
    topics: {
      clinical: draft(
        'Multifidus morphology is studied in low-back pain, but an association is not proof of the pain generator. A cohort found that age, sex and body habitus affect fat comparisons; interpret a patient in context rather than comparing them with this single atlas donor.',
        'multifidusFactors',
      ),
      pathology: draft(
        'Fat infiltration and reduced muscle bulk are different observations. Fat may occupy part of an apparently preserved outline, so total size is not equivalent to contractile tissue. Neither appearance alone establishes denervation or a cause of pain.',
        'paraspinal',
        'multifidusFactors',
      ),
      ct: draft(
        'On an already indicated CT, paraspinal area and attenuation can be assessed with explicitly defined levels and boundaries. Attenuation in Hounsfield units is not an MRI fat fraction. Published whole-paraspinal regions must not be relabelled as isolated multifidus measurements.',
        'paraspinal',
      ),
      mri: draft(
        'Separate anatomical outline from composition: water–fat MRI and conventional images answer different questions. Record the level and region being measured; total paraspinal results cannot automatically be assigned to multifidus alone. This surface contains no MR signal or fat map.',
        'paraspinal',
        'multifidusFactors',
      ),
      xray: draft(
        'A spine radiograph can orient vertebral levels and show bone alignment, but it cannot quantify multifidus area, composition or fatty infiltration. Do not infer preserved muscle from normal radiographic bone landmarks or treat these disconnected source fragments as a measured muscle region.',
        'paraspinal', 'mskMRI',
      ),
      ultrasound: draft(
        'Ultrasound studies can delineate lumbar multifidus, but its lateral boundary may be difficult to reproduce. Probe coverage, processing and prone-versus-supine positioning affect comparison with MRI. An atlas volume is not interchangeable with either acquired measurement.',
        'multifidusUS',
      ),
    },
    selfCheck: selfCheck(
      'A paraspinal muscle has preserved total cross-sectional area. Does that establish preserved contractile tissue or explain low-back pain?',
      'No. Fat can occupy part of the outline. Size, composition and symptoms are different observations; the measured region, acquisition and patient factors must be considered separately.',
      'paraspinal',
      'multifidusFactors',
    ),
  },
  rhomboidMajor: {
    modelLimit:
      'The scapular attachment is not a validated tendon footprint. There is no tear, nerve route or animated scapulothoracic motion. The selected source must not substitute for rhomboid minor.',
    topics: {
      clinical: draft(
        'A reported rhomboid major tear presented with medial scapular pain and altered scapular position. This combination is a clinical clue, not a unique diagnosis; the atlas cannot test recruitment or demonstrate a patient-specific cause of winging.',
        'rhomboid',
      ),
      pathology: draft(
        'The reported injury detached rhomboid major at its scapular insertion with retraction. Keep that structural failure distinct from weakness without demonstrated disruption. A separation gap made by the viewer is not a tear.',
        'rhomboid',
      ),
      ct: draft(
        'An acquired CT can locate the medial scapular border and reveal gross adjacent bone or muscle asymmetry, but a subtle rhomboid major insertional defect is better assessed with covered soft-tissue imaging. The cited detachment was demonstrated by MRI; no CT diagnostic accuracy follows from that case.',
        'rhomboid', 'mskMRI',
      ),
      mri: draft(
        'A periscapular MRI case demonstrated insertional disruption and surrounding fluid on a fluid-sensitive sequence. Ensure the medial scapular attachment is actually covered. One case does not establish a universal MRI protocol or diagnostic performance.',
        'rhomboid',
      ),
      xray: draft(
        'Radiographs can show scapular position and bone injury but do not directly show the rhomboid major insertional tear described in the case. Apparent scapular asymmetry is nonspecific; correlate with examination and appropriately covered soft-tissue images rather than treating the atlas surface as proof.',
        'rhomboid', 'mskMRI',
      ),
      ultrasound: draft(
        'Probe-accessible tissue near the medial scapular border may be compared dynamically with the opposite side, but bone shadowing and depth can limit the attachment view. The published major tear was shown with MRI, not a validated rhomboid ultrasound protocol or sensitivity estimate.',
        'rhomboid', 'mskUltrasound',
      ),
    },
    selfCheck: selfCheck(
      'For suspected rhomboid major detachment, which attachment and imaging features are illustrated by the cited case?',
      'The medial scapular insertion, with loss of continuity, retraction and surrounding fluid. These case findings require actual acquired images; the artificial gap made by separation is not equivalent.',
      'rhomboid',
    ),
  },
  rhomboidMinor: {
    modelLimit:
      'The smaller, superior rhomboid is a separate source selection, not the superior edge of a diagnosed major tear. Its attachment footprint, nerve and pathological changes are not reconstructed.',
    topics: {
      clinical: draft(
        'Rhomboid minor shares dorsal scapular motor supply with major. Medial scapular symptoms can have a neural cause, but the cited neuropathy case assessed the nerve near major and does not prove an isolated minor lesion. Do not infer nerve integrity from this muscle mesh.',
        'minor',
        'dorsalScapular',
      ),
      pathology: draft(
        'Weakness of the smaller superior rhomboid could accompany a dorsal scapular nerve disorder, yet the cited entrapment case localised findings near major and did not establish a minor tear. Keep neural dysfunction, muscle atrophy and a structural insertional lesion separate until actual patient evidence identifies one.',
        'minor', 'dorsalScapular',
      ),
      ct: draft(
        'If CT includes the upper medial scapula, use its bony landmarks to distinguish the minor attachment region from major below. Gross muscle asymmetry may be visible, but CT alone does not establish an isolated minor tear or nerve lesion; neither is present in this source selection.',
        'minor', 'mskMRI',
      ),
      mri: draft(
        'Use its attachment near the scapular spine to distinguish minor from the more inferior major when orienting acquired images. The linked tear case concerns major, not minor. This is an anatomical localisation aid, not validated MRI lesion teaching for minor.',
        'minor',
        'rhomboid',
      ),
      xray: draft(
        'A scapular radiograph can orient the spine and medial border, but it does not display rhomboid minor fibres or prove a tear. Do not transfer the published major insertional injury to this separate superior muscle from a normal or abnormal bone view.',
        'minor', 'rhomboid', 'mskMRI',
      ),
      ultrasound: draft(
        'A probe may access superficial tissue by the root of the scapular spine, while scapular bone shadow and the small muscle extent constrain the view. The cited dorsal scapular ultrasound case assessed the nerve near major; it does not validate an isolated minor tear or a complete minor survey.',
        'minor', 'dorsalScapular', 'mskUltrasound',
      ),
    },
    selfCheck: selfCheck(
      'Which scapular landmark helps distinguish rhomboid minor from the larger inferior rhomboid on an acquired examination?',
      'The root of the scapular spine marks the minor attachment region. Major attaches further below; a reported major tear must not be reassigned to minor without matching patient evidence.',
      'minor',
      'rhomboid',
    ),
  },
  trapezius: {
    modelLimit:
      'Three source parts are display subdivisions, not separately tested motor territories. The spinal accessory nerve and patient denervation are not supplied; visible part boundaries are not nerve-branch borders.',
    topics: {
      clinical: draft(
        'Spinal accessory neuropathy is relevant to trapezius dysfunction. In the cited MRI series, patients had electromyographic confirmation; imaging appearance was not used alone to establish the diagnosis. A selected trapezius part cannot localise a nerve injury.',
        'accessory',
      ),
      pathology: draft(
        'Reported trapezius denervation appearances include atrophy and increased T2/STIR signal. These are observations to interpret with the clinical setting, not proof that every bright or small trapezius is denervated. The atlas shows no disease state.',
        'accessory',
      ),
      ct: draft(
        'A CT acquired for another indication may show side-to-side trapezius bulk asymmetry and adjacent shoulder-girdle bones, but muscle size alone is nonspecific for spinal accessory neuropathy. Source-part boundaries are display divisions, not CT-defined nerve territories or a diagnosis.',
        'accessory', 'mskMRI',
      ),
      mri: draft(
        'Review trapezius bulk and fluid-sensitive signal, and consider the relevant nerve course and surgical history in acquired images. The small cited series also described postoperative scarring near the nerve. None of these findings can be read from the surface model.',
        'accessory',
      ),
      xray: draft(
        'Radiographs can show the clavicle and scapula, including gross alignment, but cannot directly depict trapezius denervation or the spinal accessory nerve. Shoulder position is an indirect and nonspecific clue; it cannot assign a lesion to any one of the three displayed source parts.',
        'accessory', 'mskMRI',
      ),
      ultrasound: draft(
        'In an original iatrogenic palsy case, ultrasound assessed an accessible spinal accessory nerve segment while MRI showed trapezius atrophy. Probe access varies along the nerve course and deeper tissue may be limited; a normal accessible segment does not clear the entire nerve or diagnose a source part.',
        'accessoryUS', 'mskUltrasound',
      ),
    },
    selfCheck: selfCheck(
      'Trapezius is small and has increased fluid-sensitive MR signal. Is that alone sufficient to diagnose spinal accessory neuropathy?',
      'No. Those appearances occurred in an EMG-confirmed series, but image appearance alone is not the reference diagnosis. Consider the clinical setting and relevant nerve assessment; source-part boundaries do not localise the lesion.',
      'accessory',
    ),
  },
};
