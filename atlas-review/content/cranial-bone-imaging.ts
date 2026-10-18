// Original concise teaching synthesis; reading links, never imported figures.
import {cranialBoneLessons} from '../lib/cranial-bone-curriculum';

export const cranialBoneImagingReferences={
  calvaria:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6206383/',
  anteriorBase:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5977432/',
  skullBase:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3698894/',
  temporal:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6081284/',
  nasal:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7416352/',
  orbit:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3729578/',
  lacrimal:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10996330/',
  oral:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3473765/',
  tmj:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9031630/',
  hyoid:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4859847/',
} as const;
type Reference=keyof typeof cranialBoneImagingReferences;
export type CranialBoneImagingModality='ct'|'mri';
type Fact={text:string;references:readonly Reference[]};
type Focus=Record<CranialBoneImagingModality,Fact>;
const fact=(text:string,...references:Reference[]):Fact=>({text,references});
export const cranialBoneImagingModes:Focus={
  ct:fact('On an existing study, correlate bone-window appearances with soft-tissue images and adjacent sections. Atlas colour and cut surfaces are not CT attenuation, cortical thickness or patient-specific findings.'),
  mri:fact('Identify the sequence and field of view first. Cortical bone is generally low signal on conventional MRI; marrow and neighbouring soft tissues supply different information. A surface mesh supplies no MR signal.','calvaria'),
};
// Keys are the first FMA identity in the existing curriculum, not matched names.
const patterns:Record<string,Focus>={
  FMA52734:{
    ct:fact('Follow the frontal vault into the orbital roofs. Coronal and sagittal images separate the anterior skull-base floor from the frontal sinus walls; sinus extent and drainage cannot be inferred from the outside of this bone.','anteriorBase'),
    mri:fact('Review frontal diploic marrow separately from the overlying scalp and underlying dura. A marrow or extraosseous abnormality may require correlation with CT for the cortical tables; the atlas does not display these tissue layers.','calvaria'),
  },
  FMA52788:{
    ct:fact('Trace the inner table, diploe and outer table across the parietal vault. Follow a lucency through adjacent sections and consider sutural or vascular anatomy rather than treating every line as a fracture.','calvaria'),
    mri:fact('Assess the parietal marrow and any scalp or dural component separately. This entire-bone selection is an orientation aid, not a marrow mask or an explanation for a focal signal change.','calvaria'),
  },
  FMA52735:{
    ct:fact('Start at the foramen magnum, then follow the occipital condyles to the C1 articulations and the basilar occiput towards the clivus. Keep sutures and neighbouring temporal/sphenoid bone separate; this surface does not validate canal diameters.'),
    mri:fact('Use the clival marrow and cervicomedullary junction as separate review targets. MRI can assess skull-base marrow and adjacent neural/soft tissues; neither a normal-looking outer surface nor the selected condyle establishes ligament integrity.','skullBase'),
  },
  FMA52738:{
    ct:fact('Orient through the external canal, middle ear, petrous portion and mastoid. High-resolution CT can resolve tiny osseous structures, but this whole temporal-bone selection does not independently identify the ossicles, labyrinth or facial canal.','temporal'),
    mri:fact('On suitable heavily T2-weighted images, internal-auditory-canal nerves are dark within bright fluid. Those nerves are not the temporal bone itself; a routine brain series and this mesh do not provide equivalent internal-ear detail.','temporal'),
  },
  FMA52736:{
    ct:fact('Locate the sphenoid body and sella, then follow the wings and pterygoid plates. Review the actual sinus walls and foraminal margins in multiple planes; model openings are not measured neurovascular channels.','skullBase'),
    mri:fact('Separate sphenoid/clival marrow from the pituitary, cavernous sinus and adjacent dura. MRI supplies soft-tissue and marrow context that complements CT bone detail; selecting sphenoid does not select every neighbouring compartment.','skullBase'),
  },
  FMA52740:{
    ct:fact('Use coronal images to distinguish the cribriform region, lateral lamella and ethmoid roof, and the thin medial orbital wall. Side-to-side variation matters; the displayed donor is not a surgical map of an individual olfactory fossa.','anteriorBase'),
    mri:fact('Review tissue above and below the anterior skull base separately. MRI can clarify intracranial and sinonasal soft-tissue relationships, while the thin bony partitions need CT correlation; a dark boundary alone does not establish a defect or CSF leak.','anteriorBase'),
  },
  FMA53647:{
    ct:fact('Follow each nasal bone along the upper bridge and its junctions with the frontal bone and maxilla. Keep the bony bridge separate from the cartilaginous septum and external nose; the model does not classify a traumatic line.'),
    mri:fact('Use the bridge as an external landmark when reviewing nasal soft tissues. This small bone has no validated MRI contour in the atlas; its selection cannot establish septal cartilage integrity, nasal valve function or the cause of obstruction.'),
  },
  FMA9710:{
    ct:fact('Trace the inferior-posterior bony septum in coronal and sagittal views. Distinguish vomer from the ethmoid perpendicular plate and anterior septal cartilage; the septum is not a single uniform bone.','nasal'),
    mri:fact('Locate the septum between the nasal cavities, but do not label its full low-signal partition as vomer. This selection supplies neither a cartilage/mucosa segmentation nor a validated MR boundary for the individual septal components.'),
  },
  FMA54737:{
    ct:fact('Find the lowest curved bony concha on the lateral nasal wall, with the inferior meatus below. Separate its bony scaffold from mucosal thickness; the middle and superior conchae belong to the ethmoid.','nasal'),
    mri:fact('Keep the inferior turbinate mucosa distinct from its small bony scaffold. The atlas has only this retained bone surface, not sequence-specific mucosal contours or an assessment of nasal-cycle congestion.'),
  },
  FMA53645:{
    ct:fact('Locate the small lacrimal bone at the anterior medial orbit beside the maxilla. Follow the bony lacrimal fossa/canal region separately from its soft-tissue contents; canal shape alone does not prove tear-drainage patency.','lacrimal'),
    mri:fact('Distinguish the medially located lacrimal drainage apparatus from the superolateral tear-producing gland. MRI assesses the soft tissues, not a duct lumen encoded in this bone selection; the model supplies no tear-flow test.','lacrimal'),
  },
  FMA53649:{
    ct:fact('Follow the maxillary contribution to the orbital floor and the walls of the maxillary sinus. Use multiplanar views to separate the floor from adjacent orbital contents; an atlas boundary does not demonstrate muscle entrapment.','orbit'),
    mri:fact('Review marrow and neighbouring palatal, gingival and facial soft tissues separately. MRI can add marrow/soft-tissue information to CT cortical assessment, but this single maxilla mesh contains no dental-root or perineural-spread segmentation.','oral'),
  },
  FMA53655:{
    ct:fact('At the posterior hard palate, trace the horizontal palatine plate and its junction with the maxilla; follow the perpendicular plate up the lateral nasal wall. The posterior soft palate is not part of this bone.','nasal'),
    mri:fact('Distinguish the posterior hard-palate bone from its mucosal covering and the soft palate behind it. MRI adds soft-tissue and marrow assessment, but the atlas does not model velopharyngeal closure or certify palatal canal contents.','oral'),
  },
  FMA52892:{
    ct:fact('Follow the lateral orbital rim and zygomatic contribution to the floor, then the temporal junction of the arch. The arch spans two bones; include the full junction rather than assigning it wholly to this selection.','orbit'),
    mri:fact('Use the cheek and lateral orbit as landmarks when reviewing adjacent orbital fat and muscles. The visible zygomatic surface does not provide an MR contour of those tissues or establish an intact orbital wall.'),
  },
  FMA52748:{
    ct:fact('Trace the body, rami and both condyles. CT depicts the osseous TMJ components; condylar shape or joint spacing alone does not establish the position of the articular disc.','tmj'),
    mri:fact('Dedicated TMJ images distinguish the disc from the condyle and temporal articular surface. Open/closed-mouth studies assess their changing relationship; rotating or exploding this fixed mandible is not equivalent to those acquisitions.','tmj'),
  },
  FMA52749:{
    ct:fact('Follow the hyoid body and greater horns in the neck, retaining their relationships to the mandible and larynx. Body–horn fusion varies, including persistent non-fusion in adults; do not assign an age or fracture merely from a visible junction.','hyoid'),
    mri:fact('Locate the hyoid between the floor of mouth and laryngeal region, then examine the surrounding soft tissues on the actual study. The grouped donor surface provides no validated MRI segmentation or dynamic swallowing assessment.'),
  },
};
type Group={fmaIds:readonly string[];landmark:string;limitation:string;anatomyReferences:readonly string[];focus:Focus};
export const cranialBoneImagingGroups:Record<string,Group>=Object.fromEntries(cranialBoneLessons.map(lesson=>{
  const key=lesson.fmaIds[0],focus=patterns[key];
  if(!focus)throw new Error('Missing cranial bone imaging pattern: '+key);
  return [key,{fmaIds:lesson.fmaIds,landmark:lesson.anatomy,limitation:lesson.distinction,anatomyReferences:lesson.references,focus}];
}));
