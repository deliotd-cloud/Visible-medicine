// Original factual synthesis. Linked publications are not imported illustrations.
import {acralBoneLessons} from '../lib/acral-bone-curriculum';
export const acralBoneImagingReferences={
  handMRI:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7509702/',
  fingerMRI:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10585074/',
  thumb:'https://pmc.ncbi.nlm.nih.gov/articles/PMC2654954/',
  handCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7735554/',
  footMRI:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7571512/',
  firstMTP:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7337226/',
  plantarPlate:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9000981/',
  lisfranc:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5344858/',
  load:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10666704/',
  stress:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3497949/',
} as const;
type Reference=keyof typeof acralBoneImagingReferences;
type Fact={text:string;references:readonly Reference[]};
export type AcralBoneImagingModality='ct'|'mri';
type Focus=Record<AcralBoneImagingModality,Fact>;
const fact=(text:string,...references:Reference[]):Fact=>({text,references});
export const acralBoneImagingModes:Focus={
  ct:fact('Orient an existing study to the selected ray and check adjacent slices in more than one plane. Surface colour and virtual cut faces do not encode CT attenuation or validated cortical thickness.'),
  mri:fact('Compare anatomical T1-weighted and fluid-sensitive images within the actual coverage. Marrow signal and surrounding soft tissues require separate assessment; this bone surface carries neither MR signal nor a diagnosis.','handMRI','footMRI'),
};
const phalanxCT={
  proximal:fact('Trace the proximal joint surface, shaft and distal condyles separately. Compare both ends with their named joint partners, keeping a marginal fragment distinct from the whole phalanx. Joint alignment on this fixed donor does not establish patient stability.'),
  middle:fact('Follow the base at the PIP joint through the shaft to the head at the DIP joint. Inspect both articular ends on the acquired images; the middle phalanx is not an extra segment of the thumb or great toe.'),
  distal:fact('Distinguish the articular base from the terminal tuft. A tuft abnormality and a joint-margin fragment are different locations; the bone surface alone does not assess the nail bed, tendon continuity or an open injury.'),
};
const fingerMRI={
  proximal:fact('Use the proximal phalanx to orient the MCP capsule and extensor hood dorsally, with the flexor tendons on the palmar side. Follow the actual tendons across slices; selecting this bone does not separately select the hood, pulleys or collateral ligaments.','handMRI'),
  middle:fact('At the dorsal base, look for the central extensor slip. On the palmar side, distinguish the superficialis slips inserting on this phalanx from profundus continuing distally. Sagittal and axial images provide complementary views; bone identity does not establish tendon integrity.','fingerMRI'),
  distal:fact('At the base, distinguish profundus insertion palmarly from terminal extensor insertion dorsally. Relate each to the DIP joint rather than the tuft. The actual MRI, not an intact-looking reference surface, is needed to assess these separate structures.','fingerMRI'),
};
const thumbMRI={
  proximal:fact('At the MCP end, distinguish the collateral-ligament attachments from the neighbouring adductor aponeurosis. Their relationship matters when reviewing an ulnar-sided injury; a proximal-phalanx mesh cannot demonstrate a ligament tear or a displaced Stener lesion.','thumb'),
  distal:fact('At the thumb IP joint, distinguish flexor pollicis longus on the palmar side from extensor pollicis longus dorsally. The thumb has no middle phalanx; do not apply the finger PIP/central-slip map to this selection.','fingerMRI'),
};
const toeMRI={
  proximal:fact('At the lesser MTP joint, inspect the plantar plate at its distal attachment near the phalangeal base on successive sagittal and coronal images. Keep it separate from collateral structures and neighbouring flexor tendons; one slice or this bone mesh does not establish continuity.','plantarPlate'),
  middle:fact('Identify the PIP and DIP joints before following dorsal extensor and plantar flexor tissues along the toe. Their small size and partial-volume effects may limit separation; the atlas does not supply validated individual tendon contours.','footMRI'),
  distal:fact('Separate the terminal marrow and cortex from the dorsal nail-bed region and plantar pulp. Localise any signal change to the actual imaged tissue; marrow oedema is not by itself a specific cause, and this reference contains no infection or tendon-injury map.','footMRI'),
};
const halluxMRI={
  proximal:fact('At the MTP base, review the sesamoid-phalangeal and collateral relationships as a complex, not one isolated lesser-toe-type plate. The hallux plantar supporting tissues differ from the lesser MTP joints; grouped atlas sesamoids are not individually assigned landmarks.','firstMTP'),
  distal:fact('Follow the hallux IP joint separately from the MTP joint. Review the dorsal extensor and plantar flexor tissues on the actual images; selecting the distal phalanx does not select the plantar sesamoid complex at the metatarsal head.'),
};
const handMetacarpalCT=fact('Inspect the base and its carpal partners before following the shaft, neck and MCP head. At the fourth/fifth bases include the neighbouring hamate: an apparently isolated metacarpal finding may coexist with carpal injury.','handCT');
const centralMetacarpalCT=fact('Follow the central-ray base into its named carpal articulations, then inspect the shaft, neck and MCP head. Localise any cortical projection or joint-margin fragment to the actual bone and surface; the reference model does not identify accessory ossicles or classify a fracture.');
const handMetacarpalMRI=fact('Review marrow within the base, shaft and head separately from the surrounding interossei and tendon paths. At the MCP head, inspect capsule, collateral structures and extensor mechanism on the actual scan; bone selection does not establish their integrity.','handMRI');
const handMeta:Record<number,Focus>={
  1:{ct:fact('Distinguish the trapeziometacarpal joint at the thumb base from the MCP joint at its head. Describe the location of any articular involvement on the acquired images; this uninjured whole-bone reference contains no fracture pattern or displacement measurement.'),mri:fact('Orient the thumb in its own plane rather than assuming it is parallel to the fingers. Keep CMC supporting tissues separate from the MCP collateral and volar structures; the atlas does not validate their separate footprints.','handMRI')},
  2:{ct:centralMetacarpalCT,mri:handMetacarpalMRI},
  3:{ct:centralMetacarpalCT,mri:handMetacarpalMRI},
  4:{ct:handMetacarpalCT,mri:handMetacarpalMRI},
  5:{ct:handMetacarpalCT,mri:handMetacarpalMRI},
};
const lesserMetaCT=fact('Inspect the tarsometatarsal base and neighbouring tarsal surfaces before following the shaft, neck and MTP head. CT can clarify fracture extension and articular configuration obscured by projectional overlap; normal donor alignment is not evidence about an injured foot.','lisfranc');
const lesserMetaMRI=fact('Distinguish marrow signal along the shaft from the MTP plantar plate, capsule and intermetatarsal soft tissues at the head. Stress-related marrow change and a visible fracture line are different findings; correlate the actual images and clinical setting.','stress');
const footMeta:Record<number,Focus>={
  1:{ct:fact('Follow the medial tarsometatarsal base to the first MTP head. At the head, distinguish the plantar sesamoid articulations from the main phalangeal surface; this selection does not independently assign or validate the grouped foot sesamoids.'),mri:fact('At the first MTP joint, review the plantar supporting complex, sesamoids, collateral structures and tendons together. It is not simply one lesser-toe plantar plate; the bone mesh does not define these soft-tissue components.','firstMTP')},
  2:{ct:fact('Review the recessed base between the cuneiforms and its relationship to the medial cuneiform. Document whether the actual CT was loaded or unloaded: an unloaded acquisition and a fixed donor model do not reproduce weight-bearing relationships.','load'),mri:fact('At the base, separate the Lisfranc ligamentous complex from marrow and adjacent joints. At the head, review the MTP structures independently; a selected second metatarsal does not establish midfoot ligament continuity or stability.','lisfranc')},
  3:{ct:lesserMetaCT,mri:lesserMetaMRI},
  4:{ct:lesserMetaCT,mri:lesserMetaMRI},
  5:{ct:fact('Distinguish the tuberosity from the more distal proximal-shaft region and the fourth–fifth intermetatarsal articulation. An unfused base apophysis can mimic injury in a younger patient; a donor adult outline cannot settle that distinction.','stress'),mri:lesserMetaMRI},
};
type Group={fmaIds:readonly string[];region:'hand'|'foot';digit:number;segment?:string;landmark:string;limitation:string;anatomyReferences:readonly string[];focus:Focus};
// Existing exact right/left identities supply digit, segment and joint partners.
// Carpal/tarsal notes are already present. Unassigned sesamoids are not admitted.
export const acralBoneImagingGroups:Record<string,Group>=Object.fromEntries(acralBoneLessons.filter(l=>l.digit!==undefined).map(l=>{
  const digit=l.digit!,segment=l.segment;
  const focus:Focus=segment?{
    ct:phalanxCT[segment],
    mri:l.region==='hand'?(digit===1?thumbMRI[segment as 'proximal'|'distal']:fingerMRI[segment]):(digit===1?halluxMRI[segment as 'proximal'|'distal']:toeMRI[segment]),
  }:(l.region==='hand'?handMeta:footMeta)[digit];
  if(!focus?.ct||!focus.mri)throw Error('Missing acral imaging topic '+l.fmaIds[0]);
  return[l.fmaIds[0],{fmaIds:l.fmaIds,region:l.region,digit,...(segment?{segment}:{}),landmark:l.anatomy,limitation:l.distinction,anatomyReferences:l.references,focus}];
}));
