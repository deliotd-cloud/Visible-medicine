import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname,relative} from 'node:path';
import {build} from 'esbuild';
import {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';

const source='408759d57644b05402e98a937e7cf6338b5509cf';
const root=checkedAtlasSourceRepo(source);
const epochs={legacy:'b9269c83867fbcae73e0de19ae6ca818fefb713a',portal:'6b6d9bba99985dfc5ca8deb52ca9e2632b837d25'};
const bytes=new Map<string,Buffer>();
const histories=new Map<string,Promise<any>>();

export function assertCurrentRegionalSource(){
  for(const path of ['lib/regional-tours.ts','lib/cervical-disc-tour.ts','lib/medial-thigh-tour.ts',
    'lib/posterior-calf-tour.ts','lib/lower-venous-tour.ts','content/cervical-disc-tour-pins.json',
    'content/medial-thigh-tour-pins.json','content/posterior-calf-tour-pins.json','content/lower-venous-tour-v2-pins.json']){
    const committed=execFileSync('git',['-C',root,'show',source+':'+path],{windowsHide:true,maxBuffer:32e6});
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
