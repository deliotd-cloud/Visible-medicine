// Original teaching text; these links support facts, not reuse of illustrations or films.
export const handBoneXrayReferences = [
  'https://www.radiologyinfo.org/en/info/bonerad',
  'https://www.orthoinfo.org/diseases--conditions/hand-fractures',
  'https://www.orthoinfo.org/diseases--conditions/finger-fractures/',
  'https://www.orthoinfo.org/diseases--conditions/thumb-fractures',
] as const;

export const handBoneXrayFacts = {
  metacarpal1: {
    body: 'Trace the first metacarpal from the thumb carpometacarpal (CMC) base through its shaft to the metacarpophalangeal (MCP) head. These are two different joint ends of the same bone.',
    cue: 'The thumb projects in its own plane; compare the base and head on the actual views before assigning a contour to either joint.',
  },
  metacarpal2: {
    body: 'Follow the second metacarpal along the index ray from its carpal base to the index MCP head. Separate the long shaft outline from both joint margins.',
    cue: 'At the base, neighbouring carpal and metacarpal contours may overlap on a single projection.',
  },
  metacarpal3: {
    body: 'Use the middle finger ray to identify the third metacarpal base, shaft and MCP head in sequence. Keep the proximal carpal boundary distinct from the distal knuckle.',
    cue: 'A frontal silhouette can blend adjacent central metacarpals; use a second projection to recheck which margin belongs to this ray.',
  },
  metacarpal4: {
    body: 'Trace the fourth metacarpal from the ring-finger MCP head back toward its carpal base. Compare its course with the adjacent third and fifth metacarpals.',
    cue: 'The ring and little metacarpal bases can project close together; one outline alone does not establish their separate alignment.',
  },
  metacarpal5: {
    body: 'Identify the fifth metacarpal beneath the little finger, then distinguish its base, shaft, neck and MCP head. The neck lies immediately proximal to the knuckle.',
    cue: 'Check both the ulnar-side base and distal neck on the actual views; this intact source bone contains no fracture pattern.',
  },
  proximalThumb: {
    body: 'The thumb proximal phalanx lies between the MCP joint and the thumb interphalangeal (IP) joint. Follow its base, shaft and distal articular end.',
    cue: 'The thumb has no middle phalanx: its distal phalanx meets this bone directly at the IP joint.',
  },
  proximalFinger: {
    body: 'A finger proximal phalanx runs from the MCP joint at its base to the proximal interphalangeal (PIP) joint at its head. Use the selected ray to keep those ends in order.',
    cue: 'Check the PIP margin in a complementary projection when adjacent fingers obscure the side of the joint.',
  },
  middleFinger: {
    body: 'A middle phalanx lies between the PIP and distal interphalangeal (DIP) joints of an index, middle, ring or little finger. Trace its base, shaft and head separately.',
    cue: 'There is no thumb middle phalanx. Projection overlap can hide a joint edge; correlate another view of the same finger.',
  },
  distalThumb: {
    body: 'The thumb distal phalanx begins at the thumb IP joint and ends at the terminal tuft. Keep the joint surface distinct from the fingertip end.',
    cue: 'Do not transfer the fingers’ DIP label to the thumb: its only interphalangeal joint is the IP joint.',
  },
  distalFinger: {
    body: 'A finger distal phalanx extends from the DIP joint to the terminal tuft. Identify the articular base before following the bone toward the fingertip.',
    cue: 'A bony radiograph does not directly show nail bed or tendon integrity; the terminal contour is only a location cue.',
  },
} as const;

export const handBoneXrayShared = [
  'A radiograph combines structures along the beam into a projection. Correlate orthogonal views of the actual hand or finger when one view overlaps a neighbouring bone or joint.',
  'This selected source mesh is an anatomical orientation aid, not an acquired radiograph, a fracture simulation or a source for angle, gap or displacement measurements.',
] as const;
