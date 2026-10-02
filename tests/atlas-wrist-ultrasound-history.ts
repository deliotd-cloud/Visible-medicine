import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

/** Exact saved lumbar teaching epoch; wrist Ultrasound is tested separately. */
export function lumbarSacralMilestoneBytes(path:string){
 assert((/^(?:atlas-review\/|public\/atlas-)/.test(path)||path==='lib/atlas-model-inventory.json')&&!path.includes('..'));
 return execFileSync('git',['show','4d998e34bd7ea2734301645d6032088ace3c72b8:'+path],{maxBuffer:32e6});
}
/** Remove only the exact pinned append, including before protected dependency
 * suffixes. No shipped notice is modified by this test-only helper. */
export function withoutWristUltrasoundNotice(text:string):string{
 const marker='\n## Wrist ultrasound orientation — 2 October 2026\n';
 const start=text.indexOf(marker);if(start<0)return text;
 assert.equal(text.indexOf(marker,start+marker.length),-1,'Duplicate wrist Ultrasound notice');
 const canonical=readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8').replaceAll('\r','');
 const cut=canonical.indexOf(marker);assert(cut>=0);const addition=canonical.slice(cut);
 assert.equal(createHash('sha256').update(addition).digest('hex'),'89bf5e195837ab6b02a71e0718c442c2c40accb6d5b9bb904f417e25aac9f28d');
 assert.equal(text.slice(start,start+addition.length),addition,'Altered wrist Ultrasound notice');
 return text.slice(0,start)+text.slice(start+addition.length);
}
