import type { RegionalTour } from './regional-tours';

const muscle = (name: string) => `vm:anatomy:body:head-neck:right:muscle:right-${name}`;
const globe = 'vm:anatomy:body:head-neck:right:organ:right-eyeball';
const reference = 'https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html';
const step = (name: string, title: string, view: RegionalTour['steps'][number]['view'], caption: string): RegionalTour['steps'][number] => ({
  id: name, title, selectedId: muscle(name), view, caption,
  frameIds: [muscle(name), globe], references: [reference], durationMs: 14000, fadeOthers: true,
});

/** Six existing right extraocular surfaces with the exact current globe display. */
export const orbitalTour: RegionalTour = {
  id: 'right-orbital-muscle-orientation', title: 'Right orbit: six extraocular muscles',
  region: 'head-neck', revision: 'right-orbital-muscle-orientation-v1', status: 'draft',
  description: 'Six close-up stops compare four recti and two obliques around the faded right eyeball.',
  limitations: 'Static reference surfaces only, not a complete orbit or independently verified ocular-layer dissection. Full tendons, attachments, pulleys and nerve courses are not established; the trochlea is described conceptually, not rendered. The globe uses the existing source-bound display correction that suppresses opposite-side fragments; retained surfaces keep their source positions. Fading is not dissection. Gaze, muscle forces, diagnosis, acquired imaging and patient registration are not modeled. Innervation labels describe usual anatomy, not inferred nerve endpoints. Draft pending revision-bound radiologist review; no clinical approval.',
  contextIds: [globe],
  requiredDisplayBundles: {
    [globe]: 'eye-corrected-parent',
    ...Object.fromEntries(['medial-rectus', 'lateral-rectus', 'superior-rectus', 'inferior-rectus', 'superior-oblique', 'inferior-oblique'].map(name => [muscle(name), 'head-neck-muscles'])),
  },
  steps: [
    step('medial-rectus', 'Medial rectus · Adduction', 'left',
      'Begin medially. Medial rectus turns the eye towards the nose (adduction), with usual CN III supply. The faded globe provides context.'),
    step('lateral-rectus', 'Lateral rectus · Abduction', 'right',
      'Sweep laterally. Lateral rectus turns the eye away from the nose (abduction), with usual CN VI supply. The globe stays fixed.'),
    step('superior-rectus', 'Superior rectus · Above the globe', 'superior',
      'Superior rectus contributes to elevation, adduction and intorsion under CN III. Intorsion turns the upper iris pole towards the nose.'),
    step('inferior-rectus', 'Inferior rectus · Below the globe', 'inferior',
      'Inferior rectus contributes to depression, adduction and extorsion under CN III. Extorsion turns the upper iris pole away from the nose.'),
    step('superior-oblique', 'Superior oblique · Trochlear relationship', 'superior',
      'Superior oblique contributes to depression, abduction and intorsion under CN IV. Its usual tendon passes through the trochlea; that pulley is not shown.'),
    step('inferior-oblique', 'Inferior oblique · Inferior comparison', 'inferior',
      'Finish below the globe. Inferior oblique contributes to elevation, abduction and extorsion under CN III. No gaze movement is simulated.'),
  ],
};
