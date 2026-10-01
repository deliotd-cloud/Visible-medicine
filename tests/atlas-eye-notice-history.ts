import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {withoutPelvicRingNotice} from './atlas-pelvic-notice-history.ts';

// Reconstruct the prior notice only after checking the entire new section.
// Historical append-only assertions remain strict; shipped credits stay intact.
export function withoutEyeCrossSectionalNotice(text: string): string {
  text=withoutPelvicRingNotice(text);
  const start = text.indexOf('## Eye cross-sectional teaching (1 October 2026)\n\n');
  if (start < 0) return text;
  assert.equal(start, '# Third-party notices\n\n'.length);
  const end = text.indexOf('## Abdominal wall and back', start);
  assert(end > start);
  assert.equal(createHash('sha256').update(text.slice(start, end)).digest('hex'),
    'afbbe36590b1517ad3250cf72d28dcfb4427682c0637d7250684ab40fd18b2a9');
  return text.slice(0, start) + text.slice(end);
}
