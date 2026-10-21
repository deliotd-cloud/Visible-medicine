import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const originals={
  'head-teaching-review-notes.test.ts':'62d050a69320e941913523b367d4987769089db70d8c064dbd5b806d24b5a739',
  'head-mri-review-notes.test.ts':'97fcdccb1dd085bc6a86944b8e9ff8f7bf7c3ae5f7b919b2f53bde09c50d32e9',
};
for(const [name,expected] of Object.entries(originals))test(`${name} preserves its complete original outside navigation harness seams`,()=>{
  const original=readFileSync(new URL(`./fixtures/review-navigation-harness-originals/${name}.raw`,import.meta.url));
  assert.equal(digest(original),expected,'authentic raw original');
  let source=readFileSync(new URL(`./${name}`,import.meta.url),'utf8');
  const newline=original.includes(Buffer.from('\r\n'))?'\r\n':'\n';
  const removeOnce=(from,to='')=>{
    assert.equal(source.split(from).length-1,1,`one exact seam: ${from.slice(0,70)}`);
    source=source.replace(from,to);
  };
  removeOnce(`${newline}import * as navigationGuard from '../lib/clinical-review-navigation-guard.ts';`);
  removeOnce("id==='../lib/clinical-review-navigation-guard'?navigationGuard:");
  if(name==='head-mri-review-notes.test.ts'){
    removeOnce(`  const oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
  const navigationListeners=new Set<Function>();
  (globalThis as any).document={
    defaultView:{location:{href:'https://visiblemedicine.test/atlas/head-learning?mode=review'},confirm(){throw Error('No synthetic navigation was dispatched');}},
    addEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(!navigationListeners.has(listener));navigationListeners.add(listener);},
    removeEventListener(type:string,listener:Function,capture:boolean){assert.equal(type,'click');assert.equal(capture,true);assert(navigationListeners.delete(listener),'registered navigation listener removed');},
  };
`.replaceAll('\n',newline));
    removeOnce("assert.equal(navigationListeners.size,0,'navigation listener cleaned up on unmount');if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else delete (globalThis as any).document;");
  }
  assert.deepEqual(Buffer.from(source),original,'whole-body exact inverse, including every original assertion');
});
