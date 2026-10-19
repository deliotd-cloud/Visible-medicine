// Exact inventory correction projection for historical assertions only.
// Current delivery is separately compared byte-for-byte with immutable source.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const source='C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const before='dccb53c6830f5e5aaf3c8454cd4eec5ae6b6222b';
const corrected='390834952b37ef325e9bf80c6dd994d745000493';
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const decode=(b:Uint8Array)=>new TextDecoder('utf-8',{fatal:true}).decode(b);
function pinned(commit:string,path:string,bytes:number,digest:string):Buffer{
 const b=execFileSync('git',['--no-replace-objects','-C',source,'show',commit+':'+path],{maxBuffer:32e6});
 assert.equal(b.length,bytes);assert.equal(sha(b),digest,path+' exact correction epoch');return b;
}
const previousNotice=pinned(before,'LICENSES/THIRD_PARTY_NOTICES.md',254167,'dd4be414cbcf07498a7b6552bdcc6541057af662804231aa2f80776842ada2cc');
const correctedNotice=pinned(corrected,'LICENSES/THIRD_PARTY_NOTICES.md',254554,'68071c14f9d603b0c63efe26140b662e57c6ec7d52a1b736ca7cb7dc6aadfd92');
export function bodypartsNoticeBeforeInventoryCorrection(text:string):string{
 assert.equal(text,decode(correctedNotice),'Current notice must be the entire exact corrected notice');
 const prefix='The expanded whole-body/regional library is covered by the same grant.';
 const oldLines=decode(previousNotice).split('\n'),newLines=text.split('\n');
 assert.equal(oldLines.length,newLines.length);
 const deltas=newLines.map((line,i)=>line===oldLines[i]?-1:i).filter(i=>i>=0);assert.equal(deltas.length,1);
 assert(newLines[deltas[0]].startsWith(prefix)&&oldLines[deltas[0]].startsWith(prefix));
 const projected=[...newLines];projected[deltas[0]]=oldLines[deltas[0]];
 assert.equal(projected.join('\n'),decode(previousNotice),'Only the exact inventory paragraph is projected');return projected.join('\n');
}
