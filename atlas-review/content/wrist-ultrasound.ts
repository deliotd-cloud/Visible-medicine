// Original draft orientation prose; links only, no publisher images or text imported.
export const wristUltrasoundGroups = {
  scaphoid: ['FMA24436', 'FMA24435'],
  lunate: ['FMA24438', 'FMA24437'],
  pisiform: ['FMA24442', 'FMA24441'],
  hamate: ['FMA24449', 'FMA24448'],
} as const;
export type WristUltrasoundGroup = keyof typeof wristUltrasoundGroups;
export const wristUltrasoundReferences = [
  'https://essr.org/content-essr/uploads/2016/10/wrist.pdf',
  'https://www.radiologyinfo.org/en/info/musculous',
];
export const wristUltrasoundTopics: Record<WristUltrasoundGroup, {body: string; landmark: string}> = {
  scaphoid: {
    body: 'The scaphoid tubercle marks the radial side of the proximal carpal tunnel in a transverse palmar ultrasound view. The flexor carpi radialis tendon lies over the scaphoid cortex. Keep this palmar landmark distinct from the waist and proximal pole.',
    landmark: 'The whole scaphoid is selected; its tubercle, waist and poles are not separate reviewed selections.',
  },
  lunate: {
    body: 'In a longitudinal dorsal view, use the radius, lunate and capitate as orientation landmarks for the radiocarpal and midcarpal recesses. The accessible bony contour helps locate the neighbouring joint recess; it does not depict the entire lunate.',
    landmark: 'The whole lunate is selected; recesses, cartilage and the adjacent scapholunate ligament are not supplied by this bone mesh.',
  },
  pisiform: {
    body: 'The pisiform is the ulnar bony landmark at the proximal carpal tunnel, opposite the scaphoid tubercle. It also helps orient a transverse examination of Guyon canal. Do not confuse the proximal tunnel level with the more distal hamate hook.',
    landmark: 'The whole pisiform is selected; nerve branches, vessels and canal walls cannot be inferred from its outer surface.',
  },
  hamate: {
    body: 'The hamate hook is the ulnar landmark of the distal carpal tunnel; the trapezium tubercle is radial. The deep motor branch of the ulnar nerve passes beside the hook. Keep this distal level distinct from the proximal pisiform landmark.',
    landmark: 'The whole hamate is selected; the hook is not independently segmented and its adjacent nerve course is not validated here.',
  },
};
