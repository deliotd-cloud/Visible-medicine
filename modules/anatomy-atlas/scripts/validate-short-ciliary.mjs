import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Matrix4,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {sourceObjShape} from './source-surface-audit.mjs';
import {loadCurrentSourceHolds} from './current-source-holds.mjs';
import {build} from './workspace-test-build.mjs';
const compiled=await build({stdin:{contents:"export * from './lib/body-presentation-parts';export * from './lib/body-display-catalog';export * from './lib/short-ciliary';export * from './lib/study-links';export * from './lib/body-review-material';export { bodyLesson } from './app/body-content';export { dissectionProfiles, matchesRule } from './app/dissection-data';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const source=JSON.parse(await readFile('public/models/bodyparts3d/short-ciliary/catalog.json','utf8'));
const current=await loadCurrentSourceHolds(),catalog=api.bodyDisplayCatalog(current.catalog),s=catalog.structures.find(s=>s.fmaId==='FMA7041');
assert(s);assert.deepEqual(s,source.structures[0]);assert.equal(catalog.structures.length,1103);assert.equal(catalog.structures.filter(p=>p.sources.some(f=>['FJ1319','FJ1370'].includes(f.file))).length,1);
current.policy.assertNoKnownHolds([{tree:'isa',id:s.fmaId,name:s.sourceName,files:s.sources.map(f=>f.file)}]);
const before=JSON.stringify(s),bytes=await readFile('public/models/bodyparts3d/short-ciliary/short-ciliary.glb');
assert.equal(createHash('sha256').update(bytes).digest('hex'),source.bundles[0].sha256);
const loaded=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');const nodes=new Map();loaded.scene.traverse(m=>{if(m.isMesh)nodes.set(m.name,m)});assert.equal(nodes.size,3);
const matrix=new Matrix4().fromArray(catalog.coordinateSystem.sourceToSceneColumnMajor);let total=0;
for(const part of s.presentationParts){
 const original=await readFile(`content/sources/short-ciliary/${part.source.file}.obj`);assert.equal(createHash('sha256').update(original).digest('hex'),part.source.sha256);
 const shape=sourceObjShape(original),mesh=nodes.get(part.nodeName);assert.deepEqual(Array.from(mesh.geometry.index.array),shape.faces.flat());
 assert.deepEqual(Array.from(mesh.geometry.attributes.position.array),Array.from(new Float32Array(shape.vertices.flatMap(v=>new Vector3(...v).applyMatrix4(matrix).toArray()))));
 assert(shape.vertices.every(v=>part.displaySide==='left'?v[0]>0:v[0]<0));assert.deepEqual(mesh.userData.presentationPart,part);total+=shape.faces.length;
 const projected=api.bodyPresentationStructure(s,part.displaySide);assert.equal(projected.nodeName,part.nodeName);assert.deepEqual(projected.bounds,part.bounds);assert.deepEqual(projected.anchor,part.anchor);assert.equal(projected.id,s.id);assert.equal(projected.fmaId,s.fmaId);assert.deepEqual(projected.sources,s.sources);assert.equal(projected.laterality,'unspecified');
}
assert.equal(total,1240);assert.equal(nodes.get(s.nodeName).geometry.index.count,total*3);assert.deepEqual(nodes.get(s.nodeName).userData.presentationParts,s.presentationParts);
assert.equal(api.bodyPresentationStructure(s,'both'),s);assert.equal(JSON.stringify(s),before);
let links=0;
for(const side of ['both','left','right'])for(const focus of [null,'short-ciliary-context']){
 assert(api.bodyStudyScope(catalog,'head-neck',side).some(p=>p.id===s.id));
 const url=api.makeStudyLink(catalog,'head-neck',s.id,side,focus);assert(url);const q=Object.fromEntries(new URL(url,'https://local.test').searchParams);const parsed=api.parseStudyLink(q);const resolved=api.resolveStudyLink(catalog,'head-neck',parsed);assert.equal(resolved.status,'ready');assert.deepEqual(resolved.selected,s);links++;
}
const focusRecipe=api.dissectionProfiles['head-neck'].focuses.find(f=>f.id==='short-ciliary-context');
assert(api.matchesRule(s,focusRecipe.rule));assert.equal(focusRecipe.includeSkeleton,false);
for(const fma of focusRecipe.rule.fmaIds)assert.equal(catalog.structures.filter(p=>p.fmaId===fma).length,1,'Every orbital context identity exists exactly once');
const lesson=api.bodyLesson(s,'anatomy');assert.equal(lesson.readiness,'draft');assert.equal(api.bodyLesson(s,'mri').readiness,'pending');
const review=await api.bodyReviewMaterial(s.id);assert.deepEqual(review.source.structure.presentationParts,s.presentationParts);assert.equal(review.approval,false);
let mutations=0;
for(const mutate of [p=>p.presentationParts.reverse(),p=>p.presentationParts[0].displaySide='right',p=>p.presentationParts[0].source.sha256='0'.repeat(64),p=>p.presentationParts[0].nodeName=p.nodeName,p=>p.presentationParts[0].bounds.max[0]=NaN,p=>p.presentationParts[0].anchor[0]=1e9,p=>p.presentationParts[0].center[0]=1e9,p=>p.presentationParts.pop()]){
 const copy=structuredClone(s);mutate(copy);assert.equal(api.validBodyPresentationParts(copy),false);assert.equal(api.bodySideMatches(copy,'left'),false);assert.throws(()=>api.bodyPresentationStructure(copy,'left'));mutations++;
}
const corrupted=structuredClone(catalog);corrupted.structures.find(p=>p.id===s.id).presentationParts[0].displaySide='right';assert.throws(()=>api.addShortCiliary(corrupted));
for(const old of catalog.structures.filter(p=>p.id!==s.id))for(const side of ['both','left','right'])assert.equal(api.bodySideMatches(old,side),side==='both'||old.laterality===side||['midline','unpaired','unspecified'].includes(old.laterality));
assert.equal(api.bodySideMatches(s,'invalid'),false);
const changedPresentation=structuredClone(s);changedPresentation.presentationParts[0].anchor[0]+=.00001;
assert.notEqual(api.bodyPresentationRevision([s]),api.bodyPresentationRevision([changedPresentation]));
assert.equal(api.bodyPresentationRevision(catalog.structures),api.bodyPresentationRevision([...catalog.structures].reverse()));
assert(api.bodyPresentationRevision(catalog.structures).length+catalog.bundles.length*100<16000,'Saved-view revision remains within schema size');
const report={canonicalSelections:1,sourceTriangles:total,partSides:2,alternativeRenderNodes:3,links,invalidPartMutations:mutations,legacySideComparisons:1102*3,sourceBytesAndGeometryVerified:true,canonicalIdentityPreserved:true,reviewPartMappingIncluded:true,browserAcceptance:false,clinicalApproval:false};
await writeFile('docs/short-ciliary-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
