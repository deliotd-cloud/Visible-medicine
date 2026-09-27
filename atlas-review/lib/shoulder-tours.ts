import { structures } from '../app/anatomy-data';
import manifest from '../public/models/bodyparts3d/manifest.json';
import { initialInspection } from './inspection-state';
import type { StudyView } from './study-views';

type TourStep = {
  id: string;
  title: string;
  caption: string;
  selectedId: string;
  layer: StudyView['layer'];
  view: 'posterior' | 'anterior' | 'lateral';
  durationMs: number;
  fadeOthers: boolean;
  references: string[];
};
const muscleTable = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html';
function step(id: string, title: string, caption: string, slug: string, layer: TourStep['layer'], view: TourStep['view'], fadeOthers = false): TourStep {
  const selected = structures.find(s => s.id.split(':').at(-1) === slug);
  if (!selected || !manifest.parts.some(part => part.structureId === selected.id))
    throw Error(`Shoulder tour selection is absent from the current source: ${slug}`);
  return { id, title, caption, selectedId: selected.id, layer, view, fadeOthers, durationMs: 12000, references: [muscleTable] };
}

/** Original orientation teaching about supplied surfaces. This draft is not
 * a scan, lesion simulation or radiologist approval. Source geometry is retained. */
export const shoulderTour = {
  id: 'shoulder-source-orientation',
  title: 'Shoulder surface tour',
  revision: 'shoulder-source-orientation-v1',
  sourceRevision: manifest.sha256,
  status: 'draft' as const,
  steps: [
    step('deltoid-cover', 'Deltoid cover', 'Start with the deltoid covering the shoulder. The surface layer keeps the supplied bones and muscles together; the next step sets the deltoid aside to reveal the cuff.', 'deltoid', 'surface', 'posterior'),
    step('posterior-cuff', 'Infraspinatus', 'With the deltoid set aside, compare infraspinatus with the posterior scapula. It arises from the infraspinous fossa and belongs to the rotator cuff.', 'infraspinatus', 'cuff', 'posterior'),
    step('inferior-cuff', 'Teres minor', 'Find teres minor along the lateral scapula, below infraspinatus. This smaller muscle is another member of the posterior cuff.', 'teres-minor', 'cuff', 'posterior'),
    step('superior-cuff', 'Supraspinatus', 'From the lateral view, find supraspinatus occupying the supraspinous fossa and passing beneath the acromion. Other structures are faded to reveal this relationship.', 'supraspinatus', 'cuff', 'lateral', true),
    step('anterior-cuff', 'Subscapularis', 'Turn anteriorly to find subscapularis on the subscapular fossa. It inserts on the lesser tuberosity and forms the anterior cuff context.', 'subscapularis', 'cuff', 'anterior'),
  ],
};

/** A fresh canonical display state; no captured camera or caller state leaks
 * between tour steps. Teaching revision and source revision remain distinct. */
export function shoulderTourStepView(index: number): StudyView | null {
  if (!Number.isInteger(index) || index < 0 || index >= shoulderTour.steps.length) return null;
  const selected = shoulderTour.steps[index];
  return {
    kind: 'shoulder', region: 'shoulder-pilot', revision: manifest.sha256,
    selectedId: selected.selectedId, view: selected.view, side: 'right', layer: selected.layer,
    systems: { skeleton: true, muscles: true, 'soft-tissue': true }, hiddenIds: [],
    explode: 0, layout: 'spatial', zoom: 1, isolated: selected.fadeOthers, focus: false,
    labels: true, ghostRemoved: false, illustrated: true, anchorSkeleton: false,
    showOrigins: false, plate: false, referencePlane: false,
    inspection: structuredClone(initialInspection), camera: null,
  };
}
