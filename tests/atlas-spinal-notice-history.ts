import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const noticePath='atlas-review/LICENSES/THIRD_PARTY_NOTICES.md';
const spinalMarker='\n## Spinal-bone ultrasound orientation — 3 October 2026\n';
const thoracicMarker='\n## Thoracic-bone quick checks — 2 October 2026\n';
const saved=(revision:string)=>execFileSync('git',['show',revision+':'+noticePath],{encoding:'utf8',maxBuffer:32e6}).replaceAll('\r','');

/** Test-only removal of the exact saved spinal append; delivered credits stay. */
export function withoutSpinalNotice(text:string):string{
 const start=text.indexOf(spinalMarker);
 if(start<0)return text;
 assert.equal(text.indexOf(spinalMarker,start+spinalMarker.length),-1,'Duplicate spinal notice');
 const thoracic=saved('e7b2deb78b691639970c994d477f4739333e508f');
 const spinal=saved('92f5c1bf3a262699a7217454b9d5e5626e4f5659');
 const priorStart=thoracic.indexOf(thoracicMarker),thoracicStart=spinal.indexOf(thoracicMarker),spinalStart=spinal.indexOf(spinalMarker);
 assert(priorStart>=0&&thoracicStart>=0&&spinalStart>thoracicStart,'Saved notice milestones incomplete');
 assert.equal(spinal.slice(thoracicStart,spinalStart),thoracic.slice(priorStart),'Saved thoracic tail altered before spinal append');
 const addition=spinal.slice(spinalStart);
 assert.equal(createHash('sha256').update(addition).digest('hex'),'e506f3c02e66a5d0ad1df255bbbbeee55ab26cf98b580b00f06034cb55d4bac2');
 const canonical=readFileSync(noticePath,'utf8').replaceAll('\r','');
 const cut=canonical.indexOf(spinalMarker);
 assert(cut>=0,'Spinal notice absent from canonical source');
 assert.equal(canonical.slice(cut,cut+addition.length),addition,'Altered canonical spinal notice');
 assert.equal(start,cut,'Altered preceding notice or moved spinal notice');
 assert.equal(text.slice(start,start+addition.length),addition,'Altered spinal notice');
 return text.slice(0,start)+text.slice(start+addition.length);
}
