import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';

const atlas='F:/VisibleMedicine/atlas';
const website='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const authored='6036a7a59dcc1fd75eee4a23af34ca2a568d86b6';
const current='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const snapshotPath='content/regional-teaching/head-neck.json';
const output=new URL('./SNAPSHOT_SOURCE_EVIDENCE.json',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:atlas,maxBuffer:8e6,windowsHide:true,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).toString().trim();
const bytes=(revision,path)=>execFileSync('git',['show',revision+':'+path],{cwd:atlas,maxBuffer:8e6,
  windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
assert(!existsSync(output),'Do not overwrite a saved source receipt');
assert.equal(git('rev-parse','HEAD'),current,'actual Atlas checkout identity');
assert.equal(git('status','--porcelain'),'','actual Atlas checkout clean');
assert.equal(git('rev-parse',authored+'^{tree}'),'6da62962106cfab9419b09618547a9da5e3aafc6');
const oldBytes=bytes(authored,snapshotPath),newBytes=bytes(current,snapshotPath);
assert.equal(sha(oldBytes),'94992de62a724b2be250abffd347c14dafd8bcaf86ec4edde730e533ec292d2b');
assert.equal(sha(newBytes),'e6a486cc4ab9745eae110615b340fa1797bb0e6e0b72195f083bec766543da25');
assert.equal(oldBytes.length,2431462);assert.equal(newBytes.length,2457934);
const old=JSON.parse(oldBytes),now=JSON.parse(newBytes);
assert.equal(old.schemaVersion,now.schemaVersion);
assert.equal(old.region,now.region);
assert.equal(old.entries.length,262);assert.equal(now.entries.length,262);
assert.equal(old.undefinedPaths.length,20);
assert.equal(JSON.stringify(old.undefinedPaths),JSON.stringify(now.undefinedPaths));
const indices=[...Array(28)].map((_,i)=>205+i).concat([250,251]);
let restored=newBytes.toString('utf8');
const changed=[];
for(const i of indices){
  const before=old.entries[i],after=now.entries[i],identity=JSON.parse(before.identity);
  assert.equal(before.identity,after.identity,'exact identity: '+i);
  assert(i<233?identity.id.endsWith('-tooth'):identity.id.endsWith('inferior-thyroid-artery'),
    'exact later MRI family: '+i);
  const beforeMri=JSON.stringify(before.lessons.mri),afterMri=JSON.stringify(after.lessons.mri);
  assert.notEqual(beforeMri,afterMri,'distinct later MRI lesson: '+i);
  assert.equal(restored.split(afterMri).length,2,'unique replacement: '+i);
  restored=restored.replace(afterMri,beforeMri);
  changed.push({index:i,id:identity.id,tab:'mri',authoredSha256:sha(beforeMri),currentSha256:sha(afterMri)});
}
const restoredBytes=Buffer.from(restored);
assert(restoredBytes.equals(oldBytes),'30 exact MRI replacements restore complete authored bytes');
const changedSet=new Set(indices);
for(let i=0;i<262;i++)if(!changedSet.has(i))
  assert.equal(JSON.stringify(old.entries[i]),JSON.stringify(now.entries[i]),'all other entries exact: '+i);

const quizPaths=['content/tongue-palate-quiz-pins.json','content/tongue-palate-quiz.ts',
  'lib/tongue-palate-quiz.ts'];
const quizSourceFiles=quizPaths.map(path=>{
  const before=bytes(authored,path),after=bytes(current,path);
  assert(before.equals(after),'original quiz source bytes retained: '+path);
  return {path,sha256:sha(before),bytes:before.length,blob:git('rev-parse',current+':'+path)};
});
const pins=JSON.parse(bytes(authored,quizPaths[0]));
assert.equal(pins.entries.length,8);
const quizPlacements=pins.entries.map(entry=>{
  const id=entry.identity.id;
  const prior=old.entries.filter(row=>JSON.parse(row.identity).id===id);
  const live=now.entries.filter(row=>JSON.parse(row.identity).id===id);
  assert.equal(prior.length,1,'authored quiz placement: '+id);
  assert.equal(live.length,1,'current quiz placement: '+id);
  assert.equal(JSON.stringify(prior[0]),JSON.stringify(live[0]),'complete quiz entry retained: '+id);
  return {id,sha256:sha(JSON.stringify(prior[0]))};
});
const review=JSON.parse(readFileSync(website+'/atlas-review/manifest.json'));
const row=review.files.find(file=>file.path===snapshotPath);
assert(row,'current Review source row');
assert.equal(review.revision,current);
assert.equal(row.sourceSha256,sha(newBytes));
const imported=readFileSync(website+'/atlas-review/'+snapshotPath);
assert.equal(row.importedSha256,sha(imported));
assert(imported.equals(newBytes),'current imported snapshot equals exact Git source bytes');
const headInputs=JSON.parse(readFileSync(website+'/public/atlas-runtime/head-neck/source-inputs.json'));
assert.equal(headInputs.find(item=>item.path===snapshotPath)?.sha256,sha(newBytes));
const pin=JSON.parse(readFileSync(website+'/tests/fixtures/current-atlas-delivery.json'));
assert.equal(pin.source,current);
assert.equal(pin.runtimeSources['head-neck'],current);
const receipt={
  schema:'vm-six-clinical-snapshot-source-proof-1',
  source:{authored,current,authoredTree:git('rev-parse',authored+'^{tree}'),
    currentTree:git('rev-parse',current+'^{tree}'),actualHead:git('rev-parse','HEAD')},
  snapshot:{path:snapshotPath,authoredBlob:git('rev-parse',authored+':'+snapshotPath),
    currentBlob:git('rev-parse',current+':'+snapshotPath),authoredSha256:sha(oldBytes),
    currentSha256:sha(newBytes),authoredBytes:oldBytes.length,currentBytes:newBytes.length,
    entries:262,undefinedPaths:20,changedMriLessons:changed.length,
    dentalMriLessons:28,inferiorThyroidMriLessons:2,changed,
    completeRawInverseSha256:sha(restoredBytes),allOtherEntriesExact:true},
  quizSourceFiles,quizPlacements,reviewSourceSha256:row.sourceSha256,
  reviewImportedSha256:row.importedSha256,headLearnerSourceSha256:sha(newBytes),
  noProductionOrClinicalChange:true,
};
writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log('Saved exact Git source proof: '+output.pathname);
console.log('30 MRI-only replacements restore '+oldBytes.length+' authored bytes; 8 quiz placements and 3 quiz source blobs exact');
