// Original teaching synthesis. References are reading links, not imported figures.
import {trunkMuscleLessons} from '../lib/trunk-curriculum';
import {deepNeckMuscleLessons} from '../lib/deep-neck-curriculum';
import {neckMuscleLessons} from '../lib/neck-curriculum';
import {axialGroups} from '../lib/axial-anatomy';

export const spinePelvicImagingReferences = {
  paraspinalUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11051048/',
  cervicalMRI:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5972401/',
  thoracicMRI:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7524235/',
  lumbarMRI:'https://link.springer.com/article/10.1186/s12891-016-1378-z',
  suboccipitalUS:'https://pubmed.ncbi.nlm.nih.gov/39371882/',
  craniocervical:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7549867/',
  pelvicUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11693842/',
  pelvicMRI:'https://pmc.ncbi.nlm.nih.gov/articles/PMC1472875/',
  mri:'https://www.radiologyinfo.org/en/info/muscmr',
} as const;
type Reference=keyof typeof spinePelvicImagingReferences;
export type SpinePelvicImagingModality='ct'|'mri'|'ultrasound';
type Fact={text:string;references:readonly Reference[]};
const fact=(text:string,...references:Reference[]):Fact=>({text,references});
type Focus=Record<SpinePelvicImagingModality,Fact>;
export const spinePelvicImagingModes:Focus={
  ct:fact('For an already acquired CT, use bone landmarks to orient the soft-tissue review. Model colour is not attenuation. This is not an indication to obtain CT or evidence of muscle, tendon or ligament integrity.'),
  mri:fact('Check coverage and the actual sequence. Muscle bulk, T1 fat and fluid-sensitive signal are separate observations; the donor surface supplies neither MR signal nor a patient-specific abnormality.','mri'),
  ultrasound:fact('Match the actual side, level and plane before naming a structure. A model surface is not a sonogram; an obscured or unresolved structure is not evidence of absence.'),
};
const unresolvedUS=fact('This atlas has no validated ultrasound correspondence for the individual small slips. Keep identification at the visible group or landmark level; do not invent fascicle boundaries or a needle route.');
const smallMRI=fact('Identify the bony level first. These retained small-muscle sets do not supply per-level MRI contours; record an unresolved boundary rather than transferring the full mesh to one slice.');
const cervicalDeepMRI=fact('Deep cervical extensors may merge into a shared imaging region. Semispinalis cervicis and neighbouring multifidus/erector spinae need not have separable borders on an axial slice.','cervicalMRI');
const cervicalLateralUS=fact('Splenius cervicis, longissimus cervicis and iliocostalis cervicis overlap in the lateral neck and can be difficult to separate sonographically. Do not infer three clean layers from model colours.','paraspinalUS');
const patterns:Record<string,Focus>={
  trapezius:{
    ct:fact('Follow this selected part between its listed midline and shoulder-girdle attachments. Its displayed seam is not a CT boundary separating three independent muscles.'),
    mri:fact('Trace superficial trapezius across adjacent sections; at lower thoracic levels, avoid substituting latissimus dorsi. A single section does not measure the entire selected part.','thoracicMRI'),
    ultrasound:fact('Identify superficial trapezius and the deeper muscle separately; the underlying layer changes with level. A local view does not define all three trapezius portions.','paraspinalUS'),
  },
  thoracicErector:{
    ct:fact('Use the ribs and posterior vertebral elements to orient this longitudinal muscle. Follow its own attachment course below; the visible column is not a set of validated segmental tendons.'),
    mri:fact('Within thoracic erector spinae, spinalis is medial, longissimus intermediate and iliocostalis lateral. A grouped region of interest does not independently segment each column or its slips.','thoracicMRI'),
    ultrasound:fact('At the thorax, iliocostalis is lateral to longissimus. Identify rib and vertebral landmarks before tracing a column; bone shadow limits deeper assessment.','paraspinalUS'),
  },
  lumbarErector:{
    ct:fact('Orient to the sacropelvic and posterior lumbar attachments, then trace towards the ribs. Do not equate the word lumborum with an exclusively lumbar field of view.'),
    mri:fact('Use the multifidus–erector spinae interface and transverse-process landmarks. Keep quadratus lumborum anterolateral to this region separate; a combined erector-spinae outline is not an individual-muscle contour.','lumbarMRI'),
    ultrasound:fact('Use posterior lumbar bone landmarks and the visible muscle interfaces. This model does not validate a separate sonographic contour for every iliocostalis tendon or deep lumbar slip.'),
  },
  thoracicDeep:{
    ct:fact('Search beside the posterior vertebral elements using the attachment pattern below. Individual deep slips are not identified simply because their group occupies that position.'),
    mri:fact('Thoracic transversospinalis includes semispinalis, multifidus and rotatores. Published grouped segmentation can mix small rotatores with adjacent erector spinae; it does not prove individual-slip visibility.','thoracicMRI'),
    ultrasound:unresolvedUS,
  },
  smallSpinal:{
    ct:fact('Use the listed neighbouring vertebral processes as landmarks. A source-labelled set is not proof of a separate visible muscle at every intervening vertebral level.'),
    mri:smallMRI,ultrasound:unresolvedUS,
  },
  ribElevators:{
    ct:fact('Use the transverse-process and adjacent rib landmarks. These short rib-elevator sets are not the intercostal layers, and the source does not independently label every rib attachment.'),
    mri:fact('Check the posterior rib and transverse-process coverage. The retained breves sets are not per-rib MRI segmentations, and separate longi candidates remain withheld.'),
    ultrasound:unresolvedUS,
  },
  serratusPosterior:{
    ct:fact('Follow the thin posterior rib-related muscle from its midline attachment. Keep it distinct from serratus anterior and the muscles occupying individual rib interspaces.'),
    mri:fact('Check that both the posterior rib attachments and midline origin are covered. A spine-centred or shoulder-centred series may omit part of this thin sheet.'),
    ultrasound:fact('Follow the thin posterior muscle towards its rib attachments, keeping deeper erector spinae and rib shadow separate. Superior and inferior serratus posterior occupy different levels.','paraspinalUS'),
  },
  cervicalLateral:{
    ct:fact('Follow the listed rib, thoracic or cervical attachment to the cervical transverse-process region. A cervicis selection must not be extended to a mastoid or occipital insertion.'),
    mri:cervicalDeepMRI,ultrasound:cervicalLateralUS,
  },
  spleniusCapitis:{
    ct:fact('Follow the posterior neck muscle towards the mastoid and lateral occipital attachment. Keep the skull-reaching capitis distinct from the cervical vertebral insertion of splenius cervicis.'),
    mri:fact('Identify splenius capitis superficial to semispinalis capitis. Follow serial levels: a crisp atlas border does not establish a separate splenius cervicis contour everywhere.','cervicalMRI'),
    ultrasound:fact('Near the mastoid, splenius capitis is deep to sternocleidomastoid and superficial to longissimus capitis. Follow continuity before assigning a name.','paraspinalUS'),
  },
  longissimusCapitis:{
    ct:fact('Use the mastoid endpoint to distinguish capitis from the cervical vertebral attachment of longissimus cervicis. The source does not assign every proximal slip an exact footprint.'),
    mri:fact('The mastoid-reaching longissimus capitis can be distinguished from cervical-attaching extensors. Trace its continuity rather than relying on one similarly shaped muscle cross-section.','cervicalMRI'),
    ultrasound:fact('Near the mastoid, look deep to splenius capitis for longissimus capitis. Its relationship to neighbouring muscle changes as it is followed caudally.','paraspinalUS'),
  },
  semispinalisCapitis:{
    ct:fact('Follow the posterior neck muscle to the occiput. This skull-reaching attachment distinguishes capitis from the vertebral endpoints of semispinalis cervicis and thoracis.'),
    mri:fact('Semispinalis capitis forms a substantial layer superficial to semispinalis cervicis. Its outline becomes less distinct inferiorly; do not continue a fixed axial contour into the thorax.','cervicalMRI'),
    ultrasound:fact('Identify semispinalis capitis deep to splenius/trapezius and above deeper cervical extensors. Muscle identification alone does not map the nearby occipital nerves.','paraspinalUS'),
  },
  semispinalisCervicis:{
    ct:fact('Trace the deep muscle towards cervical spinous processes, not the skull. The selected surface does not separate all fascicles from adjacent deep extensors.'),
    mri:cervicalDeepMRI,ultrasound:unresolvedUS,
  },
  longusCapitis:{
    ct:fact('Locate the prevertebral muscle anterior to the cervical transverse-process region and trace superiorly towards the skull base. Keep longus colli separate; it is not another name for this muscle.'),
    mri:fact('Longus capitis lies anterior to the cervical transverse-process anterior tubercles; at C1 it is anterior to the lateral mass. Use these landmarks to distinguish neighbouring prevertebral muscles.','cervicalMRI'),
    ultrasound:fact('This atlas supplies no validated sonographic segmentation of longus capitis. Do not transfer a posterior neck ultrasound view or a longus-colli label to this anterior skull-reaching muscle.'),
  },
  anteriorCranial:{
    ct:fact('Orient to the atlas and skull-base attachment below. Rectus capitis anterior and lateralis are anterior/lateral craniocervical muscles, not the four posterior suboccipital muscles.','craniocervical'),
    mri:fact('Confirm coverage of the atlas–occiput interval and follow the named attachment. The model supplies no validated MRI contour for this small muscle or its neighbouring ligaments.'),
    ultrasound:fact('No direct sonographic correspondence is validated here. A posterior suboccipital window must not be presented as proof of this anterior/lateral muscle.'),
  },
  posteriorSuboccipital:{
    ct:fact('Distinguish the C1 posterior tubercle, C2 spinous process and C1 transverse process before following the attachment below. Obliquus capitis inferior connects C2 to C1, without a skull insertion.','craniocervical'),
    mri:fact('These small muscles run obliquely and some are fan-shaped. One routine axial area is not a validated whole-muscle volume; follow the structure through appropriate acquired planes.','cervicalMRI'),
    ultrasound:fact('Research sonography measures visible areas of rectus capitis posterior major/minor and obliquus capitis inferior, not complete muscle volumes. A local view cannot be assumed to assess all four muscles.','suboccipitalUS'),
  },
  obliquusSuperior:{
    ct:fact('Follow the C1 transverse-process attachment to the occiput. Unlike obliquus capitis inferior, the superior muscle reaches the skull.','craniocervical'),
    mri:fact('Confirm that both the atlas and occipital endpoint are covered. The oblique course should not be replaced by a single axial contour or a mirror of the inferior oblique muscle.'),
    ultrasound:fact('The superior oblique can be followed in a dedicated long-axis view from the atlas towards the occiput. This does not map the neighbouring vertebral artery.','paraspinalUS'),
  },
  coccygeus:{
    ct:fact('Use the ischial spine, lower sacrum and coccyx to orient this posterior pelvic-diaphragm muscle. Do not merge it with levator ani or use the mesh to declare the sacrospinous ligament intact.'),
    mri:fact('Trace coccygeus between the ischial spine and lower sacrum/coccyx at the posterior pelvic diaphragm. Its contour is not the whole levator ani or a dynamic test of pelvic support.','pelvicMRI'),
    ultrasound:fact('Dedicated expert pelvic-sidewall views can identify coccygeus beside the lower sacrum, with the sacrospinous ligament behind it. A routine abdominal view is not equivalent to this targeted assessment.','pelvicUS'),
  },
};
const patternFor:Record<string,string>={
  'trapezius-ascending':'trapezius','trapezius-transverse':'trapezius','trapezius-descending':'trapezius',
  'lumbar-rotator':'smallSpinal','cervical-rotator':'smallSpinal','thoracic-rotator':'thoracicDeep',
  'iliocostalis-lumborum':'lumbarErector','iliocostalis-thoracis':'thoracicErector','longissimus-thoracis':'thoracicErector','spinalis':'thoracicErector',
  'semispinalis-thoracis':'thoracicDeep','serratus-posterior-inferior':'serratusPosterior','serratus-posterior-superior':'serratusPosterior',
  'lateral-lumbar-intertransversarius':'smallSpinal','medial-lumbar-intertransversarius':'smallSpinal','interspinalis-thoracis':'smallSpinal',
  'longus-capitis':'longusCapitis','rectus-capitis-anterior':'anteriorCranial','rectus-capitis-lateralis':'anteriorCranial',
  'rectus-capitis-posterior-major':'posteriorSuboccipital','rectus-capitis-posterior-minor':'posteriorSuboccipital','obliquus-capitis-inferior':'posteriorSuboccipital','obliquus-capitis-superior':'obliquusSuperior',
  'splenius-capitis':'spleniusCapitis','splenius-cervicis':'cervicalLateral','longissimus-capitis':'longissimusCapitis','longissimus-cervicis':'cervicalLateral',
  'semispinalis-capitis':'semispinalisCapitis','semispinalis-cervicis':'semispinalisCervicis','iliocostalis-cervicis':'cervicalLateral',
};
type Group={fmaIds:readonly string[];focus:Focus;landmark:string;anatomyReferences:readonly string[];limitation:string};
// Reuse existing original attachment teaching and source cautions without relabelling geometry.
export const spinePelvicImagingGroups:Record<string,Group>=Object.fromEntries([
  ...[...trunkMuscleLessons.filter(l=>l.region==='spine'),...deepNeckMuscleLessons,...neckMuscleLessons.filter(l=>l.key==='cervical-rotator')].map(l=>[l.key,{
    fmaIds:l.fmaIds,focus:patterns[patternFor[l.key]],landmark:`Attachment orientation: ${l.origin} → ${l.insertion}`,
    anatomyReferences:l.references,limitation:l.caution,
  }]),
  ...axialGroups.filter(g=>['interspinales','cervical-intertransversarii','levatores-breves'].includes(g.id)).flatMap(g=>
    (g.id==='levatores-breves'?[g.fmaIds]:g.fmaIds.map(id=>[id])).map(ids=>[`${g.id}-${ids[0]}`,{
      fmaIds:ids,focus:g.id==='levatores-breves'?patterns.ribElevators:patterns.smallSpinal,landmark:g.anatomy,anatomyReferences:g.references,limitation:g.caution,
    }]),
  ),
  ['coccygeus',{
    fmaIds:['FMA46443','FMA46444'],focus:patterns.coccygeus,
    landmark:'Attachment orientation: ischial spine → lateral coccyx and lower sacrum. This is the posterior pelvic-diaphragm muscle, not a source identification of the superficial perineal group.',
    anatomyReferences:['https://anatomy.ttuhscep.edu/reproductive_system/pelvicwall_tables.html'],
    limitation:'The muscle surface does not independently segment pelvic fascia, sacrospinous ligament layers or innervating branches. No dynamic contraction, support measurement or patient registration is supplied.',
  }],
]);
