import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
/** Exact saved Circle milestone; never a learner fallback or approval migration. */
export function circleWillisMilestoneBytes(path:string){
 assert((/^(?:atlas-review\/|public\/atlas-)/.test(path)||path==='lib/atlas-model-inventory.json')&&!path.includes('..'));
 return execFileSync('git',['show','992b1d2fd99e5304157005d41d394f1500ec21b1:'+path],{maxBuffer:32e6});
}
/** Test-only removal of this complete hash-pinned append; shipped credits stay. */
export function withoutCarpalQuizNotice(text:string):string{
 const marker='\n## Carpal-bone structure checks — 2 October 2026\n';
 const start=text.indexOf(marker);if(start<0)return text;
 assert.equal(text.indexOf(marker,start+marker.length),-1,'Duplicate carpal notice');
 const canonical=readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8').replaceAll('\r','');
 const cut=canonical.indexOf(marker);assert(cut>=0);
 const revision=JSON.parse(readFileSync('atlas-review/manifest.json','utf8')).revision;
 const prefix='# Clinical Review third-party notices\n\nAtlas source: '+revision+'\n\n';
 assert.equal(start,cut+(text.startsWith(prefix)?prefix.length:0),'Altered preceding notice or moved carpal notice');
 const addition=canonical.slice(cut);
 assert.equal(createHash('sha256').update(addition).digest('hex'),'34786ade34eddd161388daabd2fc77ac5c55436c76697a78275172066dc312f5');
 assert.equal(text.slice(start,start+addition.length),addition,'Altered carpal notice');
 return text.slice(0,start)+text.slice(start+addition.length);
}
