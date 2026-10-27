import fs from'node:fs';import assert from'node:assert/strict';import{hash}from'./bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-head-history-flow',file=stage+'/website/tests/native-slice-legacy-adapters.test.mjs',before=hash(file),text=fs.readFileSync(file,'utf8');
const anchor="  if(name==='head-pan-source-transition.test.ts'){\n";
const extra="    text=inverse(text,\"import {readHistoricalPanViewer} from './head-source-context-roles.mjs';\\n\",'');\n    text=inverse(text,\"after=normal(readHistoricalPanViewer());\",\"after=normal(read('components/HeadAtlasViewer.tsx'));\");\n";
assert.equal(text.split(anchor).length,2);fs.writeFileSync(file,text.replace(anchor,anchor+extra));
fs.writeFileSync(stage+'/LEGACY_CONTEXT_EXTENSION.json',JSON.stringify({at:new Date().toISOString(),test:{path:'tests/native-slice-legacy-adapters.test.mjs',before,after:hash(file)},anchor,extra,scope:'Unwind only the two exact historical-source-context seams before the existing whole-original-file equality assertion. Every original assertion and four pinned preimages remain unchanged.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({repairedHistoricalContextSeams:2,originalAssertionBodiesUnchanged:true}));
