import {readFile,lstat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
export const root=fileURLToPath(new URL('../',import.meta.url));
export const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function headNeckModuleInputs(shared=false){
  const compiled=await build({entryPoints:[join(root,'integration/head-neck/delivery.ts')],bundle:true,write:false,format:'esm',platform:'node'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const raw=JSON.parse(await readFile(join(root,'public/models/bodyparts3d/full-body/catalog.json'),'utf8'));
  const plan=shared?api.regionalWebsiteDelivery(raw):api.headNeckDelivery(raw);
  if(plan.license!=='CC BY 4.0' && plan.license!=='CC-BY-4.0')throw Error('Re-audit changed anatomy licence: '+plan.license);
  const scopes=shared?plan.scopes:[plan];
  const independent=scopes.flatMap(scope=>scope.independentSpecimens);
  const expected=shared?[
    ['bp3d3-abdominal-wall','CC BY-SA 2.1 JP','bodyparts3d-v3/abdominal-wall'],
    ['hra-united-female-v1.10-kidneys','CC BY 4.0','hra-renal'],
  ]:[];
  if(independent.length!==expected.length)throw Error('Independent specimen scope needs review');
  for(const [key,license,folder] of expected){
    const specimen=independent.find(s=>s.key===key);
    const source=JSON.parse(await readFile(join(root,'public/models',folder,'catalog.json'),'utf8'));
    if(!specimen || source.specimenId!==key || specimen.license!==license || source.source.license!==license
      || JSON.stringify(specimen.bundles)!==JSON.stringify(source.bundles)
      || JSON.stringify(specimen.sourceFrame)!==JSON.stringify({sourceToSceneColumnMajor:source.displayTransformColumnMajor,unitsPerMillimetre:0.01})
      || JSON.stringify(specimen.surfaceIds)!==JSON.stringify(source.structures.map(s=>s.id)))throw Error('Changed independent source, frame or licence: '+key);
  }
  const models=[];
  for(const bundle of plan.bundles){
    if(!/^\/models\/(?:bodyparts3d\/(?:[a-zA-Z0-9_-]+\/)+|bodyparts3d-v3\/abdominal-wall\/|hra-renal\/)[a-zA-Z0-9_-]+\.glb(?:\?v=[a-f0-9]{12}(?:[a-f0-9]{52})?)?$/.test(bundle.url))throw Error('Unexpected public model path');
    const path=bundle.url.split('?')[0].slice(1),file=join(root,'public',path);
    if(!(await lstat(file)).isFile())throw Error('Regular model files only');
    const bytes=await readFile(file);
    if(sha(bytes)!==bundle.sha256 || bytes.length!==bundle.bytes || bytes.toString('ascii',0,4)!=='glTF')throw Error('Model identity mismatch: '+path);
    models.push({file,path,sha256:bundle.sha256,bytes:bytes.length});
  }
  return {plan,models};
}
if(process.argv.includes('--audit')){
  const {plan,models}=await headNeckModuleInputs(true);
  console.log(JSON.stringify({scopes:plan.scopes.map(s=>({region:s.region,regionalSelections:s.regionalIds.length,nestedSelections:s.nestedTargets.length,nestedStudies:[...new Set(s.nestedTargets.map(t=>t.study))]})),bundles:models.length,modelBytes:models.reduce((n,b)=>n+b.bytes,0),license:plan.license},null,2));
}
