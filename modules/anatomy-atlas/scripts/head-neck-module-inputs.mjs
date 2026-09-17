import {readFile,lstat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import {assertHraPelvisSourceContract} from './independent-source-contract.mjs';
export const root=fileURLToPath(new URL('../',import.meta.url));
export const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function headNeckModuleInputs(shared=false){
  const compiled=await build({entryPoints:[join(root,'integration/head-neck/delivery.ts')],bundle:true,write:false,format:'esm',platform:'node'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const raw=JSON.parse(await readFile(join(root,'public/models/bodyparts3d/full-body/catalog.json'),'utf8'));
  const plan=shared?api.regionalWebsiteDelivery(raw):api.headNeckDelivery(raw);
  if(plan.license!=='CC BY 4.0' && plan.license!=='CC-BY-4.0')throw Error('Re-audit changed anatomy licence: '+plan.license);
  const scopes=shared?plan.scopes:[plan];
  const bySpecimen=new Map();
  for(const specimen of scopes.flatMap(scope=>scope.independentSpecimens)){
    const previous=bySpecimen.get(specimen.key);
    if(previous&&JSON.stringify(previous)!==JSON.stringify(specimen))throw Error('Conflicting independent specimen scope');
    bySpecimen.set(specimen.key,specimen);
  }
  const independent=[...bySpecimen.values()];
  const expected=shared?[
    ['bp3d3-abdominal-wall','CC BY-SA 2.1 JP','bodyparts3d-v3/abdominal-wall'],
    ['hra-united-female-v1.10-kidneys','CC BY 4.0','hra-renal'],
    ['bp3d3-back-layers','CC BY-SA 2.1 JP','bodyparts3d-v3/back-layers'],
  ]:[];
  if(independent.length!==expected.length+(shared?6:0))throw Error('Independent specimen scope needs review');
  for(const [key,license,folder] of expected){
    const specimen=independent.find(s=>s.key===key);
    const source=JSON.parse(await readFile(join(root,'public/models',folder,'catalog.json'),'utf8'));
    if(!specimen || source.specimenId!==key || specimen.license!==license || source.source.license!==license
      || JSON.stringify(specimen.bundles)!==JSON.stringify(source.bundles)
      || JSON.stringify(specimen.sourceFrame)!==JSON.stringify({sourceToSceneColumnMajor:source.displayTransformColumnMajor,unitsPerMillimetre:0.01})
      || JSON.stringify(specimen.surfaceIds)!==JSON.stringify(source.structures.map(s=>s.id)))throw Error('Changed independent source, frame or licence: '+key);
  }
  if(shared){
    const pelvis=JSON.parse(await readFile(join(root,'public/models/hra-pelvis/catalog.json'),'utf8'));
    const renal=JSON.parse(await readFile(join(root,'public/models/hra-renal/catalog.json'),'utf8'));
    assertHraPelvisSourceContract(independent.find(s=>s.key===pelvis.specimenId),pelvis,renal);
    const knee=JSON.parse(await readFile(join(root,'public/models/um-knee/catalog.json'),'utf8'));
    const limb=JSON.parse(await readFile(join(root,'public/models/um-limb/catalog.json'),'utf8'));
    const sources=[...knee.structures,...limb.structures];
    const bundles=[knee.bundle,...limb.bundles];
    if(knee.source.license!=='CC0-1.0'||limb.source.license!=='CC0-1.0')throw Error('Re-audit lower-limb licence');
    for(const [key,count]of [[knee.specimenId,15],...[['hip-thigh',34],['calf',15],['foot',23],['whole',67]].map(([scope,count])=>[limb.specimenId+':'+scope,count])]){
      const specimen=independent.find(s=>s.key===key);
      if(!specimen||specimen.license!=='CC0-1.0'||specimen.surfaceIds.length!==count
        ||new Set(specimen.surfaceIds).size!==count||specimen.surfaceIds.some(id=>!sources.some(s=>s.id===id))
        ||specimen.bundles.some(b=>!bundles.some(source=>JSON.stringify(source)===JSON.stringify(b))))throw Error('Changed lower-limb source: '+key);
    }
  }
  const models=[];
  for(const bundle of plan.bundles){
    if(!/^\/models\/(?:bodyparts3d\/(?:[a-zA-Z0-9_-]+\/)+|bodyparts3d-v3\/(?:abdominal-wall|back-layers)\/|hra-(?:renal|pelvis)\/|um-(?:knee|limb)\/)[a-zA-Z0-9_-]+\.glb(?:\?v=[a-f0-9]{12}(?:[a-f0-9]{52})?)?$/.test(bundle.url))throw Error('Unexpected public model path');
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
