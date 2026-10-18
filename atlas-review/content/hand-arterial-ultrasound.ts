// Original educational drafts. Reading citations do not license figures or scans.
const anatomy = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html';
const historicalDoppler = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1164307/';
const digitalUltrasoundReview = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8535079/';

export type HandArterialUltrasoundGroup = 'superficialArch' | 'deepArch' | 'metacarpal' | 'princeps' | 'radialis' | 'commonDigital' | 'properDigital';
type Topic = { title: string; body: string; bullets: string[]; citations: string[] };

export const handArterialUltrasoundTopics: Record<HandArterialUltrasoundGroup, Topic> = {
  superficialArch: {
    title: 'Ultrasound: superficial palmar arch',
    body: 'The superficial arch is predominantly ulnar in usual anatomy and gives rise to common palmar digital arteries.',
    bullets: [
      'A 1984 Doppler Flowmeter study found varied superficial arterial patterns; its small sample is not a modern duplex map or a universal frequency estimate.',
      'The source surface cannot show an acquired Doppler signal or establish arch completeness.',
    ],
    citations: [anatomy, historicalDoppler],
  },
  deepArch: {
    title: 'Ultrasound: deep palmar arch',
    body: 'The deep arch receives most of its usual supply from the radial artery and gives rise to palmar metacarpal arteries.',
    bullets: ['A named exterior surface does not resolve a deep vessel on ultrasound or demonstrate a patent connection.'],
    citations: [anatomy],
  },
  metacarpal: {
    title: 'Ultrasound: palmar metacarpal artery',
    body: 'Palmar metacarpal arteries usually arise from the deep arch and meet the common digital circulation.',
    bullets: ['Only one source-labelled metacarpal selection exists per side; it is not a complete numbered branch inventory or an ultrasound tracing.'],
    citations: [anatomy],
  },
  princeps: {
    title: 'Ultrasound: thumb arterial orientation',
    body: 'Princeps pollicis normally arises from the radial artery and supplies the palmar thumb.',
    bullets: ['Historical Doppler work found thumb arterial origins varied. Two source meshes form one selection, without proving an individual origin or signal.'],
    citations: [anatomy, historicalDoppler],
  },
  radialis: {
    title: 'Ultrasound: radial index orientation',
    body: 'Radialis indicis belongs to the radial arterial system and supplies the radial side of the index finger.',
    bullets: ['Historical Doppler work found variable index arterial origins. Two source meshes remain one selection, without an acquired vessel trace.'],
    citations: [anatomy, historicalDoppler],
  },
  commonDigital: {
    title: 'Ultrasound: common digital arteries',
    body: 'Common palmar digital arteries usually leave the superficial arch and divide towards proper digital arteries.',
    bullets: ['First–fourth are historical source labels on each side, not a validated standard branch count or proof of continuity.'],
    citations: [anatomy, historicalDoppler],
  },
  properDigital: {
    title: 'Ultrasound: proper digital arteries',
    body: 'Proper palmar digital arteries course along the digits. Their vessel signals are distinct from nailfold microvascular observations.',
    bullets: [
      'Only six right and four left source selections are retained; the distal inventory is incomplete.',
      'Small-vessel signals depend on acquisition conditions, including pressure, movement and settings; the model supplies none of these measurements.',
    ],
    citations: [anatomy, digitalUltrasoundReview],
  },
};

export const handArterialUltrasoundCaution = 'Educational draft: no patient ultrasound, Doppler signal, measured flow, validated lumen, complete artery tracing, collateral assessment or acquisition protocol is supplied. The atlas cannot establish patency or procedural suitability; revision-bound radiologist review remains pending.';
