import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const names=['forefoot-muscle-quiz','hand-muscle-quiz','leg-muscle-quiz','lower-arterial-tour','lower-connective-quiz','pelvic-quiz','pharyngeal-imaging','thigh-muscle-quiz'];
const oldHash='09189d13a033c9c251de2a21672b3d34fbc32fc743cdaf439bffa450e47ef34b';
const oldCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const sha=b=>createHash('sha256').update(b).digest('hex');
const originalHashes={
  'forefoot-muscle-quiz':'defa78f99d791cbfb3ed8a8ee2469a531f803f22f6979bed7e5b4fc443d7bb24',
  'hand-muscle-quiz':'42701f5b900196909e08477cd1d8745e35e3206cb8a0fbcf2520bdb497ce05bc',
  'leg-muscle-quiz':'cd16c24b86474d8c9514dbbf919a4568f7893dddfe286c6f243bc893cdbccc7c',
  'lower-arterial-tour':'386e3b5ad6fb98dd97a8aa33e4433bc1e677bc06af76ea1f1892d7cceaac7a47',
  'lower-connective-quiz':'107771258fcd549e9f6798b70c69b4cb300814a212ca65b7e8f9fda798eb942f',
  'pelvic-quiz':'78c232b18d81a760f784edc7edfa1ede94bd10b4b9aa58a2475392bbf83ecc58',
  'pharyngeal-imaging':'0343c05cb19469ff40e2cd960489498590e40cd76c77ea90f153fc22ef7ec6d0',
  'thigh-muscle-quiz':'9a4b52b710c02cfc36b6f7d676c123f48f39bd3d6547191b580c6794a5af855f',
};
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`Expected exactly one ${a}`);return s.replace(a,b);};
const lowerCurrentHash='a9b3d794de0932cfd73b59236e5a364a02991ade9751a40a0276ed686c3d0d87';
const lowerPreFollowupHash='65717aa16b244bb30a04638cd6f3dcc553bb76ad162f9e25f88101bd6dff3799';
function restoreLowerCurrent(post){
 assert.equal(sha(post),lowerCurrentHash,'Exact reviewed current lower arterial test');
 let restored=once(post,"import {execFileSync} from 'node:child_process';\n",'');
 restored=once(restored,
  "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
  "import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';");
 restored=once(restored,
  " const admittedTest=readFileSync('tests/fixtures/raw-clinical-review-lower-arterial-tour.test.ts.raw');\n"+
  " assert.equal(sha(admittedTest),'386e3b5ad6fb98dd97a8aa33e4433bc1e677bc06af76ea1f1892d7cceaac7a47');\n"+
  " assert(admittedTest.toString().includes(\"assert.equal(maxTours,5,'right hip context also participates in the pelvic venous tour')\"));\n",'');
 restored=once(restored,
  " for(const path of ['lib/lower-arterial-tour.ts','content/lower-arterial-tour-pins.json','lib/regional-tours.ts',\n"+
  "  'lib/pelvic-ring-tour.ts','lib/lower-limb-bone-tour.ts','lib/lower-venous-tour.ts',\n"+
  "  'content/lower-venous-tour-v2-pins.json','lib/pelvic-venous-tour.ts','content/pelvic-venous-tour-pins.json']){",
  " for(const path of ['lib/lower-arterial-tour.ts','content/lower-arterial-tour-pins.json','lib/regional-tours.ts']){");
 restored=once(restored,
  "  assert(input&&imported,path);assert.equal(imported.sourceSha256,input.sha256);\n"+
  "  assert.equal(imported.importedSha256,input.sha256,path+' exact Review import');\n"+
  "  assert.equal(sha(readFileSync('atlas-review/'+path)),input.sha256);\n"+
  "  const committed=execFileSync('git',['-C',currentAtlasDeliveryRoot(),'show',`${CURRENT_ATLAS_REVISION}:${path}`],\n"+
  "   {windowsHide:true,maxBuffer:4e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n"+
  "  assert.equal(sha(committed),input.sha256,path+' exact committed Atlas source');",
  "  assert(input&&imported,path);assert.equal(imported.sourceSha256,input.sha256);assert.equal(sha(readFileSync('atlas-review/'+path)),input.sha256);");
 restored=once(restored,
  " const rightHipTours=['male-pelvic-viscera-orientation','right-lower-limb-bone-orientation',\n"+
  "  'pelvic-ring-hip-orientation','right-lower-limb-venous-orientation',\n"+
  "  'right-lower-limb-arterial-orientation','pelvic-venous-tributaries-orientation'].sort();\n",'');
 restored=once(restored,
  "   assert.deepEqual(packet.guidedTours.map((e:{tour:{id:string}})=>e.tour.id).sort(),rightHipTours);\n"+
  "   for(const guided of packet.guidedTours)for(const step of guided.tour.steps)assert(js.includes(step.caption));",
  "   assert.equal(packet.guidedTours.length,5);\n"+
  "   assert(packet.guidedTours.some((e:{tour:{id:string}})=>e.tour.id==='pelvic-venous-tributaries-orientation'));");
 restored=once(restored,
  " assert.equal(maxTours,rightHipTours.length,'right hip has exactly the six source-bound tours');",
  " assert.equal(maxTours,5,'right hip context also participates in the pelvic venous tour');");
 assert.equal(sha(restored),lowerPreFollowupHash,'Exact pre-followup manifest-admitted test');
 return restored;
}
export function verify(name,post){
 assert(names.includes(name));
 const raw=readFileSync(`tests/fixtures/raw-clinical-review-${name}.test.ts.raw`);
 assert.equal(sha(raw),originalHashes[name]);
 assert(!raw.includes(13));
 if(name==='lower-arterial-tour')post=restoreLowerCurrent(post);
 const importLine="import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n";
 const historical=`const historicalBytes=readFileSync('tests/fixtures/historical-cardiac-chest-head-neck-manifest.json');\n assert.equal(sha(historicalBytes),'${oldHash}');\n const historicalLearner=JSON.parse(historicalBytes.toString());\n assert.equal(historicalLearner.sourceCommit,'${oldCommit}');\n const currentDelivery=validateCurrentAtlasDelivery();\n`;
 let restored=once(post,importLine,'');
 restored=once(restored,historical,'');
 restored=once(restored,"assert.equal(sha(bytes),currentDelivery.documents[base+'manifest.json']);",`assert.equal(sha(bytes),'${oldHash}');`);
 restored=once(restored,'assert.equal(learner.sourceCommit,CURRENT_ATLAS_REVISION);',`assert.equal(learner.sourceCommit,'${oldCommit}');`);
 if(name!=='pelvic-quiz')restored=once(restored," const base='public/atlas-runtime/head-neck/';\n const bytes=readFileSync(base+'manifest.json');\n"," const base='public/atlas-runtime/head-neck/',bytes=readFileSync(base+'manifest.json');\n");
 assert.equal(Buffer.compare(Buffer.from(restored),raw),0,`Unapproved changed bytes: ${name}`);
}
test('old manifest fixture retains historical epoch',()=>{
 const b=readFileSync('tests/fixtures/historical-cardiac-chest-head-neck-manifest.json');
 assert.equal(sha(b),oldHash);assert.equal(JSON.parse(b).sourceCommit,oldCommit);
});
for(const name of names)test(`only manifest admission changed: ${name}`,()=>verify(name,readFileSync(`tests/clinical-review-${name}.test.ts`,'utf8')));
test('approval tamper is refused by the same checker',()=>{
 const name='hand-muscle-quiz',s=readFileSync(`tests/clinical-review-${name}.test.ts`,'utf8');
 assert.throws(()=>verify(name,once(s,'assert.equal(packet.approval,false)','assert.equal(packet.approval,true)')));
});
test('answer tamper is refused by the same checker',()=>{
 const name='hand-muscle-quiz',s=readFileSync(`tests/clinical-review-${name}.test.ts`,'utf8');
 assert.throws(()=>verify(name,once(s,"correctAnswer='Foreign answer'","correctAnswer='Accepted answer'")));
});
test('lower arterial current source, exact tour membership and parser tamper are refused by the same checker',()=>{
 const name='lower-arterial-tour',s=readFileSync(`tests/clinical-review-${name}.test.ts`,'utf8');
 for(const [before,after] of [
  ["assert.equal(sha(committed),input.sha256,path+' exact committed Atlas source')","assert.equal(sha(committed),'0'.repeat(64),path+' exact committed Atlas source')"],
  ["'pelvic-venous-tributaries-orientation'].sort()","'invented-tour'].sort()"],
  ['assert.deepEqual(await api.parseBodyReviewResponse(packet,entry.id),packet)','assert.equal(await api.parseBodyReviewResponse(packet,entry.id),null)'],
 ])assert.throws(()=>verify(name,once(s,before,after)));
});
