import {build} from './workspace-test-build.mjs';
import {execFileSync} from 'node:child_process';
import {relative,dirname,extname} from 'node:path';
import {createHash} from 'node:crypto';
export const pulmonaryImagingBase='d8967e7e033ecabc174c372738e687d05affaeef';
export const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export async function pulmonaryImagingApi({saved=false}={}){
 const root=process.cwd();
 const compiled=await build({stdin:{contents:"export {nestedConcepts,nestedTeachingReferences} from './content/nested-teaching';export {nestedTeachingFor,nestedTopicLesson} from './lib/nested-teaching';export {nestedStudyTargets} from './lib/nested-anatomy';export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:saved?[{name:'saved-pulmonary-imaging-base',setup(b){b.onLoad({filter:/.*/,namespace:'workspace-test'},args=>{
  const path=relative(root,args.path).replaceAll('\\','/');if(path.startsWith('node_modules/'))return;
  if(path.startsWith('../'))throw Error('History input escaped checkout');
  return {contents:execFileSync('git',['show',pulmonaryImagingBase+':'+path],{encoding:'utf8',maxBuffer:16e6}),loader:({'.ts':'ts','.tsx':'tsx','.json':'json'})[extname(path)]||'js',resolveDir:dirname(args.path)};
 });}}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}
