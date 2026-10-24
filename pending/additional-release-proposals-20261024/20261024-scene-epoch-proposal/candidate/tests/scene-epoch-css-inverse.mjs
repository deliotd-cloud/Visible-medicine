// Exact source-only inverse for the later toolbar contrast CSS revision.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const before=`.body-toolbar button[data-variant='secondary'] {
  background: #5b7851;
}`;
const after=`.body-toolbar button[data-variant='secondary'] {
  background: var(--vm-teal);
  color: var(--vm-midnight);
}
.body-toolbar button[data-variant='ghost']:hover {
  background: var(--vm-midnight);
  color: var(--vm-ivory);
}`;

export function beforeToolbarContrastCss(current){
  assert(Buffer.isBuffer(current),'Whole CSS source bytes required');
  assert.equal(sha(current),'98fbce0ff8572b6f2055b42e2199bbfe5ca37e322743cb36adabc3ac98e0d2e9',
    'Exact reviewed current CSS source');
  const source=current.toString('utf8');
  assert.deepEqual(Buffer.from(source),current,'Lossless CSS decoding');
  assert.equal(source.split(after).length,2,'One exact toolbar contrast seam');
  const prior=Buffer.from(source.replace(after,before));
  assert.equal(sha(prior),'9722246697fafcd54f55e586797eaec33930c5f3f87d653117b064787ebe2904',
    'Whole pre-contrast CSS source');
  return prior;
}
