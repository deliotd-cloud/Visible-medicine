import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';
import {currentAtlasDeliveryRoot,CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';

const source='408759d57644b05402e98a937e7cf6338b5509cf';
const root=checkedAtlasHistoryRepo(source);
const epochs={legacy:'b9269c83867fbcae73e0de19ae6ca818fefb713a',portal:'6b6d9bba99985dfc5ca8deb52ca9e2632b837d25'};
const bytes=new Map<string,Buffer>();
const histories=new Map<string,Promise<any>>();
const archivedRoot='F:/VisibleMedicine/staging/20261016-cervical-xray/website-before/source';
const archivedWebsiteHashes=new Map([
  ['atlas-review/manifest.json','5f819bcdbc5a47097f8e0341297db454266861dcfe573e6d39ed8d27bf07ad9f'],
  ['public/atlas-runtime/head-neck/manifest.json','ccfb9c0fe08dc8f991fa145ce95046d381ba36d1b987c8d382b9ff939a321c10'],
  ['public/atlas-review-viewer/manifest.json','5e16b14e12ebe77dea380facd741a0178fbbcbda28920d1edcf7cca6feb17c7c'],
  ['lib/atlas-navigation.ts','c376f9ab3941549b30dd8094a5ae089919e1e77e277207967cb0fde41e9bb07e'],
  ['lib/regional-learning-catalogue.ts','ce8ed296310c459fac979b4d8f1f52745e46a0877ec10801a728aeaebeedba93'],
]);

export function pinned408WebsiteRead(path:string,read:(path:string)=>Buffer=(path)=>readFileSync(archivedRoot+'/'+path)){
  const expected=archivedWebsiteHashes.get(path);
  assert(expected,'Unpinned 408 Website dependency: '+path);
  const contents=read(path);
  assert.equal(createHash('sha256').update(contents).digest('hex'),expected,'408 Website dependency changed: '+path);
  return contents;
}

export function assertHistoricalRegionalSource(){
  for(const path of ['lib/regional-tours.ts','lib/cervical-disc-tour.ts','lib/medial-thigh-tour.ts',
    'lib/posterior-calf-tour.ts','lib/lower-venous-tour.ts','content/cervical-disc-tour-pins.json',
    'content/medial-thigh-tour-pins.json','content/posterior-calf-tour-pins.json','content/lower-venous-tour-v2-pins.json']){
    const committed=execFileSync('git',['-C',root,'show',source+':'+path],{windowsHide:true,maxBuffer:32e6});
    const archived=readFileSync(archivedRoot+'/atlas-review/'+path);
    assert.deepEqual(archived,committed,'Historical imported source changed: '+path);
  }
}

/** Replay the 408 Website projection against the exact 408 Atlas Git graph.
 * Non-Atlas inputs are an explicit byte-pinned archive allowlist. */
export async function historical408RegionalCatalogue(){
  const key='408-website';
  if(!histories.has(key))histories.set(key,(async()=>{
    const built=await build({stdin:{contents:`export * from './lib/regional-learning-catalogue';
      export {regionalTours,regionalTourStructures} from './atlas-review/lib/regional-tours';
      import raw from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';
      import {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';
      export const catalog=bodyDisplayCatalog(raw as any);
      export {atlasBodyRegions} from './lib/atlas-navigation';`,resolveDir:archivedRoot,loader:'ts'},
      bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'exact-408-website-closure',setup(api){
        api.onLoad({filter:/\.(?:ts|tsx|js|jsx|json)$/},args=>{
          const path=relative(archivedRoot,args.path).replaceAll('\\','/');
          assert(!path.startsWith('..')&&!path.startsWith('/')&&!path.includes('node_modules/'),'Unexpected 408 dependency: '+path);
          let contents:Buffer;
          if(path.startsWith('atlas-review/')&&path!=='atlas-review/manifest.json'){
            contents=execFileSync('git',['-C',root,'show',source+':'+path.slice('atlas-review/'.length)],
              {maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
          }else{
            contents=pinned408WebsiteRead(path);
          }
          return {contents:contents.toString(),loader:path.slice(path.lastIndexOf('.')+1) as 'ts'|'tsx'|'js'|'jsx'|'json',resolveDir:dirname(args.path)};
        });
      }}]});
    const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
    const readPinned=(path:string)=>{
      const contents=pinned408WebsiteRead(path);
      return JSON.parse(contents.toString());
    };
    const review=readPinned('atlas-review/manifest.json'),learner=readPinned('public/atlas-runtime/head-neck/manifest.json'),
      viewer=readPinned('public/atlas-review-viewer/manifest.json');
    assert.equal(review.revision,source);assert.equal(learner.sourceCommit,source);assert.equal(viewer.sourceCommit,source);
    return {...api,binding:{reviewRevision:review.revision,learnerRevision:learner.sourceCommit,
      viewerRevision:viewer.sourceCommit,reviewIntegration:review.websiteIntegrationSha256,
      viewerIntegration:viewer.websiteIntegrationSha256}};
  })());
  return histories.get(key)!;
}

export function assertCurrentRegionalSource(){
  const live=currentAtlasDeliveryRoot(),currentSource=CURRENT_ATLAS_REVISION;
  for(const path of ['lib/regional-tours.ts','lib/cervical-disc-tour.ts','lib/medial-thigh-tour.ts',
    'lib/posterior-calf-tour.ts','lib/lower-venous-tour.ts','content/cervical-disc-tour-pins.json',
    'content/medial-thigh-tour-pins.json','content/posterior-calf-tour-pins.json',
    'content/lower-venous-tour-v2-pins.json']){
    const committed=execFileSync('git',['-C',live,'show',currentSource+':'+path],{windowsHide:true,maxBuffer:32e6,
      env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
    assert.deepEqual(readFileSync('atlas-review/'+path),committed,'Current imported source changed: '+path);
  }
}

/** Every first-party import comes from the same committed Atlas epoch. No live
 * imports are overlaid into an old source graph and no model is downloaded. */
export function historicalRegionalCatalogue(epoch:keyof typeof epochs){
  if(!histories.has(epoch))histories.set(epoch,(async()=>{
    const revision=epochs[epoch];
    const built=await build({stdin:{contents:`export {regionalTours,regionalTourStructures,regionalTourFrame} from './lib/regional-tours';
      import raw from './public/models/bodyparts3d/full-body/catalog.json';
      import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`,resolveDir:root,loader:'ts'},
      bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'whole-saved-regional-catalogue',setup(api){
        api.onLoad({filter:/\.(?:ts|tsx|js|jsx|json)$/},args=>{
          const path=relative(root,args.path).replaceAll('\\','/');
          assert(!path.startsWith('..')&&!path.startsWith('/')&&!path.includes('node_modules/'),'Unexpected historical dependency: '+path);
          const key=revision+':'+path;
          if(!bytes.has(key))bytes.set(key,execFileSync('git',['-C',root,'show',key],{maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
          return {contents:bytes.get(key)!.toString(),loader:path.slice(path.lastIndexOf('.')+1) as 'ts'|'tsx'|'js'|'jsx'|'json',resolveDir:dirname(args.path)};
        });
      }}]});
    const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
    assert.equal(execFileSync('git',['-C',root,'rev-parse',revision],{encoding:'utf8',windowsHide:true}).trim(),revision);
    return {...api,sourceRevision:revision};
  })());
  return histories.get(epoch)!;
}
