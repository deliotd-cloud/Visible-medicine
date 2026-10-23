import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const original=pathToFileURL('F:/VisibleMedicine/staging/20261023-midfoot-website/website/tests/thoracic-teaching-role-preservation.test.mjs').href;
const proposal='F:/VisibleMedicine/staging/20261023-thoracic-proof-current/thoracic-teaching-role-preservation.test.mjs';
export async function load(url,context,nextLoad){
 if(url===original)return {format:'module',source:readFileSync(proposal,'utf8'),shortCircuit:true};
 return nextLoad(url,context);
}
