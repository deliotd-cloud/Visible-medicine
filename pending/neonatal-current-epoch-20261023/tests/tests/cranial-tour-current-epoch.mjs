import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const site=fileURLToPath(new URL('../',import.meta.url));
const original='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const originalBlob='fb65a9c68d8753fc1789c7e6281e36c2889e0136';
const originalSha='88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97';
const historicalTourSha='57bd87627a189b7d3b50621b08b18c13b0b43e705c57dfa05c9d6f248cd34041';
const renalRevision='renal-organs-arteries-orientation-20261022-source-bound-draft';
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=p=>JSON.parse(readFileSync(site+'/'+p));

export function restoreOriginalCranialTourSource(bytes){
  assert(bytes instanceof Uint8Array,'Exact tour source bytes required');
  let source=Buffer.from(bytes).toString();
  const seams=[
    ["import {hamstringTours,hamstringTourMatches} from './hamstring-tours';\nexport {hamstringTours} from './hamstring-tours';\n",''],
    ["import { renalTour,renalTourMatches } from './renal-tour';","import { renalTour } from './renal-tour';"],
    [',medialThighTour,posteriorCalfTour,...hamstringTours];',',medialThighTour,posteriorCalfTour];'],
    ["  if(tour.id===renalTour.id&&!renalTourMatches(catalog,tour))\n    throw Error('The renal guided tour does not match the available anatomy source.');\n",''],
    ["  if(hamstringTours.some(candidate=>candidate.id===tour.id)&&!hamstringTourMatches(catalog,tour))\n    throw Error('The hamstring guided tour does not match the available anatomy source.');\n",''],
  ];
  for(const[now,old]of seams){assert.equal(source.split(now).length,2,'One exact composed tour source role');source=source.replace(now,old);}
  const restored=Buffer.from(source);assert.equal(sha(restored),originalSha,'Complete historical regional tour source recovered');
  return restored;
}

export function assertCurrentCranialTourEpoch(){
  const current=validateCurrentAtlasDelivery(),root=currentAtlasDeliveryRoot();
  const git=(...args)=>execFileSync('git',args,{cwd:root,windowsHide:true,maxBuffer:8e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  const path='lib/regional-tours.ts',old=git('show',original+':'+path),now=git('show',current.source+':'+path);
  assert.equal(git('rev-parse',original+':'+path).toString().trim(),originalBlob);
  assert.deepEqual(restoreOriginalCranialTourSource(now),old);
  const manifest=json('atlas-review/manifest.json'),binding=json('atlas-review/integration-inputs.json'),inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  for(const p of [path,'lib/renal-tour.ts','content/renal-tour-pins.json','lib/hamstring-tours.ts','content/hamstring-tour-pins.json']){
    const bytes=git('show',current.source+':'+p),digest=sha(bytes),record=manifest.files.find(r=>r.path===p);
    assert(record,p);assert.equal(record.sourceSha256,digest);assert.equal(record.importedSha256,digest);
    assert.equal(sha(readFileSync(root+'/'+p)),digest);assert.equal(sha(readFileSync(site+'/atlas-review/'+p)),digest);
    assert.deepEqual(binding.inputs.filter(r=>r.path==='atlas-review/'+p),[{path:'atlas-review/'+p,sha256:digest}]);
    assert.deepEqual(inputs.filter(r=>r.path===p),[{path:p,sha256:digest}]);
  }
  return git('rev-parse',current.source+':'+path).toString().trim();
}

export function assertCurrentCranialTourCatalog(historical,current,hamstrings){
  assert(Array.isArray(historical)&&Array.isArray(current)&&Array.isArray(hamstrings));
  assert.equal(historical.length,51);assert.equal(historical.reduce((n,t)=>n+t.steps.length,0),309);
  assert.equal(sha(JSON.stringify(historical)),historicalTourSha,'Entire original 51-tour catalogue');
  assert.equal(historical[19].id,'renal-organs-arteries-orientation');
  assert.equal(historical[19].revision,'renal-organs-arteries-orientation-v1');
  const retained=structuredClone(historical);retained[19].revision=renalRevision;
  assert.deepEqual(current.slice(0,51),retained,'Every original tour retained; exact renal revision only');
  assert.equal(hamstrings.length,2);
  assert.deepEqual(hamstrings.map(t=>t.id),['right-hamstring-orientation','left-hamstring-orientation']);
  assert(hamstrings.every(t=>t.status==='draft'&&t.revision==='bilateral-hamstring-orientation-20261022-r1'&&t.steps.length===4));
  assert.deepEqual(current.slice(51),hamstrings,'Only exact source-exported bilateral hamstring tours appended');
  assert.equal(current.length,53);assert.equal(current.reduce((n,t)=>n+t.steps.length,0),317);
}
