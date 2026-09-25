import {build} from './workspace-test-build.mjs';
import {execFileSync} from 'node:child_process';
import {relative,dirname,extname} from 'node:path';
import {createHash} from 'node:crypto';

export const pulmonaryXrayBase='77eaf754b12e039abc710f2fab21db28b2385f2f';
export const pulmonaryXrayKeys=['pulmonaryChestXray','pulmonaryLobarProjection'];
export const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

export async function pulmonaryXrayApi({saved=false}={}){
 const root=process.cwd();
 const compiled=await build({stdin:{contents:"export {nestedConcepts,nestedTeachingReferences} from './content/nested-teaching';export {nestedTeachingFor,nestedTopicLesson} from './lib/nested-teaching';export {nestedStudyTargets} from './lib/nested-anatomy';export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:saved?[{name:'saved-pulmonary-xray-base',setup(b){b.onLoad({filter:/.*/,namespace:'workspace-test'},args=>{
  const path=relative(root,args.path).replaceAll('\\','/');
  if(path.startsWith('node_modules/'))return;
  if(path.startsWith('../'))throw Error('History input escaped checkout');
  return {contents:execFileSync('git',['show',pulmonaryXrayBase+':'+path],{encoding:'utf8',maxBuffer:16e6}),loader:({'.ts':'ts','.tsx':'tsx','.json':'json'})[extname(path)]||'js',resolveDir:dirname(args.path)};
 });}}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}

export function withoutPulmonaryXray(api){
 return {...api,nestedConcepts:api.nestedConcepts.map(c=>{
  if(c.study!=='pulmonary')return c;
  const previous=structuredClone(c);delete previous.imaging.xray;return previous;
 }),nestedTeachingReferences:Object.fromEntries(Object.entries(api.nestedTeachingReferences).filter(([key])=>!pulmonaryXrayKeys.includes(key)))};
}
