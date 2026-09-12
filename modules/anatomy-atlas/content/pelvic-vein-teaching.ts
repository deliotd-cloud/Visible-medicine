// Original factual synthesis. References are reading links, not reusable image licences.
export const pelvicVeinTeachingReferences = {
  lumbar: 'https://pubmed.ncbi.nlm.nih.gov/17373712/',
  lumbarExposure: 'https://pubmed.ncbi.nlm.nih.gov/31077904/',
  corona: 'https://pubmed.ncbi.nlm.nih.gov/11210207/',
  coronaCt: 'https://pubmed.ncbi.nlm.nih.gov/40890255/',
  presacral: 'https://pubmed.ncbi.nlm.nih.gov/40168452/',
  pelvicBleeding: 'https://pubmed.ncbi.nlm.nih.gov/32940788/',
  pelvicDisorders: 'https://pubmed.ncbi.nlm.nih.gov/33529720/',
  pelvicMr: 'https://pubmed.ncbi.nlm.nih.gov/18718774/',
  dynamicMr: 'https://pubmed.ncbi.nlm.nih.gov/20846985/',
  pelvicUs: 'https://pubmed.ncbi.nlm.nih.gov/40537052/',
  perineum: 'https://anatomy.ttuhscep.edu/anatomytables/veins_pelvis_perineum.html',
} as const;
type Ref = keyof typeof pelvicVeinTeachingReferences;
type Topic = { body: string; references: readonly Ref[] };
const draft = (body: string, ...references: Ref[]): Topic => ({ body, references });
export const pelvicVeinTeachingGroups = {
  iliolumbar: ['FMA18904', 'FMA18903'],
  inferiorGluteal: ['FMA18913', 'FMA18912'],
  superiorGluteal: ['FMA18910', 'FMA18909'],
  obturator: ['FMA18916', 'FMA18915'],
  pudendal: ['FMA18918'],
  lateralSacral: ['FMA18906'],
} as const;
export type PelvicVeinTeachingGroup = keyof typeof pelvicVeinTeachingGroups;
export type PelvicVeinTeachingTopic = 'function' | 'clinical' | 'pathology' | 'ct' | 'mri' | 'ultrasound';

const glutealFunction = draft('Gluteal venous return reaches the internal iliac system. The displayed segment represents only part of that drainage, not a measured territory or a complete set of communicating veins.', 'pelvicBleeding');
const reflux = draft('Pelvic venous disease may involve reflux, obstruction or both. Symptoms, varices and haemodynamic findings must be considered together; a large reference vein or an anatomical variant alone is not a disease diagnosis.', 'pelvicDisorders');
const mr = draft('MR venography can depict pelvic venous anatomy; time-resolved acquisitions can assess contrast passage and reflux. A routine static pelvic MRI is not equivalent to that flow assessment. Published studies of ovarian/internal iliac systems do not validate visibility or diagnostic accuracy for every small named tributary here.', 'pelvicMr', 'dynamicMr');
const us = draft('Duplex assessment combines venous anatomy with acquired flow information. A study comparing transvaginal duplex with venography found that posture and the reflux criterion affected accuracy. That female-pelvic evidence is not a validated scanning route or threshold for this male donor’s individual gluteal or pudendal branch.', 'pelvicUs');
const ct = draft('On a cleared contrast-enhanced CT, trace the selected vein through consecutive images and multiplanar views before assigning its name. Venous contrast filling and continuity in that acquisition matter; an adjacent artery, a single cross-section or the atlas colour is insufficient. This is an orientation task, not an acquisition protocol.', 'coronaCt');

export const pelvicVeinTeaching: Record<PelvicVeinTeachingGroup, Partial<Record<PelvicVeinTeachingTopic, Topic>>> = {
  iliolumbar: {
    clinical: draft('Iliolumbar veins lie near lower-lumbar anterior and lateral exposure routes. Their variable trunks and neighbouring neural structures make the actual vessel course important; this atlas does not supply a patient-specific operative corridor.', 'lumbarExposure'),
    pathology: draft('Injury to an iliolumbar vein can cause bleeding during lumbar exposure. Do not label the normal venous variant itself as pathology, or use a model gap as evidence of laceration.', 'lumbarExposure'),
    ct: draft('Identify the iliac receiving vein and trace lumbar tributaries on the patient study rather than assuming one common trunk. Cadaveric and venographic evidence describes variable iliolumbar arrangements; this source surface does not establish the patient’s termination.', 'lumbar'),
  },
  inferiorGluteal: {
    function: glutealFunction,
    clinical: draft('Gluteal venous connections can link pelvic and extra-pelvic varices. Relate symptoms to the demonstrated reflux or obstruction rather than assigning a pelvic cause to every visible lower-limb vein.', 'pelvicDisorders'),
    pathology: reflux, ct, mri: mr, ultrasound: us,
  },
  superiorGluteal: {
    function: glutealFunction,
    clinical: draft('The gluteal and internal iliac venous systems are relevant to pelvic bleeding and collateral assessment. These particularly short superior-gluteal source surfaces cannot establish the extent or severity of either condition.', 'pelvicBleeding'),
    pathology: reflux, ct, mri: mr, ultrasound: us,
  },
  obturator: {
    function: draft('Obturator venous return may communicate with the external iliac system over the superior pubic ramus. A variable communicating route is distinct from a uniform direct termination in every individual.', 'corona'),
    clinical: draft('A venous corona mortis is a communication between obturator and external iliac systems near the superior pubic ramus. It is clinically relevant in pelvic and groin procedures, but is not separately demonstrated or validated by this selected obturator surface.', 'corona'),
    pathology: draft('A corona mortis is an anatomical variant, not itself a disease. Disruption can be a bleeding source; apparent contact between this mesh and another vein does not show the communication or prove injury.', 'corona'),
    ct: draft('Contrast-enhanced CT studies demonstrate diverse venous corona-mortis arrangements. Inspect continuity across the superior pubic ramus and the receiving iliac system; do not infer a venous communication from an arterial-phase reconstruction or copy a population prevalence onto this donor.', 'coronaCt'),
  },
  pudendal: {
    clinical: draft('Internal pudendal drainage must be distinguished from external pudendal and deep dorsal routes. Genital or perineal varices require their actual source and haemodynamics to be assessed; the named internal pudendal surface alone cannot identify the responsible reflux pathway.', 'perineum', 'pelvicDisorders'),
    pathology: reflux, ct, mri: mr, ultrasound: us,
  },
  lateralSacral: {
    function: draft('Lateral sacral veins participate in a communicating sacral venous network. Cadaveric work describes transverse connections; this single right-sided selection does not reproduce that complete plexus.', 'presacral'),
    clinical: draft('Presacral veins are relevant to bleeding during pelvic operations. A female-cadaver study described relationships between lateral sacral veins, piriformis fascia and sacral nerves; its measured distances are not transferred to this male reference or used as safety margins.', 'presacral', 'pelvicBleeding'),
    pathology: draft('Presacral venous injury may involve communicating plexiform channels rather than one isolated vessel. The missing channels and left-sided hold in this atlas are coverage limitations, not evidence of venous obstruction or avulsion.', 'pelvicBleeding'),
  },
};

export const pelvicVeinSelectionNotes: Record<PelvicVeinTeachingGroup, string> = {
  iliolumbar: 'Compare the selected side with the iliac receiving veins and lower-lumbar region. Tributaries and outlet variants are not reconstructed.',
  inferiorGluteal: 'Keep the inferior and superior gluteal identities separate. The source is a venous segment, not a complete gluteal territory or a segmented nerve.',
  superiorGluteal: 'Only the short supplied superior-gluteal extent is shown. Do not extrapolate a complete vessel or infer pathological truncation.',
  obturator: 'Use the superior pubic ramus as context. No separate corona-mortis connection is admitted by this teaching note.',
  pudendal: 'Right-sided source only. The left internal pudendal definition remains held; neither a mirrored vessel nor the pudendal canal has been generated.',
  lateralSacral: 'Right-sided source only. The left lateral sacral definition and complete presacral venous plexus remain unavailable.',
};
