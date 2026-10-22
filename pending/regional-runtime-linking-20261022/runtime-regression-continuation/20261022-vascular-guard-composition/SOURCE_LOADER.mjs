// Test-only overlay: run the staged preservation test at its immutable V6 URL.
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const frozen='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website/tests/vascular-live-admission-preservation.test.mjs';
const staged='F:/VisibleMedicine/staging/20261022-vascular-guard-composition/CODE/tests/vascular-live-admission-preservation.test.mjs';

export async function load(url,context,nextLoad){
 if(url===pathToFileURL(frozen).href)
  return {format:'module',source:await readFile(staged,'utf8'),shortCircuit:true};
 return nextLoad(url,context);
}
