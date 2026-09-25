// Original orientation teaching; references support facts, not reuse of their media.
export const halluxXrayReferences = [
  'https://www.orthoinfo.org/diseases--conditions/toe-and-forefoot-fractures',
  'https://www.radiologyinfo.org/en/info/bonerad',
  'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/foot-phalanges/distal-hallux/definition',
] as const;

export const halluxXrayTopics = {
  proximal: {
    body: 'Trace the hallux proximal phalanx from its first metatarsophalangeal (MTP) base through the shaft to its interphalangeal (IP) head. Keep the two joint ends distinct on the acquired views.',
    cue: 'The great toe normally has two phalanges and one IP joint, not the PIP and DIP sequence of a three-phalangeal lesser toe. This source has no middle hallux phalanx.',
  },
  distal: {
    body: 'Follow the hallux distal phalanx from its IP articular base to the terminal tuft. A finding at the joint margin is a different location from a finding at the tip.',
    cue: 'A reassuring bony outline does not establish nail-bed integrity. This source supplies neither a nail-bed surface nor a patient injury map.',
  },
} as const;

export const halluxXrayShared = [
  'Compare the available radiographic projections of the same toe; neighbouring contours can overlap. The selected mesh is an orientation aid, not an acquired radiograph.',
  'Return separation to zero before comparing relationships. Do not measure patient joint space, angulation or fracture displacement from this reference surface.',
] as const;
