import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';
const read=path=>readFileSync(new URL('./'+path,import.meta.url),'utf8');
const changes={
 'atlas-cerebral-lobar-imaging.test.ts':[['closedPin,(path:string)=>','closedPin,path=>']],
 'clinical-review-cervical-disc-tour.test.ts':[['const actual:ReviewPacket=structures.find','const actual=structures.find'],['exact:ReviewPacket=source.bodyLesson(actual,modality)','exact=source.bodyLesson(actual,modality)']],
 'atlas-cerebral-schema-preservation.test.mjs':[["new URL('./fixtures/expanded-viewer-test-types/atlas-cerebral-lobar-imaging.test.ts.raw',import.meta.url)","new URL('./atlas-cerebral-lobar-imaging.test.ts',import.meta.url)"]],
 'clinical-review-cervical-disc-tour-preservation.test.mjs':[["new URL('./fixtures/expanded-viewer-test-types/clinical-review-cervical-disc-tour.test.ts.raw',import.meta.url)","new URL('./clinical-review-cervical-disc-tour.test.ts',import.meta.url)"]],
};
for(const [name,seams]of Object.entries(changes))test((name.endsWith('.ts')?'typing preserves original source and executable ':'exact historical-reader seam preserves complete original proof ')+name,()=>{
 const original=read('fixtures/expanded-viewer-test-types/'+name+'.raw'),current=read(name);
 let inverse=current;for(const [from,to]of seams){assert.equal(inverse.split(from).length,2);inverse=inverse.replace(from,to);}
 assert.equal(inverse,original,'No assertion, fixture or executable body changed');
 const js=source=>transformSync(source,{loader:'ts',format:'esm',target:'es2022'}).code;
 if(name.endsWith('.ts'))assert.equal(js(current),js(original),'Identical type-erased executable output');
});
