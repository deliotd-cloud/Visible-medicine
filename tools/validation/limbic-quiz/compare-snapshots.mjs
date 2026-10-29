import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';

const root='G:/VisibleMedicine-temp/staging/20261029-limbic-quiz-verification';
const proposal='G:/VisibleMedicine-temp/staging/20261029-limbic-quiz';
const stage='G:/VisibleMedicine-temp/staging/20261029-combined-native-successor';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const inputs=new Map();
function read(file,digest){const bytes=fs.readFileSync(file),actual=sha(bytes);if(digest)assert.equal(actual,digest,file);if(inputs.has(file))assert.equal(inputs.get(file),actual);inputs.set(file,actual);return bytes;}
const prep=JSON.parse(read(stage+'/PREPARATION.json','f1ae317be0b5b862225f47eb1907cdc0378f4a6891e4c779ff0b38b13e1f15ee'));
const pins=new Map(prep.sourceRows.map(row=>[row.path,row.sha256]));
const atlas=prep.atlas,req=createRequire(atlas+'/package.json');
const dependency=JSON.parse(read('G:/VisibleMedicine-temp/staging/20261029-small-generator-profile/ADMISSION-1793290403527.json','cbda14f0489c2c66474f1d8b47b7171aab52130ca68749fe78219773cf650f56'));
for(const file of [process.execPath,req.resolve('typescript')]){const actual=fs.realpathSync.native(file),pin=dependency.dependencyFiles.find(p=>p.path===actual);assert(pin);read(actual,pin.sha256);}
const ts=req('typescript'),cache=new Map();
function evaluate(relative,override=false){
  assert(pins.has(relative));
  if(!override&&cache.has(relative))return cache.get(relative);
  const file=(override?proposal:atlas)+'/'+relative;
  const bytes=read(file,override?undefined:pins.get(relative));
  if(relative.endsWith('.json')){const value={default:JSON.parse(bytes)};cache.set(relative,value);return value;}
  assert(relative.endsWith('.ts'));
  const module={exports:{}};
  const code=ts.transpileModule(bytes.toString(),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  runInNewContext(code,{module,exports:module.exports,require:name=>{
    assert(name.startsWith('.'));const base=path.posix.normalize(path.posix.join(path.posix.dirname(relative),name));
    const target=[base,base+'.ts',base+'.json'].find(p=>pins.has(p));assert(target);return evaluate(target);
  }});
  if(!override)cache.set(relative,module.exports);
  return module.exports;
}
const canonical=evaluate('lib/body-source-additions.ts').sourceCanonical;
const tabs=evaluate('lib/content-types.ts').contentTabs;
const decode=evaluate('lib/regional-teaching-snapshot.ts').decodeRegionalTeachingSnapshot;
const catalogue=evaluate('public/models/bodyparts3d/limbic-landmarks/catalog.json').default;
const before=evaluate('lib/limbic-landmarks.ts').limbicLandmarkLesson;
const after=evaluate('lib/limbic-landmarks.ts',true).limbicLandmarkLesson;
assert.equal(catalogue.structures.length,4);
const file='content/regional-teaching/head-neck.json';
const snapshot=JSON.parse(read(atlas+'/'+file,pins.get(file)));
const reader=decode(snapshot,'head-neck'),matched=new Set(),questions=[];
for(const structure of catalogue.structures){
  const identity=canonical(structure);assert(reader.accepts(structure));
  assert.equal(snapshot.entries.filter(e=>e.identity===identity).length,1);
  for(const topic of tabs){
    const old=structuredClone(before(structure,topic)),current=structuredClone(after(structure,topic));
    // The complete resolver can supply other topics; only prove the old quiz
    // baseline here and preserve all non-quiz helper outputs separately.
    if(topic==='quiz'){
      assert.deepEqual(structuredClone(reader.bodyLesson(structure,topic)),old,'Saved complete resolver quiz differs from source helper');
      assert.equal(old.correctAnswer,undefined);assert.notDeepEqual(current,old);
      assert.equal(current.readiness,'draft');assert.equal(current.bullets.length,4);
      assert.equal(current.bullets.filter(c=>c===current.correctAnswer).length,1);
      assert(current.explanation?.length>0);matched.add(identity);
      questions.push({id:structure.id,name:structure.name,sourceIdentity:sha(identity),oldQuiz:old,proposedQuiz:current});
    }else assert.deepEqual(current,old,structure.id+' / '+topic);
  }
}
assert.equal(matched.size,4);
const prior=JSON.parse(read('G:/VisibleMedicine-temp/staging/20261029-quiz-successor/SNAPSHOT_COMPARISON.json','5f94906d8f0ae44ac8563013cd7c6f89530c50f193d93927b2e89302ace5601d'));
const remaining=new Set(prior.remainingProjectedIssues.map(row=>row.identity));
for(const row of questions){assert(remaining.has(row.sourceIdentity),'Question must be in the actual projected unscored queue');remaining.delete(row.sourceIdentity);}
assert.equal(remaining.size,16);
for(const[file,digest]of inputs)assert.equal(sha(fs.readFileSync(file)),digest,'Source changed while comparing');
const result={schema:'vm-limbic-quiz-proposal/1',at:new Date().toISOString(),snapshotRevision:prior.baselineRevision,matchedQuizPlacements:4,distinctQuestions:3,questions,priorProjectedUnscored:20,remainingProjectedUnscored:16,sourceInputs:[...inputs].map(([path,sha256])=>({path,sha256})),limits:['Exact saved snapshots still have the old unscored questions. This is a separate four-placement proposal, not part of the frozen6484-file candidate.','Eight non-quiz helper outputs and complete anatomical identities remain unchanged. Full resolver regeneration, review pins, build and website import remain pending.','Original factual question wording only; linked references and draft review status retained. No external image, geometry, patient data or clinical approval added.'],installed:false,clinicalApproval:false};
const output=root+'/SNAPSHOT_COMPARISON-'+Date.now()+'.json';
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,matchedQuizPlacements:4,distinctQuestions:3,nonQuizOutputsPreserved:32,remainingProjectedUnscored:16,inputs:inputs.size,installed:false}));
