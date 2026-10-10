import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const files=[...Array.from({length:12},(_,i)=>'fj'+(1700+i)),'fj1715'];
const ids=[...files,...files.map(f=>f+'m')].map(f=>'pica-source-'+f);
const keys=['picaSourceParentAnatomy','picaSourceAngiography'];
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
/** Hash-guarded test-only historical projection; no runtime content migration. */
export function beforePICASourceTeaching(api){
 const additions=api.nestedConcepts.filter(c=>ids.includes(c.id));
 assert.deepEqual(JSON.parse(JSON.stringify(additions.map(c=>c.id))),ids);
 assert.equal(hash(additions),'f78243eb26c2e7a773fcaac6f885401a3b616ae8feadc590102b074331a1ad22','Unrecorded PICA source lesson change');
 const refs=Object.fromEntries(keys.map(key=>[key,api.nestedTeachingReferences[key]]));
 assert.equal(hash(refs),'1410cd559d73ba3ef157f95a297d89d7a6e822a1890be6d33bf4e9712cf7c747','Unrecorded PICA reference change');
 return {...api,nestedConcepts:api.nestedConcepts.filter(c=>!ids.includes(c.id)),
  nestedTeachingReferences:Object.fromEntries(Object.entries(api.nestedTeachingReferences).filter(([key])=>!keys.includes(key)))};
}
if(process.argv.includes('--hash')){
 const result=await build({stdin:{contents:"export * from './content/pica-source-teaching';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
 console.log(JSON.stringify({concepts:hash(api.picaSourceConcepts),references:hash(api.picaSourceTeachingReferences)}));
}
