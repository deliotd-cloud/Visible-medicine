// Original text-only orientation drafts. References are factual reading, not asset licences.
const back = ['https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html', 'https://www.orthoinfo.org/treatment/x-rays-ct-scans-and-mris/'] as const;
const neck = ['https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html', 'https://www.orthoinfo.org/treatment/x-rays-ct-scans-and-mris/'] as const;
const trapeziusAscendingRefs = ['https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-back/ascending-part-of-trapezius-muscle/20192', 'https://www.orthoinfo.org/treatment/x-rays-ct-scans-and-mris/'] as const;
const trapeziusDescendingRefs = ['https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-back/descending-part-of-trapezius-muscle/20351', 'https://www.orthoinfo.org/treatment/x-rays-ct-scans-and-mris/'] as const;
const trapeziusTransverseRefs = ['https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-back/transverse-part-of-trapezius-muscle/19991', 'https://www.orthoinfo.org/treatment/x-rays-ct-scans-and-mris/'] as const;
const intermediate = ['https://anatomy.ttuhscep.edu/schemes/back_tables.html', 'https://www.orthoinfo.org/treatment/x-rays-ct-scans-and-mris/'] as const;
const thorax = ['https://anatomy.ttuhscep.edu/anatomytables/muscles_thorax.html', 'https://www.orthoinfo.org/treatment/x-rays-ct-scans-and-mris/'] as const;

export const spinalMuscleXrayFacts = {
  trapeziusAscending: {
    body: 'Orient the ascending part across the lower posterior thorax toward the scapular spine.',
    distinction: 'It is the inferior part of trapezius, below the transverse and descending parts; the scapula is its useful lateral landmark.',
    projection: 'The scapular spine may orient the region on a plain film, but its edge cannot mark the ascending-fiber boundary.',
    references: trapeziusAscendingRefs,
  },
  trapeziusDescending: {
    body: 'Orient the descending part from the posterior skull and neck toward the lateral clavicle and acromial region.',
    distinction: 'It is the upper trapezius part, distinct from the transverse fibers across the scapular spine.',
    projection: 'Skull, clavicle and acromion provide bony context; their projected outlines do not isolate these fibers.',
    references: trapeziusDescendingRefs,
  },
  trapeziusTransverse: {
    body: 'Follow the posterior neck and upper thoracic midline laterally toward the scapular spine.',
    distinction: 'This middle part runs across the shoulder girdle between the descending and ascending trapezius parts.',
    projection: 'On a frontal projection the scapula can overlap the ribs; no line on that image divides the trapezius parts.',
    references: trapeziusTransverseRefs,
  },
  iliocostalisCervicis: {
    body: 'Orient the cervical portion of the lateral erector-spinae column beside the lower neck and upper ribs.',
    distinction: 'It continues the iliocostalis column above its thoracic portion, lateral to longissimus.',
    projection: 'Cervical transverse processes and upper ribs give regional landmarks, not a separate muscle contour.',
    references: back,
  },
  iliocostalisLumborum: {
    body: 'Orient the lumbar portion along the lateral posterior trunk between the pelvic crest and lower ribs.',
    distinction: 'This is the caudal iliocostalis portion; longissimus lies more medially within erector spinae.',
    projection: 'Pelvis and lower ribs bracket its region, while overlying soft tissues prevent a named boundary on plain film.',
    references: back,
  },
  iliocostalisThoracis: {
    body: 'Use the posterior rib angles to orient the thoracic portion of the lateral erector-spinae column.',
    distinction: 'It lies between the cervical and lumbar iliocostalis portions, lateral to the longissimus column.',
    projection: 'Rib shadows overlap its expected course and cannot identify its individual fibers.',
    references: back,
  },
  longissimusCapitis: {
    body: 'Orient the upper intermediate erector-spinae column toward the mastoid region behind the ear.',
    distinction: 'Its headward course differs from longissimus cervicis, which remains in the neck.',
    projection: 'The mastoid is a bony orientation point, not a radiographic sign of an intact muscle attachment.',
    references: back,
  },
  longissimusCervicis: {
    body: 'Orient the cervical portion between lower and upper vertebral transverse-process regions.',
    distinction: 'It occupies the intermediate erector-spinae column, between lateral iliocostalis and medial spinalis.',
    projection: 'Projected cervical bones supply regional context without separating this portion from neighboring muscles.',
    references: back,
  },
  longissimusThoracis: {
    body: 'Trace the intermediate erector-spinae column beside the thoracic vertebrae and posterior ribs.',
    distinction: 'It sits medial to iliocostalis and lateral to spinalis; the name denotes the thoracic portion.',
    projection: 'A spine or chest film can orient vertebrae and ribs but cannot label the intervening longissimus edge.',
    references: back,
  },
  semispinalisCapitis: {
    body: 'Orient this deep posterior-neck part from the lower neck and upper back toward the occiput.',
    distinction: 'Unlike the cervicis and thoracis portions, capitis reaches the posterior skull.',
    projection: 'Occipital bone and cervical spine orient the course; overlap hides any separate capitis outline.',
    references: back,
  },
  semispinalisCervicis: {
    body: 'Orient deep fibers passing from lower transverse-process regions toward upper cervical spinous processes.',
    distinction: 'This vertebra-to-vertebra part remains below the skull-reaching semispinalis capitis.',
    projection: 'Cervical spinous shadows cannot distinguish this deep part from adjacent transversospinal fibers.',
    references: back,
  },
  semispinalisThoracis: {
    body: 'Orient deep thoracic fibers between transverse-process and higher spinous-process regions.',
    distinction: 'It is the thoracic semispinalis part, deeper than the erector-spinae columns.',
    projection: 'Ribs and vertebrae overlap this course; a projected spinous process is only a landmark.',
    references: back,
  },
  spleniusCapitis: {
    body: 'Follow the oblique posterior-neck course from midline toward the mastoid and lateral occiput.',
    distinction: 'The headward destination distinguishes it from splenius cervicis, which ends on upper cervical processes.',
    projection: 'A lateral skull or neck film can show bony orientation without resolving its own border.',
    references: neck,
  },
  spleniusCervicis: {
    body: 'Orient the oblique posterior-neck part from lower midline toward upper cervical transverse processes.',
    distinction: 'It ends in the neck rather than at the mastoid or occiput reached by splenius capitis.',
    projection: 'Upper cervical processes are regional landmarks, not proof of this part’s attachment.',
    references: neck,
  },
  serratusPosteriorInferior: {
    body: 'Orient this thin intermediate-layer sheet from the lower thoracic–upper lumbar midline toward lower posterior ribs.',
    distinction: 'Its lower-rib course contrasts with serratus posterior superior at the upper thorax.',
    projection: 'Lower-rib shadows overlap the expected sheet; a plain film does not outline its slips.',
    references: intermediate,
  },
  serratusPosteriorSuperior: {
    body: 'Orient this thin intermediate-layer sheet from the lower neck–upper thoracic midline toward upper posterior ribs.',
    distinction: 'Its upper-rib course differs from the lower-rib serratus posterior inferior.',
    projection: 'Upper ribs provide orientation but do not show a separate sheet boundary.',
    references: intermediate,
  },
  obliquusInferior: {
    body: 'Orient the short suboccipital course between the axis spinous process and atlas transverse process.',
    distinction: 'The inferior oblique does not reach the skull; superior oblique passes from atlas toward occiput.',
    projection: 'Atlas and axis may provide bony context, while superposition prevents a named muscle outline.',
    references: back,
  },
  obliquusSuperior: {
    body: 'Orient the suboccipital course from the atlas transverse process toward the occiput.',
    distinction: 'It reaches the skull, unlike the inferior oblique running between axis and atlas.',
    projection: 'The craniovertebral bony relationship is teachable; the small muscle is not separately delineated.',
    references: back,
  },
  rectusPosteriorMajor: {
    body: 'Orient the posterior axis-to-occiput course beside the midline.',
    distinction: 'It begins at the axis, while rectus capitis posterior minor begins at the posterior atlas.',
    projection: 'Axis and occiput are projected landmarks, not a visible major-muscle margin.',
    references: back,
  },
  rectusPosteriorMinor: {
    body: 'Orient the short deep atlas-to-medial-occiput course at the back of the craniovertebral junction.',
    distinction: 'It is deeper and more medial than rectus capitis posterior major, which begins at the axis.',
    projection: 'A plain film cannot resolve this small paired muscle against overlapping occipital and atlas shadows.',
    references: back,
  },
  interspinalisThoracis: {
    body: 'Orient the thoracic interspinalis family in the intervals between adjacent spinous processes.',
    distinction: 'This midline interval differs from the lateral transverse-process interval of intertransversarii.',
    projection: 'Spinous-process alignment provides a regional guide, not a visible thoracic slip.',
    references: back,
  },
  interspinalesCervicis: {
    body: 'Orient small cervical slips between neighboring posterior spinous processes.',
    distinction: 'Their midline course contrasts with the cervical intertransversarii beside transverse processes.',
    projection: 'A cervical film can orient spinous processes but not resolve each interspinal slip.',
    references: back,
  },
  interspinalesLumborum: {
    body: 'Orient small lumbar slips in the posterior midline intervals between spinous processes.',
    distinction: 'They link spinous rather than transverse-process regions.',
    projection: 'Visible lumbar spines do not establish the boundary or continuity of these slips.',
    references: back,
  },
  cervicalRotator: {
    body: 'Orient the cervical rotatores within the deep transverse-to-spinous process family.',
    distinction: 'Rotatores span shorter vertebral intervals than semispinalis in this transversospinal group.',
    projection: 'Cervical process shadows overlap the short deep course; individual slips are not identifiable.',
    references: back,
  },
  lumbarRotator: {
    body: 'Orient lumbar rotatores deep beside the posterior vertebral arches, from transverse toward nearby spinous-process regions.',
    distinction: 'They belong to the short transversospinal family, not the longitudinal erector-spinae columns.',
    projection: 'Lumbar posterior elements are landmarks only; no individual rotator boundary follows from them.',
    references: back,
  },
  thoracicRotator: {
    body: 'Orient the aggregate thoracic rotatores near the rib-bearing posterior vertebral arches.',
    distinction: 'Keep this source as a thoracic family; its short transversospinal course differs from semispinalis.',
    projection: 'Overlapping thoracic ribs and processes prevent assignment of a separate slip or side from plain film.',
    references: back,
  },
  lumbarIntertransversariusLateral: {
    body: 'Orient the lateral lumbar intertransversarii between transverse-process regions of neighboring vertebral levels.',
    distinction: 'This lateral family stays distinct from the medial lumbar intertransversarii; neither is a spinous-process muscle.',
    projection: 'A lumbar projection may orient transverse processes but cannot divide the two small families.',
    references: back,
  },
  lumbarIntertransversariusMedial: {
    body: 'Orient the medial lumbar intertransversarii deep beside the posterior arches of neighboring lumbar vertebrae.',
    distinction: 'Their medial position distinguishes them from lateral lumbar intertransversarii at family level; this draft assigns no exact process-to-process attachment.',
    projection: 'Projected lumbar elements do not validate a medial slip or an exact attachment map.',
    references: back,
  },
  cervicalIntertransversariiAnterior: {
    body: 'Orient anterior cervical intertransversarii in adjacent transverse-process intervals of the neck.',
    distinction: 'Keep the anterior and posterior cervical groups separate in the 3D source view.',
    projection: 'A radiograph can show cervical bony orientation but cannot partition these small soft-tissue groups.',
    references: back,
  },
  cervicalIntertransversariiPosterior: {
    body: 'Orient posterior cervical intertransversarii beside neighboring transverse-process regions.',
    distinction: 'This posterior group is distinct from the anterior cervical intertransversarii and from midline interspinales.',
    projection: 'Projected processes provide context without a posterior-group contour.',
    references: back,
  },
  levatoresCostarumBreves: {
    body: 'Orient short rib elevators from posterior transverse-process regions toward the rib immediately below.',
    distinction: 'These brief costal spans differ from serratus posterior sheets, which cross a broader posterior thorax.',
    projection: 'A rib and neighboring vertebra orient the region; their image does not reveal an individual short slip.',
    references: thorax,
  },
  spinalis: {
    body: 'Orient the aggregate spinalis source along the most medial erector-spinae column beside the spinous processes.',
    distinction: 'It is medial to longissimus and iliocostalis; retain this source as one aggregate, without invented subdivisions.',
    projection: 'A spine film supplies a midline landmark, not a spinalis border or segment-specific attachment.',
    references: back,
  },
} as const;

export const spinalMuscleXrayLimitations = [
  'These are draft anatomical orientation notes, pending revision-bound radiologist review; they do not give a diagnosis or clinical imaging recommendation.',
  'Plain radiographs project overlapping bones and soft tissues. The bony landmarks here do not delineate a separate named muscle boundary or establish attachment or tendon integrity.',
  'The assembled 3D model is neither a simulated X-ray projection nor a registered patient scan. No radiographic visibility, exact source-mesh attachment map or patient-space correspondence is guaranteed.',
] as const;
