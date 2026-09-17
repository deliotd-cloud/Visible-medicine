import source from '../public/models/bodyparts3d/corpus-spongiosum/catalog.json' with { type: 'json' };
import type { BodyStructure } from '../app/body-types';
import type { DissectionFocus } from '../app/dissection-data';

const records = [...source.structures, ...source.contextRecords] as BodyStructure[];
/** Source-frame comparison, not a urethral segmentation or registered scan. */
export const pelvicUrethralFocus: DissectionFocus = {
  id: 'pelvis-urethral-context',
  title: 'Male pelvis: urethra & corpus spongiosum',
  rule: { fmaIds: ['FMA19667', 'FMA19617'] },
  context: [{ fmaIds: ['FMA15900', 'FMA9600', 'FMA16586', 'FMA16587'] }],
  includeSkeleton: false,
  view: 'posterior',
  description: 'Compare the urethra and bulb/shaft source with the bladder, prostate and hip bones.',
  inspect: 'Select either target to read its available anatomy and imaging notes. Remove a covering structure and use Undo to restore it; return separation to 0% to compare source positions. Co-display does not establish an enclosed or continuous lumen, patient registration or a procedural approach. The glans and paired cavernous bodies are not included. Radiologist review is pending.',
  landmarks: ['urethra$', 'corpus spongiosum', 'prostate$', 'urinary bladder$'],
  requiredSources: records.filter(s => s.system !== 'skeleton'),
  contextSources: records.filter(s => s.system === 'skeleton'),
};
