import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {clonePinnedWebsite} from './clone-pinned-website-stage-20261026.mjs';
let script=fs.readFileSync('prepare-scene-study-native-stage-20261027.mjs','utf8');
for(const [from,to] of [['20261027-scene-study-native','20261027-tour-step-native'],['ea2413a6ea7e932f3ed6911bea15797037519ab7','bcb478b12a2739f6ab954de88eef9638d2a71fc7']]){
  assert(script.includes(from));script=script.replaceAll(from,to);
}
const file='prepare-tour-step-native-stage-20261027.mjs';
fs.writeFileSync(file,script,{flag:'wx'});
execFileSync(process.execPath,[file],{stdio:'inherit',windowsHide:true});
clonePinnedWebsite({stage:'F:/VisibleMedicine/staging/20261027-tour-step-website',parentFile:'F:/VisibleMedicine/staging/20261027-scene-study-website/SOURCE_CANDIDATE.json',parentSha256:'0684ada9cc9fcd6cf00840433d6b42ee7ec95dc0d962069b8ff8b29426251a50'});
console.log('Separate native and website sources prepared; no preview or runtime import changed.');
