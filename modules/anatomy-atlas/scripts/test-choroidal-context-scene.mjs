import assert from 'node:assert/strict';
import test from 'node:test';
import {contextScene,sceneGeometryHash} from './choroidal-context-scene.mjs';
import {choroidalContextReport} from './choroidal-context-report.mjs';
import {readFile} from 'node:fs/promises';

const metadata={id:'test',name:'Synthetic geometry',role:'parent',side:'left',displayed:false,sources:[],hold:{}};
const shape={vertices:[[0,0,0],[1,0,0],[0,1,0]],faces:[[0,1,2]],min:[0,0,0],max:[1,1,0]};
const report={purpose:'source-only-choroidal-context-review',admissions:0,clinicalValidation:false,sourceGeometryChanged:false,
 duplicateScreen:{unavailableSources:0,unsupportedSignatures:0,verifiedSources:1,matches:[]},
 context:[{...metadata,vertices:3,triangles:1,bounds:{min:shape.min,max:shape.max},geometrySha256:sceneGeometryHash(shape)}],envelopeProbes:[],limitations:[]};
test('scene preserves original vertices/faces and binds every identity',()=>{
 const before=structuredClone(shape),r=contextScene(report,[{...metadata,shape}]);assert.deepEqual(r.meshes[0].vertices,shape.vertices);assert.deepEqual(r.meshes[0].faces,shape.faces);assert.deepEqual(shape,before);assert.equal(r.admissions,0);
});
test('scene rejects changed status, metadata, missing/duplicate identities and unsupported screens',()=>{
 for(const delta of [{admissions:1},{clinicalValidation:true},{sourceGeometryChanged:true},{purpose:'learner'}])assert.throws(()=>contextScene({...report,...delta},[{...metadata,shape}]));
 assert.throws(()=>contextScene(report,[]));assert.throws(()=>contextScene(report,[{...metadata,shape},{...metadata,shape}]));assert.throws(()=>contextScene(report,[{...metadata,name:'Changed',shape}]));
 for(const delta of [{unavailableSources:1},{unsupportedSignatures:1}])assert.throws(()=>contextScene({...report,duplicateScreen:{...report.duplicateScreen,...delta}},[{...metadata,shape}]));
 for(const changed of [{...shape,vertices:[[NaN,0,0],...shape.vertices.slice(1)]},{...shape,faces:[[0,1,3]]},{...shape,min:[1,0,0]}])assert.throws(()=>contextScene(report,[{...metadata,shape:changed}]));
 assert.throws(()=>contextScene(report,[{...metadata,shape:{...shape,vertices:[[0,0,0],[.9,0,0],[0,1,0]]}}]),/geometry changed/);
 assert.throws(()=>contextScene(report,[{...metadata,shape:{...shape,faces:[[0,2,1]]}}]),/geometry changed/);
});
test('actual report reproduces and original scene coordinates remain unchanged',async()=>{
 const {report,meshes}=await choroidalContextReport(),saved=JSON.parse(await readFile('content/choroidal-context-review.json'));
 assert.deepEqual(report,saved);const r=contextScene(report,meshes);assert.equal(r.meshes.length,12);assert.equal(report.duplicateScreen.verifiedSources,1854);assert.equal(report.duplicateScreen.matches.length,0);
 assert.equal(report.envelopeProbes.length,16);const unsupported=report.envelopeProbes.filter(p=>!p.supported);assert.equal(unsupported.length,4);assert(unsupported.every(p=>p.target==='FMA61934'&&p.vertices.counts['unsupported-open-or-invalid-surface'].fraction===1));
 for(let i=0;i<meshes.length;i++){assert.deepEqual(r.meshes[i].vertices,meshes[i].shape.vertices);assert.deepEqual(r.meshes[i].faces,meshes[i].shape.faces);}
});
test('source pin tampering or unavailable required context fails before export',async()=>{
 await assert.rejects(choroidalContextReport({readSource:async()=>Buffer.from('v 0 0 0\n')}),/Source SHA changed/);
 await assert.rejects(choroidalContextReport({readSource:async()=>{throw Object.assign(new Error('Required cache unavailable'),{code:'ENOENT'});}}),/cache unavailable/);
});
