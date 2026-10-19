import assert from 'node:assert/strict';
import test from 'node:test';
import {createHeadFolderSession,type HeadRememberedView} from '../lib/head-folder-session.ts';
import type {HeadStudy,LocalHeadPackage,Modality} from '../lib/head-atlas-import.ts';

const revision='pinned-synthetic-revision';
const definition=(shape:unknown) => ({entries:[],image:{shape_kji:shape}}) as unknown as HeadStudy;
const ct=definition([2,3,4]),mri=definition([3,2,5]);
const pkg={manifest:{studies:{CT:ct,MRI:mri}}} as LocalHeadPackage;

test('remembered IJK and layout require opt-in, exact package, definition and revision',()=>{
 const session=createHeadFolderSession(revision),view:HeadRememberedView={cursor:[3,2,1],layout:'multiplanar'};
 assert.equal(session.keepView(pkg,'CT',ct,revision,view),false);
 assert.equal(session.readView(pkg,'CT',ct,revision),null);
 session.keep(pkg,revision);
 assert.equal(session.keepView(pkg,'CT',ct,revision,view),true);
 view.cursor[0]=0;
 assert.deepEqual(session.readView(pkg,'CT',ct,revision),{cursor:[3,2,1],layout:'multiplanar'});
 const returned=session.readView(pkg,'CT',ct,revision)!;returned.cursor[1]=0;
 assert.deepEqual(session.readView(pkg,'CT',ct,revision),{cursor:[3,2,1],layout:'multiplanar'});
 assert.equal(session.readView(pkg,'MRI',mri,revision),null);
 assert(session.keepView(pkg,'MRI',mri,revision,{cursor:[4,1,2],layout:'sagittal'}));
 assert.deepEqual(session.readView(pkg,'MRI',mri,revision),{cursor:[4,1,2],layout:'sagittal'});
 session.keep(pkg,revision);
 assert.deepEqual(session.readView(pkg,'CT',ct,revision),{cursor:[3,2,1],layout:'multiplanar'});
 for(const [candidate,modality,source,pin] of [
   [{...pkg},'CT',ct,revision],
   [pkg,'CT',{...ct},revision],
   [pkg,'MRI',ct,revision],
   [pkg,'XR',ct,revision],
   [pkg,'CT',ct,'stale-revision'],
 ] as const){
   assert.equal(session.readView(candidate as LocalHeadPackage,modality as Modality,source as HeadStudy,pin),null);
   assert.equal(session.keepView(candidate as LocalHeadPackage,modality as Modality,source as HeadStudy,pin,{cursor:[0,0,0],layout:'axial'}),false);
 }
 pkg.manifest.studies.CT=definition([2,3,4]);
 assert.equal(session.readView(pkg,'CT',pkg.manifest.studies.CT,revision),null);
 pkg.manifest.studies.CT=ct;
 assert.deepEqual(session.readView(pkg,'CT',ct,revision),{cursor:[3,2,1],layout:'multiplanar'});
});

test('malformed or out-of-grid positions and layouts are refused without replacing a valid view',()=>{
 const session=createHeadFolderSession(revision);session.keep(pkg,revision);
 const valid:HeadRememberedView={cursor:[3,2,1],layout:'coronal'};
 assert(session.keepView(pkg,'CT',ct,revision,valid));
 const malformed=[
   {cursor:[4,2,1],layout:'axial'}, {cursor:[3,3,1],layout:'axial'}, {cursor:[3,2,2],layout:'axial'},
   {cursor:[-1,0,0],layout:'axial'}, {cursor:[0.5,0,0],layout:'axial'}, {cursor:[NaN,0,0],layout:'axial'},
   {cursor:[Infinity,0,0],layout:'axial'}, {cursor:[0,0],layout:'axial'}, {cursor:[0,0,0,0],layout:'axial'},
   {cursor:null,layout:'axial'}, {cursor:[0,0,0],layout:'3d'}, {cursor:[0,0,0],layout:null}, null,
 ];
 const sparseCursor=new Array(3);sparseCursor[0]=0;sparseCursor[2]=0;
 malformed.push({cursor:sparseCursor,layout:'axial'});
 for(const value of malformed)assert.equal(session.keepView(pkg,'CT',ct,revision,value as HeadRememberedView),false);
 assert.deepEqual(session.readView(pkg,'CT',ct,revision),valid);
 const sparseShape=new Array(3);sparseShape[0]=2;sparseShape[2]=4;
 for(const shape of [undefined,null,[],[2,3],[2,3,4,5],[0,3,4],[-1,3,4],[2.5,3,4],[NaN,3,4],[2,3,4097],sparseShape]){
   const invalid=definition(shape),candidate={manifest:{studies:{CT:invalid,MRI:mri}}} as LocalHeadPackage;
   session.keep(candidate,revision);
   assert.equal(session.keepView(candidate,'CT',invalid,revision,{cursor:[0,0,0],layout:'axial'}),false);
   assert.equal(session.readView(candidate,'CT',invalid,revision),null);
 }
});

test('replacement, stale keep and clear discard both modalities',()=>{
 const session=createHeadFolderSession(revision);session.keep(pkg,revision);
 assert(session.keepView(pkg,'CT',ct,revision,{cursor:[1,1,1],layout:'axial'}));
 assert(session.keepView(pkg,'MRI',mri,revision,{cursor:[2,1,1],layout:'sagittal'}));
 const replacement={manifest:{studies:{CT:ct,MRI:mri}}} as LocalHeadPackage;
 session.keep(replacement,revision);
 assert.equal(session.readView(pkg,'CT',ct,revision),null);
 assert.equal(session.readView(replacement,'CT',ct,revision),null);
 assert.equal(session.readView(replacement,'MRI',mri,revision),null);
 assert(session.keepView(replacement,'CT',ct,revision,{cursor:[0,0,0],layout:'axial'}));
 session.keep(replacement,'stale');session.keep(replacement,revision);
 assert.equal(session.readView(replacement,'CT',ct,revision),null);
 assert(session.keepView(replacement,'MRI',mri,revision,{cursor:[0,0,0],layout:'coronal'}));
 session.clear();session.keep(replacement,revision);
 assert.equal(session.readView(replacement,'MRI',mri,revision),null);
});
