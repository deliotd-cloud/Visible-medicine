// Original factual teaching. These HTTPS links are reading references only.
const anatomy = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html';
const variation = 'https://pubmed.ncbi.nlm.nih.gov/36168778/';
const axillaryCase = 'https://pubmed.ncbi.nlm.nih.gov/24551680/';
const elbowArcades = 'https://pubmed.ncbi.nlm.nih.gov/9384425/';
const ulnarNerve = 'https://pubmed.ncbi.nlm.nih.gov/10077790/';
const historicalDsa = 'https://pubmed.ncbi.nlm.nih.gov/6421686/';

export const armArterialXrayTopics = {
  axillary: {
    title: 'Axillary artery: contrast X-ray orientation',
    body: 'The usual axillary artery continues from the subclavian lateral to the first rib and becomes brachial distal to teres major. Pectoralis minor marks its conventional three parts. On an acquired contrast study, identify the actual side and projection before naming a segment: a two-dimensional crossing does not establish a branch origin. A 1983 series reported major axillary artery depiction with intravenous DSA; it was a historical acquisition context, not a catheter-arteriography series or a modern visibility promise. This reference surface supplies no injected lumen or acquired shoulder angiogram.',
    bullets: [
      'A single-cadaver report describes an unusual axillary branching pattern. Its variant deep brachial stem must not be substituted for the separately named profunda brachii selection in this atlas.',
      'A separate dissection and CTA variation study describes branching variation; those methods do not establish a normal branch-detection rate for catheter DSA or plain radiography.',
    ],
    citations: [anatomy, axillaryCase, variation, historicalDsa],
  },
  brachial: {
    title: 'Brachial artery: arm-to-elbow contrast context',
    body: 'The usual brachial artery continues from the axillary artery distal to teres major and divides into radial and ulnar terminal branches near the elbow. Its named arm branches include profunda brachii and the superior and inferior ulnar collaterals. A 1983 series reported major brachial artery depiction with intravenous DSA; it does not establish modern protocols or small collateral detectability. Follow an acquired contrast column through its demonstrated origin and course rather than joining atlas surfaces by proximity. Expected branching cannot identify a patient-specific parent vessel, termination or catheter route.',
    bullets: [
      'The dissection and separate CTA observations in the variation study provide anatomical context; they do not measure routine catheter DSA visibility or establish a pooled detection percentage.',
      'The selected arm surface gives no evidence of a patent radial or ulnar continuation, collateral flow, distal perfusion or safe intervention path.',
    ],
    citations: [anatomy, variation, historicalDsa],
  },
  deepBrachial: {
    title: 'Profunda brachii: posterior arm contrast context',
    body: 'The usual profunda brachii, or deep brachial artery, branches from the brachial artery and passes posteriorly around the humerus in the radial groove. Its terminal branches are the radial collateral and middle collateral arteries. The groove is useful gross orientation on an actual arm projection, but a projected vessel crossing or neighbouring mesh cannot prove the exact course or parent junction. Use the acquired contrast examination to establish any visible segment; this labelled surface is a source model, not a lumen trace.',
    bullets: [
      'The rare axillary case report uses a variant deep brachial stem. That one cadaver does not redefine the usual profunda brachii source or either atlas side.',
      'Posterior humeral location alone does not establish radial-nerve geometry, vessel continuity, patency or a patient-specific procedure route.',
    ],
    citations: [anatomy, axillaryCase],
  },
  superiorUlnarCollateral: {
    title: 'Superior ulnar collateral: medial elbow context',
    body: 'The superior ulnar collateral artery is usually a branch of the brachial artery descending toward the medial elbow with the ulnar nerve. A typical anatomical description relates it to the posterior ulnar recurrent artery, but this does not guarantee a direct connection in an individual. An injected cadaveric study of ulnar-nerve supply did not identify that direct anastomosis in most examined arms. A contrast projection would need to demonstrate the actual branch and course; this atlas selection does not establish a nerve-supply territory.',
    bullets: [
      'The nerve-supply study examined injected cadaveric arms, not living angiographic visibility; it reported no identifiable direct superior-to-posterior recurrent connection in 20 of 22 arms.',
      'Clinical importance of that finding was not established. Do not infer nerve perfusion, a complete medial arcade or a safe route from the model.',
    ],
    citations: [anatomy, ulnarNerve],
  },
  inferiorUlnarCollateral: {
    title: 'Inferior ulnar collateral: lower medial arm context',
    body: 'The inferior ulnar collateral artery usually leaves the brachial artery in the lower medial arm. Standard anatomy relates it to the anterior ulnar recurrent artery near the elbow; keep that recurrent forearm branch distinct from the superior ulnar collateral and posterior recurrent pair. The anastomotic description is a typical map, not a demonstrated direct donor connection in either retained surface. On a contrast examination, branch identity depends on the actually shown origin and course, with acquisition side and projection verified separately.',
    bullets: [
      'Injected dissection of 22 cadaveric limbs described elbow arcades; it was not living angiography and does not prove that every donor has a complete opacifying arcade.',
      'A projected meeting point is not proof of a connected lumen, collateral capacity, patency or flow.',
    ],
    citations: [anatomy, elbowArcades],
  },
  radialCollateral: {
    title: 'Radial collateral: lateral elbow context',
    body: 'The radial collateral artery is a usual terminal branch of profunda brachii approaching the lateral elbow from the arm. Keep it distinct from the radial recurrent artery approaching from the forearm. Standard descriptions relate the two within a lateral elbow arterial network, but projected overlap cannot establish an actual junction. On an acquired contrast study, trace the demonstrated origin and branch course in the stated side and projection. This model selection does not provide an angiographic segment or a verified connection to the forearm vessel.',
    bullets: [
      'The elbow arcade report used injection and dissection of 22 cadaveric limbs, not living catheter angiography or a branch visibility experiment.',
      'Do not confuse the radial recurrent partner with the interosseous recurrent branch, which is associated with the middle collateral artery.',
    ],
    citations: [anatomy, elbowArcades],
  },
  middleCollateral: {
    title: 'Middle collateral: posterior elbow context',
    body: 'The middle collateral artery is a usual terminal branch of profunda brachii approaching the posterior elbow. Standard anatomical descriptions relate it to the interosseous recurrent artery from the forearm, which is separate from the radial recurrent partner of the radial collateral artery. This naming helps orient a labelled source selection, but does not show where two donor surfaces join. For an acquired contrast image, the branch origin, course, side and projection must be established from that examination rather than inferred from model contact.',
    bullets: [
      'An injected 22-limb cadaver study describes posterior elbow arcade anatomy; it cannot establish a complete arcade or routine opacification in a living patient.',
      'No posterior interosseous parent, connected lumen, patency, collateral flow or perfusion can be reconstructed from this selection.',
    ],
    citations: [anatomy, elbowArcades],
  },
} as const;
