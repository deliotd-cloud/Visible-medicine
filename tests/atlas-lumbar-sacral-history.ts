import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

/** Exact saved Spread epoch; current lumbar teaching is tested separately. */
export function regionalSpreadMilestoneBytes(path:string){
 assert(/^(?:atlas-review\/|public\/atlas-)/.test(path)&&!path.includes('..'));
 return execFileSync('git',['show','968f502957088c8d53c9bac025db0746d4c1424a:'+path],{maxBuffer:32e6});
}
/** Only remove the independently pinned append in test-only historical replay.
 * Shipped notices are never changed. Protected notices may have a licence suffix. */
export function withoutLumbarSacralNotice(text:string):string{
 const marker='\n## Lumbar and sacral structure checks — 2 October 2026\n';
 const start=text.indexOf(marker);if(start<0)return text;
 assert.equal(text.indexOf(marker,start+marker.length),-1,'Duplicate lumbar/sacral notice');
 const canonical=readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8').replaceAll('\r','');
 const cut=canonical.indexOf(marker);assert(cut>=0);const addition=canonical.slice(cut);
 assert.equal(createHash('sha256').update(addition).digest('hex'),'85b095d343c1a82bb1463b4e039ceeee896fef70d11873c5786101e202c2caa0');
 assert.equal(text.slice(start,start+addition.length),addition,'Altered lumbar/sacral notice');
 return text.slice(0,start)+text.slice(start+addition.length);
}
