import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import vm from 'node:vm';
import {restoreSalivaryGuardPrior as restore} from '../20261022-heading-root-history-followup/CODE/tests/salivary-current-family-inverse.mjs';

const tests='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website/tests';
const code='F:/VisibleMedicine/staging/20261022-current-head-history-closure/CODE/tests/current-head-index-whole-role-transition-20261021.test.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const source=readFileSync(code,'utf8');
const name='salivary-cache-guard-adaptation.test.mjs';
const guard=readFileSync('F:/VisibleMedicine/staging/20261022-heading-root-history-followup/CODE/tests/'+name);
assert.equal(sha(guard),'09bdafdb9ec5cad0b55bc613907bc6b3171cbbc2a06a078c5275f291307ad627');
const restoreSalivaryGuardPrior=bytes=>restore(bytes,{readPrior:url=>readFileSync(join(tests,'fixtures/salivary-family-prior',url.pathname.split('/').at(-1)))});
let executable=source.replace(/^import .*;\r?\n/gm,'');
executable=executable.replace("const read=path=>readFileSync(new URL(path,import.meta.url));",'');
assert(!executable.includes('import.meta.url'));
function execute(overrides={},verbose=false){
 const results=[];
 const read=path=>overrides[path]??(path===name?guard:readFileSync(join(tests,path)));
 const test=(title,body)=>{
  try{body();results.push({title,pass:true});if(verbose)process.stdout.write('PASS '+title+'\n');}
  catch(error){results.push({title,pass:false,error:error.message.split('\n')[0]});if(verbose)process.stdout.write('FAIL '+title+' '+error.message.split('\n')[0]+'\n');}
 };
 vm.runInNewContext(executable,{assert,createHash,readFileSync,read,restoreSalivaryGuardPrior,test,Buffer,console},{filename:code});
 return results;
}
const positive=execute({},true);
assert.equal(positive.length,6,'All six original cases executed');
assert(positive.every(row=>row.pass),'All six complete original bodies pass pure source proof');
const refusalInputs=[
 ['later-current-append','current-atlas-delivery.test.mjs',Buffer.concat([readFileSync(join(tests,'current-atlas-delivery.test.mjs')),Buffer.from('\nconst unknown=true;\n')]),0],
 ['later-atlas190-refusal-removal','atlas190-current-delivery.test.mjs',Buffer.from(readFileSync(join(tests,'atlas190-current-delivery.test.mjs'),'utf8').replace("assert.throws(()=>validateCurrentAtlasDelivery({pin:before}),'Historical485pin must not admit current190bytes');",'')),4],
 ['heading-guard-mutation',name,Buffer.concat([guard,Buffer.from('\nconst unknown=true;\n')]),5],
];
for(const [label,path,mutated,index] of refusalInputs){
 const rows=execute({[path]:mutated});
 assert.equal(rows.length,6,label+': six complete cases still execute');
 assert.equal(rows[index].pass,false,label+': selected source mutation refused');
 process.stdout.write('REFUSED '+label+' '+rows[index].error+'\n');
}
process.stdout.write(JSON.stringify({sourceSha256:sha(Buffer.from(source)),virtualGuardSha256:sha(guard),passed:positive.length,refusals:refusalInputs.length})+'\n');
