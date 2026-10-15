// Original factual teaching; references are reading links, not imported assets.
const anatomy='https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html';
const wristAngiography='https://pubmed.ncbi.nlm.nih.gov/36980506/';
const recurrentDissections='https://pubmed.ncbi.nlm.nih.gov/2350635/';
const elbowArcades='https://pubmed.ncbi.nlm.nih.gov/9384425/';
const radialVariation='https://pubmed.ncbi.nlm.nih.gov/23440497/';

export const forearmBranchXrayTopics={
  'common-interosseous':{
    title:'Common interosseous origin: contrast X-ray context',
    body:'Distinguish the short common interosseous selection from its anterior daughter and the recurrent elbow branch. The usual common trunk arises from the ulnar artery and divides into anterior and posterior interosseous routes. On an acquired contrast angiogram, assign a branch name only from the demonstrated origin and course, not from a projected crossing.',
    bullets:[
      'Goelz and colleagues studied superselective wrist angiography in 17 patients with Kienbock disease. Their methods included the common interosseous system; this selected distal-wrist study is not a detection-rate study of normal proximal common trunks.',
      'No independent posterior interosseous trunk is supplied in this atlas. Neither its expected origin nor the proximity of two retained surfaces supplies that missing parent/daughter geometry or proves a complete bifurcation.',
    ],
    citations:[anatomy,wristAngiography],
  },
  'anterior-interosseous':{
    title:'Anterior interosseous course: contrast X-ray orientation',
    body:'Use the radius and ulna as gross orientation while keeping the anterior interosseous selection distinct from the short common trunk. Its usual origin is the common interosseous artery. A contrast-filled segment in a wrist projection must not be taken as a depiction of the complete forearm artery.',
    bullets:[
      'The 17-patient superselective wrist study assessed the anterior interosseous artery and its distal radiocarpal contribution. Every participant had Kienbock disease: those observations do not establish routine plain-film visibility or a healthy-population detection rate.',
      'The study does not validate this mesh endpoint, distal connection, calibre or donor flow. Do not transfer its measurements or surgical-planning conclusions to this reference surface.',
    ],
    citations:[anatomy,wristAngiography],
  },
  'recurrent-interosseous':{
    title:'Recurrent interosseous branch: elbow contrast context',
    body:'This is the recurrent elbow branch, usually arising from the posterior interosseous route, not the long anterior interosseous artery. Compare its proximal forearm position with the lateral elbow context before looking at any acquired contrast projection.',
    bullets:[
      'An injection-and-dissection study of 22 adult cadaveric upper extremities included the interosseous recurrent artery in the lateral elbow arcade. That anatomical experiment is not an in-vivo X-ray visibility test or proof of a connected arcade in this source.',
      'The posterior interosseous parent trunk is not separately supplied here. Do not reconstruct it, equate an absent contrast segment with occlusion, or interpret a surface contact as a demonstrated parent junction.',
    ],
    citations:[anatomy,elbowArcades,recurrentDissections],
  },
  'radial-recurrent':{
    title:'Radial recurrent branch: lateral elbow contrast context',
    body:'Keep the radial recurrent selection on the forearm side of the lateral elbow distinct from the radial collateral branch approaching from the arm. The usual radial parent is an orientation fact; anatomical variation means that the actual acquired origin must be checked rather than inferred from the atlas.',
    bullets:[
      'A primary morphological study documented variation in radial recurrent origins and courses. It does not identify the origin or a catheter path in either retained left/right reference surface.',
      'Cadaveric elbow work places the radial recurrent artery in a lateral arterial arcade. Dissection and injected anatomy do not establish that every branch will opacify on an angiogram, or that a visible projected crossing is an anastomosis.',
    ],
    citations:[anatomy,radialVariation,elbowArcades],
  },
  'anterior-ulnar-recurrent':{
    title:'Anterior ulnar recurrent branch: medial elbow contrast context',
    body:'Compare the anterior ulnar recurrent selection with the proximal ulnar context, without substituting the posterior recurrent branch. A shared origin with the posterior branch can occur. An acquired angiographic projection must demonstrate that arrangement; paired source labels cannot establish it.',
    bullets:[
      'The recurrent-flap study dissected anterior and posterior ulnar, radial and interosseous recurrent arteries in 16 cadavers and found differences in their collateral communications. It supplies anatomical context, not normal plain-film detection, a universally complete network or a patient-specific connection.',
      'Keep anterior/posterior branch identity separate from the chosen viewing direction. Rotating or exploding a model changes presentation, not the vessel name or an acquired examination side marker.',
    ],
    citations:[anatomy,recurrentDissections],
  },
  'posterior-ulnar-recurrent':{
    title:'Posterior ulnar recurrent branch: medial elbow contrast context',
    body:'Use the medial elbow as gross orientation for the posterior ulnar recurrent selection, retaining its distinction from the anterior branch. Their possible common ulnar origin is not proof that the two supplied surfaces meet or share a lumen.',
    bullets:[
      'The 22-extremity injected cadaver study included the posterior ulnar recurrent artery in the medial elbow arcade. Its anatomical findings do not establish reliable X-ray depiction, a complete donor arcade or collateral sufficiency.',
      'A contrast segment, if demonstrated, must be followed in its actual projection. The reference surface cannot identify a nerve blood-supply territory, certify perfusion or provide a safe intervention route.',
    ],
    citations:[anatomy,elbowArcades,recurrentDissections],
  },
} as const;
