import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {withoutNestedCTOrientationNotice} from './atlas-nested-ct-notice-history.ts';

// Historical comparisons may remove only this exact, independently checked addition.
export function withoutPelvicRingNotice(text: string): string {
 text=withoutNestedCTOrientationNotice(text);
 const start=text.indexOf('\n## Pelvic-ring guided orientation (1 October 2026)\n');
 if(start<0)return text;
 assert.equal(createHash('sha256').update(text.slice(start)).digest('hex'),
  '40fc1813277216d0f92967c51cc1a5fc3038f7ed56910fb26cc6bda9fd3b25aa');
 return text.slice(0,start);
}
