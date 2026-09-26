/** Original concise teaching relationships; no donor footprints or tendon geometry. */
export const armAttachmentReference = {
  title: 'UAMS · upper-limb muscle anatomy',
  url: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/muscle-tables/muscles-of-the-upper-limb/',
};
export const attachmentBones = {
  scapula: ['FMA13395', 'FMA13396'],
  humerus: ['FMA23130', 'FMA23131'],
  radius: ['FMA23464', 'FMA23465'],
  ulna: ['FMA23467', 'FMA23468'],
} as const;
type Bone = keyof typeof attachmentBones;
type Attachment = { bone: Bone; site: string };
type MuscleAttachment = {
  key: string;
  fmas: readonly [string, string];
  proximal: Attachment;
  distal: Attachment;
};
export const armAttachments: readonly MuscleAttachment[] = [
  {
    key: 'supraspinatus',
    fmas: ['FMA32544', 'FMA32545'],
    proximal: { bone: 'scapula', site: 'Supraspinous fossa' },
    distal: { bone: 'humerus', site: 'Superior greater-tubercle facet' },
  },
  {
    key: 'infraspinatus',
    fmas: ['FMA32547', 'FMA32548'],
    proximal: { bone: 'scapula', site: 'Infraspinous fossa' },
    distal: { bone: 'humerus', site: 'Middle greater-tubercle facet' },
  },
  {
    key: 'teres-minor',
    fmas: ['FMA32553', 'FMA32554'],
    proximal: { bone: 'scapula', site: 'Lateral border' },
    distal: { bone: 'humerus', site: 'Inferior greater-tubercle facet' },
  },
  {
    key: 'subscapularis',
    fmas: ['FMA13414', 'FMA13415'],
    proximal: { bone: 'scapula', site: 'Subscapular fossa' },
    distal: { bone: 'humerus', site: 'Lesser tubercle' },
  },
  {
    key: 'teres-major',
    fmas: ['FMA32551', 'FMA32552'],
    proximal: { bone: 'scapula', site: 'Posterior inferior-angle region' },
    distal: { bone: 'humerus', site: 'Medial intertubercular lip' },
  },
  {
    key: 'biceps-short',
    fmas: ['FMA37684', 'FMA37685'],
    proximal: { bone: 'scapula', site: 'Coracoid tip' },
    distal: { bone: 'radius', site: 'Radial tuberosity' },
  },
  {
    key: 'biceps-long',
    fmas: ['FMA37686', 'FMA37687'],
    proximal: {
      bone: 'scapula',
      site: 'Supraglenoid region; soft-tissue contributions omitted',
    },
    distal: { bone: 'radius', site: 'Radial tuberosity' },
  },
  {
    key: 'coracobrachialis',
    fmas: ['FMA37665', 'FMA37666'],
    proximal: { bone: 'scapula', site: 'Coracoid process' },
    distal: { bone: 'humerus', site: 'Medial midshaft' },
  },
  {
    key: 'brachialis',
    fmas: ['FMA37668', 'FMA37669'],
    proximal: { bone: 'humerus', site: 'Distal anterior shaft' },
    distal: { bone: 'ulna', site: 'Proximal anterior ulna' },
  },
  {
    key: 'triceps-long',
    fmas: ['FMA37699', 'FMA37700'],
    proximal: { bone: 'scapula', site: 'Infraglenoid tubercle' },
    distal: { bone: 'ulna', site: 'Olecranon' },
  },
  {
    key: 'triceps-lateral',
    fmas: ['FMA37697', 'FMA37698'],
    proximal: { bone: 'humerus', site: 'Posterior shaft above radial groove' },
    distal: { bone: 'ulna', site: 'Olecranon' },
  },
  {
    key: 'triceps-medial',
    fmas: ['FMA37695', 'FMA37696'],
    proximal: { bone: 'humerus', site: 'Posterior shaft below radial groove' },
    distal: { bone: 'ulna', site: 'Olecranon' },
  },
];
