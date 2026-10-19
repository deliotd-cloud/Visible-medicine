import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { structures as currentStructures } from '../atlas-review/app/anatomy-data.ts';
import {build} from 'esbuild';
import type {PluginBuild} from 'esbuild';
import {dirname,relative} from 'node:path';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {execFileSync} from 'node:child_process';
const feature=(path:string)=>Buffer.from(execFileSync('git',['show',`f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6:${path}`],{maxBuffer:32e6,windowsHide:true}));

async function historicalStructures():Promise<typeof currentStructures>{
 const built=await build({stdin:{contents:"export {structures} from './atlas-review/app/anatomy-data.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'feature-shoulder-anatomy',setup(api:PluginBuild){
  api.onLoad({filter:/[\\/]atlas-review[\\/].*\.(ts|json)$/},args=>{
   const path=relative(process.cwd(),args.path).replaceAll('\\','/');
   return {contents:feature(path).toString('utf8'),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
  });
 }}]});
 const module=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
 return module.structures as typeof currentStructures;
}
test('learner and protected review deliver the same six draft shoulder X-ray lessons', async () => {
  const structures=await historicalStructures();
  const root = 'public/atlas-runtime/shoulder/';
  const manifest = JSON.parse(feature(root+'manifest.json').toString('utf8'));
  const review = JSON.parse(feature('atlas-review/manifest.json').toString('utf8'));
  const inputs = JSON.parse(feature(root+'source-inputs.json').toString('utf8')) as {path:string;sha256:string}[];
  assert.equal(manifest.sourceCommit,'88cea927d48729769b96ad8fe680b0872b7e6687');
  assert.equal(review.revision,'88cea927d48729769b96ad8fe680b0872b7e6687');
  const path = 'lib/shoulder-soft-tissue-xray.ts';
  const actual = createHash('sha256').update(feature('atlas-review/'+path)).digest('hex');
  assert.equal(inputs.find(f=>f.path===path)?.sha256,actual);
  assert.equal(review.files.find((f:{path:string})=>f.path===path).importedSha256,actual);
  const targets = ['deltoid','supraspinatus','infraspinatus','subscapularis','biceps-long-head','teres-minor'];
  for (const suffix of targets) {
    const structure = structures.find(s=>s.id===`vm:anatomy:upper-limb:shoulder:right:muscle:${suffix}`)!;
    assert(structure);
    assert.equal(structure.sections.xray.readiness,'draft');
    assert.match(structure.sections.xray.title,/X-ray landmarks and limits/);
    assert.match(structure.sections.xray.note!,/radiologist sign-off pending/);
    assert.match(structure.sections.xray.note!,/access remain independent/);
    assert((structure.sections.xray.citations?.length??0)>=2);
  }
  assert.equal(structures.length,9);
  assert.equal(manifest.patientDataIncluded,false);
  assert.equal(manifest.clinicalApproved,false);
  assert.equal(manifest.standaloneReviewConnection,false);
  const revisions = JSON.parse(feature('atlas-review/content/review-revisions.json').toString('utf8'));
  for (const structure of structures) assert.equal(revisions.revisions[structure.id].imaging,null);
});

test('closed current shoulder X-ray delivery retains six source-bound draft lessons',()=>{
 const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 const root='public/atlas-runtime/shoulder/';
 const manifest=JSON.parse(readFileSync(root+'manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync(root+'source-inputs.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const path='lib/shoulder-soft-tissue-xray.ts';
 const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
 const source=execFileSync('git',['show',`${pin.source}:${path}`],{cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 const entry=review.files.find((file:{path:string})=>file.path===path);
 assert(entry,path);assert.equal(review.revision,pin.source);assert.equal(manifest.sourceCommit,pin.source);
 assert.equal(entry.sourceSha256,sha(source));
 assert.equal(entry.importedSha256,sha(readFileSync('atlas-review/'+path)));
 assert.deepEqual(inputs.filter((row:{path:string})=>row.path===path),[{path,sha256:sha(source)}]);
 for(const suffix of ['deltoid','supraspinatus','infraspinatus','subscapularis','biceps-long-head','teres-minor']){
  const structure=currentStructures.find(s=>s.id===`vm:anatomy:upper-limb:shoulder:right:muscle:${suffix}`);
  assert(structure,suffix);assert.equal(structure.sections.xray.readiness,'draft');
  assert.match(structure.sections.xray.title,/X-ray landmarks and limits/);
  assert.match(structure.sections.xray.note!,/radiologist sign-off pending/);
 }
 assert.equal(currentStructures.length,9);
 for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[flag],false,flag);
 const scripts=manifest.files.filter((file:{path:string})=>file.path.endsWith('.js'));
 const emitted=scripts.map((file:{path:string;sha256:string})=>{const bytes=readFileSync(root+file.path);assert.equal(sha(bytes),file.sha256,file.path);return bytes.toString();}).join('\n');
 assert(emitted.includes('X-ray landmarks and limits'));
 const altered=structuredClone(inputs);altered.find((row:{path:string})=>row.path===path).sha256='0'.repeat(64);
 assert.throws(()=>validateCurrentAtlasDelivery({pin,read:p=>p===root+'source-inputs.json'?Buffer.from(JSON.stringify(altered)):readFileSync(p)}),/Current delivery changed: public\/atlas-runtime\/shoulder\/source-inputs.json/);
});
