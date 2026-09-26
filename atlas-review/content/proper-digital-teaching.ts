// Original draft wording. The reference supplies anatomy facts, not reusable artwork.
export const properDigitalTeachingReferences = [
  'https://anatomy.ttuhscep.edu/musculoskeletal_system/hand_tables.html',
] as const;

// Explicit source-label mapping: anatomical border cannot be inferred from a rotated view.
export const properDigitalTeachingSelections = {
  FMA22858: {side:'right', digit:'middle finger', border:'radial', faces:'index finger'},
  FMA22860: {side:'left', digit:'middle finger', border:'radial', faces:'index finger'},
  FMA23050: {side:'right', digit:'index finger', border:'ulnar', faces:'middle finger'},
  FMA23051: {side:'left', digit:'index finger', border:'ulnar', faces:'middle finger'},
  FMA23052: {side:'right', digit:'ring finger', border:'ulnar', faces:'little finger'},
  FMA23054: {side:'right', digit:'little finger', border:'radial', faces:'ring finger'},
  FMA23055: {side:'left', digit:'little finger', border:'radial', faces:'ring finger'},
  FMA85112: {side:'right', digit:'middle finger', border:'ulnar', faces:'ring finger'},
  FMA85115: {side:'right', digit:'ring finger', border:'radial', faces:'middle finger'},
  FMA85116: {side:'left', digit:'ring finger', border:'radial', faces:'middle finger'},
} as const;

export const properDigitalTeachingFacts = {
  anatomy: {
    trunk: 'A common palmar digital artery is a proximal trunk that divides into proper branches running along named digits.',
    orientation: 'Radial and ulnar here describe anatomical source labels, unchanged by camera rotation; they do not validate mesh position or a branch junction.',
  },
  function: {
    supply: 'Proper palmar digital arteries contribute to palmar digit supply and to the distal dorsal surface and nail bed.',
    limit: 'One branch does not establish sole supply of a whole finger. This unregistered surface shows no flow or collateral adequacy and says nothing about sensory innervation.',
  },
} as const;
