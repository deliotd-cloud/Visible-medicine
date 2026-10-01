import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

// Only this independently checked terminal addition may be removed in history.
export function withoutNestedCTOrientationNotice(text:string):string {
 const start=text.indexOf('\n## Named nested CT orientation (1 October 2026)\n');
 if(start<0)return text;
 assert.equal(createHash('sha256').update(text.slice(start)).digest('hex'),
  'f716826701405decd277f915305e131d8402768bc826227c0fe87083ca8c7e0a');
 return text.slice(0,start);
}
