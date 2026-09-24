// Original orientation teaching; publications are reading links, not imported media.
import {orbitalMuscleLessons} from '../lib/orbital-curriculum';
import {neckMuscleLessons} from '../lib/neck-curriculum';
import {swallowingMuscleLessons} from '../lib/swallowing-curriculum';
export const orbitalNeckMuscleImagingReferences={
  orbitalUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4250497/',
  obliqueUS:'https://pubmed.ncbi.nlm.nih.gov/3062525/',
  orbitMRI:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7342734/',
  orbitCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9581877/',
  orbitTrauma:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3729297/',
  pulley:'https://pmc.ncbi.nlm.nih.gov/articles/PMC2268111/',
  neckUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3552675/',
  thyroidUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4499539/',
  triangle:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3063345/',
  supraUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3558093/',
  spaces:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5990998/',
  mylohyoidVariant:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7973941/',
  subclavius:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7973677/',
  subclaviusVariant:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4349834/',
  omohyoid:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10468463/',
} as const;
type Reference=keyof typeof orbitalNeckMuscleImagingReferences;
type Fact={text:string;references:readonly Reference[]};
export type OrbitalNeckMuscleImagingModality='ct'|'mri'|'ultrasound';
type Focus=Partial<Record<OrbitalNeckMuscleImagingModality,Fact>>;
const fact=(text:string,...references:Reference[]):Fact=>({text,references});
export const orbitalUltrasoundMode= fact('Image-orientation teaching only, not instructions for scanning an eye. Dedicated ophthalmic acquisition and safety require an appropriate clinical protocol. Plane and gaze affect apparent muscle dimensions; this atlas provides no ultrasound reflectivity or normal measurement thresholds.','orbitalUS');
export const orbitalNeckMuscleImagingModes:Record<OrbitalNeckMuscleImagingModality,Fact>={
  ct:fact('Use the actual acquisition and multiplanar reformats to follow the muscle between landmarks. Compare soft-tissue and bone windows where relevant; the coloured reference surface contains no attenuation, enhancement or fracture information.'),
  mri:fact('Check coverage and orientation before comparing anatomical and fluid-sensitive sequences. Assess signal, surrounding fat and continuity on the actual series; a fixed donor surface is not a signal map or a normal-size threshold.'),
  ultrasound:fact('Identify the muscle in two planes and follow its course where accessible. Probe angle, pressure and motion can change its appearance. Bone shadowing and limited windows must not be mistaken for absent anatomy; this is not a needle-placement guide.'),
};
const focuses:Record<string,Focus>={
  'medial-rectus':{
    ultrasound:fact('Orient to the nasal side of the globe. Rectus muscle is relatively less echogenic than surrounding orbital fat; compare its long-axis course with a transverse section.','orbitalUS'),
    ct:fact('Follow the medial orbital muscle separately from the adjacent ethmoid wall. Compare belly and tendon involvement; enlargement alone does not identify its cause.','orbitCT'),
    mri:fact('Axial images show the nasal-side course well; corroborate it on coronal images. Keep the muscle separate from the more posterior optic nerve.','orbitMRI'),
  },
  'lateral-rectus':{
    ultrasound:fact('Identify the temporal-side rectus independently of medial rectus. Gaze and section direction affect its appearance; an unmatched plane is not evidence of a size difference.','orbitalUS'),
    ct:fact('Trace the temporal-side muscle from apex towards globe. Assess its tendon and surrounding fat independently; do not infer abducens function from its contour.','orbitCT'),
    mri:fact('Follow the lateral course on axial images and compare coronal sections at matched levels. Different gaze positions change muscle geometry.','orbitMRI','pulley'),
  },
  'superior-rectus':{
    ultrasound:fact('Superior rectus lies below levator. A longitudinal superior-muscle complex may include both; do not label the entire combined profile as superior rectus alone.','orbitalUS'),
    ct:fact('Distinguish the superior rectus–levator complex from adjacent orbital fat. Limited separation on CT does not make the two muscles one anatomical structure.','orbitCT'),
    mri:fact('Sagittal images help separate superior rectus below from levator above. Confirm which structure reaches the globe rather than the upper eyelid.','orbitMRI'),
  },
  'inferior-rectus':{
    ultrasound:fact('Identify the rectus below the globe. Long-axis and transverse sections depict different profiles of the same muscle; use its course, not a single apparent diameter.','orbitalUS'),
    ct:fact('Review the muscle above the orbital floor and its surrounding fat. Muscle shape alone does not establish entrapment or explain restricted eye movement.','orbitTrauma'),
    mri:fact('Follow the inferior rectus longitudinally on sagittal images; check coronal relationships to the globe and floor. Separate the neighbouring inferior oblique.','orbitMRI'),
  },
  'superior-oblique':{
    ultrasound:fact('Relate a candidate oblique profile to the superomedial course and trochlear turn shown in Anatomy. Standardized echography has depicted oblique muscles and tendons in a small myositis series; that does not validate routine normal visibility or the atlas tendon boundary.','obliqueUS'),
    ct:fact('Follow the superomedial muscle towards the trochlear region. Do not interpret its reflected tendon as a straight apex-to-globe rectus course.'),
    mri:fact('Trace the anterior trochlear turn and reflected tendon across planes. Dedicated high-resolution imaging may show detail unresolved on routine orbital MRI.','orbitMRI'),
  },
  'inferior-oblique':{
    ultrasound:fact('Use the anterior medial origin and course below the globe to distinguish inferior oblique from an apex-based rectus. Published echographic depiction in a small myositis series is not a normal-appearance standard, proof of tendon continuity or a diagnosis from this surface.','obliqueUS'),
    ct:fact('Start at the anterior medial orbital floor, not the common tendinous ring. Trace the oblique course below the globe on successive planes.'),
    mri:fact('Look beneath the globe and inferior rectus for its transverse-oblique course. Do not force this anteriorly originating muscle into an apex-based pattern.','orbitMRI'),
  },
  'levator-palpebrae-superioris':{
    ultrasound:fact('The thin levator lies above superior rectus and can be difficult to separate echographically. A combined superior-complex measurement is not an isolated levator measurement.','orbitalUS'),
    ct:fact('Review the superior muscle complex with the eyelid target in mind. CT may not resolve levator, its aponeurosis and adjacent small eyelid layers separately.','orbitCT'),
    mri:fact('Sagittal imaging helps follow levator towards the upper lid, above superior rectus. Microscopy-coil detail is not guaranteed with a routine head coil.','orbitMRI'),
  },
  subclavius:{
    ct:fact('Locate the short muscle beneath the middle clavicle towards the first rib. Keep its bony attachments distinct from the deeper costoclavicular neurovascular interval.'),
    mri:fact('Confirm that the imaged slip reaches the clavicle. An anomalous subclavius posticus can continue towards the scapula; this ordinary selection does not represent that variant.','subclaviusVariant'),
    ultrasound:fact('In an accessible infraclavicular window, identify subclavius beneath pectoralis major and superficial to deeper vessels and plexus. Clavicular shadowing limits complete inspection.','subclavius'),
  },
  platysma:{
    ct:fact('Look for the thin superficial sheet in the neck soft tissues, not a deep strap muscle. Its visibility and apparent thickness depend on resolution and adjacent fat.'),
    mri:fact('Follow the superficial sheet towards the lower mandibular region. Keep skin, subcutaneous tissue and deeper muscles separate; this mesh does not define every facial blending fibre.'),
    ultrasound:fact('Identify the thin superficial layer between subcutaneous tissues and deeper neck muscles. Avoid labelling every superficial echogenic line as platysma or a validated fascial boundary.','neckUS'),
  },
  'scalenus-anterior':{
    ct:fact('Trace the anterior scalene to rib 1 and distinguish the posterior arterial groove from the anterior venous relationship. Assess these on the patient study, not exploded spacing.'),
    mri:fact('Use the muscle as the anterior boundary of the usual interscalene interval. Separate muscle, plexus and vessels; the reference does not prove neural compression or nerve continuity.','triangle'),
    ultrasound:fact('Identify anterior and middle scalene before assigning an interscalene structure. The phrenic nerve has a separate anterior-scalene relationship; its course is not supplied by this mesh.','triangle'),
  },
  'scalenus-medius':{
    ct:fact('Follow the middle scalene towards rib 1 behind the arterial groove. Distinguish it from anterior scalene and from the posterior scalene descending to rib 2.'),
    mri:fact('Review the posterior boundary of the interscalene interval without assuming every cervical slip or traversing nerve is separately resolved. Patient anatomy may differ from the donor.','triangle'),
    ultrasound:fact('Track the muscle behind the usual interscalene plexus position. Nerves may run through or beside it; a hypoechoic focus requires continuity checks, not identification by colour.','triangle'),
  },
  'scalenus-posterior':{
    ct:fact('Use the second-rib attachment to distinguish this muscle from the first-rib scalenes. The selected outline does not assign a fixed set of cervical origin levels.'),
    mri:fact('Follow the posterior scalene in more than one plane where coverage permits. Do not equate an indistinct boundary with absence or merge it automatically into middle scalene.'),
    ultrasound:fact('Middle and posterior scalene may appear together in a limited transverse window. Preserve uncertainty when their separate courses cannot be followed; do not infer rib level from one image.','thyroidUS'),
  },
  sternocleidomastoid:{
    ct:fact('Trace the broad oblique muscle from mastoid towards manubrium and medial clavicle. It is a muscular landmark, not a substitute for tracing a nearby node or vessel.'),
    mri:fact('Review its cranial and two caudal attachments on the patient series. Signal changes within muscle and changes in adjacent fat are separate observations; one atlas file does not separate its heads.'),
    ultrasound:fact('Use its broad superficial course to orient the neck, then identify deeper structures independently. Head rotation changes relationships; the medial sternal and lateral clavicular heads are distinct.','thyroidUS'),
  },
  digastric:{
    ct:fact('Locate the anterior belly below mylohyoid and trace the posterior belly towards the mastoid. Source-file counts must not be interpreted as the number of bellies.','spaces'),
    mri:fact('Follow both bellies towards the intermediate tendon near the hyoid. The combined surface does not label individual belly files or prove a resolved tendon sling.'),
    ultrasound:fact('In submental views, distinguish anterior digastric from the deeper mylohyoid. A lateral window shows different posterior-belly relationships; one view does not display the whole muscle.','supraUS'),
  },
  mylohyoid:{
    ct:fact('Use the mylohyoid sling to separate sublingual from submandibular spaces. They communicate around its posterior free edge; the sheet is not a sealed compartment.','spaces'),
    mri:fact('Review the sling on coronal and axial images. Salivary tissue can protrude through a mylohyoid defect and mimic a mass; the donor surface cannot exclude that variant.','mylohyoidVariant'),
    ultrasound:fact('Identify the muscular floor between the mandible and midline raphe. Distinguish gland tissue from muscle, including tissue extending through a focal mylohyoid gap.','supraUS'),
  },
  geniohyoid:{
    ct:fact('Locate the paired near-midline muscles above mylohyoid and below genioglossus. These are different muscle groups despite their close mandibular origins.','spaces'),
    mri:fact('Follow the geniohyoid from inferior mental spine towards hyoid on sagittal and coronal images. Keep it separate from the tongue-directed genioglossus fan.','spaces'),
    ultrasound:fact('In a submental view, distinguish geniohyoid above mylohyoid from genioglossus deeper towards the tongue. Movement during swallowing is not quantified by this static atlas.','supraUS'),
  },
  stylohyoid:{
    ct:fact('Follow the narrow styloid-to-hyoid course beside the posterior digastric region. Keep muscle identity separate from mineralised styloid or stylohyoid-ligament structures.'),
    mri:fact('Correlate the slender muscle across planes near posterior digastric. Its typical tendon relationship is teaching context, not proof of a separately visible split in this source.'),
    ultrasound:fact('Use the posterior digastric region to orient the adjacent slender stylohyoid. If the two cannot be separated confidently, retain that limitation rather than assigning a false contour.','supraUS'),
  },
  omohyoid:{
    ct:fact('Trace the superior belly towards the hyoid and the inferior course towards the scapula. The intermediate tendon beneath sternocleidomastoid is not a separate selected source component.'),
    mri:fact('Follow the changing course across successive slices rather than mistaking separate cross-sections for separate muscles. The single mesh does not validate the two bellies or fascial sling.'),
    ultrasound:fact('The superior belly can be followed deep to sternocleidomastoid towards the hyoid. A scan showing one belly does not establish continuity of the entire scapula-to-hyoid course.','omohyoid'),
  },
  sternohyoid:{
    ct:fact('Follow the superficial paramedian strap towards the hyoid. Distinguish its hyoid insertion from the deeper sternothyroid ending at thyroid cartilage.'),
    mri:fact('Separate the superficial strap from sternothyroid deep to it. Confirm the superior endpoint in another plane rather than assigning identity from one axial muscle cross-section.'),
    ultrasound:fact('Identify the superficial strap layer anterior to sternothyroid and the thyroid region. A short transverse image does not demonstrate its full sternum-to-hyoid length.','neckUS'),
  },
  sternothyroid:{
    ct:fact('Follow the deeper strap from posterior manubrium to thyroid cartilage. The cartilage is part of the larynx; it is not the adjacent thyroid gland.'),
    mri:fact('Use the thyroid-cartilage endpoint to separate sternothyroid from sternohyoid. Do not interpret continuity with the neighbouring thyrohyoid selection as one uninterrupted muscle.'),
    ultrasound:fact('Identify sternothyroid deep to sternohyoid and anterior to the thyroid gland. Its insertion is on thyroid cartilage, not the gland itself.','neckUS'),
  },
  thyrohyoid:{
    ct:fact('Inspect the short thyroid-cartilage-to-hyoid span above sternothyroid. Keep the muscle separate from the thyrohyoid membrane and from cartilage ossification.'),
    mri:fact('Correlate the short muscle on more than one plane beside the larynx. This surface does not show membrane perforations, tiny nerve branches or swallowing competence.'),
    ultrasound:fact('Use hyoid and thyroid cartilage to orient the short deep strap. Cartilage and bone shadowing may limit visibility; the membrane is a different structure.','neckUS'),
  },
};
type Group={fmaIds:readonly string[];family:'orbital'|'neck'|'hyoid';landmark:string;limitation:string;anatomyReferences:readonly string[];focus:Focus};
const hyoidKeys=new Set(['digastric','mylohyoid','geniohyoid','stylohyoid','omohyoid','sternohyoid','sternothyroid','thyrohyoid']);
const lessons=[...orbitalMuscleLessons.map(l=>({l,family:'orbital' as const})),...neckMuscleLessons.filter(l=>l.key!=='cervical-rotator').map(l=>({l,family:'neck' as const})),...swallowingMuscleLessons.filter(l=>hyoidKeys.has(l.key)).map(l=>({l,family:'hyoid' as const}))];
// Existing pairs are LEFT first, RIGHT second. No inferred mirroring or new mesh.
export const orbitalNeckMuscleImagingGroups:Record<string,Group>=Object.fromEntries(lessons.map(({l,family})=>{
  if(!focuses[l.key]?.ct||!focuses[l.key]?.mri)throw Error('Missing orbital/neck imaging focus '+l.key);
  return[l.key,{fmaIds:l.fmaIds,family,landmark:`Attachments: ${l.origin} → ${l.insertion}`,limitation:l.caution??'Typical attachment relationships are not measured footprints, individual fascial layers or validated patient contours.',anatomyReferences:l.references,focus:focuses[l.key]}];
}));
