// Test-only exact source-role inverse. No production binding or decision reads.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=value=>createHash('sha256').update(value).digest('hex');
export const keyboardRoleBeforeSha256='928e48406373c864c961cd87b1146b749a6ef403ac8de509dedc883c5b320515';
const before=" assert.equal(source.sourceRevisions[id].teaching,\n  'b0fea14f4dcc531cb8f39f98c1eb9b426831cc778c443f1fc3df63d68039afe2');";
const after=" assert.equal(ae84KeyboardSource.revisions[id].teaching,\n  'b0fea14f4dcc531cb8f39f98c1eb9b426831cc778c443f1fc3df63d68039afe2');";
export function restoreKeyboardTeachingRole(bytes){
 const text=Buffer.from(bytes).toString('utf8');
 assert.deepEqual(Buffer.from(text),Buffer.from(bytes),'Exact UTF-8 source');
 assert.equal(text.split(after).length,2,'Only the declared teaching-source role seam');
 const restored=Buffer.from(text.replace(after,before));
 assert.equal(sha(restored),keyboardRoleBeforeSha256,'Complete previous keyboard test, every assertion retained');
 return restored;
}
