import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
const compiled=await build({stdin:{contents:"export * from './lib/ultrasound-study'; export {createLectureBodyReference} from './lib/lecture-body-reference';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const square=(id='first',x=0.1,y=0.1)=>({id,label:id,polygon:[[x,y],[x+0.3,y],[x+0.3,y+0.3],[x,y+0.3]],notes:['Original draft note.']});
function fixture(){return {schema:'vm-ultrasound-teaching/1',id:'synthetic-study',title:'Synthetic test diagram, not ultrasound',region:'abdomen',source:{author:'Visible Medicine synthetic QA',license:'CC0-1.0',attribution:'Original non-medical test data.',url:null},frames:[{id:'first-frame',title:'Synthetic grid',orientationNote:'Image pixels only; no patient orientation or calibration.',image:{file:'grid.png',sha256:'a'.repeat(64),width:16,height:16},annotations:[square()]}]};}

test('a draft package is cloned and frozen without implying clearance or patient geometry',()=>{
 const raw=fixture(),study=api.parseUltrasoundStudy(raw);raw.frames[0].annotations[0].label='changed';
 assert.equal(study.frames[0].annotations[0].label,'first');assert(Object.isFrozen(study));assert(Object.isFrozen(study.frames));assert(Object.isFrozen(study.frames[0].annotations[0].polygon[0]));
 assert.equal(Object.hasOwn(study,'approved'),false);assert.equal(Object.hasOwn(study,'patientSpace'),false);
});
test('unknown approval, patient and registration fields are refused at each declared level',()=>{
 for(const mutate of [s=>s.clinicallyApproved=true,s=>s.patientName='not allowed',s=>s.source.privacyCleared=true,s=>s.frames[0].registration={},s=>s.frames[0].image.url='https://example.test/image.png',s=>s.frames[0].annotations[0].approved=true]){const s=fixture();mutate(s);assert.throws(()=>api.parseUltrasoundStudy(s));}
});
test('unsupported rights, credential-bearing links and active URL schemes are refused',()=>{
 for(const license of ['CC-BY-NC-4.0','CC-BY-ND-4.0','unknown','']){const s=fixture();s.source.license=license;assert.throws(()=>api.parseUltrasoundStudy(s));}
 for(const url of ['javascript:alert(1)','http://example.test','https://name:password@example.test/','file:///test.png']){const s=fixture();s.source.url=url;assert.throws(()=>api.parseUltrasoundStudy(s));}
 const s=fixture();s.source.url='https://commons.wikimedia.org/wiki/File:Example.png';assert.equal(api.parseUltrasoundStudy(s).source.url,s.source.url);
});
test('traversal, remote images, duplicate IDs and contradictory file definitions fail closed',()=>{
 for(const file of ['../grid.png','folder/grid.png','https://example.test/grid.png','grid.svg','grid..png']){const s=fixture();s.frames[0].image.file=file;assert.throws(()=>api.parseUltrasoundStudy(s));}
 const s=fixture();s.frames.push(structuredClone(s.frames[0]));assert.throws(()=>api.parseUltrasoundStudy(s),/unique/);
 const a=fixture();a.frames[0].annotations.push(structuredClone(a.frames[0].annotations[0]));assert.throws(()=>api.parseUltrasoundStudy(a),/unique/);
 const b=fixture(),other=structuredClone(b.frames[0]);other.id='second-frame';other.image.width=32;b.frames.push(other);assert.throws(()=>api.parseUltrasoundStudy(b),/conflicting/);
});
test('invalid, crossed and zero-area polygons cannot become quiz answers',()=>{
 for(const points of [[[0,0],[1,1],[1,0],[0,1]],[[0,0],[0.5,0.5],[1,1]],[[0,0],[1,0],[0,0]],[[0,0],[2,0],[1,1]],[[0,0],[NaN,0],[1,1]]]){const s=fixture();s.frames[0].annotations[0].polygon=points;assert.throws(()=>api.parseUltrasoundStudy(s));}
});
test('correct, wrong, outside and unknown-target answers are distinct',()=>{
 const s=fixture();s.frames[0].annotations.push(square('second',0.6,0.6));const frame=api.parseUltrasoundStudy(s).frames[0];
 assert.equal(api.ultrasoundQuizAnswer(frame,'first',0.2,0.2),'correct');assert.equal(api.ultrasoundQuizAnswer(frame,'first',0.7,0.7),'incorrect');
 assert.equal(api.ultrasoundQuizAnswer(frame,'first',0.5,0.5),'outside');assert.equal(api.ultrasoundQuizAnswer(frame,'absent',0.2,0.2),'unavailable');
 assert.equal(api.ultrasoundQuizAnswer(frame,'first',NaN,0.2),'outside');assert.equal(api.ultrasoundQuizAnswer(frame,'first',-0.1,0.2),'outside');
});
test('overlap and shared boundaries remain ambiguous rather than awarding either answer',()=>{
 const s=fixture();s.frames[0].annotations.push(square('overlap',0.2,0.2));const frame=api.parseUltrasoundStudy(s).frames[0];
 assert.equal(api.pickUltrasoundAnnotation(frame,0.3,0.3).kind,'ambiguous');assert.equal(api.ultrasoundQuizAnswer(frame,'first',0.3,0.3),'ambiguous');
 const t=fixture();t.frames[0].annotations.push(square('adjacent',0.4,0.1));assert.equal(api.ultrasoundQuizAnswer(api.parseUltrasoundStudy(t).frames[0],'first',0.4,0.2),'ambiguous');
 assert.equal(api.ultrasoundQuizAnswer(frame,'first',0.1,0.1),'correct');
});
test('picking uses a concave polygon rather than its bounding rectangle',()=>{
 const s=fixture();s.frames[0].annotations[0].polygon=[[0.1,0.1],[0.9,0.1],[0.9,0.3],[0.3,0.3],[0.3,0.9],[0.1,0.9]];
 const frame=api.parseUltrasoundStudy(s).frames[0];assert.equal(api.pickUltrasoundAnnotation(frame,0.7,0.7).kind,'miss');assert.equal(api.pickUltrasoundAnnotation(frame,0.2,0.7).kind,'match');
});
test('a concave label anchor lies in its annotation rather than in the empty notch',()=>{
 const s=fixture();s.frames[0].annotations[0].polygon=[[0.1,0.1],[0.9,0.1],[0.9,0.3],[0.3,0.3],[0.3,0.9],[0.1,0.9]];
 const frame=api.parseUltrasoundStudy(s).frames[0],annotation=frame.annotations[0],anchor=api.ultrasoundLabelAnchor(annotation);assert(anchor);
 const mean=annotation.polygon.reduce((sum,p)=>[sum[0]+p[0]/6,sum[1]+p[1]/6],[0,0]);assert.equal(api.pickUltrasoundAnnotation(frame,...mean).kind,'miss');
 assert.equal(api.pickUltrasoundAnnotation(frame,...anchor).kind,'match');assert.deepEqual(api.ultrasoundLabelAnchor(annotation),anchor);
});
test('zoom and pan retain a bounded image window, including peripheral targets',()=>{
 assert.deepEqual(api.ultrasoundViewWindow(1,[0.5,0.5]),{x:0,y:0,width:1,height:1});
 assert.deepEqual(api.ultrasoundViewWindow(4,[0.1,0.1]),{x:0,y:0,width:0.25,height:0.25});
 assert.deepEqual(api.ultrasoundViewWindow(4,[3,-2]),{x:0.75,y:0,width:0.25,height:0.25});
 for(const zoom of [1,1.5,2,3,4])for(const center of [[-5,-5],[0.05,0.05],[0.5,0.5],[0.95,0.95],[4,4]]){const w=api.ultrasoundViewWindow(zoom,center);assert(w.x>=0&&w.y>=0&&w.x+w.width<=1+1e-10&&w.y+w.height<=1+1e-10);}
 for(const zoom of [NaN,0,5,Infinity])assert.throws(()=>api.ultrasoundViewWindow(zoom,[0.5,0.5]));assert.throws(()=>api.ultrasoundViewWindow(2,[NaN,0.5]));
});
test('accessors and non-record objects are refused without executing their getters',()=>{
 let calls=0;const s=fixture();Object.defineProperty(s,'title',{get(){calls++;return 'unexpected';},enumerable:true});assert.throws(()=>api.parseUltrasoundStudy(s));assert.equal(calls,0);
 assert.throws(()=>api.parseUltrasoundStudy(Object.assign(new Date(),fixture())));
});
test('only exact source-bound same-region 3D references resolve, with no spatial claim',()=>{
 const catalog=JSON.parse(readFileSync('lib/lecture-body-catalog.json','utf8'));const row=catalog.rows.find(row=>catalog.regions[row[4]][0]==='abdomen'&&/kidney/i.test(row[1]));assert(row);
 const reference=api.createLectureBodyReference(row[0]);assert(reference);const raw=fixture();raw.frames[0].annotations[0].atlasReference=reference;
 const study=api.parseUltrasoundStudy(raw),annotation=study.frames[0].annotations[0],resolved=api.ultrasoundAtlasLink(study,annotation);assert(resolved);assert.equal(resolved.atlasHref,reference.atlasTarget);assert.match(resolved.scopeNote,/No image registration or clinical approval/);
 const stale=fixture();stale.frames[0].annotations[0].atlasReference={...reference,atlasRevision:'0'.repeat(40)};const staleStudy=api.parseUltrasoundStudy(stale);assert.equal(api.ultrasoundAtlasLink(staleStudy,staleStudy.frames[0].annotations[0]),null);
 const foreign=fixture();foreign.region='thorax';foreign.frames[0].annotations[0].atlasReference=reference;const foreignStudy=api.parseUltrasoundStudy(foreign);assert.equal(api.ultrasoundAtlasLink(foreignStudy,foreignStudy.frames[0].annotations[0]),null);
 assert.equal(api.ultrasoundAtlasLink(study,{...annotation}),null);
 const forged=fixture();forged.frames[0].annotations[0].atlasReference={...reference,atlasTarget:'/atlas/3d?forged=1'};const forgedStudy=api.parseUltrasoundStudy(forged);assert.equal(api.ultrasoundAtlasLink(forgedStudy,forgedStudy.frames[0].annotations[0]),null);
});
