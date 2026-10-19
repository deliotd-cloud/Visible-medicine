// Original factual orientation notes; reading references do not license media.
const anatomy = 'https://anatomy.ttuhscep.edu/musculoskeletal_system/thigh_tables.html';
const angiography = 'https://www.radiologyinfo.org/en/info/angiocath';
const iliacDsa = 'https://pubmed.ncbi.nlm.nih.gov/6362766/';
const internalBranches = 'https://pubmed.ncbi.nlm.nih.gov/20798937/';

export const iliacArterialXrayTopics = {
  common: {
    title: 'Common iliac angiographic orientation',
    body: 'Begin with the common iliac segment between the distal aortic division and the internal/external iliac bifurcation. On an acquired contrast angiogram, follow the selected side before separating the pelvic-directed and lower-limb-directed routes.',
    bullets: [
      'The supplied right and left common iliac surfaces are separate selections. Their ends do not prove a complete aortic or iliac bifurcation, and their lengths do not establish patient landmarks.',
      'Digital subtraction angiography has been studied for iliac arterial depiction. The cited historical vascular-disease study is evidence of that imaging use, not a current diagnostic-performance guarantee or a normal reference range.',
    ],
    citations: [anatomy, angiography, iliacDsa],
  },
  external: {
    title: 'External iliac angiographic orientation',
    body: 'Trace the external iliac route along the pelvic brim toward the inguinal ligament, where the artery becomes femoral. This lower-limb route helps distinguish it from the internal iliac branch on a contrast angiogram.',
    bullets: [
      'The selected surface is an external iliac artery, not the adjacent vein. Compare its source side label with the acquired study orientation; screen position alone is not anatomical laterality.',
      'The retained surface does not supply a complete femoral runoff or every branch origin. Its smooth outline cannot establish patency, a safe access site, or the severity of an acquired narrowing.',
    ],
    citations: [anatomy, angiography, iliacDsa],
  },
  internal: {
    title: 'Internal iliac angiographic orientation',
    body: 'Follow the internal iliac route into the pelvis rather than along the external iliac route to the lower limb. Acquired angiography can delineate pelvic arterial branches, but the selected trunk is not a complete branch map.',
    bullets: [
      'The cited imaging study examined branching patterns in men evaluated before pelvic arterial embolization. It supports branching variation and angiographic depiction, not a universal branching arrangement or this donor model’s correspondence to a patient.',
      'Do not name a distal organ feeder, anterior/posterior division, collateral route or treatment target solely from an unlabelled rendered continuation. Those assignments require the actual examination and clinical interpretation.',
    ],
    citations: [angiography, internalBranches],
  },
} as const;
