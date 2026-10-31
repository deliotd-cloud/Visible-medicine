import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='G:/VisibleMedicine-temp/proposals/20261031-release20-coronary',base='G:/VisibleMedicine-temp/staging/20261031-release19-followup/website',file='tests/clinical-review-coronary-sinus-xray.test.ts';
const bytes=fs.readFileSync(base+'/'+file),sha=b=>createHash('sha256').update(b).digest('hex');let text=bytes.toString();
function replace(from,to){assert.equal(text.split(from).length,2);text=text.replace(from,to);}
replace(" assert.deepEqual(live.nestedConcepts,posteriorAt.nestedConcepts,\n  'all 76 posterior-fossa concepts survive to current Review');",` // Later cardiac teaching is an explicit six-section extension, not a change
 // to the coronary-sinus or posterior-fossa lesson under test.
 const cardiacEpoch='d5c86abea551c92a4e59be57059e6b652fa01bde';
 assert.equal(execFileSync('git',['merge-base',cardiacEpoch,currentRevision],{cwd:atlas,windowsHide:true}).toString().trim(),cardiacEpoch);
 assert.deepEqual(git(cardiacEpoch,'content/cardiac-teaching.ts'),git(currentRevision,'content/cardiac-teaching.ts'),'Current cardiac teaching retains its exact introduction');
 const currentAt=await history.exactSourceHistoryApi(currentRevision,'nested-review-security');
 assert.deepEqual(live.nestedConcepts,currentAt.nestedConcepts,'Every current imported concept matches the exact current Atlas source');
 assert.deepEqual(live.nestedConcepts.map((row:any)=>row.id),posteriorAt.nestedConcepts.map((row:any)=>row.id),'All 76 ordered concept identities survive');
 const restored=wire(live.nestedConcepts),changed:string[]=[];
 const cardiacUpdates=new Map([
  ['cardiac-right-atrium',['mri','ultrasound']],['cardiac-left-atrium',['mri']],
  ['cardiac-right-ventricle',['mri','ultrasound']],['cardiac-left-ventricle',['mri']],
 ]);
 for(let index=0;index<restored.length;index++){
  const row=restored[index],prior=posteriorAt.nestedConcepts[index];
  for(const tab of cardiacUpdates.get(row.id)??[]){
   assert.notDeepEqual(row.imaging[tab],prior.imaging[tab],row.id+':'+tab+' later cardiac section');
   assert.equal(row.imaging[tab].readiness,'draft');
   row.imaging[tab]=wire(prior.imaging[tab]);changed.push(row.id+':'+tab);
  }
 }
 assert.equal(changed.length,6);
 assert.deepEqual(restored,posteriorAt.nestedConcepts,'All other concept fields, questions and original lessons survive byte-for-value');`);
replace(" assert.deepEqual(refs,posteriorAt.nestedTeachingReferences,\n  'all posterior-fossa references survive to current Review');",` assert.deepEqual(refs,currentAt.nestedTeachingReferences,'Every current reference matches the exact current Atlas source');
 proveReferences(posteriorAt.nestedTeachingReferences,refs,['cardiacRightHeart2025'],
  'All posterior-fossa references survive the one later cardiac reference');`);
fs.mkdirSync(path.dirname(root+'/'+file),{recursive:true});fs.writeFileSync(root+'/'+file,text,{flag:'wx'});
fs.writeFileSync(root+'/MANIFEST.json',JSON.stringify({base,files:[{path:file,before:sha(bytes),after:sha(Buffer.from(text))}],productChanged:false,historicalTransitionsRetained:true,currentSixSectionDeltaExplicit:true,focusedNativePending:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({proposal:root,files:1}));
