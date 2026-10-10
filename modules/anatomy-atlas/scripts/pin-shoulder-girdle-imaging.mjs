import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';

const parentCommit='732f5f56ff3708b9200b25f18ac3f6f175a438e5',root=process.cwd();
const expected=[
  ['FMA3992','FJ2307','right','thyrocervical-trunk'],['FMA4084','FJ2255','left','thyrocervical-trunk'],
  ['FMA5039','FJ2276','right','costocervical-trunk'],['FMA4086','FJ2224','left','costocervical-trunk'],
  ['FMA4057','FJ2284','right','dorsal-scapular-artery'],['FMA10552','FJ2232','left','dorsal-scapular-artery'],
  ['FMA50859','FJ2302','right','suprascapular-vein'],['FMA50860','FJ2250','left','suprascapular-vein'],
  ['FMA66563','FJ2304','right','thoraco-acromial-trunk'],['FMA66564','FJ2252','left','thoraco-acromial-trunk'],
  ['FMA23063','FJ2361','right','pectoral-branch'],['FMA23064','FJ2330','left','pectoral-branch'],
  ['FMA23068','FJ2263','right','acromial-branch'],['FMA23069','FJ2211','left','acromial-branch'],
  ['FMA23072','FJ2282','right','deltoid-branch'],['FMA23073','FJ2230','left','deltoid-branch'],
];
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),parentCommit,'Unexpected parent HEAD');
assert.equal(await readFile('app/body-content.ts','utf8'),execFileSync('git',['show',parentCommit+':app/body-content.ts'],{encoding:'utf8'}),'Pin before dispatch integration');
assert.equal(await readFile('public/models/bodyparts3d/full-body/catalog.json','utf8'),execFileSync('git',['show',parentCommit+':public/models/bodyparts3d/full-body/catalog.json'],{encoding:'utf8',maxBuffer:32e6}),'Source catalog differs from parent');
const result=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';export {bodyLesson} from './app/body-content';export {contentTabs} from './lib/content-types';",resolveDir:root,loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external'});
const module={exports:{}},require=createRequire(root+'/package.json');
runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,require,crypto,TextEncoder,structuredClone,URL,URLSearchParams});
const api=module.exports,catalog=api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const entries=expected.map(([fmaId,file,laterality,group])=>{
 const matches=catalog.structures.filter(s=>s.fmaId===fmaId);assert.equal(matches.length,1,fmaId);
 const identity=matches[0];assert.equal(identity.laterality,laterality);assert.equal(identity.region,'shoulder-arm');
 assert(identity.regions.includes('shoulder-arm'));assert.equal(identity.sourceTree,'isa');
 assert.deepEqual(identity.sources.map(s=>s.file),[file]);
 const previous={ct:api.bodyLesson(identity,'ct'),mri:api.bodyLesson(identity,'mri')};
 assert.equal(previous.ct.readiness,'pending',fmaId+' CT');assert.equal(previous.mri.readiness,'pending',fmaId+' MRI');
 return{identity,group,topics:['ct','mri'],previous};
});
assert.equal(entries.length,16);assert.equal(new Set(entries.map(e=>e.identity.id)).size,16);
assert.equal(entries.reduce((n,e)=>n+e.topics.length,0),32);
const ids=new Set(entries.map(e=>e.identity.bundle)),bundles=catalog.bundles.filter(b=>ids.has(b.id));
assert.equal(bundles.length,ids.size);
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const allTopics=catalog.structures.map(s=>({id:s.id,topics:api.contentTabs.map(tab=>({tab,...api.bodyLesson(s,tab)}))}));
assert.equal(allTopics.reduce((n,s)=>n+s.topics.length,0),9936);
const pins={schemaVersion:1,parentCommit,sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,bundles,entries,previousCatalogHash:hash(catalog),previousAllTopicsHash:hash(allTopics)};
await writeFile('content/shoulder-girdle-imaging-pins.json',JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({roots:entries.length,placements:32,bundles:bundles.length,pinsHash:hash(pins)}));
