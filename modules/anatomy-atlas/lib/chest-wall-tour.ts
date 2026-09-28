import type { RegionalTour } from './regional-tours';

const muscle = (side: string, name: string) => `vm:anatomy:body:thorax:${side}:muscle:${name}`;
const sternum = 'vm:anatomy:body:thorax:midline:bone:body-of-sternum';
const ribs = ['right', 'left'].map(side => `vm:anatomy:body:thorax:${side}:bone:${side}-fourth-rib`);
const reference = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_thorax.html';
const step = (id: string, title: string, selectedId: string, view: RegionalTour['steps'][number]['view'], caption: string, frameIds = [selectedId]): RegionalTour['steps'][number] => ({
  id, title, selectedId, view, caption, frameIds,
  references: [reference], durationMs: 14000, fadeOthers: true,
});

/** Existing licensed source surfaces only; midline intercostal IDs group both sides. */
export const chestWallTour: RegionalTour = {
  id: 'chest-wall-muscle-depth', title: 'Chest wall: muscle depth & diaphragm',
  region: 'thorax', revision: 'chest-wall-muscle-depth-v1', status: 'draft',
  description: 'Six stops through grouped intercostal layers, paired transversus thoracis and the diaphragm. Three faded bones provide local orientation.',
  limitations: 'Intercostal midline metadata denotes bilateral source groups, not a true unpaired muscle or separately selectable spaces. Selected static surfaces only: layer boundaries, fibres, attachments, pleura and neurovascular planes are not independently verified. Sternum context is a recovered unvalidated surface; two ribs are incomplete cage context. Fading is not dissection. No segmented intercostal nerves, procedure, disease interpretation, breathing simulation, acquired scan or patient registration. Draft pending revision-bound radiologist review; no clinical approval.',
  contextIds: [sternum, ...ribs],
  requiredDisplayBundles: {
    [sternum]: 'thorax-skeleton-recovery',
    ...Object.fromEntries(ribs.map(id => [id, 'thorax-skeleton'])),
    ...Object.fromEntries([
      muscle('midline', 'external-intercostal-muscle'),
      muscle('midline', 'internal-intercostal-muscle'),
      muscle('midline', 'innermost-intercostal-muscle'),
      muscle('right', 'right-transversus-thoracis'),
      muscle('left', 'left-transversus-thoracis'),
      muscle('midline', 'diaphragm'),
    ].map(id => [id, 'thorax-muscles'])),
  },
  steps: [
    step('external', 'External intercostals · Outer layer', muscle('midline', 'external-intercostal-muscle'), 'right',
      'Start with the outer intercostal layer between ribs. This source groups both sides under a midline ID; it is not one unpaired muscle. Faded ribs offer limited orientation.'),
    step('internal', 'Internal intercostals · Middle layer', muscle('midline', 'internal-intercostal-muscle'), 'right',
      'Continue deeper to the internal intercostals. Compare the grouped surface with the faded outer layer. Visibility changes explain depth conceptually; they do not open a verified tissue plane.'),
    step('innermost', 'Innermost intercostals · Deep layer', muscle('midline', 'innermost-intercostal-muscle'), 'right',
      'The innermost layer lies deeper still. In usual anatomy the intercostal neurovascular bundle runs between internal and innermost layers. That relationship is conceptual here; no nerve or procedural path is rendered.'),
    step('right-transversus', 'Right transversus thoracis · Behind sternum', muscle('right', 'right-transversus-thoracis'), 'posterior',
      'Turn posteriorly to the right transversus thoracis. It connects the posterior sternum region with inner costal cartilages. The faded sternum provides context; full attachment detail is not established.',
      [muscle('right', 'right-transversus-thoracis'), sternum]),
    step('left-transversus', 'Left transversus thoracis · Paired comparison', muscle('left', 'left-transversus-thoracis'), 'posterior',
      'Compare the separately identified left transversus thoracis across the sternum. Both supplied surfaces retain their source positions. This view does not depict a complete inner chest wall.',
      [muscle('left', 'left-transversus-thoracis'), sternum]),
    step('diaphragm', 'Diaphragm · Inspiration', muscle('midline', 'diaphragm'), 'superior',
      'Finish above the diaphragm. During inspiration its contraction increases thoracic volume. This fixed surface does not simulate breathing, measure excursion or establish the anatomy of individual openings.'),
  ],
};
