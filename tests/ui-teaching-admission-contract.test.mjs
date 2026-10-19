import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const oldSource='3dcdf94a46db44202e72641be9fbcf1274ce5364',oldTree='b5ab50363b521aed2e8d4f0e34a8f5ed4ecee0d5';
const replace=(s,a,b)=>{assert.equal(s.split(a).length,2,a);return s.replace(a,b);};
const raw=[['./fixtures/current-atlas-delivery-before-ui-teaching.txt','70397d1a602d1de4a1cb76da2687cf138f81ace50b9322a60c3ce327cd193e5d'],['./fixtures/portal-admission-before-ui-teaching.txt','2c32d0068ce42d8a0bcc33b259e608af81fa9fbdd37ec27d03638a04e379b383']];
function expected(index,pin){
 const [path,hash]=raw[index],bytes=read(path);assert.equal(sha(bytes),hash);let source=bytes.toString();
 source=replace(source,oldSource,CURRENT_ATLAS_REVISION);source=replace(source,oldTree,pin.sourceTree);
 if(index===0)source=replace(source,'assert.equal(sourceFiles,1534);',`assert.equal(sourceFiles,${pin.reviewSourceFiles});`);
 else {source=replace(source,'exact clean Atlas3dc','exact clean Atlas'+CURRENT_ATLAS_REVISION.slice(0,4));source=replace(source,'assert.equal(pin.reviewSourceFiles,1534);',`assert.equal(pin.reviewSourceFiles,${pin.reviewSourceFiles});`);}
 return source;
}
test('closed59 pin remains exact stale evidence and both original assertion bodies retain only current-admission seams',()=>{
 const bytes=read('./fixtures/current-atlas-delivery-59.json');assert.equal(sha(bytes),'8f78fd9edc87dac6a8d9ef5fef681059bfb698eca39f0988ff470d44c0afd267');
 const old=JSON.parse(bytes);assert.equal(old.source,oldSource);assert.equal(old.sourceTree,oldTree);assert.equal(old.reviewSourceFiles,1534);assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));
 const pin=validateCurrentAtlasDelivery();
 assert.equal(read('./current-atlas-delivery.test.mjs').toString(),expected(0,pin));
 assert.equal(read('./clinical-review-portal-venous-current-admission.test.mjs').toString(),expected(1,pin));
});
test('extra edits or weakening original emitted-byte and stale-pin assertions cannot enter the seam',()=>{
 const pin=validateCurrentAtlasDelivery(),current=expected(0,pin),portal=expected(1,pin);
 for(const candidate of [current+'\n',current.replace('assert(artifacts>100&&inputs>1500);','assert(true);'),current.replace('assert.equal(sha(bytes),row.sha256,path);','assert(true);')])assert.notEqual(candidate,current);
 for(const candidate of [portal+'\n',portal.replace("assert.notEqual(pin.source,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');",'assert(true);')])assert.notEqual(candidate,portal);
});
