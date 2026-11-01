import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const source='G:/VisibleMedicine-temp/staging/20261101-orientation-integration/atlas';
const own='G:/VisibleMedicine-temp/proposals/20261101-facial-bone-ultrasound';
const overlay=own+'/overlay';
assert(!fs.existsSync(overlay));
const head=execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.equal(head,'e32617ef2ed8690472e797d791a061fa3b1985b4');
assert.equal(execFileSync('git',['-C',source,'status','--porcelain'],{encoding:'utf8'}).trim(),'');
const hash=b=>createHash('sha256').update(b).digest('hex');
const snapshotBytes=fs.readFileSync(source+'/content/regional-teaching/head-neck.json');
const snapshot=JSON.parse(snapshotBytes);
const families={
 'vm:anatomy:body:head-neck:midline:bone:mandible':'mandible',
 'vm:anatomy:body:head-neck:left:bone:left-maxilla':'maxilla',
 'vm:anatomy:body:head-neck:right:bone:right-maxilla':'maxilla',
 'vm:anatomy:body:head-neck:left:bone:left-zygomatic-bone':'zygoma',
 'vm:anatomy:body:head-neck:right:bone:right-zygomatic-bone':'zygoma',
};
const entries=snapshot.entries.flatMap(row=>{
 const identity=JSON.parse(row.identity),family=families[identity.id];
 if(!family)return [];
 assert.equal(row.lessons.ultrasound.readiness,'pending');
 assert.equal(identity.system,'skeleton');assert.equal(identity.category,'bone');
 assert.equal(identity.region,'head-neck');assert.equal(identity.sourceTree,'isa');
 assert.equal(identity.validation.anatomicalReview,false);
 return [{family,identity,previous:row.lessons.ultrasound}];
});
assert.equal(entries.length,5);assert.equal(new Set(entries.map(x=>x.identity.id)).size,5);
function write(p,v){const out=overlay+'/'+p;fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,v,{flag:'wx'});}
write('content/facial-bone-ultrasound-pins.json',JSON.stringify({baseline:head,regionalSnapshotSha256:hash(snapshotBytes),entries},null,2)+'\n');
write('content/facial-bone-ultrasound.ts',`// Original educational synthesis. References are reading links; no figures or images are imported.
export const facialBoneUltrasoundReferences = {
  facialTrauma: 'https://doi.org/10.1002/ajum.70001',
  orbitalComplex: 'https://pubmed.ncbi.nlm.nih.gov/11010787/',
  zygomaticComplex: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7176768/',
} as const;
export const facialBoneUltrasoundTopics = {
  mandible: {
    body: 'Facial ultrasound studies have examined the mandibular symphysis and parasymphysis as accessible cortical landmarks. These lie in the anterior mandible; a local surface view does not outline the ramus, condyle, teeth or mandibular canal. Use the selected whole mandible to orient the region before comparing an acquired image.',
    bullets: [
      'The cited study involved suspected facial trauma, rather than a normal-anatomy atlas. Its cortical observations do not establish complete visibility or exclude injury elsewhere.',
      'A gap between displayed model surfaces is not an ultrasound finding. This mesh contains no echo data or patient-specific fracture.'
    ],
    references: ['facialTrauma'],
  },
  maxilla: {
    body: 'A clinical study of zygomatico-orbital injury examined the infraorbital margin and lateral wall of the maxillary sinus with ultrasound. These are regional surface landmarks, not an image of the whole maxilla. Confirm the side and exact acquired interface before relating it to the selected bone.',
    bullets: [
      'The regional examination also included neighbouring zygomatic and orbital structures. A labelled maxilla alone does not identify every echo in that examination.',
      'This injury study does not establish visibility of all sinus walls, the full orbital floor or a normality test. No sinus contents, sonographic contour or patient registration are supplied by the mesh.'
    ],
    references: ['orbitalComplex'],
  },
  zygoma: {
    body: 'A zygomatic-complex study compared ultrasound views at the arch, frontozygomatic region, infraorbital region and zygomaticomaxillary buttress with the unaffected side. Use these named regions to orient the selected side, while keeping the adjacent temporal and maxillary bones distinct. An arch view is not a view of the entire zygomatic bone.',
    bullets: [
      'The opposite-side comparison came from an injury cohort; it is not proof that all interfaces are visible in every patient or that the model has normal acquired imaging.',
      'Colour and separation in the Atlas represent selections. They do not represent echoes, fracture displacement or a measured sonographic surface.'
    ],
    references: ['zygomaticComplex'],
  },
} as const;
export const facialBoneUltrasoundNote = 'Educational draft for revision-bound radiologist review. The source bone remains anatomically unvalidated. No acquired ultrasound, diagnostic rule, patient transform or procedural guidance is supplied. Atlas, imaging-case and paid-lecture access remain independent.';
`);
write('lib/facial-bone-ultrasound.ts',`import pins from '../content/facial-bone-ultrasound-pins.json' with {type: 'json'};
import {facialBoneUltrasoundTopics as topics, facialBoneUltrasoundReferences as references, facialBoneUltrasoundNote as note} from '../content/facial-bone-ultrasound.ts';
import {sourceCanonical} from './body-source-additions.ts';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings = new Map(pins.entries.map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), family: entry.family as keyof typeof topics,
}]));
/** A whole-record source match is required; names, sides and FMA identifiers alone are insufficient. */
export function facialBoneUltrasoundLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = topics[binding.family];
  return {readiness: 'draft', title: s.name + ' · Ultrasound surface orientation · draft',
    body: topic.body, bullets: [...topic.bullets],
    citations: topic.references.map(key => references[key]), note};
}
`);
const before=fs.readFileSync(source+'/app/body-content.ts','utf8');
const anchor='export function bodyLesson(s: BodyStructure, tab: ContentTab): ContentLesson {';
assert.equal(before.split(anchor).length,2);
const after="import {facialBoneUltrasoundLesson} from '../lib/facial-bone-ultrasound';\n"+before.replace(anchor,anchor+'\n  const facialBoneUltrasound = facialBoneUltrasoundLesson(s, tab);\n  if (facialBoneUltrasound) return facialBoneUltrasound;');
write('app/body-content.ts',after);
const manifest={schema:'vm.facial-bone-ultrasound-proposal/1',source,head,overlay,sourceBefore:{'app/body-content.ts':hash(Buffer.from(before)),'content/regional-teaching/head-neck.json':hash(snapshotBytes)},files:['content/facial-bone-ultrasound.ts','content/facial-bone-ultrasound-pins.json','lib/facial-bone-ultrasound.ts','app/body-content.ts'].map(p=>({path:p,sha256:hash(fs.readFileSync(overlay+'/'+p))})),targetLessons:5,integrated:false,generatedSnapshotsUpdated:false,clinicalApproval:false,patientRegistration:false};
fs.writeFileSync(own+'/MANIFEST.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({overlay,targetLessons:entries.length,sourceUnchanged:true}));
