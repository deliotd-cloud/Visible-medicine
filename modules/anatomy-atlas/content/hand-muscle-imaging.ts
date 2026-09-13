// Original short teaching synthesis; linked figures and patient images are not assets.
export const handMuscleImagingReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html',
  handUS: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10508329/',
  ct: 'https://www.radiologyinfo.org/en/info/bodyct',
  mri: 'https://www.radiologyinfo.org/en/info/muscmr',
  ultrasound: 'https://www.radiologyinfo.org/en/info/musculous',
  xray: 'https://www.radiologyinfo.org/en/info/bonerad',
} as const;
export type HandImagingReference = keyof typeof handMuscleImagingReferences;
export type HandImagingModality = 'ct' | 'mri' | 'ultrasound' | 'xray';
export type HandImagingFact = { text: string; references: readonly HandImagingReference[] };
const fact = (text: string, ...references: HandImagingReference[]): HandImagingFact => ({text, references});
const thenarLayers = fact('Abductor brevis is superficial and radial; opponens lies deeper beside the first metacarpal.', 'handUS');
const hypothenarLayers = fact('Abductor and flexor digiti minimi are superficial; opponens lies deeper against the fifth metacarpal.', 'handUS');
const adductorLayers = fact('The adductor lies deep to the thumb long-flexor tendon; distinguish its oblique and transverse origins.', 'handUS');
const lumbricalPosition = fact('Lumbricals arise from profundus tendons, not metacarpal bone, and continue towards the finger extensor apparatus.', 'anatomy');
const interosseousPosition = fact('Compare the palmar and dorsal groups between metacarpals; their distal connections include the proximal phalanges and extensor apparatus.', 'anatomy');
const thenarMRSignal = fact('Fluid-sensitive MRI can show injury-related oedema in the thenar muscles; this is not visible in the atlas surface.', 'handUS');

export const handMuscleImagingModes: Record<HandImagingModality,HandImagingFact> = {
  ct: fact('CT provides cross-sectional bone and soft-tissue detail. Identify the selected muscle relative to its named landmarks; this surface supplies no attenuation, contrast phase, fracture finding or measured patient margin.', 'ct'),
  mri: fact('MRI can assess muscles and adjacent soft tissues. Compare the actual sequence, digit, side and hand position; atlas colours are not MR signal, fat replacement, oedema or evidence of a lesion.', 'mri'),
  ultrasound: fact('Ultrasound can examine superficial muscle and tendon structure during movement. Compare a real short- and long-axis view; a static separated atlas mesh does not supply echotexture, dynamic function or Doppler flow.', 'ultrasound'),
  xray: fact('Radiographs show bony landmarks much better than individual intrinsic muscles. Use attachment relationships for orientation, not as proof of muscle integrity, tendon continuity or nerve function.', 'xray'),
};
type Group = { fmaIds: readonly string[]; landmark: HandImagingFact; focus: Partial<Record<HandImagingModality,HandImagingFact>>; limitation: string };
export const handMuscleImagingGroups = {
  abductorDigitiMinimi: {
    fmaIds: ['FMA37396','FMA37397'],
    landmark: fact('Pisiform to the ulnar base of the fifth proximal phalanx.', 'anatomy'),
    focus: {mri: hypothenarLayers, ultrasound: fact('Look at the ulnar side of the fifth metacarpal; flexor lies radially and opponens deeper.', 'handUS')},
    limitation: 'This hand abductor is not the similarly named foot muscle. The supplied belly does not establish an accessory muscle, patient denervation pattern or a complete ulnar-nerve passage.',
  },
  flexorDigitiMinimiBrevis: {
    fmaIds: ['FMA37398','FMA37399'],
    landmark: fact('Hamate hook/retinaculum to the fifth proximal-phalanx base.', 'anatomy'),
    focus: {mri: hypothenarLayers, ultrasound: fact('Identify the flexor radial to abductor digiti minimi, rather than calling the whole hypothenar mass one muscle.', 'handUS')},
    limitation: 'Keep this intrinsic flexor distinct from the long digital-flexor tendons. A selected donor surface does not demonstrate a finger-specific tendon rupture or identify a patient variant.',
  },
  opponensDigitiMinimi: {
    fmaIds: ['FMA37400','FMA37401'],
    landmark: fact('Hamate hook/retinaculum to the ulnar fifth-metacarpal shaft.', 'anatomy'),
    focus: {mri: hypothenarLayers, ultrasound: hypothenarLayers},
    limitation: 'Its distal target is the metacarpal shaft, not the little-finger phalanx. Removing superficial muscles in the atlas is not a sonographic window or evidence of muscle function.',
  },
  abductorPollicisBrevis: {
    fmaIds: ['FMA37386','FMA37387'],
    landmark: fact('Scaphoid/trapezium/retinaculum towards the radial thumb proximal-phalanx base.', 'anatomy'),
    focus: {mri: thenarMRSignal, ultrasound: thenarLayers},
    limitation: 'Abductor brevis is not forearm abductor longus or the held flexor brevis source. The recurrent median branch and every thenar tendon boundary are not segmented here.',
  },
  opponensPollicis: {
    fmaIds: ['FMA37390','FMA37391'],
    landmark: fact('Trapezium/retinaculum to the radial first-metacarpal shaft.', 'anatomy'),
    focus: {mri: thenarMRSignal, ultrasound: thenarLayers},
    limitation: 'Its metacarpal attachment differs from the phalangeal targets of adjacent thumb muscles. This mesh does not demonstrate opposition, a recurrent-nerve lesion or patient-specific fibre injury.',
  },
  adductorOblique: {
    fmaIds: ['FMA46121','FMA46122'],
    landmark: fact('Oblique origin: capitate and second/third metacarpal bases; shared thumb attachment.', 'anatomy'),
    focus: {mri: adductorLayers, ultrasound: adductorLayers},
    limitation: 'Only the oblique head is selected, not the whole adductor or a complete adductor aponeurosis. Its coloured border is not a validated collateral-ligament boundary or imaging sign.',
  },
  adductorTransverse: {
    fmaIds: ['FMA46123','FMA46124'],
    landmark: fact('Transverse origin: third-metacarpal shaft; shared ulnar thumb proximal-phalanx attachment.', 'anatomy'),
    focus: {mri: adductorLayers, ultrasound: adductorLayers},
    limitation: 'The transverse and oblique heads retain separate source identities. Their convergence does not prove two independently resolvable patient margins or a fully represented distal tendon complex.',
  },
  lumbricalGroup: {
    fmaIds: ['FMA42398','FMA42399'],
    landmark: lumbricalPosition,
    focus: {mri: lumbricalPosition, ultrasound: fact('Scan between flexor tendons in the mid palm; the deeper distal portions of lumbricals two–four are less accessible.', 'handUS')},
    limitation: 'This is one source group per hand, not four individually selectable muscles. Do not assign a numbered lumbrical, individual tendon slip or median/ulnar denervation territory from its group colour.',
  },
  palmarInterosseousGroup: {
    fmaIds: ['FMA42402','FMA42403'],
    landmark: interosseousPosition,
    focus: {mri: interosseousPosition, ultrasound: fact('Palmar interossei lie beneath lumbricals and flexor tendons; their deep distal insertions are difficult to evaluate sonographically.', 'handUS')},
    limitation: 'This group does not establish separate muscle counts, a thumb interosseous variant or each distal slip. An unvisualized insertion is not automatically an absent or ruptured structure.',
  },
  dorsalInterosseousGroup: {
    fmaIds: ['FMA42404','FMA42405'],
    landmark: interosseousPosition,
    focus: {mri: interosseousPosition, ultrasound: fact('A dorsal transverse view over the metacarpal shafts shows the interosseous bellies within the webspaces.', 'handUS')},
    limitation: 'The supplied group is not four independently segmented bellies. Do not identify an individual dorsal interosseous or its tendon/ligament relationships merely from the whole group selection.',
  },
} satisfies Record<string,Group>;
export type HandMuscleImagingGroup = keyof typeof handMuscleImagingGroups;
