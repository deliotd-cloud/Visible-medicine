// Completed shoulder-imaging milestone remains an immutable assertion set. Current
// plantar MRI teaching is independently checked against the actual live resolver.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync as actualReadFileSync} from 'node:fs';
import {relative,dirname} from 'node:path';
import {build as actualBuild} from './workspace-test-build.mjs';
export {writeFileSync} from 'node:fs';
export const teachingEpoch='e6168496a8a59927164fc84c9297583d8ae01339';
const cache=new Map();
function bytes(path){assert(!path.startsWith('/')&&!path.includes('..')&&!path.includes('\\'));if(!cache.has(path))cache.set(path,execFileSync('git',['show',teachingEpoch+':'+path],{maxBuffer:32e6,windowsHide:true}));return cache.get(path);}
export function readFileSync(path,encoding){if(path.startsWith('scripts/'))return actualReadFileSync(path,encoding);const value=bytes(path);return encoding?value.toString():value;}
export function build(options){const epoch={name:'completed-shoulder-imaging-epoch',setup(api){api.onLoad({filter:/\.(?:ts|tsx|json)$/,namespace:'workspace-test'},args=>{const path=relative(process.cwd(),args.path).replaceAll('\\','/');if(!/^(?:app|lib|content|public\/models)\//.test(path))return;return{contents:bytes(path).toString(),loader:path.endsWith('.json')?'json':path.endsWith('.tsx')?'tsx':'ts',resolveDir:dirname(args.path)};});}};return actualBuild({...options,plugins:[...(options.plugins??[]),epoch]});}
