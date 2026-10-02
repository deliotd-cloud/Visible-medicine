import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
/** Exact saved carpal milestone; never a learner fallback or approval migration. */
export function carpalQuizMilestoneBytes(path:string){
 assert((/^(?:atlas-review\/|public\/atlas-)/.test(path)||path==='lib/atlas-model-inventory.json')&&!path.includes('..'));
 return execFileSync('git',['show','dae6af5448463d2d8bf2c193723cf076f6f88e8c:'+path],{maxBuffer:32e6});
}
/** Exact saved thoracic milestone, separate from later renderer-only changes. */
export function thoracicQuizMilestoneBytes(path:string){
 assert((/^(?:atlas-review\/|public\/atlas-)/.test(path)||path==='lib/atlas-model-inventory.json')&&!path.includes('..'));
 return execFileSync('git',['show','e7b2deb78b691639970c994d477f4739333e508f:'+path],{maxBuffer:32e6});
}
/** Test-only removal of this complete hash-pinned append; shipped credits stay. */
export function withoutThoracicQuizNotice(text:string):string{
 const marker='\n## Thoracic-bone quick checks — 2 October 2026\n';
 const start=text.indexOf(marker);if(start<0)return text;
 assert.equal(text.indexOf(marker,start+marker.length),-1,'Duplicate thoracic notice');
 const canonical=readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8').replaceAll('\r','');
 const cut=canonical.indexOf(marker);assert(cut>=0);
 const revision=JSON.parse(readFileSync('atlas-review/manifest.json','utf8')).revision;
 const prefix='# Clinical Review third-party notices\n\nAtlas source: '+revision+'\n\n';
 assert.equal(start,cut+(text.startsWith(prefix)?prefix.length:0),'Altered preceding notice or moved thoracic notice');
 const addition=canonical.slice(cut);
 assert.equal(createHash('sha256').update(addition).digest('hex'),'ae9718302d2174518f6b60aaddb1f42baec1592dff98a9c5f4a54482f71a1300');
 assert.equal(text.slice(start,start+addition.length),addition,'Altered thoracic notice');
 return text.slice(0,start)+text.slice(start+addition.length);
}
