import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {withoutLumbarSacralNotice} from './atlas-lumbar-sacral-history.ts';

// Inventory-preservation assertions belong to their saved editorial epoch.
// Current imports and delivery are checked separately by the cubital regression.
export function desktopLayoutImportMilestone(){
 return JSON.parse(new TextDecoder().decode(desktopLayoutMilestoneBytes('atlas-review/manifest.json')));
}
export function desktopLayoutMilestoneBytes(path:string){
 assert(/^(?:atlas-review\/|public\/atlas-)/.test(path)&&!path.includes('..'));
 return execFileSync('git',['show','4aa346e7923e3b303ad869d71e0ea36044d61aa6:'+path],{maxBuffer:32e6});
}

/** Remove only the complete independently pinned append, including in protected
 * notices where dependency licences follow it. Never alter shipped credits. */
export function withoutCubitalVenousUltrasoundNotice(text:string):string{
 text=withoutLumbarSacralNotice(text);
 const marker='\n## Superficial forearm venous ultrasound orientation — 2 October 2026\n';
 const start=text.indexOf(marker);if(start<0)return text;
 assert.equal(text.indexOf(marker,start+marker.length),-1,'Duplicate cubital notice');
 const canonical=withoutLumbarSacralNotice(readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8').replaceAll('\r',''));
 const cut=canonical.indexOf(marker);assert(cut>=0);const addition=canonical.slice(cut);
 assert.equal(createHash('sha256').update(addition).digest('hex'),'592572427cd5bb772212819d163fe20ae6b5f26162e437e448f5388f47570b36');
 assert.equal(text.slice(start,start+addition.length),addition,'Altered cubital notice');
 return text.slice(0,start)+text.slice(start+addition.length);
}
