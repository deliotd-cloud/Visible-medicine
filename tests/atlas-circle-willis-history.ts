import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {withoutCarpalQuizNotice} from './atlas-carpal-bone-quiz-history.ts';
/** Test-only exact saved wrist delivery epoch, never a learner fallback. */
export function wristUltrasoundMilestoneBytes(path:string){
 assert((/^(?:atlas-review\/|public\/atlas-)/.test(path)||path==='lib/atlas-model-inventory.json')&&!path.includes('..'));
 return execFileSync('git',['show','dbf3dac87ff6560cc7f20c5f7979564c1aa6619d:'+path],{maxBuffer:32e6});
}
/** Remove only this exact checked prefix; all older notices/suffixes survive. */
export function withoutCircleWillisNotice(text:string):string{
 text=withoutCarpalQuizNotice(text);
 const marker='## Circle of Willis guided orientation (2 October 2026)\n';
 const start=text.indexOf(marker);if(start<0)return text;
 assert.equal(text.indexOf(marker,start+marker.length),-1,'Duplicate Circle of Willis notice');
 const canonical=readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8').replaceAll('\r','');
 const from=canonical.indexOf(marker),end=canonical.indexOf('## Eye cross-sectional teaching',from);
 const revision=JSON.parse(readFileSync('atlas-review/manifest.json','utf8')).revision;
 const protectedPrefix='# Clinical Review third-party notices\n\nAtlas source: '+revision+'\n\n';
 const offset=text.startsWith(protectedPrefix)?protectedPrefix.length:0;
 assert(from>=0&&end>from);assert.equal(start,from+offset,'Moved Circle of Willis notice');
 const addition=canonical.slice(from,end);
 assert.equal(createHash('sha256').update(addition).digest('hex'),'6d32ebaebf6cea1934414eb0e33d126b6053706ea9c5fa2267f64538ecea9dae');
 assert.equal(text.slice(start,start+addition.length),addition,'Altered Circle of Willis notice');
 return text.slice(0,start)+text.slice(start+addition.length);
}
