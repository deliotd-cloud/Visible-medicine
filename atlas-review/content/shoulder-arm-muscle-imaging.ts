// Original teaching synthesis; reading links confer no permission to reuse figures.
import {shoulderArmLessons} from '../lib/shoulder-arm-curriculum';
export const shoulderArmImagingReferences = {
  shoulderUS:'https://www.essr.org/content-essr/uploads/2016/10/shoulder.pdf',
  elbowUS:'https://www.essr.org/content-essr/uploads/2016/10/elbow.pdf',
  shoulderMRI:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3548665/',
  subscapularisMRI:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8767392/',
  girdleMRI:'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0100292',
  scapularUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11051048/',
  uncommonUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6095189/',
  teresMRI:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4861626/',
  brachialisUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12317799/',
  pectoralRelations:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10668934/',
  mri:'https://www.radiologyinfo.org/en/info/muscmr',
} as const;
type Reference=keyof typeof shoulderArmImagingReferences;
export type ShoulderArmImagingModality='ct'|'mri'|'ultrasound';
type Fact={text:string;references:readonly Reference[]};
const fact=(text:string,...references:Reference[]):Fact=>({text,references});
export const shoulderArmImagingModes:Record<ShoulderArmImagingModality,Fact>={
  ct:fact('This is an anatomical search guide for an already acquired CT, not a recommendation to obtain CT. Mesh colour is not attenuation; a visible muscle belly does not establish tendon integrity.'),
  mri:fact('Check the acquired coverage and sequence. T1-weighted and fluid-sensitive images answer different questions; the mesh contains neither MR signal nor a patient-specific lesion.','mri'),
  ultrasound:fact('A local ultrasound view is not the entire muscle. Confirm the actual side and imaging plane; rotating this model does not generate a sonogram.'),
};
type Focus=Record<ShoulderArmImagingModality,Fact>;
const focus:Record<string,Focus>={
  'serratus-anterior':{
    ct:fact('Follow the rib-facing muscle towards the medial scapular border. Keep its lateral rib attachments separate from the muscles occupying individual interspaces.'),
    mri:fact('Check that the lateral chest wall and scapular attachment are covered. Compare muscle bulk and T1 fat separately from fluid-sensitive signal; a routine shoulder field may be insufficient.','girdleMRI'),
    ultrasound:fact('Use the lateral ribs and overlying muscle as orientation landmarks. The selected slips do not represent intercostal muscle, and rib shadow limits the deeper view.','scapularUS'),
  },
  anconeus:{
    ct:fact('Locate the small posterolateral muscle between the lateral humeral epicondyle and proximal ulna. Do not confuse it with the common extensor origin anterior to it.'),
    mri:fact('Use elbow coverage to inspect this small muscle beside the olecranon. A shoulder-only series cannot assess its distal location; trace continuity across images before assigning an abnormality.','mri'),
    ultrasound:fact('The anatomical search region is posterolateral to the elbow, between the lateral epicondyle and proximal ulna. Confirm the muscle in the actual image rather than transferring the mesh outline.'),
  },
  brachialis:{
    ct:fact('Find the muscle deep to biceps along the anterior distal humerus. Its distal attachment is ulnar, not the radial tuberosity reached by biceps.'),
    mri:fact('Include the distal arm and anterior elbow when following the belly into its ulnar attachment. A proximal-arm image alone cannot establish distal continuity.','mri'),
    ultrasound:fact('Identify brachialis beneath biceps and follow its distal tissue towards the ulna. Keep the radial biceps attachment and adjacent neurovascular structures separate.','brachialisUS'),
  },
  coracobrachialis:{
    ct:fact('Trace the coracoid-origin muscle to the medial humeral shaft. Unlike adjacent biceps it ends in the arm; do not continue its label across the elbow.'),
    mri:fact('At the proximal arm, distinguish coracobrachialis from the short-head biceps belly and nearby pectoralis major tendon. Track serial sections rather than naming a single isolated oval.','pectoralRelations'),
    ultrasound:fact('Start with the coracoid/conjoint-tendon region, then follow coracobrachialis separately into the arm. Sharing a proximal landmark with short-head biceps does not make them one muscle.','uncommonUS'),
  },
  infraspinatus:{
    ct:fact('The scapular spine separates the infraspinous belly from supraspinatus above. Follow laterally towards the posterior greater-tubercle region, without equating muscle visibility with an intact cuff tendon.'),
    mri:fact('Follow the posterior cuff on axial and oblique images; inspect the belly separately on sagittal-oblique coverage. Tendon discontinuity, muscle volume and fatty change are different observations.','shoulderMRI'),
    ultrasound:fact('Below the scapular spine, identify infraspinatus deep to deltoid and distinguish it from teres minor before following the tendon laterally.','shoulderUS'),
  },
  subscapularis:{
    ct:fact('Find the muscle on the anterior, rib-facing scapula and follow it towards the lesser tubercle. Its anterior location distinguishes it from the posterior cuff.'),
    mri:fact('Correlate the lesser-tubercle tendon on axial images with sagittal views and the long-head biceps relationship. Muscle atrophy and tendon detachment need separate image-based assessment.','subscapularisMRI'),
    ultrasound:fact('External rotation exposes the lesser-tubercle tendon. Assess its width in two planes; interspersed muscle between tendon fascicles is not automatically a tear.','shoulderUS'),
  },
  supraspinatus:{
    ct:fact('Orient above the scapular spine, then beneath the acromion towards the greater tubercle. This search path does not demonstrate the thin tendon or bursal surfaces on every CT.'),
    mri:fact('Coronal-oblique images follow the tendon; sagittal-oblique images help assess the muscle belly and adjacent cuff. Keep articular-side, bursal-side and intratendinous findings distinct.','shoulderMRI'),
    ultrasound:fact('Inspect the tendon in two planes and correct beam angle near its insertion. Anisotropy can mimic a dark defect; the overlying bursa is separate.','shoulderUS'),
  },
  'teres-major':{
    ct:fact('Trace the inferior scapular muscle towards the medial intertubercular region. It contributes to the posterior axillary fold and is not part of the rotator cuff.'),
    mri:fact('Confirm coverage from scapular origin through the myotendinous region to the humeral attachment. Standard shoulder coverage may omit teres major injury; do not treat an unseen segment as normal.','teresMRI'),
    ultrasound:fact('Follow teres major towards its humeral attachment, distinguishing the adjacent latissimus dorsi. Tendons in this crowded region should not be identified solely by proximity.','uncommonUS'),
  },
  'teres-minor':{
    ct:fact('Search below infraspinatus along the lateral scapula. Keep the small posterior cuff muscle distinct from the more inferior teres major, which has a different humeral attachment.'),
    mri:fact('Identify teres minor separately from infraspinatus on sagittal-oblique images. Its size and fat content must be assessed in the actual muscle, not inferred from the neighbouring cuff.','shoulderMRI'),
    ultrasound:fact('Identify the small muscle inferior to infraspinatus, then trace its own tendon towards the greater tubercle. A single posterior cuff view may mix both.','shoulderUS'),
  },
  'levator-scapulae':{
    ct:fact('Trace from the upper cervical transverse-process region towards the superior medial scapula. Scan coverage must include both regions before assuming the whole muscle has been shown.'),
    mri:fact('Follow the cervical-to-scapular course rather than relying on one axial level. A muscle seen at the neck edge of shoulder imaging may be incompletely sampled.','girdleMRI'),
    ultrasound:fact('Use cervical and superior-scapular landmarks to follow the muscle. Its relationship to trapezius and adjacent neck muscles changes with level.','scapularUS'),
  },
  'rhomboid-major':{
    ct:fact('Follow the band between upper thoracic spinous processes and the medial scapula below the scapular spine. It lies on the back, not within the rib-facing subscapular fossa.'),
    mri:fact('Include the medial scapular border and thoracic attachment in the field. Compare muscle bulk and internal signal without using the donor mesh as a normal-size threshold.','girdleMRI'),
    ultrasound:fact('Identify rhomboid major beneath trapezius near the medial scapular border. Keep deeper ribs and pleural interface distinct from the muscle.','scapularUS'),
  },
  'rhomboid-minor':{
    ct:fact('Use the root of the scapular spine to locate this smaller, superior rhomboid. Do not label the entire muscle band below this level as rhomboid minor.'),
    mri:fact('Relate the smaller superior rhomboid to the scapular-spine level and adjacent major muscle. Closely apposed muscles may not have the model’s crisp boundaries.','girdleMRI'),
    ultrasound:fact('Seek the smaller rhomboid at the scapular-spine level, superior to rhomboid major. Follow its course across views; adjoining muscle interfaces can be difficult to separate.','scapularUS'),
  },
  'deltoid-clavicular':{
    ct:fact('Follow the anterior deltoid from the lateral clavicle towards the humeral deltoid tuberosity. Keep the neighbouring pectoral muscle separate at the anterior shoulder.'),
    mri:fact('Inspect the anterior deltoid on axial images alongside the underlying cuff and humerus. The selected part is not an independent whole deltoid or a measured functional compartment.','shoulderMRI'),
    ultrasound:fact('Identify the superficial anterior deltoid over subscapularis and proximal biceps landmarks. A deep tendon view does not fully assess the selected deltoid portion.','shoulderUS'),
  },
  'deltoid-acromial':{
    ct:fact('Follow the lateral shoulder cap from the acromion down the humerus. The space deep to it contains other structures and should not be coloured as additional deltoid.'),
    mri:fact('Separate lateral deltoid from the deeper subacromial-subdeltoid bursa and cuff. Fluid in a bursa is not synonymous with oedema inside the muscle.','shoulderMRI'),
    ultrasound:fact('The lateral deltoid overlies the bursa and supraspinatus tendon. Identify each layer in the acquired image rather than merging them into one superficial band.','shoulderUS'),
  },
  'deltoid-spinal':{
    ct:fact('Follow the posterior deltoid from the scapular spine towards the humerus. Distinguish this superficial shoulder cap from infraspinatus and teres minor beneath it.'),
    mri:fact('Inspect the posterior deltoid separately from deeper cuff muscles. A finding in one does not establish the condition of the other; confirm coverage of the distal selected part.','mri'),
    ultrasound:fact('Posterior deltoid is superficial to the posterior cuff. The anatomical distinction requires following the visible interfaces, not interpreting every posterior muscle as infraspinatus.'),
  },
  'biceps-short-head':{
    ct:fact('Trace the coracoid-origin head into the anterior arm. Do not assign the intertubercular-groove course of the long-head tendon to this short-head selection.'),
    mri:fact('Use coracoid and proximal-arm sections to distinguish short-head biceps from coracobrachialis. A glenohumeral biceps-anchor image pertains to the long head, not this head.','pectoralRelations'),
    ultrasound:fact('At the coracoid, identify the conjoint-tendon region and follow short-head biceps separately from coracobrachialis into the arm.','uncommonUS'),
  },
  'biceps-long-head':{
    ct:fact('Use the intertubercular groove as a proximal landmark. This head’s glenohumeral origin differs from the coracoid-origin short head; CT bone landmarks do not prove tendon continuity.'),
    mri:fact('Trace the long-head tendon between the superior joint anchor, rotator interval and groove. Its relationship to subscapularis helps orientation; the groove segment is not the entire tendon.','subscapularisMRI'),
    ultrasound:fact('Locate the tendon in the groove and follow it towards the myotendinous junction. This accessible segment is not a complete assessment of the intra-articular anchor.','shoulderUS'),
  },
  'triceps-medial-head':{
    ct:fact('Locate the deep posterior-arm component arising below the radial groove. This humeral-origin head should not be extended proximally to the scapular infraglenoid attachment.'),
    mri:fact('Trace the deep component through distal-arm and elbow images towards the olecranon. A single tendon image cannot establish integrity of every triceps head.','mri'),
    ultrasound:fact('Examine the posterior elbow in both axes, separating triceps tissue from the deeper recess. Seeing the distal tendon does not independently map the medial head.','elbowUS'),
  },
  'triceps-lateral-head':{
    ct:fact('Orient to the posterolateral humeral origin above the radial groove, then follow distally. Keep it distinct from the scapular-origin long head and deeper medial head.'),
    mri:fact('Check the lateral posterior-arm belly as well as the distal attachment. A shoulder-limited acquisition does not cover the whole head or elbow tendon.','mri'),
    ultrasound:fact('Follow the posterior muscle towards the olecranon in long and short axes. The distal triceps apparatus is shared; it is not an isolated lateral-head tendon model.','elbowUS'),
  },
  'triceps-long-head':{
    ct:fact('Trace from the infraglenoid scapula between the teres muscles into the posterior arm. Unlike the humeral-origin heads, this component crosses the shoulder as well as the elbow.'),
    mri:fact('Coverage must extend beyond the shoulder to follow this long component distally. A proximal attachment image alone cannot assess the full muscle or olecranon insertion.','mri'),
    ultrasound:fact('Distal posterior-elbow views assess triceps near the olecranon, not its scapular origin. Keep proximal and distal observations separately localised.','elbowUS'),
  },
};
// Reuse the already authored attachment teaching and its source references; no mirroring.
export const shoulderArmImagingGroups=Object.fromEntries(shoulderArmLessons.map(lesson=>[lesson.key,{
  fmaIds:lesson.fmaIds,focus:focus[lesson.key],
  landmark:`Attachment orientation: ${lesson.origin} → ${lesson.insertion}`,
  anatomyReferences:lesson.references,
  limitation:lesson.representation==='muscle'
    ?'This retained surface does not independently resolve tendon layers, motor-nerve fascicles or patient-specific abnormalities.'
    :'This selection is one head or portion, not the whole muscle or an independently validated tendon. Do not infer internal fibre boundaries from its display colour.',
}]));
