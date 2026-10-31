import fs from 'node:fs';import assert from 'node:assert/strict';import test from 'node:test';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';import {fileURLToPath,pathToFileURL} from 'node:url';
const sourceBase=process.env.VM_HISTORY_SOURCE_TESTS?pathToFileURL(process.env.VM_HISTORY_SOURCE_TESTS+'/'):new URL('./',import.meta.url);
const root=fileURLToPath(new URL('../',sourceBase)),sha=b=>createHash('sha256').update(b).digest('hex'),proof=JSON.parse(fs.readFileSync(new URL('./fixtures/sql-policy-history/current-binding-seams.json',sourceBase),'utf8'));
function replaceOne(text,before,after){assert.equal(text.split(before).length,2,'one exact later SQL seam');return text.replace(before,after);}
function restoreLaterSqlSource(current){
 assert.equal(sha(current),'68d7ae6b48b3c46290d39d3f57791022770e7c430d18caae1419fc6d19c3f7ff','exact later SQL source');
 const prior=fs.readFileSync(new URL('./fixtures/atlas-delivery-access-sql-current-source-before-20261028.mjs.raw',sourceBase));
 assert.equal(sha(prior),'8239d8d290c39da5497dbfd87ec577102b9293d2470f53800496d8b88e5b859f','exact pre-20261028 source');
 let expected=prior.toString('utf8');
 expected=replaceOne(expected,"import {createRequire} from 'node:module';\n",
  "import {createRequire} from 'node:module';\nimport {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\n");
 expected=replaceOne(expected,"const sha=b=>createHash('sha256').update(b).digest('hex');\n",
  "const sha=b=>createHash('sha256').update(b).digest('hex');\n"+
  "const wholePreimage=fs.readFileSync(new URL('./fixtures/atlas-delivery-access-sql-current-source-before-20261028.mjs.raw',import.meta.url));\n"+
  "assert.equal(sha(wholePreimage),'8239d8d290c39da5497dbfd87ec577102b9293d2470f53800496d8b88e5b859f','Whole preceding SQL helper remains recoverable');\n"+
  "const deliveryPin=validateCurrentAtlasDelivery();\ncurrentAtlasDeliveryRoot(); // Actual clean native HEAD and tree must match the validated delivery.\n\n"+
  "const modelInventory=fs.readFileSync(path.join(root,'lib/atlas-model-inventory.json'));\n"+
  "assert.equal(sha(modelInventory),deliveryPin.documents['lib/atlas-model-inventory.json'],'Pinned current inventory bytes');\n");
 expected=replaceOne(expected," 'lib/atlas-delivery-policy.ts':'0aab958726e8b5560872fd0aa1b82d360ec038428d14bb229813dea0987a09db',\n",'');
 expected=replaceOne(expected,"const text={};for(const [name,expected]of Object.entries(pins)){const bytes=fs.readFileSync(path.join(root,name));assert.equal(sha(bytes),expected,'Actual source bytes: '+name);text[name]=bytes.toString('utf8');}\n",
  "const text={};for(const [name,expected]of Object.entries(pins)){const bytes=fs.readFileSync(path.join(root,name));assert.equal(sha(bytes),expected,'Actual source bytes: '+name);text[name]=bytes.toString('utf8');}\n"+
  "const policyBytes=fs.readFileSync(path.join(root,'lib/atlas-delivery-policy.ts'));\nconst policySource=policyBytes.toString('utf8');\n"+
  "const revisionLiteral=\"'\"+deliveryPin.documents['lib/atlas-model-inventory.json']+\"'\";\n"+
  "assert.equal(policySource.split(revisionLiteral).length,2,'Exactly one current inventory revision in policy source');\n"+
  "const policyTemplate=policySource.replace(revisionLiteral,\"'__CURRENT_INVENTORY_SHA256__'\");\n"+
  "assert.equal(sha(Buffer.from(policyTemplate)),'74f66aca65f9dc014f9e85ead49471dc6a036c05f00a04256c4d93ffa15c39e5','Exact policy source except its validated current inventory revision');\n");
 expected=replaceOne(expected,"export const actualPolicy=policy.ATLAS_DELIVERY_POLICY;\n",
  "export const actualPolicy=policy.ATLAS_DELIVERY_POLICY;\n"+
  "assert.equal(actualPolicy.audience,'administrator-review','Current policy remains review-only');\n"+
  "assert.equal(actualPolicy.manifestRevision,deliveryPin.documents['lib/atlas-model-inventory.json'],'Current policy binds pinned inventory');\n"+
  "assert.equal(Object.hasOwn(actualPolicy,'approvedRevision'),false,'No clinical approval is introduced');\n");
 assert.deepEqual(Buffer.from(expected+'\n'),Buffer.from(current),'only declared later SQL seams');
 return prior.toString('utf8');
}
test('current SQL revision binding retains all prior case bodies and schema checks',()=>{
 for(const[i,row]of proof.before.entries()){let text=fs.readFileSync(root+'/'+row.path,'utf8');if(i===1)text=restoreLaterSqlSource(text);for(const[a,b]of proof.seams[i].toReversed()){assert.equal(text.split(b).length,2);text=text.replace(b,a);}const original=fs.readFileSync(root+'/'+proof.fixtures[i]);assert.equal(sha(original),row.sha256);assert.deepEqual(Buffer.from(text),original);}
});
test('later SQL source inverse refuses an altered current check',()=>{
 const current=fs.readFileSync(root+'/tests/atlas-delivery-access-sql-current-source.mjs','utf8');
 assert.throws(()=>restoreLaterSqlSource(current.replace("'administrator-review'","'reviewed-learner'")));
});
test('current SQL replay refuses a borrowed Website before loading its source',()=>{
 const env={...process.env,VM_ATLAS_ACCESS_SQL_ROOT:root+'/foreign'};delete env.NODE_TEST_CONTEXT;
 const r=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',"await import('./tests/atlas-delivery-access-sql-current-source.mjs')"],{cwd:root,env,encoding:'utf8',windowsHide:true,maxBuffer:1024*1024});assert.equal(r.error,undefined);assert.equal(r.signal,null);assert.notEqual(r.status,0);assert.match(r.stderr,/Current SQL source must be this Website/);
});
