import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const here=path.dirname(fileURLToPath(import.meta.url));
const oldRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const importLine="import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';\n";
const originals={
 'clinical-review-collicular-teaching.test.ts':'f67179b20e243911a760023f8a3ffb65fe3ffad25c13d28eca23fccd9e580f1f',
 'clinical-review-coronary-sinus-ultrasound.test.ts':'65ca25b2d4b409f45ba6a2d1aa5a1496327aeaf0bc284c5a2f5a585a75ec826d',
 'clinical-review-craniofacial-bone-quiz.test.ts':'6b1e9fe1ed89ef51efe2e93568df4f61d1269b3e4998c70cf5738118c6a75dc7',
 'clinical-review-deep-brain-quiz.test.ts':'e6d0603bf00f8c07d0b4a46818bd2963d1fde1c19958b06e45897e34acede437',
 'clinical-review-femoral-component-imaging.test.ts':'408627f5bcfc17c58f644f61788679008d4e79c3d30c7ecf514afdc01656451d',
 'clinical-review-foot-bone-quiz.test.ts':'020d5f4a0879ec02b19292d1276002dbfd2940ba03c5f211eca5492feac10a45',
 'clinical-review-forearm-muscle-quiz.test.ts':'eb2bb05c84dd79d311f593d9e35cfdfcfc72584fc1e8152ecda7f149ee1be4b0',
 'clinical-review-forearm-venous-cross-sectional.test.ts':'3daee15892e808f567391105060d0cbde589ae19ed4d74b895da529d871444ff',
 'clinical-review-forearm-vessel-quiz.test.ts':'b1719e17e1d0a73a8ee6da3f8875f55d159b20cee018b6358389f77e1f813c00',
 'clinical-review-foregut-vessel-quiz.test.ts':'e536100f6837be27820a8bc8f864d60cf11d7351fea56c520026d9f7d8b88881',
 'clinical-review-guided-library.test.ts':'78cf736bc54d50725c6e0c5821751d68e068d8d45090835a6bacfddaad6a3535',
 'clinical-review-hand-arterial-quiz.test.ts':'6b8a89748f3ad53aa275f8c12c6122fb3e09f70aec7a9aec5ab1173217757f9a',
 'clinical-review-hand-bone-quiz.test.ts':'a1b60937c9ba81c241633c777d0bc99c80f0b7db5e051aae33030b00e76220ea',
 'clinical-review-iliac-vessel-quiz.test.ts':'24bd0e93c341d06bdda94e6fbf70e3da3db95757dd783edf0a0268d72e80ae59',
 'clinical-review-laryngeal-support-imaging.test.ts':'4aa23cb78fdebd7c9e3e2eb911071f01301aef3ba9079994d3d3cc5a05184121',
 'clinical-review-limb-connective-ct.test.ts':'dfd8b28189240e0108d19b7ac42af950331f101fe54e2209cb37e83bc825223c',
 'clinical-review-lower-limb-bone-reasoning.test.ts':'60f6d87843eee746a32d6e1d7e42cc9b0b4a3d70f6abc54f075ea356d7508c5d',
 'clinical-review-lower-limb-vessel-quiz.test.ts':'58aabbd1820bb3a2cf20396c03a1cda3f6898aafdd9518707a0df419a1f07aff',
 'clinical-review-major-limb-bone-quiz.test.ts':'aeb09a74992c6601d6b70642e237c74c2272f75baae28a0d3fe43d84ff0b2ff0',
 'clinical-review-nested-selection-order.test.ts':'dd2a58480a887e88706e52dea59997464077ce4422c81352e8250c4f7b7e5e82',
};

function sha256(bytes){return createHash('sha256').update(bytes).digest('hex');}
function expectedPostimage(name){
 const original=readFileSync(path.join(here,'fixtures','clinical-current-pins',name+'.txt'));
 assert.equal(sha256(original),originals[name],`${name}: original identity`);
 assert.equal(original.includes(13),false,`${name}: LF-only original`);
 const source=original.toString('utf8');
 assert.equal(source.split(oldRevision).length-1,1,`${name}: one old revision`);
 const learner=`assert.equal(learner.sourceCommit,'${oldRevision}');`;
 const review=`assert.equal(review.revision,'${oldRevision}');`;
 const count=Number(source.includes(learner))+Number(source.includes(review));
 assert.equal(count,1,`${name}: one eligible assertion`);
 const before=source.includes(learner)?learner:review;
 const after=before.replace(`'${oldRevision}'`,'CURRENT_ATLAS_REVISION');
 let admitted=importLine+source.replace(before,after);
 if(name==='clinical-review-guided-library.test.ts'){
  const once=(before,after)=>{assert.equal(admitted.split(before).length-1,1,'Exact guided renderer admission');admitted=admitted.replace(before,after);};
  once(importLine,"import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\n");
  once("import {createHash} from 'node:crypto';\n","import {createHash} from 'node:crypto';\nimport {execFileSync} from 'node:child_process';\n");
  once(" assert.equal(rendererFile.sourceSha256,'5fb911cd62e63452591d7dff7fe474c0dccf80485290c1c7afd60ff0ac08ae33');",[
   ' const atlas=currentAtlasDeliveryRoot();',
   " const historicalRenderer=execFileSync('git',['-C',atlas,'show','9fba9a1e24b6669aafd48e945d55fc0939d50ab2:'+rendererPath],{windowsHide:true,maxBuffer:2e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});",
   " assert.equal(sha(historicalRenderer),'5fb911cd62e63452591d7dff7fe474c0dccf80485290c1c7afd60ff0ac08ae33');",
   " const currentRenderer=execFileSync('git',['-C',atlas,'show',CURRENT_ATLAS_REVISION+':'+rendererPath],{windowsHide:true,maxBuffer:2e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});",
   ' assert.equal(rendererFile.sourceSha256,sha(currentRenderer));',
   " assert(!inputs.some((row:{path:string})=>row.path===rendererPath),'Generated renderer metadata must not be its own source dependency');",
  ].join('\n'));
 }
 return Buffer.from(admitted,'utf8');
}
function preserve(name,actual){
 assert.deepEqual(actual,expectedPostimage(name),name);
}

test('nineteen current pins and one historical/current renderer split preserve exact original bodies',()=>{
 assert.equal(Object.keys(originals).length,20);
 for(const name of Object.keys(originals)){
  preserve(name,readFileSync(path.join(here,name)));
 }
});

test('guided renderer source-check tampering is refused',()=>{
 const name='clinical-review-guided-library.test.ts',expected=expectedPostimage(name).toString('utf8');
 const before='assert.equal(rendererFile.sourceSha256,sha(currentRenderer));';
 assert.equal(expected.split(before).length-1,1);
 assert.throws(()=>preserve(name,Buffer.from(expected.replace(before,'assert.equal(rendererFile.sourceSha256,sha(historicalRenderer));'))),assert.AssertionError);
});

test('approval and clinical answer assertion tampering is refused',()=>{
 const name='clinical-review-major-limb-bone-quiz.test.ts';
 const expected=expectedPostimage(name).toString('utf8');
 const approval='assert.equal(packet.approval,false);';
 const answer='assert.equal(lesson.bullets.filter((answer:string)=>answer===lesson.correctAnswer).length,1);';
 assert.equal(expected.split(approval).length-1,1);
 assert.equal(expected.split(answer).length-1,1);
 assert.throws(()=>preserve(name,Buffer.from(expected.replace(approval,'assert.equal(packet.approval,true);'))),assert.AssertionError);
 assert.throws(()=>preserve(name,Buffer.from(expected.replace(answer,answer.replace('length,1','length,0')))),assert.AssertionError);
});
