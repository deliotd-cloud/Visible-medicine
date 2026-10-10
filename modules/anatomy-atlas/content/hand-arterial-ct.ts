// Original educational summaries. References are reading sources, not asset grants.
const anatomy = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html';
const cta = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11736060/';

export type HandArterialCtGroup = 'deepArch' | 'metacarpal' | 'princeps' | 'radialis' | 'commonDigital' | 'properDigital';
type Topic = { title: string; body: string; bullets: string[]; citations: string[] };

export const handArterialCtTopics: Record<HandArterialCtGroup, Topic> = {
  deepArch: {
    title: 'CT/CTA: deep palmar arch',
    body: 'The deep palmar arch is predominantly radial, with a deep ulnar contribution. It lies proximal to the superficial arch and gives rise to palmar metacarpal branches.',
    bullets: [
      'On a suitable hand CTA, trace the arch through adjacent source sections before interpreting a projected overview; overlap can obscure its course.',
      'A model gap or an unseen tiny segment cannot establish interruption, absence or collateral capacity.',
    ],
    citations: [anatomy, cta],
  },
  metacarpal: {
    title: 'CT/CTA: deep palmar branches',
    body: 'Palmar metacarpal arteries arise from the deep arch and join the common palmar digital circulation.',
    bullets: [
      'Each side has one source-labelled metacarpal selection. It does not resolve independently numbered branches.',
      'Small branches may elude CTA resolution. Confirm a proposed course on source sections; a projected connection is not proof of a patent lumen.',
    ],
    citations: [anatomy, cta],
  },
  princeps: {
    title: 'CT/CTA: thumb arterial orientation',
    body: 'The princeps pollicis is a radial-system artery supplying the palmar thumb; the hand CTA review depicts it near the deep arch.',
    bullets: [
      'The two retained meshes form one source-labelled selection, not two new branches. Trace any patient branch on sequential CTA sections.',
      'This surface cannot establish the thumb\'s individual origin pattern, flow or surgical suitability.',
    ],
    citations: [anatomy, cta],
  },
  radialis: {
    title: 'CT/CTA: radial index supply',
    body: 'The radialis indicis is a radial-system vessel to the radial side of the index finger.',
    bullets: [
      'The two retained meshes represent one source-labelled selection. They do not assert a duplicated artery or a patient-specific origin.',
      'Follow a visible vessel through source sections; failure to see this small branch does not prove absence or occlusion.',
    ],
    citations: [anatomy, cta],
  },
  commonDigital: {
    title: 'CT/CTA: common digital trunks',
    body: 'Common palmar digital arteries typically arise from the superficial arch and divide toward proper digital arteries.',
    bullets: [
      'These eight historical source selections use first–fourth numbering on each side. That numbering is not validated as a standard branch inventory.',
      'On CTA, distinguish a trunk from overlapping distal vessels in source sections. The atlas alone cannot establish continuity or collateral adequacy.',
    ],
    citations: [anatomy, cta],
  },
  properDigital: {
    title: 'CT/CTA: distal digital course',
    body: 'Proper palmar digital arteries supply the palmar digits and contribute to the distal segment and nail-bed circulation.',
    bullets: [
      'Only ten source selections are retained: six right and four left. They are not a complete bilateral digital arterial inventory.',
      'Distal caliber challenges CTA depiction. Compare sequential sections before naming a vessel; nonvisibility does not establish occlusion or absence.',
    ],
    citations: [anatomy, cta],
  },
};

export const handArterialCtAcquisition = 'CTA uses contrast-timed CT acquisition; routine CT is not an arterial map. This atlas has neither acquisition nor patient-specific vessel data.';
