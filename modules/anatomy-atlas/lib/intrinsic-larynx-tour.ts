import type { RegionalTour } from './regional-tours';

const neck = (side: string, kind: string, name: string) => `vm:anatomy:body:head-neck:${side}:${kind}:${name}`;
const muscle = (side: string, name: string) => neck(side, 'muscle', side === 'midline' ? name : `${side}-${name}`);
const cricoid = neck('midline', 'cartilage', 'cricoid-cartilage');
const arytenoid = (side: string) => neck(side, 'cartilage', `${side}-arytenoid-cartilage`);
const context = [cricoid, arytenoid('right'), arytenoid('left')];
const reference = 'https://anatomy.ttuhscep.edu/schemes/larynx_tables.html';
const step = (side: string, name: string, title: string, view: RegionalTour['steps'][number]['view'], caption: string): RegionalTour['steps'][number] => ({
  id: side === 'midline' ? name : `${side}-${name}`, title, selectedId: muscle(side, name), view, caption,
  frameIds: [muscle(side, name), ...(name.includes('crico-arytenoid') ? [cricoid, arytenoid(side)] : [arytenoid('right'), arytenoid('left')])],
  references: [reference], durationMs: 14000, fadeOthers: true,
});

/** Seven existing intrinsic muscle surfaces; cartilage landmarks retain source positions. */
export const intrinsicLarynxTour: RegionalTour = {
  id: 'intrinsic-larynx-muscle-orientation', title: 'Larynx: intrinsic muscle orientation',
  region: 'head-neck', revision: 'intrinsic-larynx-muscle-orientation-v1', status: 'draft',
  description: 'Seven muscle stops compare posterior and lateral cricoarytenoids, transverse arytenoid and paired obliques, with faded cartilage landmarks.',
  limitations: 'Selected static reference surfaces only, not a complete intrinsic-muscle map or verified attachments, tendons, joints or nerve courses. Cartilage context includes recovered surfaces whose anatomical boundaries and relationships remain unreviewed. Fading is not dissection. Vocal-fold movement, mucosa, lumen, airway patency, phonation, endoscopy, acquired imaging, patient registration and procedural guidance are not modeled or established. Action and innervation captions describe usual anatomy, not measured function or depicted nerve endpoints. Draft pending revision-bound radiologist review; no clinical approval.',
  contextIds: context,
  requiredDisplayBundles: {
    ...Object.fromEntries(context.map(id => [id, 'head-neck-connective-recovery'])),
    ...Object.fromEntries([
      muscle('right', 'posterior-crico-arytenoid'), muscle('left', 'posterior-crico-arytenoid'),
      muscle('right', 'lateral-crico-arytenoid'), muscle('left', 'lateral-crico-arytenoid'),
      muscle('midline', 'transverse-arytenoid'), muscle('right', 'oblique-arytenoid'), muscle('left', 'oblique-arytenoid'),
    ].map(id => [id, 'head-neck-muscles'])),
  },
  steps: [
    step('right', 'posterior-crico-arytenoid', 'Right posterior cricoarytenoid', 'posterior',
      'Begin behind the cricoid. Posterior cricoarytenoid abducts the vocal folds in usual anatomy; these surfaces remain still.'),
    step('left', 'posterior-crico-arytenoid', 'Left posterior cricoarytenoid', 'posterior',
      'Compare the left partner against the cricoid and left arytenoid. Its usual supply is the inferior laryngeal branch of recurrent laryngeal nerve.'),
    step('right', 'lateral-crico-arytenoid', 'Right lateral cricoarytenoid', 'right',
      'Turn laterally. Lateral cricoarytenoid adducts the vocal folds, opposing the posterior muscle; the right arytenoid provides orientation.'),
    step('left', 'lateral-crico-arytenoid', 'Left lateral cricoarytenoid', 'left',
      'Compare the left lateral muscle with its cartilage landmarks. The shared recurrent laryngeal supply is described, not rendered.'),
    step('midline', 'transverse-arytenoid', 'Transverse arytenoid', 'posterior',
      'Identify the transverse surface between both arytenoids. Its usual action draws those cartilages together.'),
    step('right', 'oblique-arytenoid', 'Right oblique arytenoid', 'posterior',
      'Locate the right oblique surface against the paired arytenoids. Oblique fibers also bring the arytenoids together.'),
    step('left', 'oblique-arytenoid', 'Left oblique arytenoid', 'posterior',
      'Finish with the separately labelled left oblique. Compare the static pair; no vocal-fold movement is simulated.'),
  ],
};
