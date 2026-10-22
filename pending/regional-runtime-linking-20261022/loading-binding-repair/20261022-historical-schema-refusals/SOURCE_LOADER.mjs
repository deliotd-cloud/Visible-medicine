// Test-only overlay: execute staged source at the frozen website URLs, without writing to it.
import {readFile} from 'node:fs/promises';
import {fileURLToPath, pathToFileURL} from 'node:url';
import path from 'node:path';

const frozen='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website/tests/';
const code='F:/VisibleMedicine/staging/20261022-historical-schema-refusals/CODE/tests/';
const names=new Set([
 'completion-checklist-current-transition.test.mjs',
 'posterior-fossa-integration-register.test.mjs',
 'historical-atlas-delivery-register47.mjs',
]);

export async function resolve(specifier,context,nextResolve){
 if(specifier==='./historical-atlas-delivery-register47.mjs'&&context.parentURL?.startsWith(pathToFileURL(frozen).href))
  return {url:pathToFileURL(path.join(frozen,'historical-atlas-delivery-register47.mjs')).href,shortCircuit:true};
 return nextResolve(specifier,context);
}

export async function load(url,context,nextLoad){
 if(url.startsWith(pathToFileURL(frozen).href)){
  const name=path.basename(fileURLToPath(url));
  if(names.has(name))return {format:'module',source:await readFile(path.join(code,name),'utf8'),shortCircuit:true};
 }
 return nextLoad(url,context);
}
