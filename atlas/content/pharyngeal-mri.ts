// Original educational summaries; citations are evidence, not licensed image assets.
const levator='https://pubmed.ncbi.nlm.nih.gov/11879068/';
const tensor='https://journals.sagepub.com/doi/abs/10.1177/1055665617752802';
const longitudinal='https://pmc.ncbi.nlm.nih.gov/articles/PMC3563921/';
const uvula='https://pmc.ncbi.nlm.nih.gov/articles/PMC6693950/';
const note='Educational draft awaiting revision-bound radiologist review. These published observations do not identify a structure in the open scan or register this reference model to CT/MRI.';

export const pharyngealMriTopics={
  levator:{
    body:'For levator veli palatini orientation, an oblique-coronal view along the muscular sling complements sagittal assessment. A study of ten healthy adults used static spin-echo and dynamic gradient-echo MRI to examine its configuration at rest and during speech.',
    bullets:[
      'Follow the paired muscle toward the velum across adjacent images; a single sagittal section does not show the complete sling.',
      'Muscle length and orientation changed with the speech task. A resting anatomical image and a dynamic speech sequence answer different questions.',
      'The research acquisition does not establish routine brain-MRI visibility, an individual normal measurement or a validated moving Atlas muscle.',
    ],citations:[levator],note,
  },
  tensor:{
    body:'High-resolution 3D MRI has been used to study tensor veli palatini and its surrounding structures. A prospective study compared eight adults without cleft palate with six adults with cleft palate; this supports specialist anatomical assessment, not an assumption that every routine scan depicts the muscle.',
    bullets:[
      'Keep the named tensor selection separate from the levator sling when comparing the reference anatomy with an independently reviewed scan.',
      'The accessible study abstract supports 3D muscle measurement but does not supply a routine sequence prescription or a reliable boundary on the current image.',
      'Do not transfer study-group dimensions, cleft-related findings or an assumed tendon course to this unvalidated reference surface.',
    ],citations:[tensor],note,
  },
  palatopharyngeus:{
    body:'In a muscle-functional MRI study of 11 healthy adults, the proximal palatopharyngeus was followed from the soft palate near the uvula toward the posterolateral pharyngeal wall on axial images.',
    bullets:[
      'Its relation to the palatine tonsil helps orientation. Distal fibres could not be separated reliably from the constrictors, so segmentation stopped before that blend.',
      'Only right-sided muscles were segmented using a dedicated 3-T, 4-mm acquisition. Left-sided Atlas teaching describes the anatomical counterpart, not demonstrated bilateral imaging performance.',
      'Post-task T2 measurements are research observations, not a live swallowing animation or a routine diagnostic threshold.',
    ],citations:[longitudinal],note,
  },
  stylopharyngeus:{
    body:'The same 11-participant muscle-functional MRI study followed proximal stylopharyngeus inferiorly from the medial aspect of the styloid process. Tracing stopped where it became inseparable from the pharyngeal constrictors.',
    bullets:[
      'Use adjacent axial sections to examine the proximal course; a visible upper segment does not establish the full distal boundary.',
      'The study segmented right-sided muscles only. Its results do not verify the left side, individual Atlas boundaries or routine scan visibility.',
      'T2 changes after a task differ from direct observation of contraction. No patient-specific swallowing function is measured by this model.',
    ],citations:[longitudinal],note,
  },
  uvular:{
    body:'A dedicated 3D MRI study examined musculus uvulae in 70 adults without cleft palate and six with repaired cleft palate, using 0.8-mm isotropic images. The muscle was assessed in sagittal and oblique-coronal views, dorsal to the levator sling.',
    bullets:[
      'On the study’s T2-weighted sequence, the muscle was darker than surrounding tissue that helped separate it from the levator. This appearance is sequence-dependent.',
      'The muscle became less distinct posteriorly and ended before the uvular tip. The visible uvula and the segmented muscle are different extents.',
      'The single midline Atlas selection does not establish paired-fibre anatomy, a normal size, cleft diagnosis or visibility on routine brain MRI.',
    ],citations:[uvula],note,
  },
} as const;
