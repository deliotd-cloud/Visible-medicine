// Original educational interpretation of the linked CC BY 4.0 references.
// No article wording, figures, ultrasound frames, datasets or meshes imported.
export const footSurfaceImagingReferences = {
  hung2020: {url: 'https://www.mdpi.com/2075-4418/10/3/160', licence: 'CC BY 4.0'},
  tsutsumi2022: {url: 'https://www.nature.com/articles/s41598-022-19543-4', licence: 'CC BY 4.0'},
  noelBarker2026: {url: 'https://journals.sagepub.com/doi/10.1177/24730114261460463', licence: 'CC BY 4.0'},
} as const;
export type FootSurfaceImagingLesson = {
  readonly body: string;
  readonly bullets: readonly string[];
  readonly citations: readonly (keyof typeof footSurfaceImagingReferences)[];
};
export const footSurfaceImagingReviewNote =
  'Original educational draft; revision-bound radiologist review pending. This unregistered surface model is not an ultrasound frame, acquisition simulator or diagnostic test. Atlas, case and paid-lecture access remain independent.';
export const footSurfaceImagingTeaching = {
  calcaneus: {
    ultrasound: {
      body: 'The medial calcaneal shelf, the sustentaculum tali, is a useful ultrasound orientation landmark. A small human anatomy/ultrasound study located flexor digitorum longus inferomedial to that shelf. Keep this tendon distinct from flexor hallucis longus in the groove beneath it. Use the model to rehearse these relationships, not to infer a validated tendon course within this source.',
      bullets: [
        'Identify the talus, shelf and medial malleolus together before naming a neighbouring tendon.',
        'Ultrasound samples accessible bone surfaces; the model does not expose marrow or a complete sonographic calcaneus.',
        'The referenced study examined anatomical relationships, not fracture-detection performance.',
      ],
      citations: ['tsutsumi2022', 'hung2020'],
    },
  },
  talus: {
    ultrasound: {
      body: 'In a medial coronal ultrasound view, the talus provides a landmark alongside the medial malleolus and sustentaculum tali when orienting flexor digitorum longus. The spring-ligament region is approached from the medial hindfoot using the shelf and talar/navicular boundaries. These are limited surface windows, not an ultrasound view of the whole talus.',
      bullets: [
        'A visible contour helps orientation; it does not establish an entire articular surface or internal bone health.',
        'Patient position, probe plane and overlying tissue are absent from the atlas; no diagnostic or registration accuracy is supplied.',
      ],
      citations: ['tsutsumi2022', 'hung2020'],
    },
  },
  navicular: {
    ultrasound: {
      body: 'The medial navicular is an insertion landmark for tibialis posterior. A 2026 weight-bearing ultrasound study used a specialized plantar setup to identify the inferior navicular surface; dissection checked the bone identity. This supports a local surface landmark, not routine visibility of the entire navicular or a clinical arch-height measurement from this model.',
      bullets: [
        'Keep the navicular cortex, tibialis posterior insertion and adjacent spring-ligament region conceptually separate.',
        'The study used controlled positioning and a refined protocol; no direct in-vivo weight-bearing CT comparison was performed.',
        'Neither this surface nor a local ultrasound window demonstrates marrow or excludes a stress injury.',
      ],
      citations: ['noelBarker2026', 'hung2020'],
    },
  },
  longPlantar: {
    ultrasound: {
      body: 'For plantar-hindfoot orientation, relate the long plantar ligament to the cuboid and peroneus longus tendon. The ligament crosses superficial to that tendon toward the metatarsal bases; the short plantar ligament is deeper at the calcaneocuboid joint. An illustrated ultrasound review describes this approach but notes that separating the two ligaments can be difficult.',
      bullets: [
        'Do not confuse the long plantar ligament with the plantar fascia or the short plantar ligament.',
        'This source is one gross surface: fibre layers, anisotropy, tenderness and dynamic ligament integrity are not encoded.',
        'A review illustration is not a diagnostic-accuracy study. The separate CT lesson remains pending rather than borrowing ultrasound evidence.',
      ],
      citations: ['hung2020'],
    },
  },
} as const satisfies Record<'calcaneus' | 'talus' | 'navicular' | 'longPlantar', Record<'ultrasound', FootSurfaceImagingLesson>>;
